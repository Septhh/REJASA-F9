import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { db } from './db.ts';
import { config } from './config.ts';

export type Role = 'ADMIN' | 'LABORAN' | 'GURU';

export interface AuthUser {
  id: number;
  code: string;
  name: string;
  role: Role;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export const COOKIE_NAME = 'rejasa_sid';

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function createSession(userId: number): { token: string; maxAgeMs: number } {
  const token = crypto.randomBytes(32).toString('base64url');
  const maxAgeMs = config.sessionTtlHours * 3600 * 1000;
  const expires = new Date(Date.now() + maxAgeMs).toISOString();
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(
    sha256(token),
    userId,
    expires,
  );
  return { token, maxAgeMs };
}

export function destroySession(token: string | undefined) {
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

export function setSessionCookie(req: Request, res: Response, token: string, maxAgeMs: number) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: maxAgeMs,
    path: '/',
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export function getSessionToken(req: Request): string | undefined {
  return parseCookies(req.headers.cookie)[COOKIE_NAME];
}

const findSession = db.prepare(`
  SELECT u.id, u.code, u.name, u.role
  FROM sessions s JOIN users u ON u.id = s.user_id
  WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1
`);

/** Memuat user dari cookie sesi. Role SELALU dibaca dari database, tidak dari klien. */
export function loadUser(req: Request, _res: Response, next: NextFunction) {
  const token = getSessionToken(req);
  if (token) {
    const row = findSession.get(sha256(token), new Date().toISOString()) as AuthUser | undefined;
    if (row) req.user = row;
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Belum login.' });
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Belum login.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke sumber daya ini.' });
    }
    next();
  };
}

/** Bersihkan sesi kedaluwarsa (dipanggil periodik). */
export function purgeExpiredSessions() {
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date().toISOString());
}

/** Rate limiter sederhana in-memory (per kunci, jendela tetap). */
export function rateLimit(max: number, windowMs: number) {
  const hits = new Map<string, { count: number; reset: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const cur = hits.get(key);
    if (!cur || cur.reset <= now) {
      hits.set(key, { count: 1, reset: now + windowMs });
      return next();
    }
    cur.count += 1;
    if (cur.count > max) {
      res.setHeader('Retry-After', Math.ceil((cur.reset - now) / 1000));
      return res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi sebentar lagi.' });
    }
    next();
  };
}

/** Tolak request tulis lintas-origin (pertahanan CSRF tambahan di atas SameSite=Lax). */
export function sameOriginWrites(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.host) {
        return res.status(403).json({ error: 'Origin tidak diizinkan.' });
      }
    } catch {
      return res.status(403).json({ error: 'Origin tidak valid.' });
    }
  }
  next();
}
