import { Router } from 'express';
import { db } from '../db.ts';
import { config } from '../config.ts';
import {
  clearSessionCookie,
  createSession,
  destroySession,
  getSessionToken,
  rateLimit,
  requireAuth,
  setSessionCookie,
} from '../auth.ts';

export const authRouter = Router();

// Login hanya dengan kode (tanpa PIN) — batasi percobaan untuk mencegah tebak-tebakan kode.
const loginLimiter = rateLimit(config.loginRateLimit, 60_000);

authRouter.post('/login', loginLimiter, (req, res) => {
  const raw = req.body?.code;
  const code = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  if (!code || code.length > 32) return res.status(400).json({ error: 'Kode wajib diisi.' });

  const user = db
    .prepare('SELECT id, code, name, role FROM users WHERE code = ? AND active = 1')
    .get(code) as { id: number; code: string; name: string; role: string } | undefined;
  if (!user) return res.status(401).json({ error: 'Kode tidak dikenali.' });

  const { token, maxAgeMs } = createSession(user.id);
  setSessionCookie(req, res, token, maxAgeMs);
  res.json({ user });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

authRouter.post('/logout', (req, res) => {
  destroySession(getSessionToken(req));
  clearSessionCookie(res);
  res.json({ ok: true });
});
