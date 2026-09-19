import { LabRoom, JournalEntry, IncidentItem, LabUsageStat, DayAllocation } from '../types';

export const INITIAL_ROOMS: LabRoom[] = [
  {
    id: 'room-bio',
    code: 'BIO-01',
    badgeCode: 'BIO • LAB 01',
    badgeBg: 'bg-emerald-950',
    badgeColor: 'text-[#89f5e7]',
    name: 'Lab Biologi Terpadu',
    status: 'Standby',
    statusType: 'standby',
    className: 'Ruangan siap digunakan.',
    topic: 'Belum ada praktikum aktif',
    teacher: 'Jadwal Terbuka',
    statusDetail: 'Kondisi Standby',
    statusDetailType: 'info',
    workstations: 36,
  },
  {
    id: 'room-fis',
    code: 'FIS-02',
    badgeCode: 'FIS • LAB 02',
    badgeBg: 'bg-sky-950',
    badgeColor: 'text-sky-200',
    name: 'Lab Fisika Modern',
    status: 'Standby',
    statusType: 'standby',
    className: 'Ruangan siap digunakan.',
    topic: 'Belum ada praktikum aktif',
    teacher: 'Jadwal Terbuka',
    statusDetail: 'Kondisi Standby',
    statusDetailType: 'info',
    workstations: 36,
  },
  {
    id: 'room-kim',
    code: 'KIM-03',
    badgeCode: 'KIM • LAB 03',
    badgeBg: 'bg-teal-950',
    badgeColor: 'text-[#89f5e7]',
    name: 'Lab Kimia Anorganik',
    status: 'Standby',
    statusType: 'standby',
    className: 'Ruangan siap digunakan.',
    topic: 'Belum ada praktikum aktif',
    teacher: 'Jadwal Terbuka',
    statusDetail: 'Kondisi Standby',
    statusDetailType: 'info',
    workstations: 36,
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
    topic: 'Belum ada praktikum aktif',
    teacher: 'Jadwal Terbuka',
    statusDetail: 'Kondisi Standby',
    statusDetailType: 'info',
    workstations: 36,
  },
  {
    id: 'room-bsm',
    code: 'BSM-05',
    badgeCode: 'BSM • LAB 05',
    badgeBg: 'bg-slate-800',
    badgeColor: 'text-slate-200',
    name: 'Smartclass & Bahasa',
    status: 'Standby',
    statusType: 'standby',
    className: 'Ruangan siap digunakan.',
    topic: 'Belum ada praktikum aktif',
    teacher: 'Jadwal Terbuka',
    statusDetail: 'Kondisi Standby',
    statusDetailType: 'info',
    workstations: 36,
  },
];

// Clean Zero State: No mock journals or incidents
export const INITIAL_JOURNALS: JournalEntry[] = [];
export const INITIAL_INCIDENTS: IncidentItem[] = [];

export const LAB_MONTHLY_STATS: LabUsageStat[] = [];
export const WEEKLY_HOURS_ALLOCATION: DayAllocation[] = [];

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
