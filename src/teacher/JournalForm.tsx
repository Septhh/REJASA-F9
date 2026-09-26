import React, { useState } from 'react';
import { api } from '../lib/api';
import { formatDate, todayWib } from '../lib/format';
import type { AuthUser, JournalEntry, Lab } from '../types';

export interface JournalPrefill {
  date?: string;
  startTime?: string;
  endTime?: string;
  className?: string;
  subject?: string;
  topic?: string;
}

interface Props {
  lab: Lab;
  user: AuthUser;
  initial?: JournalEntry | null;
  prefill?: JournalPrefill;
  onSaved: (journal: JournalEntry, submitted: boolean) => void;
  onCancel: () => void;
}

const input =
  'w-full h-11 px-3 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-sm text-[#131b2e] focus:ring-2 focus:ring-[#00685f] focus:outline-none';
const label = 'block text-xs font-semibold text-[#131b2e] mb-1';

export const JournalForm: React.FC<Props> = ({ lab, user, initial, prefill, onSaved, onCancel }) => {
  const isEdit = !!initial;
  const isCorrection = initial?.status === 'NEEDS_CORRECTION';

  const [date, setDate] = useState(initial?.date ?? prefill?.date ?? todayWib());
  const [startTime, setStartTime] = useState(initial?.startTime ?? prefill?.startTime ?? '');
  const [endTime, setEndTime] = useState(initial?.endTime ?? prefill?.endTime ?? '');
  const [className, setClassName] = useState(initial?.className ?? prefill?.className ?? '');
  const [subject, setSubject] = useState(initial?.subject ?? prefill?.subject ?? '');
  const [topic, setTopic] = useState(initial?.topic ?? prefill?.topic ?? '');
  const [studentsCount, setStudentsCount] = useState(String(initial?.studentsCount ?? ''));
  const [sopComplied, setSopComplied] = useState(initial?.sopComplied ?? true);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const lastCorrection = initial?.reviews
    ?.slice()
    .reverse()
    .find((r) => r.status === 'NEEDS_CORRECTION');

  const payload = () => ({
    date,
    startTime,
    endTime,
    className,
    subject,
    topic,
    notes,
    studentsCount: studentsCount === '' ? 0 : Number(studentsCount),
    sopComplied,
  });

  const save = async (submit: boolean) => {
    setError('');
    const form = document.getElementById('journal-form') as HTMLFormElement | null;
    if (submit && form && !form.reportValidity()) return;
    if (startTime && endTime && startTime >= endTime) {
      setError('Jam selesai harus setelah jam mulai.');
      return;
    }
    setBusy(true);
    try {
      let journal: JournalEntry;
      if (!isEdit) {
        const r = await api.post<{ journal: JournalEntry }>('/journals', {
          labId: lab.id,
          ...payload(),
          saveAsDraft: !submit,
        });
        journal = r.journal;
      } else {
        const r = await api.patch<{ journal: JournalEntry }>(`/journals/${initial!.id}`, payload());
        journal = r.journal;
        if (submit) {
          const s = await api.post<{ journal: JournalEntry }>(`/journals/${initial!.id}/resubmit`);
          journal = s.journal;
        }
      }
      onSaved(journal, submit);
    } catch (e: any) {
      setError(e?.message || 'Gagal menyimpan jurnal.');
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-5 sm:p-6">
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
        <button
          onClick={onCancel}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
          aria-label="Kembali"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#131b2e]">
            {isEdit ? (isCorrection ? 'Perbaiki Jurnal' : 'Edit Jurnal') : 'Form Jurnal Laboratorium'}
          </h2>
          {initial && <span className="font-mono text-xs font-bold text-[#00685f]">{initial.code}</span>}
        </div>
      </div>

      {isCorrection && lastCorrection && (
        <div className="mb-4 p-3 rounded-xl bg-[#FFF1F2] border border-rose-200 text-xs text-[#9f1239]">
          <div className="font-bold flex items-center gap-1 mb-0.5">
            <span className="material-symbols-outlined text-[16px]">priority_high</span>
            Catatan koreksi dari {lastCorrection.reviewerName}
          </div>
          <p className="whitespace-pre-wrap break-words">{lastCorrection.notes}</p>
        </div>
      )}

      <form
        id="journal-form"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save(true);
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={label}>Laboratorium</label>
            <input className={`${input} bg-slate-100 text-slate-600`} value={lab.name} readOnly />
          </div>
          <div>
            <label className={label}>Guru</label>
            <input className={`${input} bg-slate-100 text-slate-600`} value={user.name} readOnly />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={label} htmlFor="f-date">Tanggal</label>
            <input
              id="f-date"
              type="date"
              className={input}
              value={date}
              max={todayWib()}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            {date && <span className="text-[11px] text-slate-400">{formatDate(date)}</span>}
          </div>
          <div>
            <label className={label} htmlFor="f-start">Jam Mulai</label>
            <input id="f-start" type="time" className={input} value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </div>
          <div>
            <label className={label} htmlFor="f-end">Jam Selesai</label>
            <input id="f-end" type="time" className={input} value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={label} htmlFor="f-class">Kelas</label>
            <input id="f-class" className={input} value={className} onChange={(e) => setClassName(e.target.value)} placeholder="XI IPA 1" maxLength={60} required />
          </div>
          <div>
            <label className={label} htmlFor="f-subject">Mata Pelajaran</label>
            <input id="f-subject" className={input} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Biologi" maxLength={100} required />
          </div>
          <div>
            <label className={label} htmlFor="f-students">Jumlah Siswa</label>
            <input id="f-students" type="number" min={0} max={200} className={input} value={studentsCount} onChange={(e) => setStudentsCount(e.target.value)} placeholder="36" />
          </div>
        </div>

        <div>
          <label className={label} htmlFor="f-topic">Kegiatan</label>
          <input id="f-topic" className={input} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Contoh: Pengamatan preparat basah daun Rhoeo" maxLength={300} required />
        </div>

        <div>
          <label className={label} htmlFor="f-notes">Catatan</label>
          <textarea
            id="f-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            placeholder="Kondisi alat/ruangan, kebersihan, kendala, dan hal lain yang perlu dicatat…"
            className="w-full p-3 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-sm text-[#131b2e] focus:ring-2 focus:ring-[#00685f] focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 cursor-pointer">
          <input type="checkbox" checked={sopComplied} onChange={(e) => setSopComplied(e.target.checked)} className="w-4 h-4 rounded text-[#00685f]" />
          Praktikum berjalan sesuai SOP laboratorium
        </label>

        {error && (
          <div role="alert" className="p-2.5 rounded-xl bg-[#FFF1F2] border border-rose-200 text-xs text-[#E11D48]">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={busy}
            onClick={() => save(false)}
            className="px-4 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 disabled:opacity-50 text-[#131b2e] text-sm font-semibold border border-slate-200"
          >
            {isCorrection ? 'Simpan Perubahan' : 'Simpan Draft'}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2.5 rounded-xl bg-[#00685f] hover:bg-[#008378] disabled:opacity-50 text-white text-sm font-bold shadow-sm"
          >
            {busy ? 'Menyimpan…' : isCorrection ? 'Simpan & Kirim Ulang' : 'Kirim Jurnal'}
          </button>
        </div>
      </form>
    </div>
  );
};
