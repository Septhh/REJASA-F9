import crypto from 'node:crypto';
import { Router } from 'express';
import type { Request } from 'express';
import { db, nowIso } from '../db.ts';
import { config } from '../config.ts';
import { requireRole } from '../auth.ts';

export const qrRouter = Router();

function baseUrl(req: Request) {
  if (config.appUrl) return config.appUrl;
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
  return `${proto}://${req.headers.host}`;
}

// ---- Admin: kelola QR ----
// Didaftarkan SEBELUM '/:token' agar tidak tertangkap sebagai token.
qrRouter.get('/', requireRole('ADMIN'), (req, res) => {
  const rows = db
    .prepare(
      `SELECT q.id, q.token, q.lab_id, q.created_at, l.code AS lab_code, l.name AS lab_name
       FROM qr_codes q JOIN labs l ON l.id = q.lab_id
       WHERE q.active = 1 ${req.query.labId ? 'AND q.lab_id = ?' : ''}
       ORDER BY q.lab_id`,
    )
    .all(...(req.query.labId ? [Number(req.query.labId)] : [])) as any[];
  const base = baseUrl(req);
  res.json({
    qrCodes: rows.map((r) => ({
      id: r.id,
      token: r.token,
      labId: r.lab_id,
      labCode: r.lab_code,
      labName: r.lab_name,
      createdAt: r.created_at,
      url: `${base}/q/${r.token}`,
    })),
  });
});

// Membuat QR (mencabut QR aktif sebelumnya untuk lab yang sama). TIDAK membuat jurnal.
qrRouter.post('/', requireRole('ADMIN'), (req, res) => {
  const labId = Number(req.body?.labId);
  const lab = db.prepare('SELECT id, code, name FROM labs WHERE id = ?').get(labId) as
    | { id: number; code: string; name: string }
    | undefined;
  if (!lab) return res.status(404).json({ error: 'Laboratorium tidak ditemukan.' });

  const token = crypto.randomBytes(16).toString('base64url');
  const tx = db.transaction(() => {
    db.prepare('UPDATE qr_codes SET active = 0, revoked_at = ? WHERE lab_id = ? AND active = 1').run(
      nowIso(),
      labId,
    );
    return db
      .prepare('INSERT INTO qr_codes (token, lab_id, created_by) VALUES (?, ?, ?)')
      .run(token, labId, req.user!.id);
  });
  const info = tx();
  res.status(201).json({
    qr: {
      id: Number(info.lastInsertRowid),
      token,
      labId: lab.id,
      labCode: lab.code,
      labName: lab.name,
      createdAt: nowIso(),
      url: `${baseUrl(req)}/q/${token}`,
    },
  });
});

// ---- Publik: hanya identitas lab ----
qrRouter.get('/:token', (req, res) => {
  const row = db
    .prepare(
      `SELECT l.id, l.code, l.room_code, l.name
       FROM qr_codes q JOIN labs l ON l.id = q.lab_id
       WHERE q.token = ? AND q.active = 1`,
    )
    .get(req.params.token) as { id: number; code: string; room_code: string; name: string } | undefined;
  if (!row) return res.status(404).json({ error: 'QR tidak valid atau sudah tidak aktif.' });
  res.json({
    token: req.params.token,
    lab: { id: row.id, code: row.code, roomCode: row.room_code, name: row.name, school: config.school },
  });
});
