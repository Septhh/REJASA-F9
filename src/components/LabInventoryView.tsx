import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useTeacherAuth } from '../context/TeacherAuthContext';
import { LabCode, InventoryItem } from '../types';
import { LAB_METADATA } from '../data/inventoryData';
import { AddEditInventoryModal } from './AddEditInventoryModal';
import { InventoryDetailModal } from './InventoryDetailModal';
import { StockAdjustModal } from './StockAdjustModal';

interface LabInventoryViewProps {
  onOpenTeacherLogin?: () => void;
  onOpenAdminLogin?: () => void;
  onOpenTeacherManagement?: () => void;
}

export const LabInventoryView: React.FC<LabInventoryViewProps> = ({
  onOpenTeacherLogin,
  onOpenAdminLogin,
  onOpenTeacherManagement,
}) => {
  const {
    items,
    filterLab,
    setFilterLab,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedCondition,
    setSelectedCondition,
    addItem,
    updateItem,
    deleteItem,
    adjustQuantity,
    exportToCSV,
    resetInventory,
  } = useInventory();

  const { admin } = useAdminAuth();
  const { currentTeacher } = useTeacherAuth();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);

  // Active lab list or filtered list
  const filteredItems = items.filter((item) => {
    const matchLab = filterLab === 'ALL' || item.labCode === filterLab;
    const query = searchQuery.toLowerCase().trim();
    const matchSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.itemCode.toLowerCase().includes(query) ||
      item.brandModel.toLowerCase().includes(query) ||
      item.storageLocation.toLowerCase().includes(query) ||
      item.specs.toLowerCase().includes(query);
    const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;

    let matchCond = true;
    if (selectedCondition === 'GOOD') {
      matchCond = item.quantityGood === item.quantityTotal;
    } else if (selectedCondition === 'MINOR_DAMAGED') {
      matchCond = item.quantityMinorDamage > 0;
    } else if (selectedCondition === 'HEAVY_DAMAGED') {
      matchCond = item.quantityHeavyDamage > 0;
    }

    return matchLab && matchSearch && matchCat && matchCond;
  });

  // Calculate high-level metrics for the currently selected lab
  const labScopeItems = filterLab === 'ALL' ? items : items.filter((i) => i.labCode === filterLab);
  const totalSku = labScopeItems.length;
  const totalUnits = labScopeItems.reduce((acc, i) => acc + i.quantityTotal, 0);
  const totalGood = labScopeItems.reduce((acc, i) => acc + i.quantityGood, 0);
  const totalMinorDamage = labScopeItems.reduce((acc, i) => acc + i.quantityMinorDamage, 0);
  const totalHeavyDamage = labScopeItems.reduce((acc, i) => acc + i.quantityHeavyDamage, 0);
  const overallReadiness = totalUnits > 0 ? Math.round((totalGood / totalUnits) * 100) : 100;

  const labCodes: Array<LabCode | 'ALL'> = ['ALL', 'BIO', 'FIS', 'KIM', 'COM', 'BSM'];

  // INVENTORY ACCESS CONTROL: strictly Admin / Laboran only.
  // Guru cannot access or view inventory!
  if (!admin) {
    return (
      <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl mx-auto py-8">
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[36px]">shield_lock</span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Akses Inventaris Terbatas: Khusus Admin / Laboran
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto mt-2 leading-relaxed">
            Data inventaris seluruh laboratorium (alat, sarana, spesifikasi, dan stok fisik) hanya dapat diakses dan dikelola oleh Administrator atau Laboran yang memiliki akun terotorisasi.
          </p>

          {currentTeacher ? (
            <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 max-w-md mx-auto text-left flex items-start gap-3">
              <span className="material-symbols-outlined text-emerald-700 text-[22px] shrink-0 mt-0.5">
                account_circle
              </span>
              <div className="text-xs text-emerald-900">
                <p className="font-bold">
                  Sesi Guru Aktif: {currentTeacher.name} ({currentTeacher.teacherCode})
                </p>
                <p className="mt-1 text-emerald-800">
                  Guru tidak memiliki hak akses data inventaris. Anda dapat memindai QR pintu lab untuk melihat jadwal dan mengisi jurnal praktikum kelas Anda.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-left flex items-start gap-3">
              <span className="material-symbols-outlined text-slate-600 text-[22px] shrink-0 mt-0.5">
                badge
              </span>
              <div className="text-xs text-slate-700">
                <p className="font-bold">Informasi Guru:</p>
                <p className="mt-1 text-slate-600">
                  Guru hanya perlu memasukkan <strong>Kode Guru</strong> untuk mencatat jurnal mengajar. Admin yang terotorisasi dapat menambahkan akun guru dan mengelola inventaris bilik.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenAdminLogin}
              className="w-full sm:w-auto h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">vpn_key</span>
              <span>Masuk dengan Akun Admin / Laboran</span>
            </button>

            {onOpenTeacherLogin && !currentTeacher && (
              <button
                onClick={onOpenTeacherLogin}
                className="w-full sm:w-auto h-11 px-6 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">badge</span>
                <span>Masuk dengan Kode Guru</span>
              </button>
            )}
          </div>
        </div>

        {/* Roadmap notice */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-600">
          <span className="font-semibold text-slate-800">Prioritas Tahap REJASA:</span> Sistem inventaris laboratorium aktif mendahului pelaporan alat rusak sesuai instruksi.
        </div>
      </div>
    );
  }

  const canManage = !!admin;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner / Roadmap Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#1e293b] to-slate-900 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/30 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px]">inventory</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Sistem Inventaris Laboratorium Terpadu
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                Tahap 1: Inventaris Aktif
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Katalog sarana & peralatan dari setiap laboratorium (Biologi, Fisika, Kimia, Komputer, Bahasa).
              <span className="text-amber-300 font-medium ml-1">
                Sistem pelaporan alat rusak disiapkan untuk tahap selanjutnya sesuai instruksi.
              </span>
            </p>
          </div>
        </div>

        {/* User Session Quick Badge */}
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
          {currentTeacher ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-white">
              <span className="material-symbols-outlined text-emerald-400 text-[18px]">badge</span>
              <div className="text-left">
                <span className="text-[10px] font-semibold text-emerald-300 block leading-none">
                  Sesi Guru: {currentTeacher.teacherCode}
                </span>
                <span className="text-xs font-bold text-white truncate max-w-[140px] block mt-0.5">
                  {currentTeacher.name}
                </span>
              </div>
            </div>
          ) : admin ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-700/60 text-white">
              <span className="material-symbols-outlined text-red-400 text-[18px]">security</span>
              <div className="text-left">
                <span className="text-[10px] font-semibold text-red-300 block leading-none">
                  Admin Otorisasi: {admin.adminCode}
                </span>
                <span className="text-xs font-bold text-white truncate max-w-[140px] block mt-0.5">
                  {admin.name}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenTeacherLogin}
                className="h-9 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">key</span>
                <span>Masuk Kode Guru</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lab Selector Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {labCodes.map((code) => {
            const isActive = filterLab === code;
            const count = code === 'ALL' ? items.length : items.filter((i) => i.labCode === code).length;
            const meta = code === 'ALL' ? null : LAB_METADATA[code];

            return (
              <button
                key={code}
                onClick={() => setFilterLab(code)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {code !== 'ALL' && (
                  <span className="material-symbols-outlined text-[16px] text-emerald-500">
                    {meta?.icon || 'science'}
                  </span>
                )}
                <span>{code === 'ALL' ? 'Semua Laboratorium' : meta?.name || code}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lab Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Ragam Alat (Jenis)</span>
            <span className="material-symbols-outlined text-[18px] text-slate-400">category</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalSku}</div>
          <p className="text-[11px] text-slate-400 mt-1">Item terdata di inventaris</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Fisik Unit</span>
            <span className="material-symbols-outlined text-[18px] text-slate-400">shelves</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalUnits}</div>
          <p className="text-[11px] text-slate-400 mt-1">Semua unit alat & perkakas</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span>Kondisi Baik (Ready)</span>
            <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{totalGood}</div>
          <p className="text-[11px] text-emerald-600 mt-1 font-semibold">
            {overallReadiness}% Siap Digunakan
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
            <span>Rusak Ringan</span>
            <span className="material-symbols-outlined text-[18px] text-amber-600">build</span>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">{totalMinorDamage}</div>
          <p className="text-[11px] text-amber-700 mt-1 font-medium">Perlu perawatan berkala</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
            <span>Rusak Berat</span>
            <span className="material-symbols-outlined text-[18px] text-rose-600">cancel</span>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2">{totalHeavyDamage}</div>
          <p className="text-[11px] text-rose-700 mt-1 font-medium">Usul penggantian / afkir</p>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama alat, kode aset, lokasi rak..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-300 text-xs text-slate-900 bg-[#F8FAFC] focus:outline-none focus:border-emerald-600"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-[#F8FAFC] focus:outline-none focus:border-emerald-600"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="Optik & Mikroskopi">Optik & Mikroskopi</option>
            <option value="Elektronika & Alat Ukur">Elektronika & Alat Ukur</option>
            <option value="Alat Gelas & Kimia">Alat Gelas & Kimia</option>
            <option value="Komputer & Jaringan">Komputer & Jaringan</option>
            <option value="Audio & Multimedia">Audio & Multimedia</option>
            <option value="Peralatan Keselamatan">Peralatan Keselamatan</option>
            <option value="Peraga & Model Anatomi">Peraga & Model Anatomi</option>
          </select>

          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-[#F8FAFC] focus:outline-none focus:border-emerald-600"
          >
            <option value="ALL">Semua Kondisi</option>
            <option value="GOOD">100% Kondisi Baik</option>
            <option value="MINOR_DAMAGED">Ada Rusak Ringan</option>
            <option value="HEAVY_DAMAGED">Ada Rusak Berat</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => exportToCSV(filterLab)}
            className="h-9 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            title="Unduh data inventaris dalam format CSV"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-600">download</span>
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="h-9 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            title="Cetak lembar inventaris"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-600">print</span>
            <span className="hidden sm:inline">Cetak</span>
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setIsAddModalOpen(true);
            }}
            className="h-9 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Tambah Alat</span>
          </button>
        </div>
      </div>

      {/* Inventory Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-800 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Kode Aset</th>
                <th className="py-3.5 px-4">Nama Alat & Merk</th>
                <th className="py-3.5 px-4">Laboratorium</th>
                <th className="py-3.5 px-4">Kategori & Lokasi Simpan</th>
                <th className="py-3.5 px-4">Kuantitas & Kondisi</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <span className="material-symbols-outlined text-[36px] text-slate-300 block mb-2">
                      inventory_2
                    </span>
                    Tidak ada alat yang cocok dengan filter atau pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const labMeta = LAB_METADATA[item.labCode];
                  const goodPct =
                    item.quantityTotal > 0
                      ? Math.round((item.quantityGood / item.quantityTotal) * 100)
                      : 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Asset Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800">
                          {item.itemCode}
                        </span>
                      </td>

                      {/* Tool Name & Brand */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 leading-snug">{item.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {item.brandModel}
                        </div>
                      </td>

                      {/* Laboratory Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            labMeta?.bg || 'bg-slate-100'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {labMeta?.icon || 'science'}
                          </span>
                          <span>{labMeta?.name || item.labCode}</span>
                        </span>
                      </td>

                      {/* Category & Storage Location */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{item.category}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[13px] text-emerald-600">
                            place
                          </span>
                          <span>{item.storageLocation}</span>
                        </div>
                      </td>

                      {/* Quantity & Visual Breakdown */}
                      <td className="py-3.5 px-4 min-w-[170px]">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                          <span>
                            Total: <strong>{item.quantityTotal}</strong> {item.unit}
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              goodPct === 100 ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {goodPct}% Siap
                          </span>
                        </div>
                        {/* Mini progress bar */}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                          <div
                            style={{
                              width: `${(item.quantityGood / (item.quantityTotal || 1)) * 100}%`,
                            }}
                            className="bg-emerald-500 h-full"
                            title={`Baik: ${item.quantityGood}`}
                          />
                          <div
                            style={{
                              width: `${(item.quantityMinorDamage / (item.quantityTotal || 1)) * 100}%`,
                            }}
                            className="bg-amber-400 h-full"
                            title={`Rusak Ringan: ${item.quantityMinorDamage}`}
                          />
                          <div
                            style={{
                              width: `${(item.quantityHeavyDamage / (item.quantityTotal || 1)) * 100}%`,
                            }}
                            className="bg-rose-500 h-full"
                            title={`Rusak Berat: ${item.quantityHeavyDamage}`}
                          />
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                          <span className="text-emerald-700 font-semibold">{item.quantityGood} Baik</span>
                          {item.quantityMinorDamage > 0 && (
                            <span className="text-amber-700 font-semibold">
                              {item.quantityMinorDamage} R.Ringan
                            </span>
                          )}
                          {item.quantityHeavyDamage > 0 && (
                            <span className="text-rose-700 font-semibold">
                              {item.quantityHeavyDamage} R.Berat
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailItem(item)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Lihat detail spesifikasi alat"
                          >
                            <span className="material-symbols-outlined text-[18px]">info</span>
                          </button>

                          <button
                            onClick={() => setAdjustItem(item)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Ubah kondisi jumlah (Baik / Rusak)"
                          >
                            <span className="material-symbols-outlined text-[18px]">tune</span>
                          </button>

                          {canManage && (
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
                              title="Edit data alat"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                          )}

                          {admin && (
                            <button
                              onClick={() => {
                                if (confirm(`Hapus alat ${item.name} (${item.itemCode}) dari inventaris?`)) {
                                  deleteItem(item.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus dari inventaris"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info & Reset */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Menampilkan <strong>{filteredItems.length}</strong> dari <strong>{items.length}</strong> alat
            tercatat di semua laboratorium sekolah.
          </span>
          <button
            onClick={() => {
              if (confirm('Kembalikan data inventaris laboratorium ke data awal sekolah?')) {
                resetInventory();
              }
            }}
            className="text-slate-400 hover:text-slate-700 underline text-[11px]"
          >
            Reset Inventaris ke Sampel Awal
          </button>
        </div>
      </div>

      {/* Modals */}
      <AddEditInventoryModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSave={(data) => {
          if (editingItem) {
            return updateItem(editingItem.id, data);
          } else {
            return addItem(data);
          }
        }}
        initialData={editingItem}
        defaultLab={filterLab === 'ALL' ? 'BIO' : filterLab}
      />

      <InventoryDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onOpenEdit={(item) => {
          setDetailItem(null);
          setEditingItem(item);
          setIsAddModalOpen(true);
        }}
        onOpenAdjust={(item) => {
          setDetailItem(null);
          setAdjustItem(item);
        }}
        canEdit={canManage}
      />

      <StockAdjustModal
        isOpen={!!adjustItem}
        onClose={() => setAdjustItem(null)}
        item={adjustItem}
        onSave={(id, good, minor, heavy) => adjustQuantity(id, good, minor, heavy)}
      />
    </div>
  );
};
