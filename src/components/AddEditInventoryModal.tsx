import React, { useState, useEffect } from 'react';
import { InventoryItem, LabCode, InventoryCategory, InventoryStatus } from '../types';
import { LAB_METADATA } from '../data/inventoryData';

interface AddEditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: any) => { success: boolean; error?: string };
  initialData?: InventoryItem | null;
  defaultLab?: LabCode;
}

const CATEGORIES: InventoryCategory[] = [
  'Optik & Mikroskopi',
  'Elektronika & Alat Ukur',
  'Alat Gelas & Kimia',
  'Komputer & Jaringan',
  'Audio & Multimedia',
  'Peralatan Keselamatan',
  'Peraga & Model Anatomi',
  'Bahan & Reagen',
];

export const AddEditInventoryModal: React.FC<AddEditInventoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultLab = 'BIO',
}) => {
  const [name, setName] = useState('');
  const [brandModel, setBrandModel] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [labCode, setLabCode] = useState<LabCode>(defaultLab);
  const [category, setCategory] = useState<InventoryCategory>('Optik & Mikroskopi');
  const [quantityGood, setQuantityGood] = useState<number>(1);
  const [quantityMinorDamage, setQuantityMinorDamage] = useState<number>(0);
  const [quantityHeavyDamage, setQuantityHeavyDamage] = useState<number>(0);
  const [unit, setUnit] = useState('Unit');
  const [status, setStatus] = useState<InventoryStatus>('Tersedia');
  const [storageLocation, setStorageLocation] = useState('');
  const [procurementYear, setProcurementYear] = useState<number>(2024);
  const [fundingSource, setFundingSource] = useState<'Dana BOS' | 'DAK Fisik' | 'Komite Sekolah' | 'Bantuan Pemerintah' | 'Hibah Perusahaan'>('Dana BOS');
  const [specs, setSpecs] = useState('');
  const [inspectedBy, setInspectedBy] = useState('Laboran Sekolah');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setBrandModel(initialData.brandModel);
      setItemCode(initialData.itemCode);
      setLabCode(initialData.labCode);
      setCategory(initialData.category);
      setQuantityGood(initialData.quantityGood);
      setQuantityMinorDamage(initialData.quantityMinorDamage);
      setQuantityHeavyDamage(initialData.quantityHeavyDamage);
      setUnit(initialData.unit);
      setStatus(initialData.status);
      setStorageLocation(initialData.storageLocation);
      setProcurementYear(initialData.procurementYear);
      setFundingSource(initialData.fundingSource);
      setSpecs(initialData.specs);
      setInspectedBy(initialData.inspectedBy);
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setBrandModel('');
      setLabCode(defaultLab);
      setCategory('Optik & Mikroskopi');
      setQuantityGood(1);
      setQuantityMinorDamage(0);
      setQuantityHeavyDamage(0);
      setUnit('Unit');
      setStatus('Tersedia');
      setStorageLocation('Lemari A - Rak 1');
      setProcurementYear(new Date().getFullYear());
      setFundingSource('Dana BOS');
      setSpecs('');
      setInspectedBy('Laboran');
      setNotes('');
      // Suggest code
      const rand = Math.floor(100 + Math.random() * 900);
      setItemCode(`${defaultLab}-ALAT-${rand}`);
    }
    setErrorMessage('');
  }, [initialData, isOpen, defaultLab]);

  if (!isOpen) return null;

  const totalCalculated = Number(quantityGood) + Number(quantityMinorDamage) + Number(quantityHeavyDamage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Nama alat wajib diisi.');
      return;
    }
    if (!itemCode.trim()) {
      setErrorMessage('Kode alat wajib diisi.');
      return;
    }
    if (!storageLocation.trim()) {
      setErrorMessage('Lokasi penyimpanan wajib diisi.');
      return;
    }

    const payload = {
      name: name.trim(),
      brandModel: brandModel.trim() || name.trim(),
      itemCode: itemCode.trim().toUpperCase(),
      labCode,
      category,
      quantityTotal: totalCalculated,
      quantityGood: Number(quantityGood),
      quantityMinorDamage: Number(quantityMinorDamage),
      quantityHeavyDamage: Number(quantityHeavyDamage),
      unit,
      status,
      storageLocation: storageLocation.trim(),
      procurementYear: Number(procurementYear),
      fundingSource,
      specs: specs.trim() || 'Spesifikasi standar laboratorium.',
      inspectedBy: inspectedBy.trim(),
      notes: notes.trim() || undefined,
    };

    const res = onSave(payload);
    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || 'Gagal menyimpan alat inventaris.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#0F172A] text-white p-5 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[24px]">
                {initialData ? 'edit_note' : 'inventory_2'}
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialData ? 'Edit Data Inventaris Alat' : 'Tambah Alat Inventaris Baru'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pencatatan sarana laboratorium untuk pemeliharaan dan pelaporan berkala.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">
                Nama Lengkap Alat Laboratorium *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Mikroskop Binokuler Siswa CX23"
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Kode / Nomor Aset Alat *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: BIO-MC-001"
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono text-xs font-bold text-slate-900 uppercase bg-white focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    const r = Math.floor(100 + Math.random() * 900);
                    setItemCode(`${labCode}-ALAT-${r}`);
                  }}
                  className="px-2.5 h-9 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 shrink-0"
                  title="Generate kode unik"
                >
                  Auto
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Merk / Seri / Model *
              </label>
              <input
                type="text"
                required
                value={brandModel}
                onChange={(e) => setBrandModel(e.target.value)}
                placeholder="Contoh: Olympus CX23 LED"
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Penempatan Laboratorium *
              </label>
              <select
                value={labCode}
                onChange={(e) => setLabCode(e.target.value as LabCode)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-emerald-600"
              >
                <option value="BIO">Lab Biologi Terpadu (BIO)</option>
                <option value="FIS">Lab Fisika Modern (FIS)</option>
                <option value="KIM">Lab Kimia Anorganik (KIM)</option>
                <option value="COM">Lab Komputer Sains (COM)</option>
                <option value="BSM">Smartclass & Bahasa (BSM)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Kategori Alat *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InventoryCategory)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-emerald-600"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Lokasi Simpan Fisik di Lab *
              </label>
              <input
                type="text"
                required
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="Contoh: Lemari A - Rak 2 / Meja Praktikum 1"
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Satuan Unit *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-emerald-600"
              >
                <option value="Unit">Unit</option>
                <option value="Set">Set</option>
                <option value="Buah">Buah</option>
                <option value="Kotak">Kotak</option>
                <option value="Paket">Paket</option>
              </select>
            </div>
          </div>

          {/* Quantity & Condition Breakdown Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                Rincian Kuantitas & Kondisi Alat
              </span>
              <span className="text-xs font-bold text-slate-700">
                Total: <strong className="text-slate-900 text-sm">{totalCalculated}</strong> {unit}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                  Kondisi Baik (Siap Pakai)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={quantityGood}
                  onChange={(e) => setQuantityGood(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full h-9 px-3 rounded-lg border border-emerald-300 text-xs font-bold text-emerald-900 bg-emerald-50/50 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-800 mb-1">
                  Rusak Ringan (Servis)
                </label>
                <input
                  type="number"
                  min="0"
                  value={quantityMinorDamage}
                  onChange={(e) => setQuantityMinorDamage(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full h-9 px-3 rounded-lg border border-amber-300 text-xs font-bold text-amber-900 bg-amber-50/50 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rose-800 mb-1">
                  Rusak Berat (Afkir)
                </label>
                <input
                  type="number"
                  min="0"
                  value={quantityHeavyDamage}
                  onChange={(e) => setQuantityHeavyDamage(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full h-9 px-3 rounded-lg border border-rose-300 text-xs font-bold text-rose-900 bg-rose-50/50 focus:outline-none focus:border-rose-600"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Tahun Pengadaan
              </label>
              <input
                type="number"
                min="2010"
                max="2030"
                value={procurementYear}
                onChange={(e) => setProcurementYear(parseInt(e.target.value) || 2024)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Sumber Dana Pengadaan
              </label>
              <select
                value={fundingSource}
                onChange={(e) => setFundingSource(e.target.value as any)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-emerald-600"
              >
                <option value="Dana BOS">Dana BOS Reguler</option>
                <option value="DAK Fisik">DAK Fisik Pendidikan</option>
                <option value="Komite Sekolah">Komite Sekolah / Mandiri</option>
                <option value="Bantuan Pemerintah">Bantuan Pemerintah Pusat/Daerah</option>
                <option value="Hibah Perusahaan">Hibah CSR / Perusahaan</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">
                Spesifikasi Teknis Singkat
              </label>
              <textarea
                rows={2}
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                placeholder="Contoh: Lensa objektif Plan 4x, 10x, 40x, 100x Oil, Lampu illumination LED..."
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">
                Catatan Kondisi / Penanganan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Kalibrasi ulang diperlukan sebelum semester depan"
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {errorMessage}
            </p>
          )}

          {/* Footer actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>{initialData ? 'Simpan Perubahan Alat' : 'Tambahkan ke Inventaris'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
