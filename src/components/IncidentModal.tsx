import React, { useState, useEffect } from 'react';
import { IncidentItem } from '../types';

interface IncidentModalProps {
  isOpen: boolean;
  incident: IncidentItem | null;
  onClose: () => void;
  onSubmitDisposition: (incidentId: string, dispositionData: { action: string; urgency: string; notes: string }) => void;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({
  isOpen,
  incident,
  onClose,
  onSubmitDisposition,
}) => {
  const [action, setAction] = useState('service');
  const [urgency, setUrgency] = useState('medium');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (incident) {
      if (incident.actionType === 'scrap') {
        setAction('write-off');
      } else {
        setAction('service');
      }
      setNotes('');
      setUrgency('medium');
    }
  }, [incident]);

  if (!isOpen || !incident) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitDisposition(incident.id, { action, urgency, notes });
    onClose();
  };

  return (
    <div
      id="incident-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-150"
    >
      <div
        id="incident-modal-panel"
        className="bg-white rounded-[2px] w-full max-w-lg shadow-2xl border border-slate-300 p-6 relative max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[2px] bg-rose-50 border border-rose-300 text-rose-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">build</span>
            </div>
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#131b2e] tracking-tight">
                Disposisi Insiden Alat Lab
              </h3>
              <span className="font-mono text-xs text-rose-700 font-bold">
                KODE: {incident.assetCode}
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

        {/* Short Incident Context */}
        <div className="p-3 bg-slate-50 rounded-[2px] mb-4 border border-slate-300 text-xs">
          <div className="flex justify-between font-semibold text-slate-800">
            <span>{incident.title}</span>
            <span className="text-slate-500 font-mono text-[11px]">{incident.time}</span>
          </div>
          <p className="text-slate-600 mt-1 leading-relaxed">{incident.description}</p>
          <div className="mt-2 text-[11px] text-slate-600 font-mono">
            Pelapor: <span className="font-bold text-slate-800">{incident.reporter}</span> ({incident.className})
          </div>
        </div>

        {/* Form Body */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-mono font-bold text-slate-700 mb-1 uppercase tracking-tight">
              Tindakan Penanganan
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full h-9 px-3 rounded-[2px] bg-slate-50 border border-slate-300 text-xs text-[#131b2e] focus:bg-white focus:outline-none focus:border-slate-800"
            >
              <option value="service">Kirim Servis Internal Teknisi Sekolah</option>
              <option value="vendor">Klaim Garansi Vendor Eksternal</option>
              <option value="write-off">Afkir &amp; Hapus dari Inventaris (Scrap)</option>
              <option value="replacement">Penggantian oleh Siswa / Kelompok Belajar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-700 mb-1 uppercase tracking-tight">
              Tingkat Urgensi Praktikum
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label
                className={`flex items-center justify-center p-2 rounded-[2px] border cursor-pointer text-xs font-mono font-semibold transition-colors ${
                  urgency === 'low'
                    ? 'bg-sky-50 border-sky-600 text-sky-800'
                    : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="urgency"
                  value="low"
                  checked={urgency === 'low'}
                  onChange={() => setUrgency('low')}
                  className="sr-only"
                />
                RENDAH
              </label>

              <label
                className={`flex items-center justify-center p-2 rounded-[2px] border cursor-pointer text-xs font-mono font-semibold transition-colors ${
                  urgency === 'medium'
                    ? 'bg-amber-50 border-amber-600 text-amber-800'
                    : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="urgency"
                  value="medium"
                  checked={urgency === 'medium'}
                  onChange={() => setUrgency('medium')}
                  className="sr-only"
                />
                SEDANG
              </label>

              <label
                className={`flex items-center justify-center p-2 rounded-[2px] border cursor-pointer text-xs font-mono font-semibold transition-colors ${
                  urgency === 'critical'
                    ? 'bg-rose-50 border-rose-600 text-rose-800'
                    : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="urgency"
                  value="critical"
                  checked={urgency === 'critical'}
                  onChange={() => setUrgency('critical')}
                  className="sr-only"
                />
                KRITIS
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-700 mb-1 uppercase tracking-tight">
              Catatan Verifikasi Fisik Laboran
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Kondisi fisik kerusakan, kronologi, dan estimasi suku cadang..."
              className="w-full p-2.5 rounded-[2px] bg-slate-50 border border-slate-300 text-xs text-[#131b2e] focus:bg-white focus:outline-none focus:border-slate-800"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[2px] bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-[2px] bg-[#9E1B32] hover:bg-[#800E26] text-white text-xs font-semibold border border-[#800E26] shadow-xs transition-colors"
            >
              Terbitkan Tiket Disposisi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
