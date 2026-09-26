import { db } from './db.ts';

const JOURNAL_SELECT = `
  SELECT j.*, l.code AS lab_code, l.name AS lab_name, l.room_code AS lab_room_code,
         u.name AS teacher_name, u.code AS teacher_code, u.avatar_color AS teacher_avatar_color
  FROM journals j
  JOIN labs l ON l.id = j.lab_id
  JOIN users u ON u.id = j.teacher_id
`;

export type JournalRow = {
  id: number;
  code: string;
  lab_id: number;
  teacher_id: number;
  journal_date: string;
  start_time: string;
  end_time: string;
  class_name: string;
  subject: string;
  topic: string;
  notes: string;
  students_count: number;
  sop_complied: number;
  incident_reported: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'NEEDS_CORRECTION';
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  lab_code: string;
  lab_name: string;
  lab_room_code: string;
  teacher_name: string;
  teacher_code: string;
  teacher_avatar_color: string;
};

const TZ = 'Asia/Jakarta';
const wibHm = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })
    .format(new Date(iso))
    .replace('.', ':');

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

export function toJournalDto(r: JournalRow) {
  return {
    id: String(r.id),
    code: r.code,
    session: `${r.start_time}–${r.end_time}`,
    time: `${wibHm(r.submitted_at || r.created_at)} WIB`,
    date: r.journal_date,
    startTime: r.start_time,
    endTime: r.end_time,
    labId: r.lab_id,
    labCode: r.lab_code,
    labName: r.lab_name,
    teacherId: r.teacher_id,
    teacherCode: r.teacher_code,
    teacherName: r.teacher_name,
    teacherInitials: initials(r.teacher_name),
    teacherAvatarColor: r.teacher_avatar_color,
    className: r.class_name,
    subject: r.subject,
    topic: r.topic,
    status: r.status,
    notes: r.notes,
    studentsCount: r.students_count,
    sopComplied: !!r.sop_complied,
    incidentReported: r.incident_reported || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    submittedAt: r.submitted_at,
  };
}

export type ReviewRow = {
  id: number;
  journal_id: number;
  reviewer_id: number;
  status: 'SUBMITTED' | 'REVIEWED' | 'NEEDS_CORRECTION';
  notes: string;
  sop_complied: number | null;
  created_at: string;
  reviewer_name: string;
  reviewer_role: string;
};

export function toReviewDto(r: ReviewRow) {
  return {
    id: r.id,
    journalId: r.journal_id,
    reviewerId: r.reviewer_id,
    reviewerName: r.reviewer_name,
    reviewerRole: r.reviewer_role,
    status: r.status,
    notes: r.notes,
    sopComplied: r.sop_complied === null ? null : !!r.sop_complied,
    createdAt: r.created_at,
  };
}

const byId = db.prepare(`${JOURNAL_SELECT} WHERE j.id = ?`);
export const getJournalRow = (id: number) => byId.get(id) as JournalRow | undefined;

export function listJournalRows(where: string, params: unknown[]): JournalRow[] {
  return db
    .prepare(`${JOURNAL_SELECT} ${where} ORDER BY j.journal_date DESC, j.id DESC`)
    .all(...params) as JournalRow[];
}

export function listReviews(journalId: number) {
  const rows = db
    .prepare(
      `SELECT r.*, u.name AS reviewer_name, u.role AS reviewer_role
       FROM journal_reviews r JOIN users u ON u.id = r.reviewer_id
       WHERE r.journal_id = ? ORDER BY r.id ASC`,
    )
    .all(journalId) as ReviewRow[];
  return rows.map(toReviewDto);
}

export function journalDetailDto(id: number) {
  const row = getJournalRow(id);
  if (!row) return null;
  return { ...toJournalDto(row), reviews: listReviews(id) };
}
