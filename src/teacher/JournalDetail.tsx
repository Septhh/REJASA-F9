import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatDate, formatDateTime } from '../lib/format';
import { StatusBadge } from '../components/StatusBadge';
import { ReviewHistory } from '../components/ReviewHistory';
import type { JournalEntry } from '../types';

interface Props {
  journalId: string;
  banner?: string;
  onBack: () => void;
  onEdit: (journal: JournalEntry) => void;
  onChanged: () => void;
}

export const JournalDetail: React.FC<Props> = ({ journalId, banner, onBack, onEdit, onChanged }) => {
  const [journal, setJournal] = useState<JournalEntry | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(banner || '');

  useEffect(() => {
    let alive = true;
    api
      .get<{ journal: JournalEntry }>(`/journals/${journalId}`)
      .then((r) => alive && setJournal(r.journal))
      .catch((e) => alive && setError(e?.message || 'Gagal memuat jurnal.'));
    return () => {
      alive = false;
    };
  }, [journalId]);

  const resubmit = async () => {
    if (!journal) return;
    setBusy(true);
    setError('');
    try {
      const r = await api.post<{ journal: JournalEntry }>(`/journals/${journal.id}/resubmit`);
      setJournal(r.journal);
      setMsg(`Jurnal ${r.journal.code} berhasil dikirim.`);
      onChanged();
    } catch (e: any) {
      setError(e?.message || 'Gagal mengirim jurnal.');
    } finally {
      setBusy(false);
    }
  };

  const lastCorrection = journal?.reviews
    ?.slice()
    .reverse()
    .find((r) => r.status === 'NEEDS_CORRECTION');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-5 sm:p-6">
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
        <button onClick={onBack} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700" aria-label="Kembali">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#131b2e]">Detail Jurnal</h2>
      </div>

      {error && (
        <div role="alert" className="mb-4 p-2.5 rounded-xl bg-[#FFF1F2] border border-rose-200 text-xs text-[#E11D48]">
          {error}
        </div>
      )}
      {!journal && !error && <p className="text-sm text-slate-500">Memuat jurnal…</p>}

      {journal && (
        <>
          {msg && (
            <div className="mb-4 p-4 rounded-xl bg-[#ECFDF5] border border-emerald-200 text-sm text-[#065f46] flex items-start gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#059669]">check_circle</span>
              <div>
                <div className="font-semibold">{msg}</div>
                <div className="text-xs mt-0.5">
                  Nomor jurnal: <span className="font-mono font-bold">{journal.code}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <span className="font-mono text-base font-bold text-[#00685f]">{journal.code}</span>
            <StatusBadge status={journal.status} />
          </div>

          {journal.status === 'NEEDS_CORRECTION' && lastCorrection && (
            <div className="mb-4 p-3 rounded-xl bg-[#FFF1F2] border border-rose-200 text-xs text-[#9f1239]">
              <div className="font-bold mb-0.5">Catatan koreksi dari {lastCorrection.reviewerName}</div>
              <p className="whitespace-pre-wrap break-words">{lastCorrection.notes}</p>
            </div>
          )}

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Field k="Laboratorium" v={`${journal.labName} (${journal.labCode})`} />
            <Field k="Guru" v={journal.teacherName} />
            <Field k="Tanggal" v={journal.date ? formatDate(journal.date) : '-'} />
            <Field k="Jam" v={`${journal.startTime}–${journal.endTime}`} />
            <Field k="Kelas" v={journal.className} />
            <Field k="Mata Pelajaran" v={journal.subject || '-'} />
            <Field k="Jumlah Siswa" v={`${journal.studentsCount} orang`} />
            <Field k="Sesuai SOP" v={journal.sopComplied ? 'Ya' : 'Tidak'} />
            <div className="sm:col-span-2"><Field k="Kegiatan" v={journal.topic} /></div>
            <div className="sm:col-span-2"><Field k="Catatan" v={journal.notes || '-'} /></div>
            {journal.submittedAt && <Field k="Terakhir dikirim" v={formatDateTime(journal.submittedAt)} />}
          </dl>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Riwayat Review</h3>
            <ReviewHistory reviews={journal.reviews ?? []} />
          </div>

          {(journal.status === 'NEEDS_CORRECTION' || journal.status === 'DRAFT') && (
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                onClick={() => onEdit(journal)}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 text-[#131b2e] text-sm font-semibold border border-slate-200 flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                {journal.status === 'DRAFT' ? 'Edit Draft' : 'Perbaiki Jurnal'}
              </button>
              {journal.status === 'DRAFT' && (
                <button
                  onClick={resubmit}
                  disabled={busy}
                  className="px-5 py-2.5 rounded-xl bg-[#00685f] hover:bg-[#008378] disabled:opacity-50 text-white text-sm font-bold"
                >
                  Kirim Jurnal
                </button>
              )}
              {journal.status === 'NEEDS_CORRECTION' && (
                <button
                  onClick={resubmit}
                  disabled={busy}
                  className="px-5 py-2.5 rounded-xl bg-[#00685f] hover:bg-[#008378] disabled:opacity-50 text-white text-sm font-bold"
                >
                  Kirim Ulang Tanpa Perubahan
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const Field: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div>
    <dt className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{k}</dt>
    <dd className="text-[#131b2e] font-medium whitespace-pre-wrap break-words">{v}</dd>
  </div>
);
