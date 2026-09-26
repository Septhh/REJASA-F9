import path from 'node:path';
import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 3001,
  isProd: process.env.NODE_ENV === 'production',
  appUrl: (process.env.APP_URL || '').replace(/\/+$/, ''),
  dbPath: path.resolve(process.env.DB_PATH || './data/rejasa.db'),
  seedDemoData: process.env.SEED_DEMO_DATA !== 'false',
  sessionTtlHours: 12,
  // Batas percobaan login per IP per menit (login memakai kode saja, jadi dibatasi ketat).
  loginRateLimit: Number(process.env.LOGIN_RATE_LIMIT) || 10,
  school: 'SMAN 3 Salatiga',
};
