import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { RoomStatusGrid } from './components/RoomStatusGrid';
import { JournalTable } from './components/JournalTable';
import { LabHoursChart } from './components/LabHoursChart';
import { IncidentHub } from './components/IncidentHub';
import { IncidentModal } from './components/IncidentModal';
import { CreateQRModal } from './components/CreateQRModal';
import { ReviewJournalModal } from './components/ReviewJournalModal';
import { PrintReportModal } from './components/PrintReportModal';
import { AppsScriptIntegrationModal } from './components/AppsScriptIntegrationModal';

import {
  INITIAL_ROOMS,
  INITIAL_JOURNALS,
  INITIAL_INCIDENTS,
  LAB_MONTHLY_STATS,
  WEEKLY_HOURS_ALLOCATION,
} from './data/labData';

import { LabRoom, JournalEntry, IncidentItem, JournalStatus, LabCode } from './types';
import { useAdminAuth } from './context/AdminAuthContext.tsx';
import { AdminLoginModal } from './components/AdminLoginModal.tsx';
import { AdminManagementModal } from './components/AdminManagementModal.tsx';

import { LabInventoryView } from './components/LabInventoryView';
import { DamagedEquipmentRoadmapView } from './components/DamagedEquipmentRoadmapView';
import { TeacherLoginModal } from './components/TeacherLoginModal';
import { TeacherManagementModal } from './components/TeacherManagementModal';
import { TeacherJournalModal } from './components/TeacherJournalModal';

export default function App() {
  // Navigation & View state - Default to 'inventaris' as requested by user
  const [activeTab, setActiveTab] = useState<string>('inventaris');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'yesterday' | 'week'>('today');

  // Realtime ticking clock
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      // Format as "Jumat, 11 Sep 2026, 03.37.56 WIB"
      const formatted = now.toLocaleDateString('id-ID', options).replace(/\./g, ':');
      setCurrentTime(`${formatted} WIB`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Main data collections
  const [rooms, setRooms] = useState<LabRoom[]>(INITIAL_ROOMS);
  const [journals, setJournals] = useState<JournalEntry[]>(INITIAL_JOURNALS);
  const [incidents, setIncidents] = useState<IncidentItem[]>(INITIAL_INCIDENTS);
  const [weeklyAllocation] = useState(WEEKLY_HOURS_ALLOCATION);
  const [usageStats] = useState(LAB_MONTHLY_STATS);
  const { admin } = useAdminAuth();

  // Admin Auth modals
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminManagementOpen, setIsAdminManagementOpen] = useState(false);

  // Load from Cloud SQL backend
  const loadDatabaseData = async () => {
    try {
      const [roomsRes, journalsRes, incidentsRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/journals'),
        fetch('/api/incidents'),
      ]);

      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        if (roomsData && roomsData.length > 0) {
          setRooms(
            roomsData.map((r: any) => ({
              id: String(r.id),
              code: r.code,
              name: r.name,
              badgeCode: r.badgeCode,
              badgeBg: r.badgeBg,
              badgeColor: r.badgeColor,
              status: r.status,
              statusType: r.statusType,
              className: r.className || undefined,
              topic: r.topic || undefined,
              teacher: r.teacher || undefined,
              statusDetail: r.statusDetail,
              statusDetailType: r.statusDetailType,
              workstations: r.workstations,
            }))
          );
        }
      }

      if (journalsRes.ok) {
        const journalsData = await journalsRes.json();
        if (journalsData && journalsData.length > 0) {
          setJournals(
            journalsData.map((j: any) => ({
              id: String(j.id),
              code: j.code,
              session: j.session,
              time: j.time,
              labCode: j.labCode,
              labName: j.labName,
              teacherName: j.teacherName,
              teacherInitials: j.teacherInitials,
              teacherAvatarColor: j.teacherAvatarColor,
              className: j.className,
              topic: j.topic,
              status: j.status,
              notes: j.notes,
              studentsCount: j.studentsCount,
              sopComplied: j.sopComplied,
              incidentReported: j.incidentReported,
            }))
          );
        }
      }

      if (incidentsRes.ok) {
        const incidentsData = await incidentsRes.json();
        if (incidentsData && incidentsData.length > 0) {
          setIncidents(
            incidentsData.map((inc: any) => ({
              id: String(inc.id),
              assetCode: inc.assetCode,
              time: inc.time,
              title: inc.title,
              description: inc.description,
              reporter: inc.reporter,
              className: inc.className,
              labCode: inc.labCode,
              photoUrl: inc.photoUrl,
              photoAlt: inc.photoAlt,
              status: inc.status,
              actionType: inc.actionType,
              actionLabel: inc.actionLabel,
            }))
          );
        }
      }
    } catch (err) {
      console.warn('Backend fetch note, using client cache:', err);
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, []);

  // Modals state
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);

  const [isCreateQROpen, setIsCreateQROpen] = useState(false);

  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isIntegrationOpen, setIsIntegrationOpen] = useState(false);

  // Teacher Auth & Journal Modals
  const [isTeacherLoginOpen, setIsTeacherLoginOpen] = useState(false);
  const [isTeacherManagementOpen, setIsTeacherManagementOpen] = useState(false);
  const [isTeacherJournalOpen, setIsTeacherJournalOpen] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // KPI Calculations
  const totalJournalsToday = journals.length;
  const pendingReviewCount = journals.filter(
    (j) => j.status === 'SUBMITTED'
  ).length;
  const activeIncidentsCount = incidents.filter((i) => i.status === 'Open').length;
  const occupiedLabsCount = rooms.filter(
    (r) => r.status === 'Insiden' || r.status === 'Berjalan' || r.status === 'Praktikum'
  ).length;

  // Handlers
  const handleOpenIncidentModal = (incident: IncidentItem) => {
    setSelectedIncident(incident);
    setIsIncidentModalOpen(true);
  };

  const handleOpenIncidentForRoom = (roomCode: string) => {
    const match = incidents.find((i) => i.labCode === roomCode.slice(0, 3) && i.status === 'Open');
    if (match) {
      handleOpenIncidentModal(match);
    } else {
      showToast(`Tidak ada tiket insiden tertunda untuk bilik ${roomCode}.`);
    }
  };

  const handleSubmitDisposition = (
    incidentId: string,
    data: { action: string; urgency: string; notes: string }
  ) => {
    setIncidents((prev) =>
      prev.map((item) =>
        item.id === incidentId
          ? {
              ...item,
              status: 'Disposed',
              actionLabel: 'Tiket Diproses',
            }
          : item
      )
    );
    // Persist to Cloud SQL backend
    const numId = parseInt(incidentId, 10);
    if (!isNaN(numId)) {
      fetch(`/api/incidents/${numId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(admin ? { 'x-admin-code': admin.adminCode } : {}),
        },
        body: JSON.stringify({ status: 'Disposed' }),
      }).catch((e) => console.warn('Incident sync notice:', e));
    }
    showToast(`Tiket penanganan berhasil diterbitkan untuk insiden ${selectedIncident?.assetCode}!`);
  };

  const handleOpenReview = (journal: JournalEntry) => {
    setSelectedJournal(journal);
    setIsReviewModalOpen(true);
  };

  const handleUpdateJournalStatus = (
    journalId: string,
    newStatus: JournalStatus,
    reviewNotes: string
  ) => {
    setJournals((prev) =>
      prev.map((j) =>
        j.id === journalId
          ? {
              ...j,
              status: newStatus,
              notes: reviewNotes || j.notes,
            }
          : j
      )
    );
    // Persist to Cloud SQL backend
    const numId = parseInt(journalId, 10);
    if (!isNaN(numId)) {
      // Save status and audit review log in Cloud SQL
      fetch(`/api/journals/${numId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(admin ? { 'x-admin-code': admin.adminCode } : {}),
        },
        body: JSON.stringify({ status: newStatus, notes: reviewNotes }),
      }).catch((e) => console.warn('Journal status sync notice:', e));

      fetch(`/api/journals/${numId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(admin ? { 'x-admin-code': admin.adminCode } : {}),
        },
        body: JSON.stringify({
          status: newStatus,
          notes: reviewNotes,
          reviewerName: admin?.name || 'Laboran SMAN 3 Salatiga',
        }),
      }).catch((e) => console.warn('Journal review log sync notice:', e));
    }

    if (newStatus === 'REVIEWED') {
      showToast(`Jurnal ${selectedJournal?.code} telah diverifikasi & disetujui.`);
    } else {
      showToast(`Jurnal ${selectedJournal?.code} dikembalikan untuk perbaikan guru.`);
    }
  };

  const handleOpenQRForLab = () => {
    setIsCreateQROpen(true);
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDatabaseData();
    setIsRefreshing(false);
    showToast('Data REJASA Cloud SQL berhasil disinkronkan.');
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-[#131b2e] flex flex-col antialiased selection:bg-[#9E1B32]/20 selection:text-[#9E1B32]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F172A] text-white text-xs sm:text-sm px-4 py-3 rounded-[2px] shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <span className="material-symbols-outlined text-[#FDA4AF] text-[20px]">
            check_circle
          </span>
          <span className="font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingReviewCount}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onOpenTeacherLogin={() => setIsTeacherLoginOpen(true)}
        onOpenTeacherManagement={() => setIsTeacherManagementOpen(true)}
      />

      {/* Main Layout Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Fixed Top Header */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenCreateQR={() => setIsCreateQROpen(true)}
          onOpenPrintReport={() => setIsPrintModalOpen(true)}
          onOpenIntegration={() => setIsIntegrationOpen(true)}
          onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
          onOpenAdminManagement={() => setIsAdminManagementOpen(true)}
          onOpenTeacherJournalForm={() => setIsTeacherJournalOpen(true)}
          onOpenTeacherLogin={() => setIsTeacherLoginOpen(true)}
          onOpenTeacherManagement={() => setIsTeacherManagementOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          unreadAlertCount={activeIncidentsCount + 1}
        />

        {/* Main Content Area */}
        <main className="relative pt-20 px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full max-w-[1600px] mx-auto">
          {/* Dynamic Atmospheric Background Glow */}
          <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-[#9E1B32]/10 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-32 w-[32rem] h-[32rem] rounded-full bg-[#800E26]/5 blur-3xl pointer-events-none" />

          {/* Tab Content switch */}
          {activeTab === 'inventaris' ? (
            <div className="relative z-10">
              <LabInventoryView
                onOpenTeacherLogin={() => setIsTeacherLoginOpen(true)}
                onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
                onOpenTeacherManagement={() => setIsTeacherManagementOpen(true)}
              />
            </div>
          ) : activeTab === 'roadmap-alat' ? (
            <div className="relative z-10">
              <DamagedEquipmentRoadmapView onGoToInventory={() => setActiveTab('inventaris')} />
            </div>
          ) : activeTab === 'dashboard' ? (
            <div className="relative z-10">
              {/* 1. HEADER RINGKASAN OPERASIONAL REAL-TIME */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs uppercase tracking-widest text-[#9E1B32] font-bold">
                      REJASA • RAPID ACCESS JOURNAL
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[2px] bg-[#ECFDF5] text-[#059669] text-xs font-semibold border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-[#059669] animate-ping"></span>
                      NODE SYNC ACTIVE
                    </span>
                  </div>
                  <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">
                    Dashboard Laboratorium
                  </h1>
                  <p className="text-xs sm:text-sm text-[#3d4947] flex items-center gap-1.5 mt-1">
                    <span className="material-symbols-outlined text-[16px] text-[#9E1B32]">
                      verified
                    </span>
                    Sistem jurnal laboratorium digital untuk pencatatan cepat, review, dan pelacakan penggunaan laboratorium SMAN 3 Salatiga.
                  </p>
                </div>

                {/* Quick Action Controls & Clock */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {/* Realtime clock display */}
                  <div className="bg-white px-3.5 py-1.5 rounded-[2px] shadow-xs border border-slate-300 flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        Waktu Sistem REJASA
                      </span>
                      <span
                        id="realtime-clock"
                        className="font-mono text-xs sm:text-sm text-[#131b2e] font-bold"
                      >
                        {currentTime || 'Memuat waktu...'}
                      </span>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#9E1B32]"></div>
                  </div>

                  {/* Time Range Filter pills */}
                  <div className="flex items-center bg-white rounded-[2px] p-1 shadow-xs border border-slate-300">
                    <button
                      onClick={() => setSelectedTimeRange('today')}
                      className={`px-3 py-1.5 rounded-[2px] text-xs font-bold transition-colors ${
                        selectedTimeRange === 'today'
                          ? 'bg-[#FFF1F2] text-[#9E1B32] border border-[#FECDD3]'
                          : 'text-slate-600 hover:text-[#131b2e]'
                      }`}
                    >
                      Hari Ini
                    </button>
                    <button
                      onClick={() => setSelectedTimeRange('yesterday')}
                      className={`px-3 py-1.5 rounded-[2px] text-xs font-medium transition-colors ${
                        selectedTimeRange === 'yesterday'
                          ? 'bg-[#FFF1F2] text-[#9E1B32] font-bold border border-[#FECDD3]'
                          : 'text-slate-600 hover:text-[#131b2e]'
                      }`}
                    >
                      Kemarin
                    </button>
                    <button
                      onClick={() => setSelectedTimeRange('week')}
                      className={`px-3 py-1.5 rounded-[2px] text-xs font-medium transition-colors ${
                        selectedTimeRange === 'week'
                          ? 'bg-[#FFF1F2] text-[#9E1B32] font-bold border border-[#FECDD3]'
                          : 'text-slate-600 hover:text-[#131b2e]'
                      }`}
                    >
                      Pekan Ini
                    </button>
                  </div>

                  {/* Refresh Data button */}
                  <button
                    onClick={handleRefresh}
                    className="h-9 sm:h-10 px-3.5 rounded-[2px] bg-white hover:bg-slate-50 text-[#131b2e] text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs border border-slate-300 transition-all active:scale-95"
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] text-[#9E1B32] ${
                        isRefreshing ? 'animate-spin' : ''
                      }`}
                    >
                      sync
                    </span>
                    <span className="hidden sm:inline">Refresh Data</span>
                  </button>
                </div>
              </div>

              {/* 2. EMPAT KARTU METRIK KPI UTAMA */}
              <MetricCards
                totalJournalsToday={totalJournalsToday}
                pendingReviewCount={pendingReviewCount}
                activeIncidentsCount={activeIncidentsCount}
                occupiedLabsCount={occupiedLabsCount}
                totalLabsCount={rooms.length}
                onFilterPending={() => {
                  setActiveTab('jurnal-laboratorium');
                }}
                onFilterIncidents={() => {
                  const firstOpen = incidents.find((i) => i.status === 'Open');
                  if (firstOpen) handleOpenIncidentModal(firstOpen);
                }}
              />

              {/* 3. STATUS REAL-TIME 5 BILIK LABORATORIUM */}
              <RoomStatusGrid
                rooms={rooms}
                onSelectRoom={(room) => {
                  showToast(`Melihat status terkini ${room.name} (${room.code})`);
                }}
                onOpenIncidentForRoom={handleOpenIncidentForRoom}
              />

              {/* 4. DUA KOLOM DATA UTAMA (BENTO SPLIT: DATA TABEL & INCIDENT HUB) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* KOLOM KIRI: TABEL JURNAL PRAKTIKUM & CHART (8 COLS) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* Table Component */}
                  <JournalTable
                    journals={journals}
                    searchQuery={searchQuery}
                    onReviewJournal={handleOpenReview}
                    onViewAllJournals={() => setActiveTab('jurnal-laboratorium')}
                  />

                  {/* Inline Bar Chart: Sebaran Alokasi Jam REJASA */}
                  <LabHoursChart allocations={weeklyAllocation} />
                </div>

                {/* KOLOM KANAN: ACTION NEEDED & INCIDENT HUB (4 COLS) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <IncidentHub
                    incidents={incidents}
                    usageStats={usageStats}
                    onOpenDispositionModal={handleOpenIncidentModal}
                    onViewAllIncidents={() => setActiveTab('audit-laporan')}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Subview Pages for Secondary Nav Items */
            <div className="bg-white rounded-[2px] p-6 sm:p-8 shadow-xs border border-slate-300">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="p-2 rounded-[2px] bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-300"
                    title="Kembali ke Dashboard"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  </button>
                  <div>
                    <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#131b2e]">
                      {activeTab === 'jurnal-laboratorium' && 'Jurnal Laboratorium'}
                      {activeTab === 'review-jurnal' && 'Review Jurnal'}
                      {activeTab === 'lab-qr-core' && 'Akses QR Laboratorium'}
                      {activeTab === 'inventaris-alat' && 'Manajemen Laboratorium'}
                      {activeTab === 'audit-laporan' && 'Audit & Laporan'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      REJASA — Rapid Access Journal SMAN 3 Salatiga
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 rounded-[2px] bg-[#9E1B32] text-white text-xs font-semibold hover:bg-[#800E26] transition-colors shadow-xs border border-[#800E26]"
                >
                  Kembali ke Ringkasan Utama
                </button>
              </div>

              {/* View details */}
              {activeTab === 'jurnal-laboratorium' && (
                <JournalTable
                  journals={journals}
                  searchQuery={searchQuery}
                  onReviewJournal={handleOpenReview}
                  onViewAllJournals={() => {}}
                />
              )}

              {activeTab === 'review-jurnal' && (
                <div>
                  <div className="mb-4 p-4 rounded-[2px] bg-[#FFFBEB] border border-amber-300 text-xs text-amber-800">
                    Berikut adalah jurnal yang membutuhkan review laboran.
                  </div>
                  <JournalTable
                    journals={journals.filter((j) => j.status === 'SUBMITTED')}
                    searchQuery={searchQuery}
                    onReviewJournal={handleOpenReview}
                    onViewAllJournals={() => {}}
                  />
                </div>
              )}

              {activeTab === 'lab-qr-core' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-[2px] border border-slate-300">
                    <div>
                      <h3 className="font-bold text-sm">Generator Token QR Presensi Guru</h3>
                      <p className="text-xs text-slate-500">
                        Cetak token fisik bilik untuk ditempel di pintu masing-masing jurnal.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsCreateQROpen(true)}
                      className="px-4 py-2 bg-[#9E1B32] hover:bg-[#800E26] text-white rounded-[2px] text-xs font-bold border border-[#800E26] shadow-xs"
                    >
                      + Buat Sesi QR Baru
                    </button>
                  </div>
                  <RoomStatusGrid
                    rooms={rooms}
                    onSelectRoom={(r) => showToast(`Konfigurasi bilik ${r.name}`)}
                  />
                </div>
              )}

              {activeTab === 'inventaris-alat' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs text-slate-500">Total Alat &amp; Mikroskop</div>
                      <div className="text-2xl font-bold text-[#131b2e] mt-1">142 Unit</div>
                      <div className="text-xs text-[#059669] mt-1">140 Kondisi Baik</div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FFF1F2] border border-rose-200">
                      <div className="text-xs text-[#E11D48]">Alat Rusak / Insiden</div>
                      <div className="text-2xl font-bold text-[#E11D48] mt-1">2 Unit</div>
                      <div className="text-xs text-slate-500 mt-1">BIO-MIC-03 &amp; KIM-GLS-118</div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FFFBEB] border border-amber-200">
                      <div className="text-xs text-[#D97706]">Reagen Kritis (&lt;20%)</div>
                      <div className="text-2xl font-bold text-[#D97706] mt-1">3 Botol</div>
                      <div className="text-xs text-slate-500 mt-1">HCl 0.1M, Fenolftalein, NaOH</div>
                    </div>
                  </div>
                  <IncidentHub
                    incidents={incidents}
                    usageStats={usageStats}
                    onOpenDispositionModal={handleOpenIncidentModal}
                    onViewAllIncidents={() => {}}
                  />
                </div>
              )}

              {activeTab === 'audit-laporan' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="font-bold text-sm">Buku Register Kerusakan Alat (Bab 43)</h3>
                      <p className="text-xs text-slate-500">
                        Catatan kronologis insiden jurnal dan tindakan perbaikan.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsPrintModalOpen(true)}
                      className="px-4 py-2 bg-[#00685f] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">print</span>
                      Cetak Rekap Audit
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-200 rounded-xl">
                      <thead className="bg-slate-100 font-bold text-slate-700">
                        <tr>
                          <th className="p-3">Kode Alat</th>
                          <th className="p-3">Waktu Insiden</th>
                          <th className="p-3">Kerusakan</th>
                          <th className="p-3">Pelapor</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {incidents.map((inc) => (
                          <tr key={inc.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-[#E11D48]">{inc.assetCode}</td>
                            <td className="p-3">{inc.time}</td>
                            <td className="p-3">
                              <span className="font-semibold block">{inc.title}</span>
                              <span className="text-slate-500">{inc.description}</span>
                            </td>
                            <td className="p-3">{inc.reporter} ({inc.className})</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                                {inc.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: Tiket Disposisi Masalah Alat */}
      <IncidentModal
        isOpen={isIncidentModalOpen}
        incident={selectedIncident}
        onClose={() => {
          setIsIncidentModalOpen(false);
          setSelectedIncident(null);
        }}
        onSubmitDisposition={handleSubmitDisposition}
      />

      {/* MODAL 2: QR Pintu Laboratorium & Jadwal */}
      <CreateQRModal
        isOpen={isCreateQROpen}
        onClose={() => setIsCreateQROpen(false)}
        onProceedToJournal={(_code) => {
          setIsCreateQROpen(false);
          setIsTeacherJournalOpen(true);
        }}
      />

      {/* MODAL 3: Review & Verifikasi Jurnal */}
      <ReviewJournalModal
        isOpen={isReviewModalOpen}
        journal={selectedJournal}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedJournal(null);
        }}
        onUpdateStatus={handleUpdateJournalStatus}
      />

      {/* MODAL 4: Cetak Laporan */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        journals={journals}
        incidents={incidents}
        rooms={rooms}
      />

      {/* MODAL 5: Integrasi Cloud SQL & Google Apps Script */}
      <AppsScriptIntegrationModal
        isOpen={isIntegrationOpen}
        onClose={() => setIsIntegrationOpen(false)}
        journals={journals}
        incidents={incidents}
        onSyncSuccess={(msg) => showToast(msg)}
      />

      {/* MODAL 6: Otorisasi Kode Admin */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => {
          showToast(`Otorisasi berhasil! Selamat bertugas di sistem REJASA.`);
        }}
      />

      {/* MODAL 7: Kustomisasi Kode Admin & Hash Password */}
      <AdminManagementModal
        isOpen={isAdminManagementOpen}
        onClose={() => setIsAdminManagementOpen(false)}
        onToast={(msg) => showToast(msg)}
      />

      {/* MODAL 8: Login Kode Guru */}
      <TeacherLoginModal
        isOpen={isTeacherLoginOpen}
        onClose={() => setIsTeacherLoginOpen(false)}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
      />

      {/* MODAL 9: Kelola Guru Terotorisasi Admin */}
      <TeacherManagementModal
        isOpen={isTeacherManagementOpen || activeTab === 'kelola-guru'}
        onClose={() => {
          setIsTeacherManagementOpen(false);
          if (activeTab === 'kelola-guru') setActiveTab('inventaris');
        }}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
      />

      {/* MODAL 10: Formulir Jurnal Guru Terpadu */}
      <TeacherJournalModal
        isOpen={isTeacherJournalOpen}
        onClose={() => setIsTeacherJournalOpen(false)}
        onSuccess={(msg) => showToast(msg)}
        onOpenTeacherLogin={() => setIsTeacherLoginOpen(true)}
      />
    </div>
  );
}
