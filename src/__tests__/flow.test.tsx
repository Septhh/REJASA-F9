// Tes UI end-to-end (jsdom) terhadap API sungguhan di http://localhost:3001.
// Jalankan server dulu (npm run dev:server), lalu: npm run test:ui (opsional: TEST_API_URL)
import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Root } from '../Root';

const BASE = process.env.TEST_API_URL || 'http://localhost:3001';
let cookie = '';
const realFetch = globalThis.fetch;

beforeEach(() => {
  cookie = '';
  sessionStorage.clear();
  globalThis.fetch = (async (input: any, init: any = {}) => {
    const url = typeof input === 'string' && input.startsWith('/') ? BASE + input : input;
    const res = await realFetch(url, { ...init, headers: { ...(init.headers || {}), ...(cookie ? { Cookie: cookie } : {}) } });
    const sc = res.headers.get('set-cookie');
    if (sc) cookie = sc.startsWith('rejasa_sid=;') || sc.includes('Expires=Thu, 01 Jan 1970') ? '' : sc.split(';')[0];
    return res;
  }) as typeof fetch;
});
afterEach(() => cleanup());

async function adminQrToken(): Promise<{ token: string; labId: number }> {
  const login = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: 'ADM1' }) });
  expect(login.status).toBe(200);
  const labs = (await (await fetch('/api/labs')).json()).labs;
  const bio = labs.find((l: any) => l.code === 'BIO');
  const qr = (await (await fetch('/api/qr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ labId: bio.id }) })).json()).qr;
  await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  return { token: qr.token, labId: bio.id };
}

describe('Teacher Flow (UI)', () => {
  it('QR → lab → login → jadwal → form → submit → nomor jurnal → review → koreksi → resubmit', async () => {
    const user = userEvent.setup();
    const { token } = await adminQrToken();

    // 1) Scan QR
    window.history.pushState(null, '', `/q/${token}`);
    render(<Root />);
    expect(await screen.findByText('Lab Biologi Terpadu')).toBeTruthy();
    expect(screen.getByText('SMAN 3 Salatiga')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/Mikroskop|Tabung|Unit/);
    await user.click(screen.getByRole('button', { name: 'Lanjut' }));

    // 2) Login Guru
    expect(await screen.findByText('Login Guru')).toBeTruthy();
    await user.type(screen.getByLabelText('KODE GURU'), 'gr1');
    await user.click(screen.getByRole('button', { name: 'Masuk' }));

    // 3) Jadwal + form
    expect(await screen.findByText('Jadwal Penggunaan')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Isi Jurnal Baru/ }));
    expect(await screen.findByText('Form Jurnal Laboratorium')).toBeTruthy();
    await user.type(screen.getByLabelText('Jam Mulai'), '07:30');
    await user.type(screen.getByLabelText('Jam Selesai'), '09:00');
    await user.type(screen.getByLabelText('Kelas'), 'XI IPA 1');
    await user.type(screen.getByLabelText('Mata Pelajaran'), 'Biologi');
    await user.type(screen.getByLabelText('Kegiatan'), 'Uji UI otomatis');
    await user.type(screen.getByLabelText('Catatan'), 'Catatan awal');
    await user.click(screen.getByRole('button', { name: 'Kirim Jurnal' }));

    // 4) Nomor jurnal + status
    const banner = await screen.findByText(/berhasil dikirim/);
    expect(banner).toBeTruthy();
    await waitFor(() => expect(document.body.textContent).toMatch(/JR-\d{8}-\d{4}/));
    const code = document.body.textContent!.match(/JR-\d{8}-\d{4}/)![0];
    expect(screen.getAllByText('SUBMITTED').length).toBeGreaterThan(0);

    // 5) Laboran meminta koreksi (via API, sesi terpisah)
    const teacherCookie = cookie;
    cookie = '';
    await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: 'LB1' }) });
    const list = (await (await fetch('/api/journals')).json()).journals;
    const j = list.find((x: any) => x.code === code);
    const rv = await fetch(`/api/journals/${j.id}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'NEEDS_CORRECTION', notes: 'Lengkapi catatan kegiatan.' }) });
    expect(rv.status).toBe(201);
    cookie = teacherCookie;

    // 6) Guru melihat koreksi, memperbaiki, kirim ulang
    await user.click(screen.getByRole('button', { name: 'Kembali' }));
    await user.click(await screen.findByText(code));
    expect(await screen.findByText(/Catatan koreksi dari/)).toBeTruthy();
    expect(document.body.textContent).toContain('Lengkapi catatan kegiatan.');
    await user.click(screen.getByRole('button', { name: /Perbaiki Jurnal/ }));
    const notes = await screen.findByLabelText('Catatan');
    await user.clear(notes);
    await user.type(notes, 'Catatan sudah dilengkapi');
    await user.click(screen.getByRole('button', { name: 'Simpan & Kirim Ulang' }));
    await waitFor(() => expect(document.body.textContent).toMatch(/Jurnal diperbaiki dan dikirim ulang/));
    expect(document.body.textContent).toContain('Riwayat Review');
    expect(document.body.textContent).toContain('Lengkapi catatan kegiatan.');
  });

  it('Persistensi: refresh → jurnal tetap ada di "Jurnal Saya"', async () => {
    window.history.pushState(null, '', '/guru');
    render(<Root />);
    await userEvent.setup().type(await screen.findByLabelText('KODE GURU'), 'GR1');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Masuk' }));
    expect(await screen.findByText('Jurnal Saya')).toBeTruthy();
    await waitFor(() => expect(document.body.textContent).toMatch(/Uji UI otomatis|JR-\d{8}-\d{4}/));
    cleanup();
    render(<Root />); // "refresh": sesi cookie tetap, state React baru
    expect(await screen.findByText('Jurnal Saya')).toBeTruthy();
    await waitFor(() => expect(document.body.textContent).toMatch(/JR-\d{8}-\d{4}/));
  });

  it('Guru tidak melihat menu/data inventaris', async () => {
    window.history.pushState(null, '', '/guru');
    render(<Root />);
    await userEvent.setup().type(await screen.findByLabelText('KODE GURU'), 'GR2');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Masuk' }));
    await screen.findByText('Jurnal Saya');
    expect(document.body.textContent).not.toMatch(/Inventaris|Mikroskop|Reagen Kritis|QR Laboratorium/);
    const r = await fetch('/api/inventory');
    expect(r.status).toBe(403);
  });
});

describe('Dashboard staf (UI)', () => {
  it('Laboran: melihat jurnal dari DB, tanpa menu QR/Inventaris; dapat memverifikasi', async () => {
    const user = userEvent.setup();
    window.history.pushState(null, '', '/');
    render(<Root />);
    await user.type(await screen.findByLabelText('KODE PENGGUNA'), 'LB1');
    await user.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(await screen.findByText('Dashboard Laboratorium')).toBeTruthy();
    const nav = document.getElementById('main-sidebar')!;
    expect(within(nav).queryByText('QR Laboratorium')).toBeNull();
    expect(within(nav).queryByText('Laboratorium', { exact: true })).toBeNull();
    await user.click(within(nav).getByText('Review Jurnal'));
    const btn = (await screen.findAllByRole('button', { name: /Verifikasi/ }))[0];
    await user.click(btn);
    expect(await screen.findByText('Verifikasi & Review Jurnal')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Verifikasi & Setujui/ }));
    await waitFor(() => expect(document.body.textContent).toMatch(/telah diverifikasi & disetujui/));
  });

  it('Admin: melihat menu QR & inventaris, QR nyata terbit', async () => {
    const user = userEvent.setup();
    window.history.pushState(null, '', '/');
    render(<Root />);
    await user.type(await screen.findByLabelText('KODE PENGGUNA'), 'ADM1');
    await user.click(screen.getByRole('button', { name: 'Masuk' }));
    await screen.findByText('Dashboard Laboratorium');
    const nav = document.getElementById('main-sidebar')!;
    await user.click(within(nav).getByText('Laboratorium', { exact: true }));
    expect(await screen.findByText(/Total Alat/)).toBeTruthy();
    await user.click(within(nav).getByText('QR Laboratorium'));
    await user.click((await screen.findAllByRole('button', { name: /Lihat \/ Cetak|Terbitkan/ }))[0]);
    const img = await screen.findByAltText(/QR Lab/);
    await waitFor(() => expect((img as HTMLImageElement).src).toMatch(/^data:image\/png/));
  });
});
