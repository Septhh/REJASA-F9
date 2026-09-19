import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext.tsx';
import { useTeacherAuth } from '../context/TeacherAuthContext.tsx';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenCreateQR: () => void;
  onOpenPrintReport: () => void;
  onOpenIntegration?: () => void;
  onOpenAdminLogin?: () => void;
  onOpenAdminManagement?: () => void;
  onOpenTeacherJournalForm?: () => void;
  onOpenTeacherLogin?: () => void;
  onOpenTeacherManagement?: () => void;
  onToggleMobileSidebar: () => void;
  unreadAlertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenCreateQR,
  onOpenPrintReport,
  onOpenIntegration,
  onOpenAdminLogin,
  onOpenAdminManagement,
  onOpenTeacherJournalForm,
  onOpenTeacherLogin,
  onOpenTeacherManagement,
  onToggleMobileSidebar,
  unreadAlertCount,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { admin, logoutAdmin } = useAdminAuth();
  const { currentTeacher, logoutTeacher } = useTeacherAuth();

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-30 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200">
      {/* Left side: Hamburger & Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Buka Menu"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <div className="relative w-full max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari alat inventaris, kode, atau lab..."
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-[#F8FAFC] text-[#131b2e] text-xs sm:text-sm border border-slate-300 focus:outline-none focus:border-[#9E1B32] focus:ring-1 focus:ring-[#9E1B32] transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Right side: Teacher & Admin session controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Teacher status badge / Teacher login button */}
        {currentTeacher ? (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
              {currentTeacher.teacherCode.slice(0, 3)}
            </div>
            <div className="hidden md:flex flex-col text-left min-w-0">
              <span className="text-[11px] font-bold text-emerald-900 truncate max-w-[120px] leading-tight">
                {currentTeacher.name}
              </span>
              <span className="text-[9px] font-mono text-emerald-700">
                {currentTeacher.teacherCode}
              </span>
            </div>
            <button
              onClick={logoutTeacher}
              title="Keluar Sesi Guru"
              className="text-emerald-600 hover:text-emerald-900 p-0.5 rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenTeacherLogin}
            className="h-9 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">key</span>
            <span className="hidden sm:inline">Kode Guru</span>
          </button>
        )}

        {/* Admin actions */}
        {admin ? (
          <>
            {/* Admin Teacher Management button */}
            <button
              onClick={onOpenTeacherManagement}
              className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              title="Kelola & Tambah Akun Guru"
            >
              <span className="material-symbols-outlined text-[18px] text-[#9E1B32]">manage_accounts</span>
              <span className="hidden lg:inline">Kelola Guru</span>
            </button>

            <button
              id="btn-create-qr"
              onClick={onOpenCreateQR}
              className="hidden sm:flex h-9 px-3 rounded-xl bg-[#9E1B32] hover:bg-[#800E26] text-white text-xs font-semibold items-center gap-1.5 shadow-xs transition-colors"
              title="Cetak/Tampilkan QR Pintu Laboratorium"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
              <span>QR Lab</span>
            </button>

            {/* Admin Profile Box */}
            <div className="flex items-center gap-1.5 pl-1">
              <button
                onClick={onOpenAdminManagement}
                title="Pengaturan Akun Admin"
                className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-[#9E1B32] text-white flex items-center justify-center font-mono font-bold text-xs">
                  {admin.adminCode.substring(0, 3)}
                </div>
                <div className="hidden sm:flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {admin.adminCode}
                    </span>
                    <span className="material-symbols-outlined text-[13px] text-slate-500">settings</span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate max-w-[80px]">{admin.name}</span>
                </div>
              </button>

              <button
                onClick={logoutAdmin}
                title="Keluar Sesi Admin"
                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={onOpenAdminLogin}
            className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-red-400">lock</span>
            <span className="hidden sm:inline">Admin</span>
          </button>
        )}
      </div>
    </header>
  );
};
