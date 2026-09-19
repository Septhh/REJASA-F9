import React from 'react';
import { InventoryItem } from '../types';
import { LAB_METADATA } from '../data/inventoryData';

interface InventoryDetailModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onOpenEdit: (item: InventoryItem) => void;
  onOpenAdjust: (item: InventoryItem) => void;
  canEdit: boolean;
}

export const InventoryDetailModal: React.FC<InventoryDetailModalProps> = ({
  item,
  onClose,
  onOpenEdit,
  onOpenAdjust,
  canEdit,
}) => {
  if (!item) return null;

  const labMeta = LAB_METADATA[item.labCode];
  const readinessPercent =
    item.quantityTotal > 0 ? Math.round((item.quantityGood / item.quantityTotal) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 px-6 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">precision_manufacturing</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  {item.itemCode}
                </span>
                <span className="text-[11px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded">
                  {labMeta?.name || item.labCode}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-1 leading-snug">{item.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          {/* Status & Readiness Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 flex items-center justify-center text-emerald-700 font-black text-sm bg-white">
                {readinessPercent}%
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                  Tingkat Kesiapan Operasional
                </span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {item.quantityGood} dari {item.quantityTotal} {item.unit} Siap Pakai
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-200">
                {item.status}
              </span>
            </div>
          </div>

          {/* Condition Breakdown */}
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
              Rincian Kondisi Fisik Alat
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[11px] font-semibold text-emerald-800">Kondisi Baik</span>
                <div className="text-lg font-black text-emerald-900 mt-1">
                  {item.quantityGood} <span className="text-xs font-medium">{item.unit}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-[11px] font-semibold text-amber-800">Rusak Ringan</span>
                <div className="text-lg font-black text-amber-900 mt-1">
                  {item.quantityMinorDamage} <span className="text-xs font-medium">{item.unit}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                <span className="text-[11px] font-semibold text-rose-800">Rusak Berat</span>
                <div className="text-lg font-black text-rose-900 mt-1">
                  {item.quantityHeavyDamage} <span className="text-xs font-medium">{item.unit}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications & Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-slate-100 pt-4">
            <div>
              <span className="text-slate-500 block text-[11px]">Merk & Tipe</span>
              <span className="font-bold text-slate-900 text-xs">{item.brandModel}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Kategori</span>
              <span className="font-bold text-slate-900 text-xs">{item.category}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Lokasi Penyimpanan di Lab</span>
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[15px] text-emerald-700">place</span>
                {item.storageLocation}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Tahun & Sumber Pengadaan</span>
              <span className="font-bold text-slate-900 text-xs">
                Tahun {item.procurementYear} ({item.fundingSource})
              </span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-slate-500 block text-[11px]">Spesifikasi Teknis</span>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800 mt-1 leading-relaxed">
                {item.specs}
              </div>
            </div>

            {item.notes && (
              <div className="sm:col-span-2">
                <span className="text-slate-500 block text-[11px]">Catatan Kondisi Khusus</span>
                <p className="font-medium text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200 mt-1">
                  {item.notes}
                </p>
              </div>
            )}

            <div>
              <span className="text-slate-500 block text-[11px]">Pemeriksaan Terakhir</span>
              <span className="font-bold text-slate-800 text-xs">
                {item.lastInspectedAt} oleh {item.inspectedBy}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Label Barcode/Asset Tag</span>
              <div className="font-mono text-[11px] tracking-widest text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block border border-slate-300 mt-0.5">
                |||||| | | ||| | ||| {item.itemCode}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => onOpenAdjust(item)}
              className="h-9 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-amber-700">tune</span>
              <span>Ubah Kondisi Stok</span>
            </button>

            {canEdit && (
              <button
                onClick={() => onOpenEdit(item)}
                className="h-9 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-700">edit</span>
                <span>Edit Spesifikasi</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
