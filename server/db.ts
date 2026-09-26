import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from './config.ts';

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN','LABORAN','GURU')),
  avatar_color TEXT NOT NULL DEFAULT 'bg-emerald-700',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS labs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  room_code TEXT NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lab_id INTEGER NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  class_name TEXT NOT NULL,
  activity TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS qr_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  lab_id INTEGER NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS journals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  lab_id INTEGER NOT NULL REFERENCES labs(id),
  teacher_id INTEGER NOT NULL REFERENCES users(id),
  journal_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  class_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  students_count INTEGER NOT NULL DEFAULT 0,
  sop_complied INTEGER NOT NULL DEFAULT 1,
  incident_reported TEXT,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','SUBMITTED','REVIEWED','NEEDS_CORRECTION')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  submitted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_journals_teacher ON journals(teacher_id);
CREATE INDEX IF NOT EXISTS idx_journals_status ON journals(status);

CREATE TABLE IF NOT EXISTS journal_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_id INTEGER NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  reviewer_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('SUBMITTED','REVIEWED','NEEDS_CORRECTION')),
  notes TEXT NOT NULL DEFAULT '',
  sop_complied INTEGER,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_journal ON journal_reviews(journal_id);

CREATE TABLE IF NOT EXISTS inventory_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ALAT','REAGEN','BAHAN')),
  lab_id INTEGER REFERENCES labs(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  item_condition TEXT NOT NULL DEFAULT 'BAIK' CHECK (item_condition IN ('BAIK','PERLU_PERBAIKAN','RUSAK')),
  storage_location TEXT NOT NULL DEFAULT '',
  unit_value INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_code TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reporter TEXT NOT NULL,
  class_name TEXT NOT NULL,
  lab_code TEXT NOT NULL,
  photo_url TEXT NOT NULL DEFAULT '',
  photo_alt TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Disposed','Resolved')),
  action_type TEXT NOT NULL CHECK (action_type IN ('repair','scrap')),
  action_label TEXT NOT NULL,
  disposition_action TEXT,
  disposition_urgency TEXT,
  disposition_notes TEXT,
  disposed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  disposed_at TEXT
);
`);

/** Timestamp ISO (UTC) untuk kolom created_at/updated_at. */
export const nowIso = () => new Date().toISOString();
