import React from 'react';
import { JournalStatus } from '../types';

const STYLES: Record<JournalStatus, { cls: string; dot: string; label: string }> = {
  DRAFT: { cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400', label: 'DRAFT' },
  SUBMITTED: { cls: 'bg-[#F0F9FF] text-[#0284C7] border-sky-200', dot: 'bg-[#0284C7]', label: 'SUBMITTED' },
  REVIEWED: { cls: 'bg-[#ECFDF5] text-[#059669] border-emerald-200', dot: 'bg-[#059669]', label: 'REVIEWED' },
  NEEDS_CORRECTION: { cls: 'bg-[#FFF1F2] text-[#E11D48] border-rose-200', dot: 'bg-[#E11D48]', label: 'NEEDS_CORRECTION' },
};

export const StatusBadge: React.FC<{ status: JournalStatus }> = ({ status }) => {
  const s = STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
      {s.label}
    </span>
  );
};
