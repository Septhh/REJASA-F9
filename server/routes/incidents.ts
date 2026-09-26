import { Router } from 'express';
import { db, nowIso } from '../db.ts';
import { requireRole } from '../auth.ts';

export const incidentsRouter = Router();
incidentsRouter.use(requireRole('ADMIN', 'LABORAN'));

const dto = (r: any) => ({
  id: String(r.id),
  assetCode: r.asset_code,
  time: r.occurred_at,
  title: r.title,
  description: r.description,
  reporter: r.reporter,
  className: r.class_name,
  labCode: r.lab_code,
  photoUrl: r.photo_url,
  photoAlt: r.photo_alt,
  status: r.status,
  actionType: r.action_type,
  actionLabel: r.action_label,
});

incidentsRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM incidents ORDER BY id DESC').all();
  res.json({ incidents: rows.map(dto) });
});

incidentsRouter.patch('/:id/disposition', (req, res) => {
  const cur = db.prepare('SELECT * FROM incidents WHERE id = ?').get(Number(req.params.id)) as any;
  if (!cur) return res.status(404).json({ error: 'Insiden tidak ditemukan.' });
  if (cur.status !== 'Open') return res.status(409).json({ error: 'Insiden sudah diproses.' });
  const action = String(req.body?.action ?? '').slice(0, 100);
  const urgency = String(req.body?.urgency ?? '').slice(0, 50);
  const notes = String(req.body?.notes ?? '').slice(0, 2000);
  db.prepare(
    `UPDATE incidents SET status='Disposed', action_label='Tiket Diproses', disposition_action=?, disposition_urgency=?,
       disposition_notes=?, disposed_by=?, disposed_at=? WHERE id=?`,
  ).run(action, urgency, notes, req.user!.id, nowIso(), cur.id);
  res.json({ incident: dto(db.prepare('SELECT * FROM incidents WHERE id = ?').get(cur.id)) });
});
