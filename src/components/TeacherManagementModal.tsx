import React, { useState } from 'react';
import { useTeacherAuth } from '../context/TeacherAuthContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Teacher, LabCode } from '../types';
import { LAB_METADATA } from '../data/inventoryData';

interface TeacherManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdminLogin: () => void;
}

export const TeacherManagementModal: React.FC<TeacherManagementModalProps> = ({
  isOpen,
  onClose,
  onOpenAdminLogin,
}) => {
  const { admin } = useAdminAuth();
  const { teachers, addTeacher, updateTeacher, deleteTeacher, resetDefaultTeachers } = useTeacherAuth();

  const [searchFilter, setSearchFilter] = useState('');
  const [selectedLab, setSelectedLab] = useState<LabCode | 'ALL'>('ALL');

  // Form state for adding/editing teacher
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formLab, setFormLab] = useState<LabCode>('BIO');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  if (!isOpen) return null;

  // If admin is not logged in, prompt authorization
  if (!admin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px]">admin_panel_settings</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1.5">Otorisasi Admin Diperlukan</h3>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Menambahkan dan mengelola akun guru hanya dapat dilakukan melalui akun yang telah terotorisasi oleh Administrator Laboratorium.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              Kembali
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenAdminLogin();
              }}
              className="flex-1 h-10 rounded-xl bg-[#9E1B32] hover:bg-[#831629] text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">lock_open</span>
              <span>Masuk Admin</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setFormName('');
    setFormCode('');
    setFormNip('');
    setFormSubject('');
    setFormLab('BIO');
    setFormPhone('');
    setFormStatus('ACTIVE');
    setFormError('');
    setFormSuccess('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartAdd = () => {
    resetForm();
    // Auto-generate suggested code
    const count = teachers.length + 1;
    setFormCode(`GUR-LAB-${String(count).padStart(2, '0')}`);
    setIsAdding(true);
  };

  const handleStartEdit = (teacher: Teacher) => {
    setFormName(teacher.name);
    setFormCode(teacher.teacherCode);
    setFormNip(teacher.nip || '');
    setFormSubject(teacher.subject);
    setFormLab(teacher.primaryLab);
    setFormPhone(teacher.phone || '');
    setFormStatus(teacher.status);
    setEditingId(teacher.id);
    setIsAdding(true);
    setFormError('');
    setFormSuccess('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formName.trim()) {
      setFormError('Nama lengkap guru wajib diisi.');
      return;
    }
    if (!formCode.trim()) {
      setFormError('Kode guru wajib diisi.');
      return;
    }
    if (!formSubject.trim()) {
      setFormError('Mata pelajaran wajib diisi.');
      return;
    }

    if (editingId) {
      const res = updateTeacher(editingId, {
        name: formName.trim(),
        teacherCode: formCode.trim().toUpperCase(),
        nip: formNip.trim() || undefined,
        subject: formSubject.trim(),
        primaryLab: formLab,
        phone: formPhone.trim() || undefined,
        status: formStatus,
      });

      if (res.success) {
        setFormSuccess('Data guru berhasil diperbarui.');
        setTimeout(() => resetForm(), 800);
      } else {
        setFormError(res.error || 'Gagal memperbarui data guru.');
      }
    } else {
      const colors = ['bg-emerald-700', 'bg-sky-700', 'bg-teal-700', 'bg-indigo-700', 'bg-purple-700', 'bg-rose-700'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const res = addTeacher({
        name: formName.trim(),
        teacherCode: formCode.trim().toUpperCase(),
        nip: formNip.trim() || undefined,
        subject: formSubject.trim(),
        primaryLab: formLab,
        phone: formPhone.trim() || undefined,
        status: formStatus,
        avatarColor: randomColor,
      });

      if (res.success) {
        setFormSuccess(`Guru ${formName} berhasil didaftarkan dengan kode ${formCode.toUpperCase()}!`);
        setTimeout(() => resetForm(), 900);
      } else {
        setFormError(res.error || 'Gagal menambahkan guru baru.');
      }
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.teacherCode.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchFilter.toLowerCase());
    const matchLab = selectedLab === 'ALL' || t.primaryLab === selectedLab;
    return matchSearch && matchLab;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#0F172A] text-white p-5 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#9E1B32] flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Manajemen Guru Terotorisasi</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-red-950 text-red-300 border border-red-800/60 px-2 py-0.5 rounded">
                  Admin: {admin.adminCode}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Admin dapat mendaftarkan guru baru dan mengatur kode guru untuk akses cepat.
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

        {/* Action / Subheader bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Cari guru, kode guru, atau mapel..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-[#9E1B32] focus:ring-1 focus:ring-[#9E1B32]"
              />
            </div>
            <select
              value={selectedLab}
              onChange={(e) => setSelectedLab(e.target.value as any)}
              className="h-9 px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-[#9E1B32]"
            >
              <option value="ALL">Semua Laboratorium</option>
              <option value="BIO">Lab Biologi</option>
              <option value="FIS">Lab Fisika</option>
              <option value="KIM">Lab Kimia</option>
              <option value="COM">Lab Komputer</option>
              <option value="BSM">Lab Bahasa</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {!isAdding ? (
              <button
                onClick={handleStartAdd}
                className="h-9 px-3.5 rounded-lg bg-[#9E1B32] hover:bg-[#831629] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>Tambah Guru Baru</span>
              </button>
            ) : (
              <button
                onClick={resetForm}
                className="h-9 px-3 rounded-lg border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold"
              >
                Tutup Formulir
              </button>
            )}
          </div>
        </div>

        {/* Content body: Form OR Table */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Add / Edit Form Drawer */}
          {isAdding && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 mb-4 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#9E1B32] text-[20px]">
                    {editingId ? 'edit' : 'person_add'}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900">
                    {editingId ? 'Edit Data Akun Guru' : 'Formulir Pendaftaran Guru Baru'}
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500">
                  Guru yang terdaftar dapat langsung login dengan memasukkan Kode Guru.
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Lengkap Guru (dengan Gelar) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Contoh: Drs. Bambang Haryanto, M.Pd."
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-[#9E1B32]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kode Guru (Unik untuk Login) *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                        placeholder="Contoh: GUR-IPA-01"
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono text-xs font-bold text-slate-900 uppercase bg-white focus:outline-none focus:border-[#9E1B32]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const rand = Math.floor(10 + Math.random() * 89);
                          setFormCode(`GUR-${formLab}-${rand}`);
                        }}
                        className="px-2.5 h-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-[11px] font-semibold text-slate-700 shrink-0"
                        title="Acak kode otomatis"
                      >
                        Auto
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mata Pelajaran yang Diampu *
                    </label>
                    <input
                      type="text"
                      required
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      placeholder="Contoh: Biologi & Sains Terapan"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-[#9E1B32]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Laboratorium Utama / Pengampu *
                    </label>
                    <select
                      value={formLab}
                      onChange={(e) => setFormLab(e.target.value as LabCode)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-[#9E1B32]"
                    >
                      <option value="BIO">Lab Biologi Terpadu (BIO)</option>
                      <option value="FIS">Lab Fisika Modern (FIS)</option>
                      <option value="KIM">Lab Kimia Anorganik (KIM)</option>
                      <option value="COM">Lab Komputer Sains (COM)</option>
                      <option value="BSM">Smartclass & Bahasa (BSM)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      NIP / NUPTK (Opsional)
                    </label>
                    <input
                      type="text"
                      value={formNip}
                      onChange={(e) => setFormNip(e.target.value)}
                      placeholder="Contoh: 19750812 200003 1 003"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-[#9E1B32]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor Telepon / WhatsApp (Opsional)
                    </label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="Contoh: 0812-3456-7890"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-[#9E1B32]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formStatus === 'ACTIVE'}
                      onChange={(e) => setFormStatus(e.target.checked ? 'ACTIVE' : 'INACTIVE')}
                      className="rounded border-slate-300 text-[#9E1B32] focus:ring-[#9E1B32]"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Status Akun Aktif (Dapat Login Menggunakan Kode)
                    </span>
                  </label>
                </div>

                {formError && (
                  <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    {formError}
                  </p>
                )}

                {formSuccess && (
                  <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    {formSuccess}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-rose-100">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="h-9 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-lg bg-[#9E1B32] hover:bg-[#831629] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>{editingId ? 'Simpan Perubahan Guru' : 'Daftarkan Guru'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Teachers List Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-800 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Kode Guru</th>
                    <th className="py-3 px-4">Nama Lengkap & NIP</th>
                    <th className="py-3 px-4">Mata Pelajaran</th>
                    <th className="py-3 px-4">Lab Utama</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Tidak ada guru yang sesuai dengan pencarian atau filter lab.
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((tch) => {
                      const labMeta = LAB_METADATA[tch.primaryLab];
                      return (
                        <tr key={tch.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            <span className="px-2 py-1 rounded bg-slate-100 border border-slate-300 text-[#9E1B32]">
                              {tch.teacherCode}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{tch.name}</div>
                            {tch.nip && <div className="text-[11px] text-slate-400">NIP: {tch.nip}</div>}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {tch.subject}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${labMeta?.bg || 'bg-slate-100'}`}>
                              <span className="material-symbols-outlined text-[13px]">{labMeta?.icon || 'science'}</span>
                              <span>{labMeta?.name || tch.primaryLab}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                updateTeacher(tch.id, {
                                  status: tch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                                });
                              }}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                tch.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              }`}
                              title="Klik untuk mengubah status aktif"
                            >
                              {tch.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleStartEdit(tch)}
                                className="p-1 text-slate-500 hover:text-[#9E1B32] hover:bg-slate-100 rounded transition-colors"
                                title="Edit data guru"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus guru ${tch.name} (${tch.teacherCode})?`)) {
                                    deleteTeacher(tch.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Hapus guru"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>Total Guru Terdaftar: <strong>{teachers.length}</strong> orang</span>
            <button
              onClick={() => {
                if (confirm('Kembalikan daftar guru ke data awal bawaan sekolah?')) {
                  resetDefaultTeachers();
                }
              }}
              className="text-slate-400 hover:text-slate-700 underline text-[11px]"
            >
              Reset ke Daftar Bawaan Sekolah
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
