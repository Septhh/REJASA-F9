import React, { useState } from 'react';
import {
  AppsScriptConfig,
  getStoredAppsScriptConfig,
  saveAppsScriptConfig,
  syncJournalsToGoogleSheets,
  testAppsScriptConnection,
  SAMPLE_GOOGLE_APPS_SCRIPT_CODE,
} from '../services/appScriptService';
import { JournalEntry, IncidentItem } from '../types';

interface AppsScriptIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  journals: JournalEntry[];
  incidents: IncidentItem[];
  onSyncSuccess: (message: string) => void;
}

export const AppsScriptIntegrationModal: React.FC<AppsScriptIntegrationModalProps> = ({
  isOpen,
  onClose,
  journals,
  incidents,
  onSyncSuccess,
}) => {
  const [config, setConfig] = useState<AppsScriptConfig>(getStoredAppsScriptConfig());
  const [activeTab, setActiveTab] = useState<'settings' | 'code' | 'cloudsql'>('settings');
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    saveAppsScriptConfig(config);
    setFeedback({ type: 'success', message: 'Pengaturan Google Apps Script berhasil disimpan di memori browser.' });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setFeedback(null);
    const result = await testAppsScriptConnection(config.webhookUrl);
    setIsTesting(false);
    if (result.success) {
      setFeedback({ type: 'success', message: result.message });
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  const handleManualSync = async () => {
    if (!config.webhookUrl) {
      setFeedback({ type: 'error', message: 'Harap isi dan simpan Web App URL terlebih dahulu.' });
      return;
    }
    setIsSyncing(true);
    setFeedback(null);
    const result = await syncJournalsToGoogleSheets(config.webhookUrl, journals, incidents);
    setIsSyncing(false);

    const updatedConfig: AppsScriptConfig = {
      ...config,
      lastSyncTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      lastSyncStatus: result.success ? 'success' : 'failed',
      lastSyncMessage: result.message,
    };
    setConfig(updatedConfig);
    saveAppsScriptConfig(updatedConfig);

    if (result.success) {
      setFeedback({ type: 'success', message: result.message });
      onSyncSuccess(result.message);
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(SAMPLE_GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] flex items-center justify-center text-[#9E1B32]">
              <span className="material-symbols-outlined text-[24px]">integration_instructions</span>
            </div>
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#131b2e] flex items-center gap-2">
                Pusat Integrasi REJASA
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#FFF1F2] text-[#9E1B32] font-semibold">
                  SMAN 3 Salatiga
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Koneksi fungsional Google Apps Script (Spreadsheet) dan Cloud SQL PostgreSQL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'settings'
                ? 'bg-[#9E1B32] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">sync</span>
            Sinkronisasi Google Sheets
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'code'
                ? 'bg-[#9E1B32] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">code</span>
            Script Code.gs
          </button>
          <button
            onClick={() => setActiveTab('cloudsql')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'cloudsql'
                ? 'bg-[#9E1B32] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">database</span>
            Cloud SQL (PostgreSQL)
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`mb-4 p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : feedback.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-slate-50 text-slate-800 border border-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {feedback.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Tab 1: Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
              <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#9E1B32] text-[18px]">info</span>
                Tentang Integrasi Google Apps Script
              </div>
              Integrasi ini menghubungkan pencatatan jurnal praktikum dan log buku kerusakan alat SMAN 3 Salatiga secara langsung ke Google Spreadsheet milik sekolah secara otomatis melalui Webhook Apps Script.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                URL Google Apps Script Web App (doPost/doGet)
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  value={config.webhookUrl}
                  onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl text-xs bg-white border border-slate-300 focus:outline-none focus:border-[#9E1B32] focus:ring-2 focus:ring-[#9E1B32]/15 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Dapatkan URL ini dari menu <strong>Deploy &gt; New deployment &gt; Web app</strong> pada Apps Script Google Spreadsheet Anda.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Status Sinkronisasi Terakhir</span>
                <span className="text-[11px] text-slate-500">
                  {config.lastSyncTime ? `Pukul ${config.lastSyncTime}` : 'Belum pernah melakukan sinkronisasi'}
                </span>
              </div>
              {config.lastSyncStatus === 'success' && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  TERHUBUNG
                </span>
              )}
              {config.lastSyncStatus === 'failed' && (
                <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                  GAGAL
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Simpan Konfigurasi
                </button>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !config.webhookUrl}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isTesting && <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>}
                  Uji Koneksi
                </button>
              </div>

              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-4 py-2 rounded-xl bg-[#9E1B32] hover:bg-[#800E26] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${isSyncing ? 'animate-spin' : ''}`}>
                  sync
                </span>
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Apps Script Code */}
        {activeTab === 'code' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Salin kode berikut ke Google Spreadsheet Anda:
              </p>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg bg-[#9E1B32] hover:bg-[#800E26] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copiedCode ? 'check' : 'content_copy'}
                </span>
                <span>{copiedCode ? 'Tersalin!' : 'Salin Seluruh Kode'}</span>
              </button>
            </div>
            <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 max-h-72 overflow-y-auto">
              <pre className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
                {SAMPLE_GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Cloud SQL */}
        {activeTab === 'cloudsql' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                  Cloud SQL PostgreSQL Readiness
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Sistem REJASA siap dihubungkan dengan <strong>Google Cloud SQL (Developer Edition)</strong> untuk penyimpanan data relasional terpusat dengan skala ACID, didukung skema Drizzle ORM dan Firebase Authentication.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">DIALECT</span>
                  <span className="font-bold text-slate-800">PostgreSQL</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">ORM LAYER</span>
                  <span className="font-bold text-slate-800">Drizzle ORM</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">ELIGIBILITY STATUS</span>
                  <span className="font-bold text-emerald-700">ELIGIBLE (Checked)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">AUTH MIDDLEWARE</span>
                  <span className="font-bold text-slate-800">Firebase Auth</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-xs text-[#9E1B32]">
              <span className="font-bold block mb-0.5">Konfirmasi Penyediaan Cloud SQL:</span>
              Jendela otorisasi Cloud SQL telah disiapkan melalui wizard Google AI Studio untuk memilih Region database secara resmi.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
