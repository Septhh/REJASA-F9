import type { Lab } from '../types';

// Konteks laboratorium hasil scan QR, disimpan sementara selama sesi tab browser.
const KEY = 'rejasa.lab';

export function saveLab(lab: Lab) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(lab));
  } catch {
    /* penyimpanan tidak tersedia */
  }
}

export function loadLab(): Lab | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Lab) : null;
  } catch {
    return null;
  }
}

export function clearLab() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* abaikan */
  }
}
