import { Teacher, LabCode } from '../types';

export const DEFAULT_TEACHERS: Teacher[] = [
  {
    id: 'tch-01',
    teacherCode: 'GUR-IPA-01',
    name: 'Drs. Bambang Haryanto, M.Pd.',
    nip: '19750812 200003 1 003',
    subject: 'Biologi & IPA Terpadu',
    primaryLab: 'BIO',
    status: 'ACTIVE',
    phone: '0812-3456-7890',
    avatarColor: 'bg-emerald-700',
    joinedDate: '2023-01-10',
  },
  {
    id: 'tch-02',
    teacherCode: 'GUR-FIS-02',
    name: 'Dra. Siti Nurhaliza, M.Si.',
    nip: '19810425 200604 2 011',
    subject: 'Fisika Terapan & Gelombang',
    primaryLab: 'FIS',
    status: 'ACTIVE',
    phone: '0813-9876-5432',
    avatarColor: 'bg-sky-700',
    joinedDate: '2023-02-15',
  },
  {
    id: 'tch-03',
    teacherCode: 'GUR-KIM-03',
    name: 'Hendra Wijaya, S.Si., M.Pd.',
    nip: '19881119 201212 1 002',
    subject: 'Kimia Analitik & Larutan',
    primaryLab: 'KIM',
    status: 'ACTIVE',
    phone: '0821-4567-8901',
    avatarColor: 'bg-teal-700',
    joinedDate: '2023-03-01',
  },
  {
    id: 'tch-04',
    teacherCode: 'GUR-KOM-04',
    name: 'Raditya Pratama, S.Kom., M.T.',
    nip: '19920315 201902 1 005',
    subject: 'Informatika & Jaringan Komputer',
    primaryLab: 'COM',
    status: 'ACTIVE',
    phone: '0857-1234-5678',
    avatarColor: 'bg-indigo-700',
    joinedDate: '2023-07-20',
  },
  {
    id: 'tch-05',
    teacherCode: 'GUR-BHS-05',
    name: 'Nurul Aisyah, S.Pd., M.Hum.',
    nip: '19850630 201001 2 018',
    subject: 'Bahasa Inggris & Smart Multimedia',
    primaryLab: 'BSM',
    status: 'ACTIVE',
    phone: '0878-8765-4321',
    avatarColor: 'bg-purple-700',
    joinedDate: '2023-08-01',
  },
];

const STORAGE_KEY = 'lab_school_teachers_v1';

export function getStoredTeachers(): Teacher[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TEACHERS));
      return DEFAULT_TEACHERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_TEACHERS;
  } catch (err) {
    console.error('Failed to get teachers from localStorage:', err);
    return DEFAULT_TEACHERS;
  }
}

export function saveTeachers(teachers: Teacher[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teachers));
  } catch (err) {
    console.error('Failed to save teachers to localStorage:', err);
  }
}
