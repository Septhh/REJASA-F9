export type LabCode = 'BIO' | 'FIS' | 'KIM' | 'COM' | 'BSM';

export type JournalStatus = 'DRAFT' | 'NEEDS_CORRECTION' | 'SUBMITTED' | 'REVIEWED';

export type RoomStatus = 'Insiden' | 'Berjalan' | 'Praktikum' | 'Standby' | 'Sterilisasi';

export interface Teacher {
  id: string;
  teacherCode: string; // e.g. "ML", "KP1", "SK", "GUR-IPA-01"
  name: string; // e.g. "Drs. Bambang Haryanto, M.Pd."
  nip?: string;
  subject: string; // e.g. "Biologi & Ilmu Pengetahuan Alam"
  primaryLab: LabCode;
  status: 'ACTIVE' | 'INACTIVE';
  phone?: string;
  avatarColor: string;
  joinedDate: string;
}

export interface JournalReview {
  id: number | string;
  journalId: number | string;
  reviewerRole: 'LABORAN' | 'ADMIN' | 'GURU';
  reviewerName: string;
  reviewerCode?: string;
  status: JournalStatus;
  notes: string;
  createdAt: string;
}

export interface LabSchedule {
  id: number | string;
  labCode: LabCode;
  dayOfWeek: string;
  date?: string;
  timeSlot: string;
  className: string;
  subject: string;
  teacherCode?: string;
  teacherName: string;
  topic: string;
}

export interface LabQRCode {
  id: number | string;
  token: string;
  labCode: LabCode;
  labName: string;
  title: string;
  schoolName?: string;
}

export type InventoryCategory =
  | 'Optik & Mikroskopi'
  | 'Elektronika & Alat Ukur'
  | 'Alat Gelas & Kimia'
  | 'Komputer & Jaringan'
  | 'Audio & Multimedia'
  | 'Peralatan Keselamatan'
  | 'Peraga & Model Anatomi'
  | 'Bahan & Reagen';

export type InventoryCondition = 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Perlu Kalibrasi';

export type InventoryStatus = 'Tersedia' | 'Sedang Digunakan' | 'Dalam Perbaikan' | 'Dipinjam';

export interface InventoryItem {
  id: string;
  itemCode: string; // e.g. "BIO-MC-001"
  name: string; // e.g. "Mikroskop Binokuler Olympus CX23"
  brandModel: string; // e.g. "Olympus CX23 LED"
  labCode: LabCode;
  category: InventoryCategory;
  quantityTotal: number;
  quantityGood: number;
  quantityMinorDamage: number;
  quantityHeavyDamage: number;
  status: InventoryStatus;
  storageLocation: string; // e.g. "Lemari A - Rak 2"
  procurementYear: number;
  fundingSource: 'Dana BOS' | 'DAK Fisik' | 'Komite Sekolah' | 'Bantuan Pemerintah' | 'Hibah Perusahaan';
  specs: string;
  unit: string; // "Unit", "Set", "Buah", "Paket"
  lastInspectedAt: string;
  inspectedBy: string;
  notes?: string;
}

export interface LabRoom {
  id: string;
  code: string;
  badgeCode: string;
  badgeBg: string;
  badgeColor: string;
  name: string;
  status: RoomStatus;
  statusType: 'problem' | 'reviewed' | 'active' | 'standby';
  className?: string;
  topic?: string;
  teacher?: string;
  statusDetail: string;
  statusDetailType: 'problem' | 'success' | 'timer' | 'info';
  actionLabel?: string;
  workstations?: number;
}

export interface JournalEntry {
  id: string;
  code: string;
  session: string;
  time: string;
  labCode: LabCode;
  labName: string;
  teacherCode?: string;
  teacherName: string;
  teacherInitials: string;
  teacherAvatarColor: string;
  className: string;
  subject?: string;
  topic: string;
  status: JournalStatus;
  notes?: string;
  studentsCount: number;
  conditionBefore?: string;
  conditionAfter?: string;
  issueType?: string;
  issueDescription?: string;
  sopComplied: boolean;
  incidentReported?: string;
  reviews?: JournalReview[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IncidentItem {
  id: string;
  assetCode: string;
  time: string;
  title: string;
  description: string;
  reporter: string;
  className: string;
  labCode: LabCode;
  photoUrl: string;
  photoAlt: string;
  status: 'Open' | 'Disposed' | 'Resolved';
  actionType: 'repair' | 'scrap';
  actionLabel: string;
}

export interface LabUsageStat {
  labName: string;
  sessions: number;
  percentage: number;
  color: string;
}

export interface DayAllocation {
  day: string;
  hours: number;
  isToday?: boolean;
  details: string;
}
