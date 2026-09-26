import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, nowIso } from '../db.ts';
import { requireAuth, requireRole } from '../auth.ts';
import { getJournalRow, journalDetailDto, listJournalRows, listReviews, toJournalDto } from '../dto.ts';
import { isValidDate, isValidTime, wibDate } from '../time.ts';

export const journalsRouter = Router();

// ---------- Validasi ----------
interface JournalInput {
  date: string;
  startTime: string;
  endTime: string;
  className: string;
  subject: string;
  topic: string;
  notes: string;
  studentsCount: number;
  sopComplied: boolean;
}

/** Validasi field jurnal. `partial` = untuk PATCH (field yang tidak dikirim dilewati). */
function readInput(body: any, partial: boolean): { errors: string[]; value: Partial<JournalInput> } {
  const errors: string[] = [];
  const v: Partial<JournalInput> = {};
  const has = (k: string) => body && body[k] !== undefined;
  const need = (k: string) => !partial || has(k);

  if (need('date')) {
    if (!isValidDate(body?.date)) errors.push('Tanggal tidak valid.');
    else if (body.date > wibDate()) errors.push('Tanggal tidak boleh di masa depan.');
    else v.date = body.date;
  }
  if (need('startTime')) {
    if (!isValidTime(body?.startTime)) errors.push('Jam mulai tidak valid.');
    else v.startTime = body.startTime;
  }
  if (need('endTime')) {
    if (!isValidTime(body?.endTime)) errors.push('Jam selesai tidak valid.');
    else v.endTime = body.endTime;
  }
  for (const [key, label, max] of [
    ['className', 'Kelas', 60],
    ['subject', 'Mata pelajaran', 100],
    ['topic', 'Kegiatan', 300],
  ] as const) {
    if (need(key)) {
      const s = typeof body?.[key] === 'string' ? body[key].trim() : '';
      if (!s) errors.push(`${label} wajib diisi.`);
      else if (s.length > max) errors.push(`${label} maksimal ${max} karakter.`);
      else v[key] = s;
    }
  }
  if (has('notes')) {
    const s = typeof body.notes === 'string' ? body.notes.trim() : '';
    if (s.length > 2000) errors.push('Catatan maksimal 2000 karakter.');
    else v.notes = s;
  }
  if (has('studentsCount')) {
    const n = Number(body.studentsCount);
    if (!Number.isInteger(n) || n < 0 || n > 200) errors.push('Jumlah siswa harus 0-200.');
    else v.studentsCount = n;
  }
  if (has('sopComplied')) v.sopComplied = !!body.sopComplied;
  return { errors, value: v };
}

function bad(res: Response, errors: string[]) {
  return res.status(400).json({ error: errors.join(' '), errors });
}

function nextJournalCode(date: string): string {
  const prefix = `JR-${date.replace(/-/g, '')}-`;
  const row = db
    .prepare('SELECT code FROM journals WHERE code LIKE ? ORDER BY code DESC LIMIT 1')
    .get(`${prefix}%`) as { code: string } | undefined;
  const n = row ? parseInt(row.code.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(n).padStart(4, '0')}`;
}

const addEvent = db.prepare(
  `INSERT INTO journal_reviews (journal_id, reviewer_id, status, notes, sop_complied, created_at)
   VALUES (?, ?, ?, ?, ?, ?)`,
);

/** Ambil jurnal + cek kepemilikan. Guru hanya boleh miliknya sendiri; staf boleh semua (kecuali DRAFT). */
function loadAuthorized(req: Request, res: Response) {
  const id = Number(req.params.id);
  const row = Number.isInteger(id) ? getJournalRow(id) : undefined;
  if (!row) {
    res.status(404).json({ error: 'Jurnal tidak ditemukan.' });
    return null;
  }
  const u = req.user!;
  if (u.role === 'GURU' && row.teacher_id !== u.id) {
    res.status(403).json({ error: 'Anda tidak memiliki akses ke jurnal ini.' });
    return null;
  }
  if (u.role !== 'GURU' && row.status === 'DRAFT') {
    res.status(403).json({ error: 'Draft jurnal bersifat pribadi milik guru.' });
    return null;
  }
  return row;
}

function loadOwned(req: Request, res: Response) {
  const row = loadAuthorized(req, res);
  if (row && row.teacher_id !== req.user!.id) {
    res.status(403).json({ error: 'Hanya pemilik jurnal yang dapat mengubahnya.' });
    return null;
  }
  return row;
}

// ---------- Daftar ----------
// Jurnal milik guru yang sedang login.
journalsRouter.get('/me', requireRole('GURU'), (req, res) => {
  const rows = listJournalRows('WHERE j.teacher_id = ?', [req.user!.id]);
  res.json({ journals: rows.map(toJournalDto) });
});

// Seluruh jurnal (tanpa DRAFT) untuk Laboran/Admin.
journalsRouter.get('/', requireRole('ADMIN', 'LABORAN'), (req, res) => {
  const conds = [`j.status != 'DRAFT'`];
  const params: unknown[] = [];
  if (typeof req.query.status === 'string' && req.query.status !== 'DRAFT') {
    conds.push('j.status = ?');
    params.push(req.query.status);
  }
  if (req.query.labId) {
    conds.push('j.lab_id = ?');
    params.push(Number(req.query.labId));
  }
  const rows = listJournalRows(`WHERE ${conds.join(' AND ')}`, params);
  res.json({ journals: rows.map(toJournalDto) });
});

// ---------- Buat ----------
journalsRouter.post('/', requireRole('GURU'), (req, res) => {
  const labId = Number(req.body?.labId);
  const lab = Number.isInteger(labId) ? db.prepare('SELECT id FROM labs WHERE id = ?').get(labId) : null;
  if (!lab) return res.status(400).json({ error: 'Laboratorium tidak valid.' });

  const { errors, value: v } = readInput(req.body, false);
  if (v.startTime && v.endTime && v.startTime >= v.endTime) errors.push('Jam selesai harus setelah jam mulai.');
  if (errors.length) return bad(res, errors);

  const draft = req.body?.saveAsDraft === true;
  const status = draft ? 'DRAFT' : 'SUBMITTED';
  const now = nowIso();

  // teacher_id, waktu, status awal & nomor jurnal ditentukan SERVER — bukan dari klien.
  const create = db.transaction(() => {
    const code = nextJournalCode(v.date!);
    const info = db
      .prepare(
        `INSERT INTO journals (code, lab_id, teacher_id, journal_date, start_time, end_time, class_name, subject, topic,
           notes, students_count, sop_complied, status, created_at, updated_at, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        code,
        labId,
        req.user!.id,
        v.date,
        v.startTime,
        v.endTime,
        v.className,
        v.subject,
        v.topic,
        v.notes ?? '',
        v.studentsCount ?? 0,
        v.sopComplied === false ? 0 : 1,
        status,
        now,
        now,
        draft ? null : now,
      );
    const id = Number(info.lastInsertRowid);
    if (!draft) addEvent.run(id, req.user!.id, 'SUBMITTED', 'Jurnal dikirim.', null, now);
    return id;
  });
  const id = create();
  res.status(201).json({ journal: journalDetailDto(id) });
});

// ---------- Detail ----------
journalsRouter.get('/:id', requireAuth, (req, res) => {
  const row = loadAuthorized(req, res);
  if (!row) return;
  res.json({ journal: journalDetailDto(row.id) });
});

// ---------- Edit (DRAFT / NEEDS_CORRECTION oleh pemilik) ----------
journalsRouter.patch('/:id', requireRole('GURU'), (req, res) => {
  const row = loadOwned(req, res);
  if (!row) return;
  if (row.status !== 'DRAFT' && row.status !== 'NEEDS_CORRECTION') {
    return res.status(409).json({ error: 'Jurnal hanya dapat diubah saat berstatus DRAFT atau NEEDS_CORRECTION.' });
  }
  const { errors, value: v } = readInput(req.body, true);
  const start = v.startTime ?? row.start_time;
  const end = v.endTime ?? row.end_time;
  if (start >= end) errors.push('Jam selesai harus setelah jam mulai.');
  if (errors.length) return bad(res, errors);

  db.prepare(
    `UPDATE journals SET journal_date=?, start_time=?, end_time=?, class_name=?, subject=?, topic=?, notes=?,
       students_count=?, sop_complied=?, updated_at=? WHERE id=?`,
  ).run(
    v.date ?? row.journal_date,
    start,
    end,
    v.className ?? row.class_name,
    v.subject ?? row.subject,
    v.topic ?? row.topic,
    v.notes ?? row.notes,
    v.studentsCount ?? row.students_count,
    v.sopComplied === undefined ? row.sop_complied : v.sopComplied ? 1 : 0,
    nowIso(),
    row.id,
  );
  res.json({ journal: journalDetailDto(row.id) });
});

// ---------- Kirim / kirim ulang ----------
journalsRouter.post('/:id/resubmit', requireRole('GURU'), (req, res) => {
  const row = loadOwned(req, res);
  if (!row) return;
  if (row.status !== 'NEEDS_CORRECTION' && row.status !== 'DRAFT') {
    return res.status(409).json({ error: 'Hanya jurnal DRAFT atau NEEDS_CORRECTION yang dapat dikirim.' });
  }
  const extra = typeof req.body?.notes === 'string' ? req.body.notes.trim().slice(0, 1000) : '';
  const base = row.status === 'DRAFT' ? 'Jurnal dikirim.' : 'Jurnal diperbaiki dan dikirim ulang.';
  const now = nowIso();
  db.transaction(() => {
    db.prepare(`UPDATE journals SET status='SUBMITTED', updated_at=?, submitted_at=? WHERE id=?`).run(now, now, row.id);
    addEvent.run(row.id, req.user!.id, 'SUBMITTED', extra ? `${base} ${extra}` : base, null, now);
  })();
  res.json({ journal: journalDetailDto(row.id) });
});

// ---------- Review (Laboran / Admin) ----------
journalsRouter.post('/:id/reviews', requireRole('ADMIN', 'LABORAN'), (req, res) => {
  const row = loadAuthorized(req, res);
  if (!row) return;
  const status = req.body?.status;
  if (status !== 'REVIEWED' && status !== 'NEEDS_CORRECTION') {
    return res.status(400).json({ error: 'Status review harus REVIEWED atau NEEDS_CORRECTION.' });
  }
  const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : '';
  if (notes.length > 2000) return res.status(400).json({ error: 'Catatan maksimal 2000 karakter.' });
  if (status === 'NEEDS_CORRECTION' && !notes) {
    return res.status(400).json({ error: 'Catatan koreksi wajib diisi agar guru tahu apa yang diperbaiki.' });
  }
  if (row.status !== 'SUBMITTED') {
    return res.status(409).json({ error: 'Hanya jurnal berstatus SUBMITTED yang dapat direview.' });
  }
  const sop = typeof req.body?.sopComplied === 'boolean' ? (req.body.sopComplied ? 1 : 0) : null;
  const now = nowIso();
  db.transaction(() => {
    addEvent.run(row.id, req.user!.id, status, notes, sop, now);
    db.prepare(
      `UPDATE journals SET status=?, updated_at=?, sop_complied=COALESCE(?, sop_complied) WHERE id=?`,
    ).run(status, now, sop, row.id);
  })();
  res.status(201).json({ journal: journalDetailDto(row.id) });
});

journalsRouter.get('/:id/reviews', requireAuth, (req, res) => {
  const row = loadAuthorized(req, res);
  if (!row) return;
  res.json({ reviews: listReviews(row.id) });
});
