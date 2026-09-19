import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { LAB_METADATA } from '../data/inventoryData';

interface DamagedEquipmentRoadmapViewProps {
  onGoToInventory: () => void;
}

export const DamagedEquipmentRoadmapView: React.FC<DamagedEquipmentRoadmapViewProps> = ({
  onGoToInventory,
}) => {
  const { items } = useInventory();

  // Find all items with minor or heavy damage in current inventory
  const damagedItems = items.filter((i) => i.quantityMinorDamage > 0 || i.quantityHeavyDamage > 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150">
      {/* Hero card acknowledging user instruction */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white border border-slate-700 shadow-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold mb-4">
          <span className="material-symbols-outlined text-[16px]">priority_high</span>
          <span>Tahapan Prioritas: Sesuai Instruksi Anda</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Sistem Inventaris Laboratorium Berhasil Dibangun Sebagai Fondasi
        </h1>

        <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
          Sesuai dengan instruksi Anda:{' '}
          <em className="text-amber-200">
            "sebelum membuat pelaporan alat rusak, nanti.. ingat ya NANTI buatlah sistem inventaris dari setiap laboratorium terlebih dahulu, sebelum maju ke tahap itu."
          </em>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-white/10 border border-white/15">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Tahap 1: Selesai & Aktif</span>
            </div>
            <h3 className="font-bold text-base text-white">Sistem Inventaris Laboratorium</h3>
            <p className="text-xs text-slate-300 mt-1">
              Data alat lengkap di Lab Biologi, Fisika, Kimia, Komputer, dan Bahasa telah aktif dengan kode aset, jumlah unit, dan pemantauan kondisi.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider mb-1">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              <span>Tahap 2: Disiapkan Untuk Nanti</span>
            </div>
            <h3 className="font-bold text-base text-white">Pelaporan Alat Rusak Terpadu</h3>
            <p className="text-xs text-slate-300 mt-1">
              Akan langsung membaca dan memperbarui status kode aset dari inventaris setiap lab saat Anda menginstruksikan maju ke tahap berikutnya.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Saat ini terdeteksi <strong>{damagedItems.length}</strong> jenis alat di inventaris yang membutuhkan perbaikan/servis.
          </span>
          <button
            onClick={onGoToInventory}
            className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
          >
            <span>Buka Inventaris Laboratorium</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Equipment readiness preview across labs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-600 text-[20px]">build_circle</span>
          <span>Daftar Alat Inventaris Yang Terdata Membutuhkan Perhatian / Perbaikan</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Data ini akan menjadi dasar utama ketika formulir pelaporan alat rusak diaktifkan pada tahap selanjutnya.
        </p>

        <div className="space-y-3">
          {damagedItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
              Semua alat di semua laboratorium dalam kondisi 100% baik.
            </div>
          ) : (
            damagedItems.map((item) => {
              const labMeta = LAB_METADATA[item.labCode];
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">warning</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                          {item.itemCode}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{item.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${labMeta?.bg || 'bg-slate-100'}`}>
                          {labMeta?.name || item.labCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Lokasi: {item.storageLocation} • {item.brandModel}
                      </p>
                      {item.notes && (
                        <p className="text-[11px] text-amber-800 font-medium mt-1">
                          Catatan: {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right text-xs">
                      {item.quantityMinorDamage > 0 && (
                        <span className="font-bold text-amber-700 block">
                          {item.quantityMinorDamage} unit Rusak Ringan
                        </span>
                      )}
                      {item.quantityHeavyDamage > 0 && (
                        <span className="font-bold text-rose-700 block">
                          {item.quantityHeavyDamage} unit Rusak Berat
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
