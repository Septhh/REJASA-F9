import React from 'react';

interface MetricCardsProps {
  totalJournalsToday: number;
  pendingReviewCount: number;
  activeIncidentsCount: number;
  occupiedLabsCount: number;
  totalLabsCount: number;
  onFilterPending?: () => void;
  onFilterIncidents?: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  totalJournalsToday,
  pendingReviewCount,
  activeIncidentsCount,
  occupiedLabsCount,
  totalLabsCount,
  onFilterPending,
  onFilterIncidents,
}) => {
  const utilizationPercentage = totalLabsCount > 0 ? Math.round((occupiedLabsCount / totalLabsCount) * 100) : 0;
  const standbyCount = Math.max(0, totalLabsCount - occupiedLabsCount);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {/* Metric 1: Jurnal Hari Ini */}
      <div
        id="card-metric-journals"
        className="relative bg-white rounded-[2px] p-5 shadow-xs hover:border-slate-400 transition-colors border border-slate-300 flex flex-col justify-between"
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#9E1B32]"></div>
        <div>
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider font-semibold">
                Jurnal Hari Ini
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-['Plus_Jakarta_Sans'] text-3xl font-extrabold text-[#131b2e] tracking-tight tabular-nums">
                  {totalJournalsToday}
                </span>
                <span className="text-xs text-slate-500 font-mono">sesi tercatat</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-[2px] bg-[#FFF1F2] border border-[#FECDD3] flex items-center justify-center text-[#9E1B32]">
              <span className="material-symbols-outlined text-[22px]">menu_book</span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Data Terverifikasi</span>
          <span className="px-2 py-0.5 rounded-[2px] bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-mono font-bold">
            {totalJournalsToday > 0 ? `${totalJournalsToday} SESI` : 'BELUM ADA SESI'}
          </span>
        </div>
      </div>

      {/* Metric 2: Belum Direview */}
      <div
        id="card-metric-pending"
        onClick={onFilterPending}
        className="relative bg-white rounded-[2px] p-5 shadow-xs hover:border-amber-400 transition-colors border border-slate-300 flex flex-col justify-between cursor-pointer"
        title="Klik untuk melihat antrean verifikasi"
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500"></div>
        <div>
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider font-semibold">
                Belum Direview
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-['Plus_Jakarta_Sans'] text-3xl font-extrabold text-amber-600 tracking-tight tabular-nums">
                  {pendingReviewCount}
                </span>
                <span className="text-xs text-slate-500 font-mono">menunggu laboran</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-[2px] bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined text-[22px]">pending_actions</span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Antrean Verifikasi</span>
          <span className={`px-2 py-0.5 rounded-[2px] text-[11px] font-mono font-bold ${
            pendingReviewCount > 0
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {pendingReviewCount > 0 ? `${pendingReviewCount} TERTUNDA` : 'SELESAI SEMUA'}
          </span>
        </div>
      </div>

      {/* Metric 3: Ada Masalah / Rusak */}
      <div
        id="card-metric-incidents"
        onClick={onFilterIncidents}
        className="relative bg-white rounded-[2px] p-5 shadow-xs hover:border-rose-400 transition-colors border border-slate-300 flex flex-col justify-between cursor-pointer"
        title="Klik untuk melihat insiden alat"
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-rose-600"></div>
        <div>
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider font-semibold">
                Ada Masalah
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-['Plus_Jakarta_Sans'] text-3xl font-extrabold text-rose-600 tracking-tight tabular-nums">
                  {activeIncidentsCount}
                </span>
                <span className="text-xs text-slate-500 font-mono">masalah dilaporkan</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-[2px] bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <span className="material-symbols-outlined text-[22px]">fmd_bad</span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Kondisi Fasilitas/Alat</span>
          <span className={`px-2 py-0.5 rounded-[2px] text-[11px] font-mono font-bold ${
            activeIncidentsCount > 0
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {activeIncidentsCount > 0 ? `${activeIncidentsCount} MASALAH` : 'KONDISI BAIK'}
          </span>
        </div>
      </div>

      {/* Metric 4: Lab Terpakai Saat Ini */}
      <div
        id="card-metric-occupancy"
        className="relative bg-white rounded-[2px] p-5 shadow-xs hover:border-slate-400 transition-colors border border-slate-300 flex flex-col justify-between"
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#065F46]"></div>
        <div>
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider font-semibold">
                Lab Digunakan
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-['Plus_Jakarta_Sans'] text-3xl font-extrabold text-[#131b2e] tracking-tight tabular-nums">
                  {occupiedLabsCount}
                  <span className="text-xl text-slate-400 font-normal">/{totalLabsCount}</span>
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  {utilizationPercentage}% Aktif
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-[2px] bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#065F46]">
              <span className="material-symbols-outlined text-[22px]">meeting_room</span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Kapasitas Bilik Lab</span>
          <span className="px-2 py-0.5 rounded-[2px] bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-mono font-bold">
            {standbyCount} STANDBY
          </span>
        </div>
      </div>
    </div>
  );
};
