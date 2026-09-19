import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext.tsx';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginAdmin } = useAdminAuth();
  const [adminCode, setAdminCode] = useState('RDT1');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCode.trim() || !password.trim()) {
      setError('Harap masukkan Kode Admin dan Password otorisasi.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await loginAdmin(adminCode.trim().toUpperCase(), password);
    setLoading(false);

    if (result.success) {
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setError(result.error || 'Otorisasi gagal.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-300 rounded-[2px] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#9E1B32] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[22px]">badge</span>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Otorisasi Kode Admin</h3>
              <p className="text-[11px] text-red-100">Sistem Laboratorium Terpadu SMAN 3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-[2px] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-[2px] bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-red-600">error</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
              Kode Admin (Contoh: RDT1)
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                tag
              </span>
              <input
                type="text"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value.toUpperCase())}
                placeholder="RDT1"
                className="w-full h-10 pl-9 pr-3 text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-[2px] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#9E1B32] focus:border-[#9E1B32] uppercase"
                required
                autoFocus
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Admin default terdaftar: <span className="font-mono font-bold text-[#9E1B32]">RDT1</span>,{' '}
              <span className="font-mono font-bold text-slate-700">ADM2</span>,{' '}
              <span className="font-mono font-bold text-slate-700">LAB01</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
              Password Otorisasi
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password otorisasi..."
                className="w-full h-10 pl-9 pr-10 text-sm bg-slate-50 border border-slate-300 rounded-[2px] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#9E1B32] focus:border-[#9E1B32]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Disimpan secara aman dengan hashing SHA-256 terenkripsi di Cloud SQL.
            </p>
          </div>

          {/* Quick Info Box */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-[2px] text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0 mt-0.5">key</span>
            <div>
              <strong>Kredensial Default RDT1:</strong> Password: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">password123</code>. Anda dapat mengkustomisasi kode dan password kapan saja di menu Admin.
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-[2px] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-white bg-[#9E1B32] hover:bg-[#831629] rounded-[2px] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
              <span>Verifikasi & Masuk</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
