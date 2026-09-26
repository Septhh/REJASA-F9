import React from 'react';
import { Lab, QRCodeInfo } from '../types';

interface Props {
  labs: Lab[];
  qrCodes: QRCodeInfo[];
  onManage: (labId: number) => void;
}

export const QRManager: React.FC<Props> = ({ labs, qrCodes, onManage }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    {labs.map((lab) => {
      const qr = qrCodes.find((q) => q.labId === lab.id);
      return (
        <div key={lab.id} className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col gap-3">
          <div>
            <span className="font-mono text-[11px] font-bold text-[#00685f]">{lab.roomCode}</span>
            <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#131b2e]">{lab.name}</h4>
          </div>
          <div className="flex items-center justify-between">
            {qr ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#ECFDF5] text-[#059669] text-xs font-bold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span>QR aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] text-xs font-bold border border-amber-200">
                Belum ada QR
              </span>
            )}
            <button
              onClick={() => onManage(lab.id)}
              className="px-3 py-1.5 rounded-lg bg-[#00685f] hover:bg-[#008378] text-white text-xs font-semibold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">qr_code</span>
              {qr ? 'Lihat / Cetak' : 'Terbitkan'}
            </button>
          </div>
        </div>
      );
    })}
  </div>
);
