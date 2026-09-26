// Uji akseptansi Teacher Flow (Test A–F). Jalankan server dulu (npm run dev:server), lalu:
//   npm run test:api            (BASE_URL default http://localhost:3001)
// Memakai akun seed placeholder: ADM1, LB1, GR1, GR2.
const BASE = process.env.BASE_URL || 'http://localhost:3001';

class Client {
  cookie = '';
  async req(method: string, path: string, body?: unknown) {
    const res = await fetch(BASE + '/api' + path, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(this.cookie ? { Cookie: this.cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const sc = res.headers.get('set-cookie');
    if (sc) this.cookie = sc.split(';')[0];
    let json: any = null;
    try { json = await res.json(); } catch { /* kosong */ }
    return { status: res.status, json };
  }
  async login(code: string) {
    const r = await this.req('POST', '/auth/login', { code });
    if (r.status !== 200) throw new Error(`login ${code} gagal: ${r.status}`);
    return r.json.user;
  }
}

let pass = 0, fail = 0;
function check(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name} ${extra}`); }
}
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

async function main() {
  const admin = new Client(), laboran = new Client(), guru = new Client(), guru2 = new Client(), anon = new Client();
  await admin.login('ADM1'); await laboran.login('LB1');
  const g1 = await guru.login('GR1'); await guru2.login('GR2');

  console.log('Test E — QR protection');
  const labs = (await admin.req('GET', '/labs')).json.labs;
  const bio = labs.find((l: any) => l.code === 'BIO');
  const qr = await admin.req('POST', '/qr', { labId: bio.id });
  check('Admin dapat membuat QR (201)', qr.status === 201);
  check('Membuat QR tidak membuat jurnal', (await admin.req('GET', '/journals')).json.journals.every((j: any) => !j.code.includes('QR')));
  const pub = await anon.req('GET', `/qr/${qr.json.qr.token}`);
  check('QR publik mengembalikan identitas lab', pub.status === 200 && pub.json.lab.code === 'BIO');
  const keys = JSON.stringify(pub.json).toLowerCase();
  check('QR tidak membocorkan inventaris', !/(inventory|inventaris|quantity|stok|kondisi|unitvalue)/.test(keys));
  check('Token QR tidak valid → 404', (await anon.req('GET', '/qr/xxxx')).status === 404);
  check('Guru tidak dapat membuat QR (403)', (await guru.req('POST', '/qr', { labId: bio.id })).status === 403);

  console.log('Test A — Normal Teacher Flow');
  check('Jadwal butuh login (401)', (await anon.req('GET', `/labs/${bio.id}/schedule`)).status === 401);
  const sch = await guru.req('GET', `/labs/${bio.id}/schedule`);
  check('Guru melihat jadwal lab', sch.status === 200 && Array.isArray(sch.json.schedule) && sch.json.schedule.length > 0);
  check('Jadwal tidak memuat inventaris', !/(inventory|quantity|kondisi)/i.test(JSON.stringify(sch.json)));
  const create = await guru.req('POST', '/journals', {
    labId: bio.id, date: today, startTime: '07:30', endTime: '09:00', className: 'XI IPA 1',
    subject: 'Biologi', topic: 'Pengamatan sel', notes: 'Uji akseptansi', studentsCount: 30,
    teacherId: 999, status: 'REVIEWED', // upaya menyamar/memalsukan → harus diabaikan
  });
  check('Submit jurnal (201)', create.status === 201);
  const j = create.json.journal;
  check('Nomor jurnal berformat JR-YYYYMMDD-NNNN', /^JR-\d{8}-\d{4}$/.test(j.code), j.code);
  check('Status awal SUBMITTED (dari server)', j.status === 'SUBMITTED');
  check('teacher_id dari sesi, bukan dari body', j.teacherId === g1.id);

  console.log('Test B — Persistence');
  const mine = await guru.req('GET', '/journals/me');
  check('Jurnal muncul di My Journals', mine.json.journals.some((x: any) => x.id === j.id));

  console.log('Test F — Ownership');
  check('Guru A hanya melihat jurnal miliknya', mine.json.journals.every((x: any) => x.teacherId === g1.id));
  const other = await guru2.req('GET', '/journals/me');
  check('Guru B tidak melihat jurnal Guru A', !other.json.journals.some((x: any) => x.id === j.id));
  check('Guru B GET detail jurnal Guru A → 403', (await guru2.req('GET', `/journals/${j.id}`)).status === 403);
  check('Guru B PATCH jurnal Guru A → 403', (await guru2.req('PATCH', `/journals/${j.id}`, { topic: 'x' })).status === 403);
  check('Guru tidak dapat memanggil GET /journals (403)', (await guru.req('GET', '/journals')).status === 403);
  check('Guru tidak dapat mereview (403)', (await guru.req('POST', `/journals/${j.id}/reviews`, { status: 'REVIEWED' })).status === 403);

  console.log('Test C — Correction loop');
  check('Koreksi tanpa catatan ditolak (400)', (await laboran.req('POST', `/journals/${j.id}/reviews`, { status: 'NEEDS_CORRECTION' })).status === 400);
  const rv = await laboran.req('POST', `/journals/${j.id}/reviews`, { status: 'NEEDS_CORRECTION', notes: 'Perbaiki catatan kegiatan.' });
  check('Laboran meminta koreksi', rv.status === 201 && rv.json.journal.status === 'NEEDS_CORRECTION');
  check('Review ganda pada status non-SUBMITTED ditolak (409)', (await laboran.req('POST', `/journals/${j.id}/reviews`, { status: 'REVIEWED' })).status === 409);
  const seen = await guru.req('GET', `/journals/${j.id}`);
  check('Guru melihat catatan koreksi', seen.json.journal.reviews.some((r: any) => r.status === 'NEEDS_CORRECTION' && r.notes.includes('Perbaiki')));
  const edit = await guru.req('PATCH', `/journals/${j.id}`, { notes: 'Catatan sudah diperbaiki.' });
  check('Guru mengedit jurnal', edit.status === 200 && edit.json.journal.notes === 'Catatan sudah diperbaiki.');
  const re = await guru.req('POST', `/journals/${j.id}/resubmit`, {});
  check('Resubmit → SUBMITTED', re.status === 200 && re.json.journal.status === 'SUBMITTED');
  check('Edit saat SUBMITTED ditolak (409)', (await guru.req('PATCH', `/journals/${j.id}`, { notes: 'x' })).status === 409);
  const ok = await laboran.req('POST', `/journals/${j.id}/reviews`, { status: 'REVIEWED', notes: 'OK', sopComplied: true });
  check('Laboran menyetujui → REVIEWED', ok.status === 201 && ok.json.journal.status === 'REVIEWED');
  const hist = (await guru.req('GET', `/journals/${j.id}/reviews`)).json.reviews;
  check('Review history tersimpan lengkap (4 entri)', hist.length === 4, `got ${hist.length}`);
  check('Urutan history: SUBMITTED, NEEDS_CORRECTION, SUBMITTED, REVIEWED',
    hist.map((h: any) => h.status).join(',') === 'SUBMITTED,NEEDS_CORRECTION,SUBMITTED,REVIEWED');

  console.log('Draft');
  const d = await guru.req('POST', '/journals', { labId: bio.id, date: today, startTime: '10:00', endTime: '11:00', className: 'X-1', subject: 'Biologi', topic: 'Draft', saveAsDraft: true });
  check('Draft dibuat', d.status === 201 && d.json.journal.status === 'DRAFT');
  check('Draft tidak tampil untuk laboran', !(await laboran.req('GET', '/journals')).json.journals.some((x: any) => x.id === d.json.journal.id));
  check('Laboran tidak dapat membuka draft (403)', (await laboran.req('GET', `/journals/${d.json.journal.id}`)).status === 403);
  check('Draft dapat dikirim', (await guru.req('POST', `/journals/${d.json.journal.id}/resubmit`, {})).json.journal.status === 'SUBMITTED');

  console.log('Validasi');
  const invalid = await guru.req('POST', '/journals', { labId: bio.id, date: '2999-01-01', startTime: '10:00', endTime: '09:00', className: '', subject: 'x', topic: 'x' });
  check('Input tidak valid ditolak (400)', invalid.status === 400);

  console.log('Test D — Inventory protection');
  check('Guru GET /inventory → 403', (await guru.req('GET', '/inventory')).status === 403);
  check('Guru POST /inventory → 403', (await guru.req('POST', '/inventory', { code: 'X', name: 'X', category: 'ALAT' })).status === 403);
  check('Guru PATCH /inventory/1 → 403', (await guru.req('PATCH', '/inventory/1', { quantity: 1 })).status === 403);
  check('Guru DELETE /inventory/1 → 403', (await guru.req('DELETE', '/inventory/1')).status === 403);
  check('Laboran GET /inventory → 403', (await laboran.req('GET', '/inventory')).status === 403);
  check('Tanpa login GET /inventory → 401', (await anon.req('GET', '/inventory')).status === 401);
  const inv = await admin.req('GET', '/inventory');
  check('Admin GET /inventory → 200', inv.status === 200 && inv.json.items.length > 0);
  check('Guru tidak dapat membaca insiden (403)', (await guru.req('GET', '/incidents')).status === 403);

  console.log('Auth');
  check('Kode salah → 401', (await new Client().req('POST', '/auth/login', { code: 'NOPE' })).status === 401);
  check('Logout menghapus sesi', await (async () => { const c = new Client(); await c.login('GR1'); await c.req('POST', '/auth/logout'); const cookie = c.cookie; const c2 = new Client(); c2.cookie = cookie; return (await c2.req('GET', '/auth/me')).status === 401; })());

  console.log(`\nHasil: ${pass} lulus, ${fail} gagal`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
