import { LabRoom, JournalEntry, IncidentItem, LabUsageStat, DayAllocation } from '../types';

export const INITIAL_ROOMS: LabRoom[] = [
  {
    id: 'room-bio',
    code: 'BIO-01',
    badgeCode: 'BIO • LAB 01',
    badgeBg: 'bg-emerald-950',
    badgeColor: 'text-[#89f5e7]',
    name: 'Lab Biologi Terpadu',
    status: 'Insiden',
    statusType: 'problem',
    className: 'Kelas XI IPA 1',
    topic: 'Pengamatan Jaringan Sel',
    teacher: 'Pak Budi Santoso, M.Pd',
    statusDetail: 'BIO-03 Lensa Retak',
    statusDetailType: 'problem',
  },
  {
    id: 'room-fis',
    code: 'FIS-02',
    badgeCode: 'FIS • LAB 02',
    badgeBg: 'bg-sky-950',
    badgeColor: 'text-sky-200',
    name: 'Lab Fisika Modern',
    status: 'Berjalan',
    statusType: 'reviewed',
    className: 'Kelas X-2',
    topic: 'Rangkaian Hukum Ohm',
    teacher: 'Bu Ratna Sari, S.Si',
    statusDetail: 'Peralatan Lengkap & Aman',
    statusDetailType: 'success',
  },
  {
    id: 'room-kim',
    code: 'KIM-03',
    badgeCode: 'KIM • LAB 03',
    badgeBg: 'bg-teal-950',
    badgeColor: 'text-[#89f5e7]',
    name: 'Lab Kimia Anorganik',
    status: 'Praktikum',
    statusType: 'active',
    className: 'Kelas XII IPA 3',
    topic: 'Titrasi Asam Basa HCl-NaOH',
    teacher: 'Pak Anton Wijaya, M.Sc',
    statusDetail: 'Selesai dlm 35 Menit',
    statusDetailType: 'timer',
  },
  {
    id: 'room-com',
    code: 'COM-04',
    badgeCode: 'COM • LAB 04',
    badgeBg: 'bg-slate-800',
    badgeColor: 'text-slate-200',
    name: 'Lab Komputer Sains',
    status: 'Standby',
    statusType: 'standby',
    className: 'Ruangan siap digunakan.',
    topic: 'Simulasi PhET Fisika XI IPA 2',
    teacher: 'Sesi Berikutnya: 13.00 WIB',
    statusDetail: '36 Workstation Siap',
    statusDetailType: 'info',
    actionLabel: 'Jadwal',
    workstations: 36,
  },
  {
    id: 'room-bsm',
    code: 'BSM-05',
    badgeCode: 'BSM • LAB 05',
    badgeBg: 'bg-slate-800',
    badgeColor: 'text-slate-200',
    name: 'Smartclass & Bahasa',
    status: 'Sterilisasi',
    statusType: 'standby',
    className: 'Maintenance & kebersihan usai.',
    topic: 'Sanitasi Headset Audio OK',
    teacher: 'Siap Digunakan Sesi Siang',
    statusDetail: 'Siap Booking',
    statusDetailType: 'info',
    actionLabel: 'Kunci',
  },
];

export const LAB_MONTHLY_STATS: LabUsageStat[] = [
  { labName: 'Lab Kimia Anorganik', sessions: 42, percentage: 92, color: 'bg-primary' },
  { labName: 'Lab Biologi Terpadu', sessions: 38, percentage: 84, color: 'bg-primary' },
  { labName: 'Lab Fisika Modern', sessions: 29, percentage: 65, color: 'bg-secondary' },
  { labName: 'Lab Komputer Sains', sessions: 14, percentage: 31, color: 'bg-slate-400' },
];

export const WEEKLY_HOURS_ALLOCATION: DayAllocation[] = [
  { day: 'Sen', hours: 7, details: 'BIO: 3j, KIM: 2j, FIS: 2j' },
  { day: 'Sel', hours: 9, details: 'KIM: 4j, FIS: 3j, COM: 2j' },
  { day: 'Rab', hours: 8, details: 'BIO: 4j, KIM: 2j, FIS: 2j' },
  { day: 'Kam (Now)', hours: 10, isToday: true, details: 'BIO: 4j, KIM: 3j, FIS: 3j' },
  { day: 'Jum', hours: 5, details: 'KIM: 3j, FIS: 2j' },
];

/**
 * Helper to export Journal records to standard CSV
 */
export function exportJournalsToCSV(journals: JournalEntry[]) {
  const headers = ['No Jurnal', 'Sesi', 'Waktu', 'Lab', 'Guru Pengampu', 'Kelas', 'Topik Praktikum', 'Status Validasi', 'Jumlah Siswa'];
  const rows = journals.map(j => [
    `"${j.code}"`,
    `"${j.session}"`,
    `"${j.time}"`,
    `"${j.labCode}"`,
    `"${j.teacherName}"`,
    `"${j.className}"`,
    `"${j.topic.replace(/"/g, '""')}"`,
    `"${j.status}"`,
    j.studentsCount,
  ]);
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `jurnal-laboratorium-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
