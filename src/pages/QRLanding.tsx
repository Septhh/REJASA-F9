import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { navigate } from '../lib/router';
import { saveLab } from '../lib/labContext';
import type { Lab } from '../types';

export const QRLanding: React.FC<{ token: string }> = ({ token }) => {
  const [lab, setLab] = useState<Lab | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .get<{ lab: Lab }>(`/qr/${encodeURIComponent(token)}`)
      .then((r) => alive && setLab(r.lab))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : 'Gagal memuat QR.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [token]);

  const proceed = () => {
    if (!lab) return;
    saveLab(lab);
    navigate('/guru');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 sm:p-8 text-center">
        <div className="font-mono text-xs uppercase tracking-widest text-[#00685f] font-bold">
          REJASA • Rapid Access Journal
        </div>

        {loading && <p className="text-sm text-slate-500 mt-6">Mengenali laboratorium…</p>}

        {!loading && error && (
          <div className="mt-6">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[#FFF1F2] text-[#E11D48] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px]">qr_code_scanner</span>
            </div>
            <p role="alert" className="text-sm text-[#E11D48] font-semibold">
              {error}
            </p>
            <p className="text-xs text-slate-500 mt-2">Minta laboran/admin menerbitkan QR laboratorium yang baru.</p>
          </div>
        )}

        {!loading && lab && (
          <div className="mt-6">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[#00685f]/10 text-[#00685f] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px]">science</span>
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold text-[#131b2e]">{lab.name}</h1>
            <p className="text-sm text-slate-500 mt-1">{lab.school}</p>
            <button
              onClick={proceed}
              className="mt-6 w-full h-11 rounded-xl bg-[#00685f] hover:bg-[#008378] text-white text-sm font-bold transition-colors"
            >
              Lanjut
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
