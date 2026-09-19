import React, { useState } from 'react';
import { useTeacherAuth } from '../context/TeacherAuthContext';
import { LAB_METADATA } from '../data/inventoryData';

interface TeacherLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (teacherName: string) => void;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { loginWithTeacherCode, teachers } = useTeacherAuth();
  const [inputCode, setInputCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessInfo(null);
    setIsLoggingIn(true);

    try {
      const res = await loginWithTeacherCode(inputCode);
      if (res.success && res.teacher) {
        setSuccessInfo(`Selamat datang, ${res.teacher.name}!`);
        setTimeout(() => {
          onSuccess?.(res.teacher!.name);
          onClose();
          setInputCode('');
          setSuccessInfo(null);
        }, 700);
      } else {
        setErrorMessage(res.error || 'Kode Guru tidak valid.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleQuickSelect = async (code: string) => {
    setInputCode(code);
    setErrorMessage('');
    setIsLoggingIn(true);
    try {
      const res = await loginWithTeacherCode(code);
      if (res.success && res.teacher) {
        setSuccessInfo(`Selamat datang, ${res.teacher.name}!`);
        setTimeout(() => {
          onSuccess?.(res.teacher!.name);
          onClose();
          setInputCode('');
          setSuccessInfo(null);
        }, 700);
      } else {
        setErrorMessage(res.error || 'Kode Guru tidak valid.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-emerald-200 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
          <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-white text-[28px]">badge</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Akses Masuk Guru</h2>
          <p className="text-xs text-emerald-100/90 mt-1">
            Guru hanya perlu memasukkan <strong className="text-white">Kode Guru</strong> saja untuk mulai mengisi dan mencatat jurnal kegiatan laboratorium.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {successInfo ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800">
              <span className="material-symbols-outlined text-emerald-600 text-[24px]">check_circle</span>
              <div>
                <p className="font-bold text-sm">{successInfo}</p>
                <p className="text-xs text-emerald-700">Membuka sesi inventaris laboratorium...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Masukkan Kode Guru
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    key
                  </span>
                  <input
                    type="text"
                    autoFocus
                    value={inputCode}
                    onChange={(e) => {
                      setInputCode(e.target.value.toUpperCase());
                      setErrorMessage('');
                    }}
                    placeholder="Contoh: GUR-IPA-01"
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-300 font-mono text-base font-bold tracking-wider text-slate-900 uppercase focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
                  />
                </div>
                {errorMessage && (
                  <p className="text-xs font-semibold text-rose-600 mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    {errorMessage}
                  </p>
                )}
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Tanpa perlu password atau email. Kode guru terdaftar resmi dari Administrator.
                </p>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm tracking-wide shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">login</span>
                <span>Masuk dengan Kode Guru</span>
              </button>
            </form>
          )}

          {/* Quick Select for Easy Testing */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">touch_app</span>
                Pilih Cepat Kode Guru Terdaftar:
              </span>
              <span className="text-[11px] text-slate-600">Klik untuk masuk</span>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {teachers.slice(0, 5).map((tch) => {
                const labMeta = LAB_METADATA[tch.primaryLab];
                return (
                  <button
                    key={tch.id}
                    type="button"
                    onClick={() => handleQuickSelect(tch.teacherCode)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-left transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {tch.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                            {tch.teacherCode}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {tch.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {tch.subject} • {labMeta?.name || tch.primaryLab}
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-700 text-[18px] shrink-0">
                      arrow_forward
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-6">
          <span>Belum punya kode? Hubungi Laboran/Admin.</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-semibold"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};
