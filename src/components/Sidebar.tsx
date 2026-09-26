import React from 'react';
import { AuthUser } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  user: AuthUser;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingCount,
  isOpenMobile = false,
  onCloseMobile,
  user,
  onLogout,
}) => {
  const allNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      badge: 'Live',
      badgeType: 'live',
    },
    {
      id: 'jurnal-laboratorium',
      label: 'Jurnal Laboratorium',
      icon: 'menu_book',
      badge: `${pendingCount} Pending`,
      badgeType: 'warning',
    },
    {
      id: 'review-jurnal',
      label: 'Review Jurnal',
      icon: 'assignment_turned_in',
    },
    {
      id: 'lab-qr-core',
      label: 'QR Laboratorium',
      icon: 'qr_code_scanner',
      adminOnly: true,
    },
    {
      id: 'inventaris-alat',
      label: 'Laboratorium',
      icon: 'science',
      adminOnly: true,
    },
    {
      id: 'audit-laporan',
      label: 'Audit & Laporan',
      icon: 'verified_user',
    },
  ] as Array<{ id: string; label: string; icon: string; badge?: string; badgeType?: string; adminOnly?: boolean }>;

  // QR & inventaris hanya untuk ADMIN (server-side juga menolak role lain).
  const navItems = allNavItems.filter((i) => !i.adminOnly || user.role === 'ADMIN');

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
          <div className="p-6 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <img
                alt="REJASA Logo"
                className="h-8 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida/AEtjO1WCeLzecpV83AZgHYUqqdEO5ksiJ0DyEzOvu4qp-HRmltyJ-K4aPmcz1HnS_FqaHQY7tapwSw9zGea61BSpyj9UGtN3gXr97a_cvkf095haTFbNHsvljFVUAYisd_JjGJ2c39JvOtv86wxRaoFhZqhfgWYCZcunDK8t4YtmcUdyIMVQLFUtZaF6TFr7TH27sclzbMB-HH440BF4kjYU27ZBGvk1qd6XPAwFQbrJ0htMb0BhH2a8Rb587_2Z"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-white tracking-tight leading-none truncate">
                  REJASA
                </span>
                <span className="text-xs text-slate-400 truncate mt-1">
                  Rapid Access Journal • Lab System
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

          {/* Node sync status banner */}
          <div className="px-4 py-2">
            <div className="px-3 py-1.5 flex items-center justify-between rounded-xl bg-slate-800/80 mb-2 border border-slate-700/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-medium text-slate-300">REJASA Lab System</span>
              </div>
              <span className="text-[11px] font-semibold tracking-wider text-[#89f5e7] bg-[#89f5e7]/10 px-1.5 py-0.5 rounded">
                ONLINE
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
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-[#008378] text-[#f4fffc] font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span className="text-sm tracking-tight">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        item.badgeType === 'live'
                          ? 'bg-[#00685f] text-white'
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

        {/* User profile card at bottom */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3 p-1">
            <div className="w-9 h-9 rounded-full bg-[#008378] ring-2 ring-[#008378] text-white flex items-center justify-center font-bold text-sm shrink-0">
              {user.name
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm text-white font-semibold truncate leading-tight">{user.name}</span>
              <span className="text-xs text-slate-400 truncate">
                {user.role === 'ADMIN' ? 'Administrator Laboratorium' : 'Laboran'}
              </span>
              <span className="text-[11px] text-[#89f5e7] truncate mt-0.5 font-medium">SMAN 3 Salatiga</span>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Keluar"
              aria-label="Keluar"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
