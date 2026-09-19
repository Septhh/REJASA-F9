import React, { useState, useEffect } from 'react';
import { JournalEntry, JournalStatus } from '../types';

interface ReviewJournalModalProps {
  isOpen: boolean;
  journal: JournalEntry | null;
  onClose: () => void;
  onUpdateStatus: (journalId: string, newStatus: JournalStatus, reviewNotes: string) => void;
}

export const ReviewJournalModal: React.FC<ReviewJournalModalProps> = ({
  isOpen,
  journal,
  onClose,
  onUpdateStatus,
}) => {
  const [sopPresence, setSopPresence] = useState(true);
  const [sopReagents, setSopReagents] = useState(true);
  const [sopWaste, setSopWaste] = useState(true);
  const [sopCleanliness, setSopCleanliness] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (journal) {
      setNotes(journal.notes || '');
      setSopPresence(true);
      setSopReagents(journal.status !== 'NEEDS_CORRECTION');
      setSopWaste(true);
      setSopCleanliness(true);
    }
  }, [journal]);

  if (!isOpen || !journal) return null;

  const handleApprove = () => {
    onUpdateStatus(journal.id, 'REVIEWED', notes);
    onClose();
  };

  const handleReject = () => {
    onUpdateStatus(journal.id, 'NEEDS_CORRECTION', notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-[2px] w-full max-w-lg shadow-2xl border border-slate-300 p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[2px] bg-[#FFF1F2] border border-[#FECDD3] text-[#9E1B32] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#131b2e] tracking-tight">
                Verifikasi &amp; Review Jurnal Lab
              </h3>
              <span className="font-mono text-xs font-bold text-[#9E1B32]">
                KODE: {journal.code}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[2px] border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Journal Summary Box */}
        <div className="bg-slate-50 p-3.5 rounded-[2px] border border-slate-300 mb-4 text-xs space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-bold text-sm text-[#131b2e] block">{journal.topic}</span>
              <span className="text-slate-500 font-mono">{journal.labName} ({journal.labCode})</span>
            </div>
            <span className="px-2 py-0.5 rounded-[2px] font-mono font-bold bg-slate-200 border border-slate-300 text-slate-800">
              {journal.className}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-slate-600 font-mono text-[11px]">
            <div>Guru: <span className="font-bold text-slate-900">{journal.teacherName}</span></div>
            <div>Peserta: <span className="font-bold text-slate-900">{journal.studentsCount} siswa</span></div>
            <div>Waktu: <span className="font-bold text-slate-900">{journal.session} • {journal.time}</span></div>
            <div>Status: <span className="font-bold text-[#9E1B32]">{journal.status}</span></div>
          </div>

          {journal.incidentReported && (
            <div className="mt-2 p-2 rounded-[2px] bg-rose-50 border border-rose-300 text-rose-700 flex items-center gap-1.5 font-mono text-xs">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              <span>Terlampir insiden alat: <strong>{journal.incidentReported}</strong></span>
            </div>
          )}
        </div>

        {/* SOP Compliance Checklist */}
        <div className="mb-4">
          <h4 className="text-xs font-mono font-bold uppercase tracking-tight text-slate-700 mb-2">
            Audit Checklist Kepatuhan SOP Lab
          </h4>
          <div className="space-y-1.5 text-xs">
            <label className="flex items-center gap-2.5 p-2 rounded-[2px] bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-300">
              <input
                type="checkbox"
                checked={sopPresence}
                onChange={(e) => setSopPresence(e.target.checked)}
                className="w-4 h-4 rounded-none text-[#9E1B32] focus:ring-0"
              />
              <span className="text-slate-700">Presensi siswa lengkap &amp; kepatuhan APD (Jas lab/Kacamata)</span>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-[2px] bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-300">
              <input
                type="checkbox"
                checked={sopReagents}
                onChange={(e) => setSopReagents(e.target.checked)}
                className="w-4 h-4 rounded-none text-[#9E1B32] focus:ring-0"
              />
              <span className="text-slate-700">Pencatatan reagen &amp; alat praktikum habis pakai sesuai</span>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-[2px] bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-300">
              <input
                type="checkbox"
                checked={sopWaste}
                onChange={(e) => setSopWaste(e.target.checked)}
                className="w-4 h-4 rounded-none text-[#9E1B32] focus:ring-0"
              />
              <span className="text-slate-700">Penetralan limbah sisa bahan kimia &amp; pembuangan aman</span>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-[2px] bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-300">
              <input
                type="checkbox"
                checked={sopCleanliness}
                onChange={(e) => setSopCleanliness(e.target.checked)}
                className="w-4 h-4 rounded-none text-[#9E1B32] focus:ring-0"
              />
              <span className="text-slate-700">Kebersihan meja kerja, wastafel, dan penutupan kran/gas selesai</span>
            </label>
          </div>
        </div>

        {/* Laboran Notes */}
        <div className="mb-4">
          <label className="block text-xs font-mono font-bold text-slate-700 mb-1 uppercase tracking-tight">
            Catatan Verifikasi / Instruksi Laboran
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Catatan klarifikasi atau instruksi jika ada koreksi..."
            className="w-full p-2 rounded-[2px] bg-slate-50 border border-slate-300 text-xs text-[#131b2e] focus:bg-white focus:outline-none focus:border-slate-800"
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={handleReject}
            className="px-3.5 py-2 rounded-[2px] bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-300 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">cancel</span>
            Minta Koreksi
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-[2px] bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleApprove}
              className="px-4 py-2 rounded-[2px] bg-[#9E1B32] hover:bg-[#800E26] text-white text-xs font-semibold border border-[#800E26] shadow-xs transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Verifikasi &amp; Sahkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
