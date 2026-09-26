import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { api } from '../lib/api';
import { Lab, QRCodeInfo } from '../types';

interface CreateQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  labs: Lab[];
  /** Lab yang dipilih saat modal dibuka (opsional). */
  initialLabId?: number | null;
  /** Dipanggil setelah QR diterbitkan/diperbarui (mis. untuk refresh daftar). */
  onChanged?: () => void;
  onToast?: (msg: string) => void;
}

// QR hanya mengidentifikasi laboratorium. Membuat QR TIDAK membuat jurnal.
export const CreateQRModal: React.FC<CreateQRModalProps> = ({ isOpen, onClose, labs, initialLabId, onChanged, onToast }) => {
  const [labId, setLabId] = useState<number | null>(null);
  const [qr, setQr] = useState<QRCodeInfo | null>(null);
  const [qrImage, setQrImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) setLabId(initialLabId ?? labs[0]?.id ?? null);
  }, [isOpen, initialLabId, labs]);

  // Muat QR aktif untuk lab terpilih.
  useEffect(() => {
    if (!isOpen || labId == null) return;
    let alive = true;
    setLoading(true);
    setError('');
    api
      .get<{ qrCodes: QRCodeInfo[] }>(`/qr?labId=${labId}`)
      .then((r) => alive && setQr(r.qrCodes[0] ?? null))
      .catch((e) => alive && setError(e?.message || 'Gagal memuat QR.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [isOpen, labId]);

  // Render QR nyata dari URL.
  useEffect(() => {
    if (!qr) {
      setQrImage('');
      return;
    }
    let alive = true;
    QRCode.toDataURL(qr.url, { width: 512, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#00685f', light: '#ffffff' } })
      .then((d) => alive && setQrImage(d))
      .catch(() => alive && setError('Gagal membuat gambar QR.'));
    return () => {
      alive = false;
    };
  }, [qr]);

  if (!isOpen) return null;

  const lab = labs.find((l) => l.id === labId) ?? null;

  const generate = async () => {
    if (labId == null) return;
    if (qr && !window.confirm('QR lama untuk laboratorium ini akan dicabut dan tidak dapat dipakai lagi. Lanjutkan?')) return;
    setBusy(true);
    setError('');
    try {
      const r = await api.post<{ qr: QRCodeInfo }>('/qr', { labId });
      setQr(r.qr);
      onChanged?.();
      onToast?.(`QR baru diterbitkan untuk ${r.qr.labName}.`);
    } catch (e: any) {
      setError(e?.message || 'Gagal menerbitkan QR.');
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!qr) return;
    try {
      await navigator.clipboard.writeText(qr.url);
      onToast?.('Tautan QR laboratorium disalin.');
    } catch {
      window.prompt('Salin tautan berikut:', qr.url);
    }
  };

  const download = () => {
    if (!qrImage || !lab) return;
    const a = document.createElement('a');
    a.href = qrImage;
    a.download = `qr-${lab.code.toLowerCase()}.png`;
    a.click();
  };

  const print = () => {
    if (!qrImage || !lab) return;
    const w = window.open('', '_blank', 'width=480,height=640');
    if (!w) return;
    w.document.write(
      `<html><head><title>QR ${lab.name}</title></head><body style="font-family:sans-serif;text-align:center;padding:32px">
       <h2 style="margin:0">${lab.name.replace(/</g, '&lt;')}</h2><p style="margin:4px 0 16px">${lab.school}</p>
       <img src="${qrImage}" style="width:320px;height:320px" /><p style="font-size:14px">Scan untuk mengisi jurnal laboratorium</p>
       <script>window.onload=()=>window.print()</script></body></html>`,
    );
    w.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00685f]/10 text-[#00685f] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">qr_code_2</span>
            </div>
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#131b2e]">QR Laboratorium</h3>
              <span className="text-xs text-slate-500">Pintu masuk guru ke alur pengisian jurnal</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#131b2e] mb-1">Pilih Laboratorium</label>
          <select
            value={labId ?? ''}
            onChange={(e) => setLabId(Number(e.target.value))}
            className="w-full h-10 px-3 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs sm:text-sm text-[#131b2e] focus:ring-2 focus:ring-[#00685f] focus:outline-none"
          >
            {labs.map((l) => (
              <option key={l.id} value={l.id}>
                {l.code} • {l.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div role="alert" className="mb-3 p-2.5 rounded-xl bg-[#FFF1F2] border border-rose-200 text-xs text-[#E11D48]">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-xs text-slate-400 text-center py-8">Memuat QR…</p>
        ) : qr ? (
          <div className="text-center flex flex-col items-center">
            <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-[#00685f] shadow-md mb-3 flex flex-col items-center">
              {qrImage ? <img src={qrImage} alt={`QR ${qr.labName}`} className="w-48 h-48" /> : <div className="w-48 h-48" />}
              <span className="font-mono text-[11px] font-bold text-[#00685f] mt-2 break-all max-w-[12rem]">{qr.labName}</span>
            </div>
            <p className="text-[11px] text-slate-500 break-all mb-4">{qr.url}</p>
            <div className="grid grid-cols-3 gap-2 w-full">
              <button onClick={copyLink} className="py-2 px-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[16px]">content_copy</span>Salin
              </button>
              <button onClick={download} className="py-2 px-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[16px]">download</span>Unduh
              </button>
              <button onClick={print} className="py-2 px-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[16px]">print</span>Cetak
              </button>
            </div>
            <button
              onClick={generate}
              disabled={busy}
              className="mt-3 text-xs font-semibold text-[#E11D48] hover:underline disabled:opacity-50"
            >
              {busy ? 'Memproses…' : 'Buat ulang QR (cabut QR lama)'}
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-slate-500 mb-4">Belum ada QR aktif untuk laboratorium ini.</p>
            <button
              onClick={generate}
              disabled={busy || labId == null}
              className="px-5 py-2 rounded-xl bg-[#00685f] hover:bg-[#008378] disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md"
            >
              {busy ? 'Memproses…' : 'Terbitkan QR Laboratorium'}
            </button>
          </div>
        )}

        <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 text-[#131b2e] text-xs font-semibold border border-slate-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
