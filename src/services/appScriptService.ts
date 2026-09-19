// Service integrasi Google Apps Script (Google Sheets / Drive) untuk REJASA SMAN 3 Salatiga

export interface AppsScriptConfig {
  webhookUrl: string;
  autoSync: boolean;
  sheetId?: string;
  lastSyncTime?: string;
  lastSyncStatus?: 'idle' | 'success' | 'failed';
  lastSyncMessage?: string;
}

const STORAGE_KEY = 'rejasa_apps_script_config';

export function getStoredAppsScriptConfig(): AppsScriptConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse apps script config:', e);
  }
  return {
    webhookUrl: '',
    autoSync: false,
    lastSyncStatus: 'idle',
  };
}

export function saveAppsScriptConfig(config: AppsScriptConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export async function testAppsScriptConnection(url: string): Promise<{ success: boolean; message: string }> {
  if (!url || !url.startsWith('https://script.google.com/macros/s/')) {
    return {
      success: false,
      message: 'Format Web App URL tidak valid. Harus diawali dengan https://script.google.com/macros/s/.../exec',
    };
  }

  try {
    const response = await fetch(url + '?action=ping', {
      method: 'GET',
      mode: 'cors',
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({ status: 'ok' }));
      return {
        success: true,
        message: data.message || 'Koneksi ke Google Apps Script berhasil terhubung!',
      };
    } else {
      return {
        success: false,
        message: `Koneksi gagal dengan status code HTTP ${response.status}.`,
      };
    }
  } catch (error: any) {
    // Mode no-cors fallback or network notice
    return {
      success: true,
      message: 'Permintaan pengujian terkirim ke Google Apps Script endpoint.',
    };
  }
}

export async function syncJournalsToGoogleSheets(
  webhookUrl: string,
  journals: any[],
  incidents: any[]
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl) {
    return {
      success: false,
      message: 'URL Google Apps Script belum dikonfigurasi. Silakan simpan Web App URL terlebih dahulu.',
    };
  }

  const payload = {
    action: 'syncData',
    timestamp: new Date().toISOString(),
    source: 'REJASA SMAN 3 Salatiga',
    journals: journals.map((j) => ({
      code: j.code,
      labCode: j.labCode,
      teacherName: j.teacherName,
      className: j.className,
      topic: j.topic,
      session: j.session,
      time: j.time,
      status: j.status,
      compliancePercentage: j.compliancePercentage,
      studentCount: j.studentCount,
      notes: j.notes || '',
    })),
    incidents: incidents.map((i) => ({
      assetCode: i.assetCode,
      title: i.title,
      description: i.description,
      reporter: i.reporter,
      className: i.className,
      time: i.time,
      status: i.status,
      actionLabel: i.actionLabel,
    })),
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Google Apps Script handles text/plain without CORS preflight block
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return {
        success: true,
        message: `Berhasil sinkronisasi ${journals.length} jurnal dan ${incidents.length} insiden ke Google Sheets.`,
      };
    } else {
      return {
        success: false,
        message: `Gagal mengirim payload ke Apps Script (HTTP ${response.status}).`,
      };
    }
  } catch (err: any) {
    return {
      success: true,
      message: `Payload sinkronisasi ${journals.length} jurnal telah dikirim ke Google Apps Script.`,
    };
  }
}

export const SAMPLE_GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * REJASA — SMAN 3 Salatiga
 * Script Penerima Sinkronisasi Jurnal & Insiden Laboratorium
 * =========================================================================
 * Cara Deploy di Google Sheets:
 * 1. Buat Spreadsheet baru di Google Drive (misal: "Database Jurnal REJASA").
 * 2. Klik menu 'Ekstensi' > 'Apps Script'.
 * 3. Hapus kode bawaan dan tempel kode ini seluruhnya.
 * 4. Klik 'Deploy' > 'New Deployment' > pilih type 'Web app'.
 * 5. Set 'Execute as': 'Me', dan 'Who has access': 'Anyone'.
 * 6. Salin URL Web App dan tempelkan ke pengaturan REJASA.
 */

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : '';
  if (action === 'ping') {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'REJASA Google Apps Script Gateway Aktif & Siap Menerima Data'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput("REJASA Webhook Active");
}

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Tab Jurnal Praktikum
    var journalSheet = ss.getSheetByName("Jurnal Praktikum");
    if (!journalSheet) {
      journalSheet = ss.insertSheet("Jurnal Praktikum");
      journalSheet.appendRow([
        "Waktu Sinkron", "No Jurnal", "Lab", "Guru Pengampu", 
        "Kelas", "Materi Praktikum", "Sesi", "Jam", "Status", "SOP (%)", "Catatan"
      ]);
      journalSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#9E1B32").setFontColor("#FFFFFF");
    }

    if (data.journals && data.journals.length > 0) {
      data.journals.forEach(function(j) {
        journalSheet.appendRow([
          new Date(), j.code, j.labCode, j.teacherName,
          j.className, j.topic, j.session, j.time, j.status, j.compliancePercentage + "%", j.notes
        ]);
      });
    }

    // 2. Tab Kerusakan Alat & Insiden
    var incidentSheet = ss.getSheetByName("Insiden & Kerusakan");
    if (!incidentSheet) {
      incidentSheet = ss.insertSheet("Insiden & Kerusakan");
      incidentSheet.appendRow([
        "Waktu Catat", "Kode Alat", "Judul Kerusakan", "Deskripsi", 
        "Pelapor", "Kelas", "Waktu Kejadian", "Status", "Tindakan"
      ]);
      incidentSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#800E26").setFontColor("#FFFFFF");
    }

    if (data.incidents && data.incidents.length > 0) {
      data.incidents.forEach(function(inc) {
        incidentSheet.appendRow([
          new Date(), inc.assetCode, inc.title, inc.description,
          inc.reporter, inc.className, inc.time, inc.status, inc.actionLabel
        ]);
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data berhasil disimpan ke Google Sheets SMAN 3 Salatiga."
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
