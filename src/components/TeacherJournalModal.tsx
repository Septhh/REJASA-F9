import React, { useState, useEffect } from 'react';
import { LabCode } from '../types';
import { useTeacherAuth } from '../context/TeacherAuthContext';

interface TeacherJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLabCode?: LabCode;
  onSuccess: (message: string) => void;
  onOpenTeacherLogin?: () => void;
}

export const TeacherJournalModal: React.FC<TeacherJournalModalProps> = ({
  isOpen,
  onClose,
  defaultLabCode = 'BIO',
  onSuccess,
  onOpenTeacherLogin,
}) => {
  const { currentTeacher } = useTeacherAuth();
  const [labCode, setLabCode] = useState<LabCode>(defaultLabCode);
  const [teacherName, setTeacherName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('09:00');
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [activityType, setActivityType] = useState('Praktikum');
  const [activityTitle, setActivityTitle] = useState('');
  const [studentCount, setStudentCount] = useState<number>(32);
  const [activityNotes, setActivityNotes] = useState('');

  useEffect(() => {
    if (currentTeacher) {
      setTeacherName(currentTeacher.name);
      setLabCode(currentTeacher.primaryLab);
      setSubject(currentTeacher.subject);
    }
  }, [currentTeacher, isOpen]);

  // Kondisi Sebelum & Sesudah
  const [conditionBefore, setConditionBefore] = useState<'Baik' | 'Ada masalah'>('Baik');
  const [conditionAfter, setConditionAfter] = useState<'Baik' | 'Ada masalah'>('Baik');

  // Conditional Issue Fields (hanya tampil jika conditionAfter === 'Ada masalah' atau conditionBefore === 'Ada masalah')
  const [issueType, setIssueType] = useState<'Alat' | 'Bahan' | 'Fasilitas' | 'Kebersihan' | 'Lainnya'>('Alat');
  const [issueDescription, setIssueDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const hasIssue = conditionBefore === 'Ada masalah' || conditionAfter === 'Ada masalah';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !className.trim() || !activityTitle.trim()) {
      alert('Mohon lengkapi Nama Guru, Kelas, dan Judul Kegiatan.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Buat nomor jurnal standar: JR-YYYYMMDD-XXXX
      const datePart = date.replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const journalCode = `JR-${datePart}-${randomSuffix}`;

      const sessionLabel = `${startTime} - ${endTime} WIB`;
      const labNameMap: Record<LabCode, string> = {
        BIO: 'Lab Biologi Terpadu',
        FIS: 'Lab Fisika Modern',
        KIM: 'Lab Kimia Anorganik',
        COM: 'Lab Komputer Sains',
        BSM: 'Smartclass & Bahasa',
      };

      const payload = {
        code: journalCode,
        session: sessionLabel,
        time: startTime + ' WIB',
        labCode,
        labName: labNameMap[labCode],
        teacherName: teacherName.trim(),
        className: className.trim(),
        topic: activityTitle.trim(),
        status: 'SUBMITTED',
        notes: activityNotes ? `${activityType}: ${activityNotes}` : `${activityType} (${subject || 'Mata Pelajaran'})`,
        studentsCount: Number(studentCount) || 30,
        sopComplied: !hasIssue,
        incidentReported: hasIssue ? `[${issueType}] ${issueDescription}` : undefined,
      };

      const res = await fetch('/api/journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Gagal menyimpan jurnal ke server');
      }

      onSuccess(`Jurnal berhasil dikirim! Nomor referensi: ${journalCode}`);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat submit jurnal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-[2px] w-full max-w-xl shadow-2xl border border-slate-300 p-5 sm:p-6 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[2px] bg-[#FFF1F2] border border-[#FECDD3] text-[#9E1B32] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">menu_book</span>
            </div>
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Formulir Jurnal Guru (QR Check-In)
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                Pengisian digital presensi &amp; kondisi praktikum laboratorium
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[2px] border border-slate-200 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Teacher Code Auth Banner */}
          {currentTeacher ? (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-[18px]">verified_user</span>
                <span className="text-[11px] text-emerald-900 font-semibold">
                  Terverifikasi sebagai <strong>{currentTeacher.name}</strong> (Kode: {currentTeacher.teacherCode})
                </span>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-600">
                Punya Kode Guru? Masuk dengan kode guru untuk pengisian otomatis.
              </span>
              {onOpenTeacherLogin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTeacherLogin();
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline"
                >
                  Masuk Kode Guru
                </button>
              )}
            </div>
          )}

          {/* SEKSI A: Identitas */}
          <div className="bg-slate-50 p-3.5 rounded-[2px] border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-[11px] uppercase tracking-wider font-mono">
              <span className="w-2 h-2 bg-[#9E1B32]"></span>
              A. Identitas Praktikum
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Laboratorium</label>
                <select
                  value={labCode}
                  onChange={(e) => setLabCode(e.target.value as LabCode)}
                  className="w-full h-8 px-2 rounded-[2px] border border-slate-300 bg-white font-mono text-xs focus:border-[#9E1B32] focus:outline-none"
                >
                  <option value="BIO">BIO • Lab Biologi Terpadu</option>
                  <option value="FIS">FIS • Lab Fisika Modern</option>
                  <option value="KIM">KIM • Lab Kimia Anorganik</option>
                  <option value="COM">COM • Lab Komputer Sains</option>
                  <option value="BSM">BSM • Smartclass &amp; Bahasa</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Guru Pengampu *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dra. Sri Wahyuni / Budi Santoso, S.Pd"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full h-8 px-2 rounded-[2px] border border-slate-300 bg-white text-xs focus:border-[#9E1B32] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-8 px-2 rounded-[2px] border border-slate-300 bg-white text-xs focus:border-[#9E1B32] focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full h-8 px-2 rounded-[2px] border border-slate-300 bg-white text-xs focus:border-[#9E1B32] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full h-8 px-2 rounded-[2px] border border-slate-300 bg-white text-xs focus:border-[#9E1B32] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kelas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: XI IPA 1 / X-4"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full h-8 px-2 rounded-[2px] border border-slate-300 bg-white text-xs focus:border-[#9E1B32] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  placeholder="Contoh: Biologi / Kimia / Fisika"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-8 px-2 rounded-[2px] border border-slate-300 bg-white text-xs focus:border-[#9E1B32] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SEKSI B: Kegiatan */}
          <div className="bg-slate-50 p-3.5 rounded-[2px] border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-[11px] uppercase tracking-wider font-mono">
              <span className="w-2 h-2 bg-sky-700"></span>
              B. Rincian Kegiatan
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Kegiatan</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full h-8 px-2 rounded-[2px] border border-slate-300 bg-white text-xs focus:border-[#9E1B32] focus:outline-none"
                >
                  <option value="Praktikum">Praktikum</option>
                  <option value="Pembelajaran">Pembelajaran</option>
                  <option value="Ujian">Ujian</option>
                  <option value="Demonstrasi">Demonstrasi</option>
                  <option value="Kegiatan lain">Kegiatan lain</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jumlah Siswa Hadir</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={studentCount}
                  onChange={(e) => setStudentCount(Number(e.target.value))}
                  className="w-full h-8 px-2 rounded-[2px] border border-slate-300 bg-white text-xs focus:border-[#9E1B32] focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Judul / Topik Praktikum *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Pengamatan Preparat Sel Tumbuhan / Titrasi Asam Basa"
                value={activityTitle}
                onChange={(e) => setActivityTitle(e.target.value)}
                className="w-full h-8 px-2 rounded-[2px] border border-slate-300 bg-white text-xs focus:border-[#9E1B32] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Catatan Kegiatan (Opsional)</label>
              <textarea
                rows={2}
                placeholder="Ringkasan alat yang digunakan atau catatan jalannya praktikum..."
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
                className="w-full p-2 rounded-[2px] border border-slate-300 bg-white text-xs focus:border-[#9E1B32] focus:outline-none"
              />
            </div>
          </div>

          {/* SEKSI C: Kondisi Sebelum & Sesudah */}
          <div className="bg-slate-50 p-3.5 rounded-[2px] border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-[11px] uppercase tracking-wider font-mono">
              <span className="w-2 h-2 bg-emerald-700"></span>
              C. Kondisi Alat &amp; Fasilitas
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sebelum */}
              <div>
                <span className="block font-semibold text-slate-700 mb-1.5">Kondisi SEBELUM digunakan</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="conditionBefore"
                      value="Baik"
                      checked={conditionBefore === 'Baik'}
                      onChange={() => setConditionBefore('Baik')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-800">Baik</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="conditionBefore"
                      value="Ada masalah"
                      checked={conditionBefore === 'Ada masalah'}
                      onChange={() => setConditionBefore('Ada masalah')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-medium text-rose-700">Ada masalah</span>
                  </label>
                </div>
              </div>

              {/* Sesudah */}
              <div>
                <span className="block font-semibold text-slate-700 mb-1.5">Kondisi SESUDAH digunakan</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="conditionAfter"
                      value="Baik"
                      checked={conditionAfter === 'Baik'}
                      onChange={() => setConditionAfter('Baik')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-800">Baik</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="conditionAfter"
                      value="Ada masalah"
                      checked={conditionAfter === 'Ada masalah'}
                      onChange={() => setConditionAfter('Ada masalah')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-medium text-rose-700">Ada masalah</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SEKSI D: Jika Ada Masalah (Field Kondisional, Bagian 7.D Dokumen) */}
          {hasIssue && (
            <div className="bg-rose-50/70 p-3.5 rounded-[2px] border border-rose-200 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-bold text-rose-900 text-[11px] uppercase tracking-wider font-mono">
                <span className="material-symbols-outlined text-[16px] text-rose-600">warning</span>
                D. Rincian Masalah yang Ditemukan
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-rose-950 mb-1">Jenis Masalah *</label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value as any)}
                    className="w-full h-8 px-2 rounded-[2px] border border-rose-300 bg-white text-xs focus:border-rose-600 focus:outline-none"
                  >
                    <option value="Alat">Alat (Mikroskop, Pipet, Catu Daya, dll)</option>
                    <option value="Bahan">Bahan (Reagen, Larutan, Sampel)</option>
                    <option value="Fasilitas">Fasilitas (Kran air, Listrik, Meja, Kursi)</option>
                    <option value="Kebersihan">Kebersihan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-rose-950 mb-1">Deskripsi Masalah / Kerusakan *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Meja 3 lampu mikroskop nomor 4 tidak menyala; Tabung reaksi pecah saat praktikum..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="w-full p-2 rounded-[2px] border border-rose-300 bg-white text-xs focus:border-rose-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Tombol Aksi */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[2px] border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-[2px] bg-[#9E1B32] hover:bg-[#831629] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span>{isSubmitting ? 'Mengirim...' : 'Kirim Jurnal (SUBMIT)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
