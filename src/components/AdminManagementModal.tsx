import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext.tsx';

interface AdminManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const AdminManagementModal: React.FC<AdminManagementModalProps> = ({ isOpen, onClose, onToast }) => {
  const { admin, logoutAdmin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'change-pw'>('list');
  const [adminList, setAdminList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form for New / Custom Admin
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Laboran');

  // Form for Change Password
  const [targetCode, setTargetCode] = useState(admin?.adminCode || 'RDT1');
  const [oldPassword, setOldPassword] = useState('');
  const [newCustomPassword, setNewCustomPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/list');
      if (res.ok) {
        const data = await res.json();
        setAdminList(data);
      }
    } catch (err) {
      console.error('Error fetching admin list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdmins();
      setFormError(null);
      setFormSuccess(null);
      if (admin) setTargetCode(admin.adminCode);
    }
  }, [isOpen, admin]);

  if (!isOpen) return null;

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!newCode.trim() || !newName.trim() || !newPassword.trim()) {
      setFormError('Kode Admin, Nama, dan Password otorisasi wajib diisi.');
      return;
    }

    try {
      const res = await fetch('/api/admin/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminCode: newCode.trim().toUpperCase(),
          name: newName.trim(),
          password: newPassword,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFormSuccess(`Admin dengan Kode ${newCode.toUpperCase()} berhasil disimpan! Hash password telah diperbarui di Cloud SQL.`);
        setNewCode('');
        setNewName('');
        setNewPassword('');
        fetchAdmins();
        onToast(`Admin ${data.admin?.adminCode} berhasil dikustomisasi!`);
      } else {
        setFormError(data.error || 'Gagal menyimpan data admin.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Koneksi gagal.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!targetCode.trim() || !oldPassword.trim() || !newCustomPassword.trim()) {
      setFormError('Semua field wajib diisi.');
      return;
    }

    if (newCustomPassword !== confirmPassword) {
      setFormError('Konfirmasi password baru tidak cocok.');
      return;
    }

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminCode: targetCode.trim().toUpperCase(),
          oldPassword,
          newPassword: newCustomPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFormSuccess(`Password otorisasi untuk ${targetCode.toUpperCase()} berhasil diperbarui dalam hash SHA-256 Cloud SQL.`);
        setOldPassword('');
        setNewCustomPassword('');
        setConfirmPassword('');
        onToast(`Password ${targetCode.toUpperCase()} berhasil diubah!`);
      } else {
        setFormError(data.error || 'Gagal memperbarui password.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Koneksi gagal.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-300 rounded-[2px] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[22px] text-[#9E1B32]">admin_panel_settings</span>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Manajemen Kode Admin & Hash Password</h3>
              <p className="text-[11px] text-slate-400">Penyimpanan kredensial otorisasi terenkripsi di Cloud SQL (PostgreSQL)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-[2px] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Current Admin Session Status Bar */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Sesi Aktif:</span>
            {admin ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                <span className="px-1.5 py-0.5 rounded-[2px] bg-[#9E1B32] text-white font-mono text-[11px]">
                  {admin.adminCode}
                </span>
                <span>{admin.name}</span>
                <span className="text-slate-400 font-normal">({admin.role})</span>
              </span>
            ) : (
              <span className="text-amber-700 italic">Belum terautentikasi</span>
            )}
          </div>
          {admin && (
            <button
              onClick={() => {
                logoutAdmin();
                onToast('Sesi admin telah diakhiri.');
              }}
              className="text-[11px] font-bold text-red-700 hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">logout</span>
              Keluar Sesi
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6 pt-3 gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'list'
                ? 'border-[#9E1B32] text-[#9E1B32]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">list</span>
            Daftar Admin ({adminList.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'border-[#9E1B32] text-[#9E1B32]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            Kustomisasi / Tambah Admin Baru
          </button>
          <button
            onClick={() => setActiveTab('change-pw')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'change-pw'
                ? 'border-[#9E1B32] text-[#9E1B32]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">key</span>
            Ubah Password Otorisasi
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {formError && (
            <div className="p-3 rounded-[2px] bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-red-600">error</span>
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 rounded-[2px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-emerald-600">check_circle</span>
              <span>{formSuccess}</span>
            </div>
          )}

          {/* TAB 1: LIST */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Tiap admin memiliki kode unik (seperti <strong className="font-mono text-[#9E1B32]">RDT1</strong>) dan password otorisasi terpisah yang disimpan dalam bentuk <strong>hash SHA-256</strong> di tabel <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">admin_users</code> Cloud SQL.
              </p>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">Memuat daftar admin dari Cloud SQL...</div>
              ) : (
                <div className="border border-slate-200 rounded-[2px] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5">Kode Admin</th>
                        <th className="px-4 py-2.5">Nama Personel</th>
                        <th className="px-4 py-2.5">Peran</th>
                        <th className="px-4 py-2.5">Status Hash</th>
                        <th className="px-4 py-2.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {adminList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            <span className="px-2 py-0.5 rounded-[2px] bg-slate-100 border border-slate-300">
                              {item.adminCode}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                          <td className="px-4 py-3 text-slate-600">{item.role}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[2px] border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              SHA256 Encrypted
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                setTargetCode(item.adminCode);
                                setActiveTab('change-pw');
                              }}
                              className="text-[#9E1B32] hover:underline font-bold text-[11px]"
                            >
                              Ganti Password
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADD / CUSTOMIZE */}
          {activeTab === 'add' && (
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Tambahkan kode admin baru atau perbarui profil admin yang sudah ada. Password yang Anda tentukan akan langsung di-hash dengan garam kriptografi sebelum disimpan ke Cloud SQL.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">
                    Kode Admin Kustom *
                  </label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: RDT2, LAB02, BIO1"
                    className="w-full h-10 px-3 text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-[2px] focus:bg-white focus:ring-1 focus:ring-[#9E1B32] focus:border-[#9E1B32] uppercase"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Huruf kapital dan angka tanpa spasi</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">
                    Nama Lengkap / Jabatan *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Contoh: Raditya Aditama"
                    className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-300 rounded-[2px] focus:bg-white focus:ring-1 focus:ring-[#9E1B32] focus:border-[#9E1B32]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">
                    Password Otorisasi Unik *
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tentukan password khusus admin ini..."
                    className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-300 rounded-[2px] focus:bg-white focus:ring-1 focus:ring-[#9E1B32] focus:border-[#9E1B32]"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Akan di-hash aman di Cloud SQL</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">
                    Peran Laboratorium
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-300 rounded-[2px] focus:bg-white focus:ring-1 focus:ring-[#9E1B32] focus:border-[#9E1B32]"
                  >
                    <option value="Laboran">Laboran</option>
                    <option value="Laboran Senior">Laboran Senior</option>
                    <option value="Kepala Lab">Kepala Lab</option>
                    <option value="Admin Utama">Admin Utama</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#9E1B32] hover:bg-[#831629] rounded-[2px] transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  Simpan Admin & Hash ke Cloud SQL
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CHANGE PASSWORD */}
          {activeTab === 'change-pw' && (
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <p className="text-xs text-slate-600 leading-relaxed">
                Perbarui password otorisasi untuk admin tertentu. Password baru akan otomatis di-hash ulang dan menggantikan hash lama di Cloud SQL.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">
                  Kode Admin Target
                </label>
                <input
                  type="text"
                  value={targetCode}
                  onChange={(e) => setTargetCode(e.target.value.toUpperCase())}
                  placeholder="RDT1"
                  className="w-full h-10 px-3 text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-[2px] focus:bg-white focus:ring-1 focus:ring-[#9E1B32] focus:border-[#9E1B32] uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">
                  Password Lama
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password saat ini..."
                  className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-300 rounded-[2px] focus:bg-white focus:ring-1 focus:ring-[#9E1B32] focus:border-[#9E1B32]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">
                  Password Baru Kustom
                </label>
                <input
                  type="password"
                  value={newCustomPassword}
                  onChange={(e) => setNewCustomPassword(e.target.value)}
                  placeholder="Password otorisasi baru..."
                  className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-300 rounded-[2px] focus:bg-white focus:ring-1 focus:ring-[#9E1B32] focus:border-[#9E1B32]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">
                  Ulangi Password Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Konfirmasi password baru..."
                  className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-300 rounded-[2px] focus:bg-white focus:ring-1 focus:ring-[#9E1B32] focus:border-[#9E1B32]"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#9E1B32] hover:bg-[#831629] rounded-[2px] transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                  Update Hash Password
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-[2px] transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
