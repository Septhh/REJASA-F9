import React from 'react';
import { InventoryItem } from '../types';

// Hanya dirender untuk ADMIN. Data berasal dari /api/inventory yang dijaga server (403 untuk role lain).
export const InventoryPanel: React.FC<{ items: InventoryItem[] }> = ({ items }) => {
  const tools = items.filter((i) => i.category === 'ALAT');
  const totalTools = tools.reduce((n, i) => n + i.quantity, 0);
  const damaged = items.filter((i) => i.condition !== 'BAIK');
  const criticalReagents = items.filter((i) => i.category === 'REAGEN' && i.quantity <= i.minStock);
  const goodTools = tools.filter((i) => i.condition === 'BAIK').reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-xs text-slate-500">Total Alat</div>
          <div className="text-2xl font-bold text-[#131b2e] mt-1">{totalTools} Unit</div>
          <div className="text-xs text-[#059669] mt-1">{goodTools} Kondisi Baik</div>
        </div>
        <div className="p-4 rounded-xl bg-[#FFF1F2] border border-rose-200">
          <div className="text-xs text-[#E11D48]">Item Rusak / Perlu Perbaikan</div>
          <div className="text-2xl font-bold text-[#E11D48] mt-1">{damaged.length} Item</div>
          <div className="text-xs text-slate-500 mt-1">{damaged.map((d) => d.code).join(', ') || '-'}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#FFFBEB] border border-amber-200">
          <div className="text-xs text-[#D97706]">Reagen Kritis (stok ≤ minimum)</div>
          <div className="text-2xl font-bold text-[#D97706] mt-1">{criticalReagents.length} Item</div>
          <div className="text-xs text-slate-500 mt-1">{criticalReagents.map((d) => d.name).join(', ') || '-'}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-200 rounded-xl min-w-[640px]">
          <thead className="bg-slate-100 font-bold text-slate-700">
            <tr>
              <th className="p-3">Kode</th>
              <th className="p-3">Nama</th>
              <th className="p-3">Lab</th>
              <th className="p-3 text-right">Jumlah</th>
              <th className="p-3">Kondisi</th>
              <th className="p-3">Lokasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-slate-400">Belum ada data inventaris.</td></tr>
            )}
            {items.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-[#00685f]">{i.code}</td>
                <td className="p-3">{i.name}</td>
                <td className="p-3">{i.labCode ?? '-'}</td>
                <td className="p-3 text-right tabular-nums">{i.quantity}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded font-bold ${i.condition === 'BAIK' ? 'bg-emerald-100 text-emerald-800' : i.condition === 'RUSAK' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                    {i.condition.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-3 text-slate-500">{i.storageLocation || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
