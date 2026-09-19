import React from 'react';
import { IncidentItem, LabUsageStat } from '../types';

interface IncidentHubProps {
  incidents: IncidentItem[];
  usageStats: LabUsageStat[];
  onOpenDispositionModal: (incident: IncidentItem) => void;
  onViewAllIncidents: () => void;
}

export const IncidentHub: React.FC<IncidentHubProps> = ({
  incidents,
  usageStats,
  onOpenDispositionModal,
  onViewAllIncidents,
}) => {
  return (
    <div className="flex flex-col gap-5">
      {/* Card 1: Laporan Masalah & Insiden Terkini */}
      <div className="bg-white rounded-[2px] p-5 shadow-xs border border-slate-300 flex flex-col">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-rose-600"></span>
            <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-sm sm:text-base text-[#131b2e] tracking-tight">
              Insiden Alat &amp; Fasilitas
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded-[2px] bg-rose-50 text-rose-700 text-[11px] font-mono font-bold border border-rose-300">
            {incidents.filter((i) => i.status === 'Open').length} KASUS AKTIF
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-3 font-normal">
          Insiden otomatis tercatat dari submisi checklist verifikasi lab.
        </p>

        {/* List of Incidents */}
        <div className="space-y-3">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              id={`incident-item-${incident.assetCode.toLowerCase()}`}
              className="p-3 rounded-[2px] bg-rose-50/40 border border-rose-200 flex flex-col gap-2 hover:bg-rose-50/70 transition-colors"
            >
              <div className="flex items-start gap-3">
                <img
                  className="w-16 h-16 rounded-[2px] object-cover flex-shrink-0 border border-rose-300"
                  data-alt={incident.photoAlt}
                  src={incident.photoUrl}
                  alt={incident.title}
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-rose-700">
                      {incident.assetCode}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{incident.time}</span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#131b2e] truncate mt-0.5">
                    {incident.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                    {incident.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-rose-200/60">
                <span className="text-xs text-slate-600 flex items-center gap-1 font-mono">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
                  <span className="truncate max-w-[140px]">
                    {incident.reporter} ({incident.className})
                  </span>
                </span>
                <button
                  onClick={() => onOpenDispositionModal(incident)}
                  className="px-2.5 py-1 rounded-[2px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-semibold transition-colors border border-rose-700 shadow-xs"
                >
                  [{incident.actionLabel}]
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Link to Full Log */}
        <div className="mt-4 pt-2 border-t border-slate-100">
          <button
            onClick={onViewAllIncidents}
            className="w-full py-2 rounded-[2px] bg-slate-50 hover:bg-slate-100 text-[#131b2e] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-300"
          >
            <span className="material-symbols-outlined text-[16px]">assignment</span>
            <span>Buku Kerusakan Alat Lengkap</span>
          </button>
        </div>
      </div>

      {/* Card 2: Statistik Pemanfaatan Lab Bulan Ini */}
      <div className="bg-white rounded-[2px] p-5 shadow-xs border border-slate-300 flex flex-col">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
          <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-sm sm:text-base text-[#131b2e] tracking-tight">
            Pemanfaatan Lab (Bulan Ini)
          </h3>
          <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-[2px]">
            SEP 2026
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-3 font-normal">
          Statistik frekuensi praktikum untuk estimasi logistik praktikum.
        </p>

        <div className="space-y-3">
          {usageStats.map((stat) => (
            <div key={stat.labName}>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-slate-800 font-semibold">{stat.labName}</span>
                <span className="font-mono font-bold text-slate-700">
                  {stat.sessions} Sesi ({stat.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-none bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-none transition-all duration-300 ${
                    stat.color.includes('primary')
                      ? 'bg-[#9E1B32]'
                      : stat.color.includes('secondary')
                      ? 'bg-[#065F46]'
                      : 'bg-slate-600'
                  }`}
                  style={{ width: `${stat.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Notice Card */}
        <div className="mt-4 p-3 rounded-[2px] bg-amber-50/80 border border-amber-300 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-amber-700 text-[18px] flex-shrink-0 mt-0.5">
            inventory_2
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-mono font-bold text-amber-900 uppercase">Restok Reagen Segera</span>
            <span className="text-xs text-slate-700 mt-0.5 leading-relaxed">
              Stok HCl 0.1M dan Indikator Fenolftalein di Lab Kimia tersisa &lt; 20%.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
