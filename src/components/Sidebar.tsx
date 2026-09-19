import React from 'react';
import { useAdminAuth } from '../context/AdminAuthContext.tsx';
import { useTeacherAuth } from '../context/TeacherAuthContext.tsx';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenAdminLogin?: () => void;
  onOpenTeacherLogin?: () => void;
  onOpenTeacherManagement?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingCount,
  isOpenMobile = false,
  onCloseMobile,
  onOpenAdminLogin,
  onOpenTeacherLogin,
  onOpenTeacherManagement,
}) => {
  const { admin, logoutAdmin } = useAdminAuth();
  const { currentTeacher, logoutTeacher } = useTeacherAuth();

  const navItems = [
    {
      id: 'inventaris',
      label: 'Inventaris Laboratorium',
      icon: 'inventory_2',
      badge: 'Prioritas',
      badgeType: 'priority',
    },
    {
      id: 'dashboard',
      label: 'Monitoring Ruang Lab',
      icon: 'dashboard',
      badge: 'Live',
      badgeType: 'live',
    },
    {
      id: 'jurnal-laboratorium',
      label: admin ? 'Daftar Jurnal' : 'Isi Jurnal Guru',
      icon: 'menu_book',
      badge: pendingCount > 0 ? `${pendingCount} Baru` : undefined,
      badgeType: 'warning',
    },
    ...(admin
      ? [
          {
            id: 'kelola-guru',
            label: 'Manajemen Akun Guru',
            icon: 'manage_accounts',
            badge: 'Admin',
            badgeType: 'admin',
          },
          {
            id: 'review-jurnal',
            label: 'Verifikasi & Review',
            icon: 'assignment_turned_in',
          },
          {
            id: 'lab-qr-core',
            label: 'QR Pintu Lab',
            icon: 'qr_code_2',
          },
        ]
      : []),
    {
      id: 'roadmap-alat',
      label: 'Pelaporan Alat Rusak',
      icon: 'schedule',
      badge: 'Nanti',
      badgeType: 'future',
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="main-sidebar"
        className={`fixed left-0 top-0 h-screen w-64 bg-[#0F172A] text-slate-100 z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand header */}
          <div className="p-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#9E1B32] flex items-center justify-center text-white font-black text-sm tracking-wider shadow-md border border-red-400/30 shrink-0">
                LAB
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-base text-white tracking-tight leading-none truncate">
                  SIM LAB SEKOLAH
                </span>
                <span className="text-[11px] text-slate-400 truncate mt-1">
                  Inventaris & Fasilitas Lab
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white"
                aria-label="Tutup navigasi"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>

          {/* Quick status banner */}
          <div className="px-4 py-2">
            <div className="px-3 py-2 flex items-center justify-between rounded-xl bg-slate-800/80 mb-2 border border-slate-700/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-slate-300">5 Lab Terintegrasi</span>
              </div>
              <span className="text-[10px] font-bold tracking-wider text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                AKTIF
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 space-y-1 mt-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-[#9E1B32] text-white font-bold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span className="text-xs tracking-tight">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-extrabold ${
                        item.badgeType === 'priority'
                          ? 'bg-emerald-500 text-slate-900'
                          : item.badgeType === 'live'
                          ? 'bg-[#800E26] text-white'
                          : item.badgeType === 'admin'
                          ? 'bg-red-900 text-red-100 border border-red-700'
                          : item.badgeType === 'future'
                          ? 'bg-amber-400 text-slate-900'
                          : 'bg-[#FFFBEB] text-[#D97706]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile cards at bottom */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 space-y-2">
          {/* Teacher session */}
          {currentTeacher ? (
            <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {currentTeacher.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-900/80 px-1 rounded">
                      {currentTeacher.teacherCode}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white truncate max-w-[110px]">
                    {currentTeacher.name}
                  </div>
                </div>
              </div>
              <button
                onClick={logoutTeacher}
                title="Keluar Sesi Guru"
                className="p-1 rounded text-emerald-400 hover:text-white hover:bg-emerald-900/80"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenTeacherLogin}
              className="w-full flex items-center gap-2 p-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 text-left transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-emerald-400">key</span>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-white">Akses Guru (Kode Guru)</span>
                <span className="text-[10px] text-emerald-300/80">Masukkan kode guru saja</span>
              </div>
            </button>
          )}

          {/* Admin session */}
          {admin ? (
            <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#9E1B32] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  {admin.adminCode.substring(0, 3)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono font-bold text-red-300 bg-red-900/80 px-1 rounded">
                      {admin.adminCode}
                    </span>
                    <span className="text-[10px] text-slate-300">{admin.role}</span>
                  </div>
                  <div className="text-xs font-bold text-white truncate max-w-[110px]">
                    {admin.name}
                  </div>
                </div>
              </div>
              <button
                onClick={logoutAdmin}
                title="Keluar Sesi Admin"
                className="p-1 rounded text-red-400 hover:text-white hover:bg-red-900/80"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="w-full flex items-center gap-2 p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-left transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-red-400">shield</span>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-white">Login Admin Terotorisasi</span>
                <span className="text-[10px] text-slate-400">Untuk kelola guru & izin lab</span>
              </div>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
