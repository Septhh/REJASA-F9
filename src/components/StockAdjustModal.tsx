import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSave: (id: string, good: number, minor: number, heavy: number) => { success: boolean; error?: string };
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  const [good, setGood] = useState(0);
  const [minor, setMinor] = useState(0);
  const [heavy, setHeavy] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (item) {
      setGood(item.quantityGood);
      setMinor(item.quantityMinorDamage);
      setHeavy(item.quantityHeavyDamage);
      setErrorMessage('');
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const total = Number(good) + Number(minor) + Number(heavy);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (total < 0) {
      setErrorMessage('Total unit tidak boleh bernilai negatif.');
      return;
    }
    const res = onSave(item.id, good, minor, heavy);
    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || 'Gagal memperbarui kuantitas alat.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
              {item.itemCode}
            </span>
            <h3 className="font-bold text-base text-white mt-1">Penyesuaian Kondisi Unit</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-bold text-slate-900 text-xs block">{item.name}</span>
            <span className="text-[11px] text-slate-500">{item.storageLocation}</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-bold text-emerald-800 mb-1 flex items-center justify-between">
                <span>1. Kondisi Baik (Siap Pakai)</span>
                <span className="text-slate-500 font-normal">{item.unit}</span>
              </label>
              <input
                type="number"
                min="0"
                value={good}
                onChange={(e) => setGood(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full h-10 px-3 rounded-lg border border-emerald-300 text-emerald-900 font-bold text-sm bg-emerald-50/40 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-amber-800 mb-1 flex items-center justify-between">
                <span>2. Rusak Ringan (Perlu Perbaikan Ringan)</span>
                <span className="text-slate-500 font-normal">{item.unit}</span>
              </label>
              <input
                type="number"
                min="0"
                value={minor}
                onChange={(e) => setMinor(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full h-10 px-3 rounded-lg border border-amber-300 text-amber-900 font-bold text-sm bg-amber-50/40 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-bold text-rose-800 mb-1 flex items-center justify-between">
                <span>3. Rusak Berat (Tidak Berfungsi / Afkir)</span>
                <span className="text-slate-500 font-normal">{item.unit}</span>
              </label>
              <input
                type="number"
                min="0"
                value={heavy}
                onChange={(e) => setHeavy(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full h-10 px-3 rounded-lg border border-rose-300 text-rose-900 font-bold text-sm bg-rose-50/40 focus:outline-none focus:border-rose-600"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between font-bold text-slate-800 text-xs">
            <span>Total Unit Dihitung:</span>
            <span className="text-sm font-black text-slate-900">{total} {item.unit}</span>
          </div>

          {errorMessage && (
            <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {errorMessage}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-colors"
            >
              Simpan Penyesuaian
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
