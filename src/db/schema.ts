import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

// Admin users table with unique admin code and hashed authorization passwords
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  adminCode: text('admin_code').notNull().unique(), // e.g. RDT1, ADM2, LAB01
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(), // SHA-256 / scrypt hex hash
  role: text('role').notNull().default('Laboran'), // Laboran | Kepala Lab | Admin Utama
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Authorized Teachers table (Login by Teacher Code, e.g. ML, KP1, SK, GUR-IPA-01)
export const teachers = pgTable('teachers', {
  id: serial('id').primaryKey(),
  teacherCode: text('teacher_code').notNull().unique(), // ML, KP1, SK, GUR-IPA-01
  name: text('name').notNull(),
  nip: text('nip'),
  subject: text('subject').notNull(),
  primaryLab: text('primary_lab').notNull().default('BIO'),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE | INACTIVE
  phone: text('phone'),
  avatarColor: text('avatar_color').notNull().default('bg-emerald-600'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Users table (fallback/legacy)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('laboran'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Lab rooms table
export const labRooms = pgTable('lab_rooms', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g. LAB-01, LAB-02
  name: text('name').notNull(),
  badgeCode: text('badge_code').notNull(), // BIO, FIS, KIM, COM, BSM
  badgeBg: text('badge_bg').notNull(),
  badgeColor: text('badge_color').notNull(),
  status: text('status').notNull().default('Standby'),
  statusType: text('status_type').notNull().default('standby'),
  className: text('class_name'),
  topic: text('topic'),
  teacher: text('teacher'),
  statusDetail: text('status_detail').notNull().default('Siap digunakan'),
  statusDetailType: text('status_detail_type').notNull().default('info'),
  workstations: integer('workstations').default(36),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Lab schedules table (for Teacher Flow identification & jadwal praktikum)
export const labSchedules = pgTable('lab_schedules', {
  id: serial('id').primaryKey(),
  labCode: text('lab_code').notNull(), // BIO, FIS, KIM, COM, BSM
  dayOfWeek: text('day_of_week').notNull(), // Senin, Selasa, etc.
  date: text('date'), // YYYY-MM-DD
  timeSlot: text('time_slot').notNull(), // 08.00 - 10.00 WIB
  className: text('class_name').notNull(), // XI IPA 1
  subject: text('subject').notNull(), // Biologi
  teacherCode: text('teacher_code'), // GUR-IPA-01
  teacherName: text('teacher_name').notNull(),
  topic: text('topic').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// QR codes table (maps token -> lab_code, identifies laboratory only)
export const qrCodes = pgTable('qr_codes', {
  id: serial('id').primaryKey(),
  token: text('token').notNull().unique(), // e.g. QR-LAB-BIO, SLMS-QR-BIO-123456
  labCode: text('lab_code').notNull(), // BIO, FIS, KIM, COM, BSM
  labName: text('lab_name').notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Journal entries table
export const journals = pgTable('journals', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g. JR-20260918-0001
  session: text('session').notNull(), // Sesi 1-2, 07:30 - 09:00 WIB
  time: text('time').notNull(), // 07:30 WIB
  labCode: text('lab_code').notNull(), // BIO, FIS, KIM, COM, BSM
  labName: text('lab_name').notNull(),
  teacherCode: text('teacher_code'), // GUR-IPA-01 or ML
  teacherName: text('teacher_name').notNull(),
  teacherInitials: text('teacher_initials').notNull(),
  teacherAvatarColor: text('teacher_avatar_color').notNull(),
  className: text('class_name').notNull(),
  subject: text('subject'),
  topic: text('topic').notNull(),
  status: text('status').notNull().default('SUBMITTED'), // DRAFT | NEEDS_CORRECTION | SUBMITTED | REVIEWED
  notes: text('notes'),
  studentsCount: integer('students_count').notNull().default(36),
  conditionBefore: text('condition_before').default('Baik'),
  conditionAfter: text('condition_after').default('Baik'),
  issueType: text('issue_type'),
  issueDescription: text('issue_description'),
  sopComplied: boolean('sop_complied').notNull().default(true),
  incidentReported: text('incident_reported'),
  submittedByUid: text('submitted_by_uid'),
  reviewedByUid: text('reviewed_by_uid'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
});

// Review History table (tracks review logs: timestamp, reviewer, status, notes)
export const journalReviews = pgTable('journal_reviews', {
  id: serial('id').primaryKey(),
  journalId: integer('journal_id').notNull().references(() => journals.id, { onDelete: 'cascade' }),
  reviewerRole: text('reviewer_role').notNull(), // LABORAN | ADMIN | GURU
  reviewerName: text('reviewer_name').notNull(),
  reviewerCode: text('reviewer_code'),
  status: text('status').notNull(), // SUBMITTED | REVIEWED | NEEDS_CORRECTION
  notes: text('notes').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Inventory items table (ADMIN ONLY: Protected by server-side authorization)
export const inventoryItems = pgTable('inventory_items', {
  id: serial('id').primaryKey(),
  itemCode: text('item_code').notNull().unique(), // e.g. BIO-MC-001
  name: text('name').notNull(),
  brandModel: text('brand_model').notNull(),
  labCode: text('lab_code').notNull(), // BIO, FIS, KIM, COM, BSM
  category: text('category').notNull(),
  quantityTotal: integer('quantity_total').notNull().default(0),
  quantityGood: integer('quantity_good').notNull().default(0),
  quantityMinorDamage: integer('quantity_minor_damage').notNull().default(0),
  quantityHeavyDamage: integer('quantity_heavy_damage').notNull().default(0),
  status: text('status').notNull().default('Tersedia'),
  storageLocation: text('storage_location').notNull(),
  procurementYear: integer('procurement_year').notNull().default(2023),
  fundingSource: text('funding_source').notNull().default('Dana BOS'),
  specs: text('specs').notNull().default(''),
  unit: text('unit').notNull().default('Unit'),
  lastInspectedAt: text('last_inspected_at').notNull().default('2026-09-10'),
  inspectedBy: text('inspected_by').notNull().default('Laboran'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Incident reports table
export const incidents = pgTable('incidents', {
  id: serial('id').primaryKey(),
  assetCode: text('asset_code').notNull(), // e.g. BIO-MC-04
  time: text('time').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  reporter: text('reporter').notNull(),
  className: text('class_name').notNull(),
  labCode: text('lab_code').notNull(),
  photoUrl: text('photo_url').notNull(),
  photoAlt: text('photo_alt').notNull(),
  status: text('status').notNull().default('Open'), // Open | Disposed | Resolved
  actionType: text('action_type').notNull().default('repair'), // repair | scrap
  actionLabel: text('action_label').notNull().default('Ajukan Servis'),
  createdAt: timestamp('created_at').defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  journals: many(journals),
}));

export const journalsRelations = relations(journals, ({ one, many }) => ({
  submitter: one(users, {
    fields: [journals.submittedByUid],
    references: [users.uid],
  }),
  reviews: many(journalReviews),
}));

export const journalReviewsRelations = relations(journalReviews, ({ one }) => ({
  journal: one(journals, {
    fields: [journalReviews.journalId],
    references: [journals.id],
  }),
}));

