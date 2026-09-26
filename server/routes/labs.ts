import { Router } from 'express';
import { db } from '../db.ts';
import { config } from '../config.ts';
import { requireAuth, requireRole } from '../auth.ts';
import { addDays, dayOfWeek, isValidTime, wibDate } from '../time.ts';

export const labsRouter = Router();
export const schedulesRouter = Router();

type LabRow = { id: number; code: string; room_code: string; name: string };
const labDto = (l: LabRow) => ({
  id: l.id,
  code: l.code,
  roomCode: l.room_code,
  name: l.name,
  school: config.school,
});

// Identitas laboratorium saja (tidak ada data inventaris).
labsRouter.get('/', requireAuth, (_req, res) => {
  const rows = db.prepare('SELECT * FROM labs ORDER BY id').all() as LabRow[];
  res.json({ labs: rows.map(labDto) });
});

labsRouter.get('/:labId', requireAuth, (req, res) => {
  const lab = db.prepare('SELECT * FROM labs WHERE id = ?').get(Number(req.params.labId)) as
    | LabRow
    | undefined;
  if (!lab) return res.status(404).json({ error: 'Laboratorium tidak ditemukan.' });
  res.json({ lab: labDto(lab) });
});

const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

// Jadwal penggunaan mingguan berulang -> diekspansi menjadi 7 hari ke depan (mulai hari ini, WIB).
labsRouter.get('/:labId/schedule', requireAuth, (req, res) => {
  const labId = Number(req.params.labId);
  const lab = db.prepare('SELECT * FROM labs WHERE id = ?').get(labId) as LabRow | undefined;
  if (!lab) return res.status(404).json({ error: 'Laboratorium tidak ditemukan.' });

  const rows = db
    .prepare(
      `SELECT id, day_of_week, start_time, end_time, class_name, activity, subject, teacher_id
       FROM schedules WHERE lab_id = ? ORDER BY start_time`,
    )
    .all(labId) as {
    id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    class_name: string;
    activity: string;
    subject: string;
    teacher_id: number | null;
  }[];

  const today = wibDate();
  const items = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
    const dow = dayOfWeek(date);
    for (const r of rows.filter((x) => x.day_of_week === dow)) {
      items.push({
        scheduleId: r.id,
        date,
        dayName: DAY_NAMES[dow - 1],
        isToday: i === 0,
        startTime: r.start_time,
        endTime: r.end_time,
        className: r.class_name,
        activity: r.activity,
        subject: r.subject,
        isMine: r.teacher_id !== null && r.teacher_id === req.user!.id,
      });
    }
  }
  res.json({ lab: labDto(lab), schedule: items });
});

// ---- Manajemen jadwal (ADMIN) ----
function readSchedule(body: any) {
  const errors: string[] = [];
  const labId = Number(body?.labId);
  const dow = Number(body?.dayOfWeek);
  if (!Number.isInteger(labId)) errors.push('labId tidak valid');
  if (!Number.isInteger(dow) || dow < 1 || dow > 7) errors.push('dayOfWeek harus 1-7');
  if (!isValidTime(body?.startTime) || !isValidTime(body?.endTime) || body.startTime >= body.endTime)
    errors.push('jam tidak valid');
  const className = String(body?.className ?? '').trim();
  const activity = String(body?.activity ?? '').trim();
  if (!className) errors.push('className wajib');
  if (!activity) errors.push('activity wajib');
  const teacherId = body?.teacherId == null ? null : Number(body.teacherId);
  return {
    errors,
    v: {
      labId,
      dow,
      start: body?.startTime,
      end: body?.endTime,
      className,
      activity,
      subject: String(body?.subject ?? '').trim(),
      teacherId,
    },
  };
}

schedulesRouter.post('/', requireRole('ADMIN'), (req, res) => {
  const { errors, v } = readSchedule(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });
  if (!db.prepare('SELECT 1 FROM labs WHERE id = ?').get(v.labId))
    return res.status(404).json({ error: 'Laboratorium tidak ditemukan.' });
  const info = db
    .prepare(
      `INSERT INTO schedules (lab_id, day_of_week, start_time, end_time, class_name, activity, subject, teacher_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(v.labId, v.dow, v.start, v.end, v.className, v.activity, v.subject, v.teacherId);
  res.status(201).json({ id: info.lastInsertRowid });
});

schedulesRouter.patch('/:id', requireRole('ADMIN'), (req, res) => {
  const cur = db.prepare('SELECT * FROM schedules WHERE id = ?').get(Number(req.params.id)) as any;
  if (!cur) return res.status(404).json({ error: 'Jadwal tidak ditemukan.' });
  const { errors, v } = readSchedule({
    labId: cur.lab_id,
    dayOfWeek: cur.day_of_week,
    startTime: cur.start_time,
    endTime: cur.end_time,
    className: cur.class_name,
    activity: cur.activity,
    subject: cur.subject,
    teacherId: cur.teacher_id,
    ...req.body,
  });
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });
  db.prepare(
    `UPDATE schedules SET lab_id=?, day_of_week=?, start_time=?, end_time=?, class_name=?, activity=?, subject=?, teacher_id=? WHERE id=?`,
  ).run(v.labId, v.dow, v.start, v.end, v.className, v.activity, v.subject, v.teacherId, cur.id);
  res.json({ ok: true });
});

schedulesRouter.delete('/:id', requireRole('ADMIN'), (req, res) => {
  const info = db.prepare('DELETE FROM schedules WHERE id = ?').run(Number(req.params.id));
  if (!info.changes) return res.status(404).json({ error: 'Jadwal tidak ditemukan.' });
  res.json({ ok: true });
});
