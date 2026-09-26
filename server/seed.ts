import { db, nowIso } from './db.ts';
import { config } from './config.ts';
import { addDays, wibDate } from './time.ts';

/**
 * Seed data awal. SEMUA akun & nama di sini adalah PLACEHOLDER — ganti dengan data asli sekolah
 * (lihat `npm run user:add`) sebelum dipakai sungguhan. Login memakai KODE saja.
 */
const USERS = [
  { code: 'ADM1', name: 'Admin Contoh', role: 'ADMIN', color: 'bg-slate-700' },
  { code: 'LB1', name: 'Laboran Contoh', role: 'LABORAN', color: 'bg-indigo-700' },
  { code: 'GR1', name: 'Guru Biologi Contoh', role: 'GURU', color: 'bg-emerald-700' },
  { code: 'GR2', name: 'Guru Fisika Contoh', role: 'GURU', color: 'bg-sky-700' },
  { code: 'GR3', name: 'Guru Kimia Contoh', role: 'GURU', color: 'bg-teal-700' },
  { code: 'GR4', name: 'Guru Komputer Contoh', role: 'GURU', color: 'bg-violet-700' },
];

const LABS = [
  { code: 'BIO', room: 'BIO-01', name: 'Lab Biologi Terpadu', teacher: 'GR1' },
  { code: 'FIS', room: 'FIS-02', name: 'Lab Fisika Modern', teacher: 'GR2' },
  { code: 'KIM', room: 'KIM-03', name: 'Lab Kimia Anorganik', teacher: 'GR3' },
  { code: 'COM', room: 'COM-04', name: 'Lab Komputer Sains', teacher: 'GR4' },
  { code: 'BSM', room: 'BSM-05', name: 'Smartclass & Bahasa', teacher: 'GR4' },
];

const SLOTS: [string, string][] = [
  ['07:30', '09:00'],
  ['09:15', '10:45'],
  ['13:00', '14:30'],
];
const CLASSES = ['X-1', 'X-2', 'XI IPA 1', 'XI IPA 2', 'XII IPA 1', 'XII IPA 3'];

const INVENTORY = [
  ['BIO-MIC-01', 'Mikroskop Binokuler', 'ALAT', 'BIO', 12, 8, 'BAIK', 'Lemari A1', 4500000],
  ['BIO-MIC-03', 'Mikroskop Binokuler (lensa retak)', 'ALAT', 'BIO', 1, 1, 'RUSAK', 'Lemari A1', 4500000],
  ['KIM-GLS-118', 'Tabung Reaksi 20 ml', 'ALAT', 'KIM', 80, 40, 'BAIK', 'Rak K2', 5000],
  ['FIS-MUL-01', 'Multimeter Digital', 'ALAT', 'FIS', 15, 10, 'BAIK', 'Lemari F1', 250000],
  ['KIM-RGN-HCL', 'HCl 0,1 M', 'REAGEN', 'KIM', 1, 3, 'BAIK', 'Lemari Asam', 60000],
  ['KIM-RGN-NAOH', 'NaOH 0,1 M', 'REAGEN', 'KIM', 2, 3, 'BAIK', 'Lemari Basa', 55000],
  ['KIM-RGN-PP', 'Fenolftalein', 'REAGEN', 'KIM', 1, 2, 'BAIK', 'Lemari Reagen', 90000],
  ['BIO-BHN-01', 'Kaca Preparat (kotak)', 'BAHAN', 'BIO', 20, 5, 'BAIK', 'Lemari A2', 30000],
] as const;

const PHOTO_1 = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOjbEX5bg8ZecE3c8V6qIL2BMnyyUsq_WSwgJLXk2kYtcucodajSARHeKmOd8UWuEO4_kgHI4OIE16WhLHerhBG4SMf7UCqguY_nY2NqLNBWi900syOh696LWWQzTYTVhyrH6jws9U6cyQupI4WKFr1erWeULYgzGPEJHUAABoRw5h6LB_glD7nXZ2cOAi5JSU2XoknlC4nQNts57YNCfMphzRNylkCmUnX_Tf3G9Jq0ojuSoLxEoC0w';
const PHOTO_2 = 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8yrhlUhSCDL_lNnIZq7aALMuTbQfA782m1G0o2Z8zMITBsCMvKHLRZmIY0SNhSkV6zaE2vAbOdCXiEAacTpGLDUUiUOznzZEI0kZu-mKb5piVTvHkT4i4Y-qZldhh8IV9Fz02zUa6Ne6tBMAYZ5YIB1TwnBRiYxHuoJZvlY6n76wGXFOdIjOguN7HjUwypI9891SNkd88XG8jDgXQzHMsAVhF4TKmyAc_dMWvletUV0JlzY1mlwa-ow';
const ALT_1 = 'Close-up macro shot of a scientific optical microscope objective lens with fine fracture line on the glass element sitting in a high school biology laboratory setting under cool clinical LED lighting.';
const ALT_2 = 'Broken borosilicate chemical lab glassware test tube shards safely isolated in an educational science chemical lab tray with yellow hazmat warning labels under clinical fluorescent lights.';

export function seedIfEmpty() {
  const hasUsers = (db.prepare('SELECT COUNT(*) c FROM users').get() as { c: number }).c > 0;
  if (hasUsers) return;

  const tx = db.transaction(() => {
    const userId: Record<string, number> = {};
    for (const u of USERS) {
      const r = db
        .prepare('INSERT INTO users (code, name, role, avatar_color) VALUES (?, ?, ?, ?)')
        .run(u.code, u.name, u.role, u.color);
      userId[u.code] = Number(r.lastInsertRowid);
    }

    const labId: Record<string, number> = {};
    LABS.forEach((l, li) => {
      const r = db.prepare('INSERT INTO labs (code, room_code, name) VALUES (?, ?, ?)').run(l.code, l.room, l.name);
      labId[l.code] = Number(r.lastInsertRowid);
      // Jadwal mingguan berulang Senin–Jumat, 2 sesi per hari.
      for (let dow = 1; dow <= 5; dow++) {
        for (const k of [0, 1]) {
          const [s, e] = SLOTS[(dow + li + k) % SLOTS.length];
          const cls = CLASSES[(dow * 2 + li + k) % CLASSES.length];
          db.prepare(
            `INSERT INTO schedules (lab_id, day_of_week, start_time, end_time, class_name, activity, subject, teacher_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ).run(labId[l.code], dow, s, e, cls, 'Praktikum ' + l.name.replace(/^Lab /, ''), l.name.replace(/^Lab /, ''), userId[l.teacher]);
        }
      }
    });

    for (const [code, name, cat, lab, qty, min, cond, loc, val] of INVENTORY) {
      db.prepare(
        `INSERT INTO inventory_items (code, name, category, lab_id, quantity, min_stock, item_condition, storage_location, unit_value)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(code, name, cat, labId[lab], qty, min, cond, loc, val);
    }

    if (config.seedDemoData) seedDemo(userId, labId);
  });
  tx();
  console.log('[seed] Database diisi dengan data awal (akun placeholder: ADM1, LB1, GR1-GR4).');
}

function seedDemo(userId: Record<string, number>, labId: Record<string, number>) {
  const today = wibDate();
  const demo = [
    { seq: 1, lab: 'BIO', t: 'GR1', cls: 'XII IPA 1', subj: 'Biologi', topic: 'Uji Enzim Katalase H2O2 Ekstrak Hati', notes: 'Tabung reaksi dan mortar alu telah dicuci bersih dan dikeringkan di rak.', n: 35, s: '07:30', e: '09:00', day: today, status: 'SUBMITTED' },
    { seq: 2, lab: 'FIS', t: 'GR2', cls: 'X-2', subj: 'Fisika', topic: 'Karakteristik V-I Hambatan Geser', notes: 'Multimeter digital dan catu daya 12V kembali dalam kondisi lengkap dan rapi.', n: 32, s: '07:30', e: '09:00', day: today, status: 'REVIEWED' },
    { seq: 3, lab: 'KIM', t: 'GR3', cls: 'XII IPA 3', subj: 'Kimia', topic: 'Standarisasi Larutan NaOH 0.1 M', notes: 'Praktikum berjalan lancar, reagen terpakai 250ml NaOH dan 150ml HCl.', n: 34, s: '08:30', e: '10:00', day: today, status: 'SUBMITTED' },
    { seq: 4, lab: 'BIO', t: 'GR1', cls: 'XI IPA 1', subj: 'Biologi', topic: 'Pengamatan Preparat Basah Daun Rhoeo', notes: 'Satu mikroskop mengalami kerusakan lensa saat praktikum. Mohon verifikasi.', n: 36, s: '09:15', e: '10:45', day: addDays(today, -1), status: 'NEEDS_CORRECTION' },
  ];
  const stamp = (d: string, hm: string) => new Date(`${d}T${hm}:00+07:00`).toISOString();
  const counter: Record<string, number> = {};

  for (const j of demo) {
    const prefix = `JR-${j.day.replace(/-/g, '')}-`;
    counter[prefix] = (counter[prefix] ?? 0) + 1;
    const code = `${prefix}${String(counter[prefix]).padStart(4, '0')}`;
    const created = stamp(j.day, j.e);
    const r = db
      .prepare(
        `INSERT INTO journals (code, lab_id, teacher_id, journal_date, start_time, end_time, class_name, subject, topic, notes,
           students_count, sop_complied, status, created_at, updated_at, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
      )
      .run(code, labId[j.lab], userId[j.t], j.day, j.s, j.e, j.cls, j.subj, j.topic, j.notes, j.n, j.status, created, created, created);
    const id = Number(r.lastInsertRowid);
    const ev = db.prepare(
      'INSERT INTO journal_reviews (journal_id, reviewer_id, status, notes, sop_complied, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    );
    ev.run(id, userId[j.t], 'SUBMITTED', 'Jurnal dikirim.', null, created);
    if (j.status === 'REVIEWED') ev.run(id, userId['LB1'], 'REVIEWED', 'Sudah sesuai SOP.', 1, stamp(j.day, '11:00'));
    if (j.status === 'NEEDS_CORRECTION')
      ev.run(id, userId['LB1'], 'NEEDS_CORRECTION', 'Lengkapi kode alat yang rusak pada catatan kegiatan.', 0, stamp(j.day, '11:30'));
  }

  const inc = db.prepare(
    `INSERT INTO incidents (asset_code, occurred_at, title, description, reporter, class_name, lab_code, photo_url, photo_alt, status, action_type, action_label)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', ?, ?)`,
  );
  inc.run('BIO-MIC-03', '09:30 WIB', 'Lensa Objektif 40x Retak', 'Lensa terbentur kaca preparat tebal saat kelompok 3 memutar makrometer kasar.', 'Guru Biologi Contoh', 'XI IPA 1', 'BIO', PHOTO_1, ALT_1, 'repair', 'Buat Tiket Perbaikan');
  inc.run('KIM-GLS-118', '08:45 WIB', 'Tabung Reaksi 20ml Pecah', 'Jatuh saat pemanasan Bunsen oleh siswa meja 4. Telah disapu bersih tanpa cedera fisik.', 'Guru Kimia Contoh', 'XII IPA 3', 'KIM', PHOTO_2, ALT_2, 'scrap', 'Registrasi Afkir');
  void nowIso;
}
