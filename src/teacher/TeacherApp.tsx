import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { clearLab, loadLab, saveLab } from '../lib/labContext';
import { formatDate } from '../lib/format';
import { StatusBadge } from '../components/StatusBadge';
import { JournalForm, JournalPrefill } from './JournalForm';
import { JournalDetail } from './JournalDetail';
import type { JournalEntry, Lab, ScheduleItem } from '../types';

type View =
  | { name: 'home' }
  | { name: 'form'; journal?: JournalEntry; prefill?: JournalPrefill }
  | { name: 'detail'; id: string; banner?: string };

export const TeacherApp: React.FC = () => {
  const { user, logout } = useAuth();
  const [lab, setLab] = useState<Lab | null>(() => loadLab());
  const [labs, setLabs] = useState<Lab[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loadingJ, setLoadingJ] = useState(true);
  const [loadingS, setLoadingS] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>({ name: 'home' });

  const loadJournals = useCallback(() => {
    setLoadingJ(true);
    api
      .get<{ journals: JournalEntry[] }>('/journals/me')
      .then((r) => setJournals(r.journals))
      .catch((e) => setError(e?.message || 'Gagal memuat jurnal.'))
      .finally(() => setLoadingJ(false));
  }, []);

  useEffect(loadJournals, [loadJournals]);

  // Tanpa konteks QR: sediakan daftar lab (identitas saja) sebagai cadangan.
  useEffect(() => {
    if (lab) return;
    api
      .get<{ labs: Lab[] }>('/labs')
      .then((r) => setLabs(r.labs))
      .catch(() => {});
  }, [lab]);

  useEffect(() => {
    if (!lab) {
      setSchedule([]);
      return;
    }
    setLoadingS(true);
    api
      .get<{ schedule: ScheduleItem[] }>(`/labs/${lab.id}/schedule`)
      .then((r) => setSchedule(r.schedule))
      .catch((e) => setError(e?.message || 'Gagal memuat jadwal.'))
      .finally(() => setLoadingS(false));
  }, [lab]);

  const chooseLab = (l: Lab) => {
    saveLab(l);
    setLab(l);
  };
  const changeLab = () => {
    clearLab();
    setLab(null);
  };

  if (!user) return null;

  let content: React.ReactNode;

  if (view.name === 'form' && lab) {
    content = (
      <JournalForm
        lab={lab}
        user={user}
        initial={view.journal}
        prefill={view.prefill}
        onCancel={() => setView(view.journal ? { name: 'detail', id: view.journal.id } : { name: 'home' })}
        onSaved={(j, submitted) => {
          loadJournals();
          setView({
            name: 'detail',
            id: j.id,
            banner: submitted ? `Jurnal ${j.code} berhasil dikirim (status ${j.status}).` : `Jurnal ${j.code} tersimpan sebagai draft.`,
          });
        }}
      />
    );
  } else if (view.name === 'detail') {
    content = (
      <JournalDetail
        key={view.id + (view.banner ?? '')}
        journalId={view.id}
        banner={view.banner}
        onBack={() => setView({ name: 'home' })}
        onEdit={(j) => setView({ name: 'form', journal: j })}
        onChanged={loadJournals}
      />
    );
  } else {
    content = (
      <div className="space-y-5">
        {/* Laboratorium */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-5">
          {lab ? (
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Laboratorium</div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-extrabold text-[#131b2e]">{lab.name}</h2>
                <p className="text-xs text-slate-500">{lab.school}</p>
              </div>
              <button onClick={changeLab} className="text-xs font-semibold text-[#00685f] hover:underline shrink-0">
                Ganti lab
              </button>
            </div>
          ) : (
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#131b2e]">Scan QR laboratorium</h2>
              <p className="text-xs text-slate-500 mt-1">
                Scan QR di pintu laboratorium untuk memulai, atau pilih laboratorium secara manual:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {labs.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => chooseLab(l)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-[#F8FAFC] hover:bg-slate-100 text-xs font-semibold text-[#131b2e]"
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {lab && (
          <>
            {/* Jadwal */}
            <section className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-5">
              <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#131b2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00685f] text-[20px]">calendar_month</span>
                Jadwal Penggunaan
              </h3>
              {loadingS && <p className="text-xs text-slate-400 mt-3">Memuat jadwal…</p>}
              {!loadingS && schedule.length === 0 && (
                <p className="text-xs text-slate-400 mt-3">Belum ada jadwal penggunaan dalam 7 hari ke depan.</p>
              )}
              <ul className="mt-3 divide-y divide-slate-100">
                {schedule.map((s) => (
                  <li key={`${s.scheduleId}-${s.date}`} className="py-3 flex items-start justify-between gap-3">
                    <div className="text-sm">
                      <div className="font-semibold text-[#131b2e] flex items-center gap-2 flex-wrap">
                        {s.isToday ? 'Hari ini' : s.dayName}, {formatDate(s.date)}
                        {s.isMine && (
                          <span className="px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#059669] text-[10px] font-bold">
                            JADWAL SAYA
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {s.startTime}–{s.endTime} • {s.className} • {s.activity}
                      </div>
                    </div>
                    {s.isToday && (
                      <button
                        onClick={() =>
                          setView({
                            name: 'form',
                            prefill: {
                              date: s.date,
                              startTime: s.startTime,
                              endTime: s.endTime,
                              className: s.className,
                              subject: s.subject,
                              topic: s.activity,
                            },
                          })
                        }
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-[#00685f] hover:bg-[#008378] text-white text-xs font-semibold"
                      >
                        Isi Jurnal
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setView({ name: 'form' })}
                className="mt-4 w-full h-11 rounded-xl bg-[#00685f] hover:bg-[#008378] text-white text-sm font-bold flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[20px]">edit_note</span>
                Isi Jurnal Baru
              </button>
            </section>
          </>
        )}

        {/* Jurnal saya */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-5">
          <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#131b2e] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00685f] text-[20px]">history_edu</span>
            Jurnal Saya
          </h3>
          {loadingJ && <p className="text-xs text-slate-400 mt-3">Memuat jurnal…</p>}
          {!loadingJ && journals.length === 0 && (
            <p className="text-xs text-slate-400 mt-3">Belum ada jurnal. Jurnal yang Anda kirim akan muncul di sini.</p>
          )}
          <ul className="mt-3 divide-y divide-slate-100">
            {journals.map((j) => (
              <li key={j.id}>
                <button
                  onClick={() => setView({ name: 'detail', id: j.id })}
                  className="w-full text-left py-3 flex items-start justify-between gap-3 hover:bg-slate-50/70 rounded-lg px-1 -mx-1"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-bold text-[#00685f]">{j.code}</div>
                    <div className="text-sm font-semibold text-[#131b2e] truncate">{j.topic}</div>
                    <div className="text-xs text-slate-500">
                      {j.labCode} • {j.className} • {j.date ? formatDate(j.date) : ''}
                    </div>
                  </div>
                  <StatusBadge status={j.status} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#131b2e]">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-[#00685f] tracking-tight">REJASA</span>
            <span className="text-xs text-slate-400 hidden sm:inline">Portal Guru</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-xs font-semibold">{user.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{user.code}</div>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Keluar
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-5">
        {error && view.name === 'home' && (
          <div role="alert" className="mb-4 p-3 rounded-xl bg-[#FFF1F2] border border-rose-200 text-xs text-[#E11D48] flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold">×</button>
          </div>
        )}
        {content}
      </main>
    </div>
  );
};
