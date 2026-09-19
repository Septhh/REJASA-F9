import React, { useState, useEffect } from 'react';
import { LabCode } from '../types';

interface CreateQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToJournal?: (labCode: LabCode) => void;
}

export const CreateQRModal: React.FC<CreateQRModalProps> = ({
  isOpen,
  onClose,
  onProceedToJournal,
}) => {
  const [selectedLab, setSelectedLab] = useState<LabCode>('BIO');
  const [labDetails, setLabDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const labList: Array<{ code: LabCode; name: string; icon: string }> = [
    { code: 'BIO', name: 'Lab Biologi Terpadu', icon: 'biotech' },
    { code: 'FIS', name: 'Lab Fisika Modern', icon: 'bolt' },
    { code: 'KIM', name: 'Lab Kimia Anorganik', icon: 'science' },
    { code: 'COM', name: 'Lab Komputer Sains', icon: 'computer' },
    { code: 'BSM', name: 'Smartclass & Bahasa', icon: 'translate' },
  ];

  useEffect(() => {
    if (isOpen) {
      loadLabQR(selectedLab);
    }
  }, [isOpen, selectedLab]);

  const loadLabQR = async (code: LabCode) => {
    setIsLoading(true);
    try {
      // Step 1 & 2: Identify Lab & Fetch Schedule (Strictly NO inventory & NO journal creation)
      const res = await fetch(`/api/qr/QR-LAB-${code}`);
      if (res.ok) {
        const data = await res.json();
        setLabDetails(data);
      } else {
        // Fallback info
        const labItem = labList.find(l => l.code === code);
        setLabDetails({
          valid: true,
          token: `QR-LAB-${code}`,
          lab: {
            code,
            name: labItem?.name || `Laboratorium ${code}`,
            schoolName: 'SMAN 3 Salatiga',
            status: 'Standby',
            statusDetail: 'Ruangan siap digunakan.',
            workstations: 36,
          },
          schedules: [],
        });
      }
    } catch (e) {
      console.warn('QR load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentToken = `QR-LAB-${selectedLab}`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText?.(currentToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 p-6 relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">qr_code_2</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                QR Pintu Bilik Laboratorium
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Identifikasi Lab &amp; Jadwal Penggunaan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Lab Selector Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {labList.map((lab) => (
            <button
              key={lab.code}
              onClick={() => setSelectedLab(lab.code)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 flex items-center gap-1.5 ${
                selectedLab === lab.code
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{lab.icon}</span>
              <span>{lab.code}</span>
            </button>
          ))}
        </div>

        {/* QR Code Card */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center mb-4">
          <div className="w-48 h-48 bg-white rounded-xl p-3 border border-slate-300 shadow-xs flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Corner position squares */}
              <rect x="5" y="5" width="25" height="25" fill="#064E3B" rx="2" />
              <rect x="9" y="9" width="17" height="17" fill="white" rx="1" />
              <rect x="13" y="13" width="9" height="9" fill="#064E3B" rx="1" />

              <rect x="70" y="5" width="25" height="25" fill="#064E3B" rx="2" />
              <rect x="74" y="9" width="17" height="17" fill="white" rx="1" />
              <rect x="78" y="13" width="9" height="9" fill="#064E3B" rx="1" />

              <rect x="5" y="70" width="25" height="25" fill="#064E3B" rx="2" />
              <rect x="9" y="74" width="17" height="17" fill="white" rx="1" />
              <rect x="13" y="78" width="9" height="9" fill="#064E3B" rx="1" />

              {/* Data modules */}
              <rect x="35" y="10" width="6" height="6" fill="#131b2e" />
              <rect x="45" y="12" width="8" height="5" fill="#131b2e" />
              <rect x="58" y="8" width="6" height="7" fill="#131b2e" />
              <rect x="12" y="36" width="7" height="7" fill="#131b2e" />
              <rect x="25" y="42" width="6" height="5" fill="#131b2e" />
              <rect x="36" y="32" width="8" height="8" fill="#047857" />
              <rect x="48" y="40" width="7" height="6" fill="#131b2e" />
              <rect x="62" y="35" width="6" height="9" fill="#131b2e" />
              <rect x="74" y="40" width="9" height="6" fill="#131b2e" />
              <rect x="88" y="45" width="6" height="7" fill="#131b2e" />
              <rect x="36" y="50" width="9" height="6" fill="#131b2e" />
              <rect x="50" y="52" width="6" height="8" fill="#047857" />
              <rect x="60" y="55" width="8" height="5" fill="#131b2e" />
              <rect x="35" y="65" width="7" height="7" fill="#131b2e" />
              <rect x="48" y="72" width="8" height="6" fill="#131b2e" />
              <rect x="65" y="70" width="7" height="8" fill="#131b2e" />
              <rect x="78" y="75" width="8" height="6" fill="#047857" />
              <rect x="88" y="80" width="6" height="6" fill="#131b2e" />
            </svg>
          </div>

          <div className="mt-3 text-center">
            <span className="font-mono text-sm font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg">
              {currentToken}
            </span>
            <p className="text-xs font-semibold text-slate-800 mt-2">
              {labDetails?.lab?.name || `Laboratorium ${selectedLab}`} • SMAN 3 Salatiga
            </p>
          </div>
        </div>

        {/* Step 1 & 2 Results: Room Info & Schedule */}
        <div className="space-y-3 mb-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">calendar_month</span>
                Jadwal Praktikum Hari Ini:
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {labDetails?.lab?.status || 'Siap Digunakan'}
              </span>
            </div>

            {labDetails?.schedules && labDetails.schedules.length > 0 ? (
              <div className="space-y-1.5 mt-2">
                {labDetails.schedules.map((s: any) => (
                  <div key={s.id} className="p-2 rounded-lg bg-white border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{s.timeSlot}</span>
                      <span className="text-emerald-700 font-bold">{s.className}</span>
                    </div>
                    <div className="text-slate-600 text-[11px] mt-0.5">
                      {s.subject} • {s.teacherName}
                    </div>
                    {s.topic && (
                      <div className="text-slate-500 text-[11px] italic mt-0.5 truncate">
                        Topik: {s.topic}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-2 text-center">
                Belum ada jadwal praktikum terjadwal di bilik ini untuk jam sekarang.
              </p>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">info</span>
            <span>
              <strong>Pindai QR Pintu</strong> hanya menampilkan identitas lab &amp; jadwal. Tidak membuat jurnal otomatis dan tidak memuat inventaris.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 h-10 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Token Disalin!' : 'Salin Token QR'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onProceedToJournal?.(selectedLab);
            }}
            className="flex-1 h-10 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            <span>Lanjut Isi Jurnal Guru</span>
          </button>
        </div>
      </div>
    </div>
  );
};

