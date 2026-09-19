import React from 'react';
import { JournalEntry, IncidentItem, LabRoom } from '../types';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  journals: JournalEntry[];
  incidents: IncidentItem[];
  rooms: LabRoom[];
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  journals,
  incidents,
  rooms,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-150 print:p-0 print:bg-white">
      <div className="bg-white rounded-[2px] w-full max-w-3xl shadow-2xl border border-slate-300 p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:w-full print:p-0">
        {/* Actions bar (hidden in print) */}
        <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#9E1B32] text-[22px]">print</span>
            <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#131b2e] tracking-tight">
              Cetak Rekapitulasi Operasional Laboratorium
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-[2px] bg-[#9E1B32] hover:bg-[#800E26] text-white text-xs font-mono font-semibold flex items-center gap-1.5 border border-[#800E26] shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              Cetak / Ekspor PDF
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-[2px] border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Official Printable Report Document */}
        <div className="print-content text-slate-800 text-xs font-sans">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
            <h1 className="font-['Plus_Jakarta_Sans'] text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-900">
              PEMERINTAH PROVINSI JAWA TENGAH • DINAS PENDIDIKAN DAN KEBUDAYAAN
            </h1>
            <h2 className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-bold uppercase text-slate-800">
              SMA NEGERI 3 SALATIGA • SISTEM REJASA (RAPID ACCESS JOURNAL)
            </h2>
            <p className="text-[11px] font-mono text-slate-600 mt-1">
              Jl. Pembina No. 1, Kalicacing, Sidomukti, Kota Salatiga, Jawa Tengah 50724 • Dokumen Resmi Pengawasan Laboratorium
            </p>
          </div>

          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-300 text-xs font-mono">
            <div>
              <span className="font-bold">DOKUMEN:</span> REKAPITULASI HARIAN OPERASIONAL LAB REJASA
            </div>
            <div>
              <span className="font-bold">TANGGAL:</span> {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
            </div>
          </div>

          {/* Section 1: Ringkasan Bilik Lab */}
          <div className="mb-5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 font-mono mb-2">
              1. STATUS BILIK LABORATORIUM AKTIF
            </h4>
            <table className="w-full border-collapse border border-slate-400 text-left">
              <thead>
                <tr className="bg-slate-100 font-bold font-mono text-[11px]">
                  <th className="border border-slate-400 p-2">KODE</th>
                  <th className="border border-slate-400 p-2">NAMA BILIK</th>
                  <th className="border border-slate-400 p-2">STATUS</th>
                  <th className="border border-slate-400 p-2">AGENDA TERJADWAL</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id} className="border-b border-slate-300">
                    <td className="border border-slate-400 p-2 font-mono font-bold text-[#9E1B32]">{room.code}</td>
                    <td className="border border-slate-400 p-2 font-medium">{room.name}</td>
                    <td className="border border-slate-400 p-2 font-mono font-bold">
                      {room.status}
                    </td>
                    <td className="border border-slate-400 p-2">{room.className} - {room.topic}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 2: Jurnal Praktikum */}
          <div className="mb-5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 font-mono mb-2">
              2. REKAPITULASI JURNAL PRAKTIKUM ({journals.length} SESI)
            </h4>
            <table className="w-full border-collapse border border-slate-400 text-left">
              <thead>
                <tr className="bg-slate-100 font-bold font-mono text-[11px]">
                  <th className="border border-slate-400 p-2">NO JURNAL</th>
                  <th className="border border-slate-400 p-2">LAB</th>
                  <th className="border border-slate-400 p-2">GURU PENGAMPU</th>
                  <th className="border border-slate-400 p-2">KELAS &amp; MATERI</th>
                  <th className="border border-slate-400 p-2">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {journals.map((j) => (
                  <tr key={j.id}>
                    <td className="border border-slate-400 p-2 font-mono font-bold">{j.code}</td>
                    <td className="border border-slate-400 p-2 font-mono font-bold text-[#9E1B32]">{j.labCode}</td>
                    <td className="border border-slate-400 p-2">{j.teacherName}</td>
                    <td className="border border-slate-400 p-2">{j.className} - {j.topic}</td>
                    <td className="border border-slate-400 p-2 font-mono font-bold">{j.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3: Insiden & Kerusakan Alat */}
          <div className="mb-6">
            <h4 className="font-bold text-xs uppercase tracking-wider text-rose-800 font-mono mb-2">
              3. BUKU KERUSAKAN ALAT &amp; LAPORAN INSIDEN
            </h4>
            <table className="w-full border-collapse border border-slate-400 text-left">
              <thead>
                <tr className="bg-slate-100 font-bold font-mono text-[11px]">
                  <th className="border border-slate-400 p-2">KODE ALAT</th>
                  <th className="border border-slate-400 p-2">KONDISI KERUSAKAN</th>
                  <th className="border border-slate-400 p-2">PELAPOR</th>
                  <th className="border border-slate-400 p-2">TINDAKAN</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((i) => (
                  <tr key={i.id}>
                    <td className="border border-slate-400 p-2 font-mono font-bold text-rose-700">{i.assetCode}</td>
                    <td className="border border-slate-400 p-2">
                      <span className="font-bold block">{i.title}</span>
                      <span className="text-[10px] text-slate-600">{i.description}</span>
                    </td>
                    <td className="border border-slate-400 p-2">{i.reporter} ({i.className})</td>
                    <td className="border border-slate-400 p-2 font-mono font-bold">{i.actionLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-400 text-center font-mono">
            <div>
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-bold text-slate-800 mt-1">Wakil Kepala Sekolah Bid. Kurikulum</p>
              <div className="h-14"></div>
              <p className="font-bold underline text-slate-900">Dr. H. Ahmad Fauzi, M.Pd</p>
              <p className="text-[10px] text-slate-500">NIP. 19740512 199903 1 002</p>
            </div>
            <div>
              <p className="text-slate-600">EduLab, {new Date().toLocaleDateString('id-ID')}</p>
              <p className="font-bold text-slate-800 mt-1">Kepala Laboratorium</p>
              <div className="h-14"></div>
              <p className="font-bold underline text-slate-900">Dra. Sri Wahyuni</p>
              <p className="text-[10px] text-slate-500">NIP. 19680820 199412 2 001</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
