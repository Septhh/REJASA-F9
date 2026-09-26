import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import type { Lab } from '../types';

interface Props {
  /** Mode guru (setelah scan QR / di /guru) menampilkan judul "Login Guru". */
  teacherMode?: boolean;
  lab?: Lab | null;
}

export const LoginPage: React.FC<Props> = ({ teacherMode = false, lab = null }) => {
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError('');
    try {
      await login(code.trim());
    } catch (err: any) {
      setError(err?.message || 'Gagal masuk.');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-xl bg-[#00685f]/10 text-[#00685f] flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[28px]">{teacherMode ? 'badge' : 'lock'}</span>
          </div>
          <div className="font-mono text-xs uppercase tracking-widest text-[#00685f] font-bold">REJASA</div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold text-[#131b2e] mt-1">
            {teacherMode ? 'Login Guru' : 'Masuk ke REJASA'}
          </h1>
          {lab && (
            <p className="text-xs text-slate-500 mt-1">
              {lab.name} • {lab.school}
            </p>
          )}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="kode" className="block text-xs font-semibold text-[#131b2e] mb-1">
              {teacherMode ? 'KODE GURU' : 'KODE PENGGUNA'}
            </label>
            <input
              id="kode"
              autoFocus
              autoCapitalize="characters"
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="contoh: GR1"
              maxLength={32}
              className="w-full h-11 px-3 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-sm font-mono tracking-wider text-[#131b2e] focus:ring-2 focus:ring-[#00685f] focus:outline-none"
            />
          </div>
          {error && (
            <div role="alert" className="p-2.5 rounded-xl bg-[#FFF1F2] border border-rose-200 text-xs text-[#E11D48]">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="w-full h-11 rounded-xl bg-[#00685f] hover:bg-[#008378] disabled:opacity-50 text-white text-sm font-bold transition-colors"
          >
            {busy ? 'Memeriksa…' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
};
