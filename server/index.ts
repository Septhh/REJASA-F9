import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { config } from './config.ts';
import './db.ts';
import { seedIfEmpty } from './seed.ts';
import { loadUser, purgeExpiredSessions, requireAuth, sameOriginWrites } from './auth.ts';
import { authRouter } from './routes/auth.ts';
import { labsRouter, schedulesRouter } from './routes/labs.ts';
import { qrRouter } from './routes/qr.ts';
import { journalsRouter } from './routes/journals.ts';
import { inventoryRouter } from './routes/inventory.ts';
import { incidentsRouter } from './routes/incidents.ts';

seedIfEmpty();
purgeExpiredSessions();
setInterval(purgeExpiredSessions, 60 * 60 * 1000).unref();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

app.use('/api', express.json({ limit: '100kb' }));
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use('/api', sameOriginWrites, loadUser);

app.use('/api/auth', authRouter);
app.use('/api/qr', qrRouter);
app.use('/api/labs', labsRouter);
app.use('/api/schedules', requireAuth, schedulesRouter);
app.use('/api/journals', requireAuth, journalsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/incidents', incidentsRouter);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan.' }));

// Produksi: layani hasil build frontend (SPA) dari server yang sama.
const dist = path.resolve('dist');
if (config.isProd && fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON tidak valid.' });
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

app.listen(config.port, () => {
  console.log(`[rejasa] API berjalan di http://localhost:${config.port} (${config.isProd ? 'production' : 'development'})`);
});
