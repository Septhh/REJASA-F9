import React from 'react';
import { JournalReview } from '../types';
import { formatDateTime } from '../lib/format';

const LABEL: Record<JournalReview['status'], string> = {
  SUBMITTED: 'Dikirim',
  REVIEWED: 'Disetujui',
  NEEDS_CORRECTION: 'Perlu Koreksi',
};
const DOT: Record<JournalReview['status'], string> = {
  SUBMITTED: 'bg-[#0284C7]',
  REVIEWED: 'bg-[#059669]',
  NEEDS_CORRECTION: 'bg-[#E11D48]',
};

export const ReviewHistory: React.FC<{ reviews: JournalReview[] }> = ({ reviews }) => {
  if (!reviews.length) {
    return <p className="text-xs text-slate-400">Belum ada riwayat.</p>;
  }
  return (
    <ol className="space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="flex gap-3 text-xs">
          <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${DOT[r.status]}`}></span>
          <div className="min-w-0">
            <div className="text-slate-500">
              {formatDateTime(r.createdAt)} • <span className="font-semibold text-slate-700">{r.reviewerRole}</span>{' '}
              ({r.reviewerName}) • <span className="font-semibold text-slate-700">{LABEL[r.status]}</span>
            </div>
            {r.notes && <p className="text-slate-700 mt-0.5 whitespace-pre-wrap break-words">{r.notes}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
};
