import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { requireAuth, optionalAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  getOrCreateUser,
  seedInitialDataIfEmpty,
  getLabRooms,
  getJournals,
  getJournalsByTeacher,
  getJournalById,
  getReviewsByJournalId,
  updateJournal,
  createJournal,
  reviewJournal,
  resubmitJournal,
  getIncidents,
  createIncident,
  updateIncidentStatus,
  authenticateAdmin,
  getAllAdmins,
  createOrUpdateAdmin,
  updateAdminPassword,
  authenticateTeacher,
  getAllTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getLabByQRToken,
  getAllQRCodes,
  createOrRegisterQRCode,
  getSchedulesForLab,
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from './src/db/queries.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API: Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Middleware helper to enforce ADMIN access
const requireAdminRole = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const adminCode = req.headers['x-admin-code'] as string;
  if (!adminCode) {
    return res.status(403).json({
      error: 'Forbidden: Inventaris hanya dapat diakses oleh Admin / Laboran.',
      code: 'INVENTORY_ADMIN_ONLY'
    });
  }
  next();
};

// =======================================================
// AUTH: Admin Authentication
// =======================================================
app.post('/api/admin/login', async (req, res) => {
  try {
    const { adminCode, password } = req.body;
    if (!adminCode || !password) {
      return res.status(400).json({ error: 'Kode Admin dan Password Otorisasi wajib diisi.' });
    }
    const result = await authenticateAdmin(adminCode, password);
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }
    res.json({ success: true, role: 'ADMIN', admin: result.admin });
  } catch (error: any) {
    console.error('Error in /api/admin/login:', error);
    res.status(500).json({ error: error.message || 'Gagal login admin.' });
  }
});

app.get('/api/admin/list', async (_req, res) => {
  try {
    const admins = await getAllAdmins();
    res.json(admins);
  } catch (error: any) {
    console.error('Error in /api/admin/list:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat data admin.' });
  }
});

app.post('/api/admin/custom', async (req, res) => {
  try {
    const { adminCode, name, password, role } = req.body;
    if (!adminCode || !name) {
      return res.status(400).json({ error: 'Kode Admin dan Nama wajib diisi.' });
    }
    const saved = await createOrUpdateAdmin({ adminCode, name, password, role });
    res.json({ success: true, admin: saved });
  } catch (error: any) {
    console.error('Error in /api/admin/custom:', error);
    res.status(500).json({ error: error.message || 'Gagal menyimpan data admin.' });
  }
});

app.post('/api/admin/change-password', async (req, res) => {
  try {
    const { adminCode, oldPassword, newPassword } = req.body;
    if (!adminCode || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Semua field password wajib diisi.' });
    }
    const result = await updateAdminPassword(adminCode, oldPassword, newPassword);
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Password lama tidak valid.' });
    }
    res.json({ success: true, message: 'Password otorisasi berhasil diubah.' });
  } catch (error: any) {
    console.error('Error in /api/admin/change-password:', error);
    res.status(500).json({ error: error.message || 'Gagal memperbarui password.' });
  }
});

// =======================================================
// AUTH: Unified Login, Me, and Logout
// =======================================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { teacherCode, adminCode, password, role } = req.body;
    if (teacherCode || role === 'GURU') {
      const code = (teacherCode || '').trim();
      if (!code) return res.status(400).json({ error: 'Kode Guru wajib diisi.' });
      const result = await authenticateTeacher(code);
      if (!result.success) return res.status(401).json({ error: result.error });
      return res.json({ success: true, role: 'GURU', teacher: result.teacher, user: result.teacher });
    }
    if (adminCode || role === 'ADMIN') {
      if (!adminCode || !password) return res.status(400).json({ error: 'Kode Admin dan Password wajib diisi.' });
      const result = await authenticateAdmin(adminCode, password);
      if (!result.success) return res.status(401).json({ error: result.error });
      return res.json({ success: true, role: 'ADMIN', admin: result.admin, user: result.admin });
    }
    return res.status(400).json({ error: 'Format login tidak valid. Masukkan Kode Guru atau Kredensial Admin.' });
  } catch (error: any) {
    console.error('Error in /api/auth/login:', error);
    res.status(500).json({ error: error.message || 'Gagal login.' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const adminCode = req.headers['x-admin-code'] as string;
    const teacherCode = (req.headers['x-teacher-code'] || req.query.teacherCode) as string;

    if (adminCode) {
      const admins = await getAllAdmins();
      const matched = admins.find(a => a.adminCode.toUpperCase() === adminCode.toUpperCase());
      if (matched) {
        return res.json({ authenticated: true, role: 'ADMIN', user: matched });
      }
    }

    if (teacherCode) {
      const teachers = await getAllTeachers();
      const matched = teachers.find(t => t.teacherCode.toUpperCase() === teacherCode.toUpperCase());
      if (matched) {
        return res.json({ authenticated: true, role: 'GURU', user: matched });
      }
    }

    res.json({ authenticated: false, role: null, user: null });
  } catch (error: any) {
    console.error('Error in /api/auth/me:', error);
    res.status(500).json({ error: error.message || 'Gagal memeriksa sesi.' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.json({ success: true, message: 'Berhasil keluar.' });
});

// Teacher Authentication (Login by Teacher Code - direct alias)
app.post('/api/auth/teacher-login', async (req, res) => {
  try {
    const { teacherCode } = req.body;
    if (!teacherCode || typeof teacherCode !== 'string' || !teacherCode.trim()) {
      return res.status(400).json({ error: 'Kode Guru wajib diisi.' });
    }
    const result = await authenticateTeacher(teacherCode);
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }
    res.json({ success: true, role: 'GURU', teacher: result.teacher });
  } catch (error: any) {
    console.error('Error in /api/auth/teacher-login:', error);
    res.status(500).json({ error: error.message || 'Gagal login guru.' });
  }
});

// Teacher Management (by Admin)
app.get('/api/teachers', async (_req, res) => {
  try {
    const teacherList = await getAllTeachers();
    res.json(teacherList);
  } catch (error: any) {
    console.error('Error in GET /api/teachers:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat data guru.' });
  }
});

app.post('/api/teachers', async (req, res) => {
  try {
    const created = await createTeacher(req.body);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error in POST /api/teachers:', error);
    res.status(500).json({ error: error.message || 'Gagal menambahkan guru.' });
  }
});

app.patch('/api/teachers/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await updateTeacher(id, req.body);
    res.json(updated);
  } catch (error: any) {
    console.error('Error in PATCH /api/teachers/:id:', error);
    res.status(500).json({ error: error.message || 'Gagal memperbarui guru.' });
  }
});

app.delete('/api/teachers/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteTeacher(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/teachers/:id:', error);
    res.status(500).json({ error: error.message || 'Gagal menghapus guru.' });
  }
});

// =======================================================
// QR CODE & LAB IDENTIFICATION (Teacher Flow Step 1 & 2)
// NOTE: Strictly does NOT contain or return inventory!
// Does NOT create journal on scan!
// =======================================================
app.get('/api/qr/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const result = await getLabByQRToken(token);
    res.json(result);
  } catch (error: any) {
    console.error('Error resolving QR:', error);
    res.status(404).json({ error: error.message || 'QR Code lab tidak valid.' });
  }
});

app.get('/api/qr', async (_req, res) => {
  try {
    const qrs = await getAllQRCodes();
    res.json(qrs);
  } catch (error: any) {
    console.error('Error fetching QR list:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat data QR.' });
  }
});

app.post('/api/qr', async (req, res) => {
  try {
    const { labCode, title } = req.body;
    if (!labCode) return res.status(400).json({ error: 'Lab code wajib diisi.' });
    const qr = await createOrRegisterQRCode(labCode, title);
    res.status(201).json(qr);
  } catch (error: any) {
    console.error('Error creating QR:', error);
    res.status(500).json({ error: error.message || 'Gagal membuat QR lab.' });
  }
});

// Lab schedules (Jadwal Penggunaan)
app.get('/api/labs/:labId/schedule', async (req, res) => {
  try {
    const schedules = await getSchedulesForLab(req.params.labId);
    res.json(schedules);
  } catch (error: any) {
    console.error('Error fetching lab schedules:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat jadwal lab.' });
  }
});

// =======================================================
// INVENTORY (ADMIN ONLY - SERVER SIDE RESTRICTION)
// Guru is forbidden from reading/writing inventory!
// =======================================================
app.get('/api/inventory', requireAdminRole, async (req, res) => {
  try {
    const labCode = req.query.labCode as string;
    const items = await getInventoryItems(labCode);
    res.json(items);
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat inventaris.' });
  }
});

app.post('/api/inventory', requireAdminRole, async (req, res) => {
  try {
    const created = await createInventoryItem(req.body);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: error.message || 'Gagal menambahkan alat inventaris.' });
  }
});

app.patch('/api/inventory/:id', requireAdminRole, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await updateInventoryItem(id, req.body);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: error.message || 'Gagal memperbarui alat inventaris.' });
  }
});

app.delete('/api/inventory/:id', requireAdminRole, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteInventoryItem(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: error.message || 'Gagal menghapus alat inventaris.' });
  }
});

// User sync (upon Firebase sign in)
app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const dbUser = await getOrCreateUser(user.uid, user.email || '', user.name);
    res.json({ success: true, user: dbUser });
  } catch (error: any) {
    console.error('Failed to sync user:', error);
    res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

// Lab Rooms (Public monitoring overview)
app.get('/api/rooms', async (_req, res) => {
  try {
    const rooms = await getLabRooms();
    res.json(rooms);
  } catch (error: any) {
    console.error('Error in /api/rooms:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch lab rooms' });
  }
});

// =======================================================
// JOURNALS & REVIEW HISTORY
// =======================================================
// Get all journals (for Admin/Laboran)
app.get('/api/journals', async (_req, res) => {
  try {
    const journalList = await getJournals();
    res.json(journalList);
  } catch (error: any) {
    console.error('Error in /api/journals:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch journals' });
  }
});

// Get journals for the logged-in teacher (role: GURU)
app.get('/api/journals/me', async (req, res) => {
  try {
    const teacherCode = (req.query.teacherCode || req.headers['x-teacher-code']) as string;
    if (!teacherCode) {
      return res.status(400).json({ error: 'Parameter teacherCode wajib disertakan.' });
    }
    const myJournals = await getJournalsByTeacher(teacherCode);
    res.json(myJournals);
  } catch (error: any) {
    console.error('Error in /api/journals/me:', error);
    res.status(500).json({ error: error.message || 'Gagal mengambil jurnal guru.' });
  }
});

// Get single journal with review history
app.get('/api/journals/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const journal = await getJournalById(id);
    if (!journal) {
      return res.status(404).json({ error: 'Jurnal tidak ditemukan.' });
    }
    res.json(journal);
  } catch (error: any) {
    console.error('Error in GET /api/journals/:id:', error);
    res.status(500).json({ error: error.message || 'Gagal mengambil detail jurnal.' });
  }
});

// Teacher submits new journal
app.post('/api/journals', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userUid = req.user?.uid;
    const newJournal = await createJournal(req.body, userUid);
    res.status(201).json(newJournal);
  } catch (error: any) {
    console.error('Error in POST /api/journals:', error);
    res.status(500).json({ error: error.message || 'Failed to create journal' });
  }
});

// Admin/Laboran reviews journal (approve / request correction)
app.post('/api/journals/:id/reviews', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, notes, reviewerName, reviewerRole, reviewerCode } = req.body;
    if (!status || !['REVIEWED', 'NEEDS_CORRECTION'].includes(status)) {
      return res.status(400).json({ error: "Status review harus 'REVIEWED' atau 'NEEDS_CORRECTION'." });
    }
    const updated = await reviewJournal(
      id,
      status,
      notes || '',
      reviewerName || 'Laboran',
      reviewerRole || 'LABORAN',
      reviewerCode
    );
    res.json(updated);
  } catch (error: any) {
    console.error('Error in POST /api/journals/:id/reviews:', error);
    res.status(500).json({ error: error.message || 'Gagal menyimpan review jurnal.' });
  }
});

// Teacher resubmits corrected journal
app.post('/api/journals/:id/resubmit', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { updatedData, resubmissionNotes, teacherName } = req.body;
    const updated = await resubmitJournal(id, updatedData || {}, resubmissionNotes, teacherName);
    res.json(updated);
  } catch (error: any) {
    console.error('Error in POST /api/journals/:id/resubmit:', error);
    res.status(500).json({ error: error.message || 'Gagal mengirim ulang jurnal.' });
  }
});

// Legacy status route
app.patch('/api/journals/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, notes, reviewerName, reviewerRole } = req.body;
    const updated = await reviewJournal(id, status, notes, reviewerName, reviewerRole);
    res.json(updated);
  } catch (error: any) {
    console.error('Error in PATCH /api/journals/:id/status:', error);
    res.status(500).json({ error: error.message || 'Failed to update journal' });
  }
});

// =======================================================
// INCIDENTS
// =======================================================
app.get('/api/incidents', async (_req, res) => {
  try {
    const incidentList = await getIncidents();
    res.json(incidentList);
  } catch (error: any) {
    console.error('Error in /api/incidents:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch incidents' });
  }
});

app.post('/api/incidents', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const newIncident = await createIncident(req.body);
    res.status(201).json(newIncident);
  } catch (error: any) {
    console.error('Error in POST /api/incidents:', error);
    res.status(500).json({ error: error.message || 'Failed to create incident' });
  }
});

app.patch('/api/incidents/:id/status', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    const updated = await updateIncidentStatus(id, status);
    res.json(updated);
  } catch (error: any) {
    console.error('Error in PATCH /api/incidents/:id/status:', error);
    res.status(500).json({ error: error.message || 'Failed to update incident' });
  }
});

async function startServer() {
  // Seed sample data in background if empty
  seedInitialDataIfEmpty().catch((err) => console.error("Data seed check warning:", err));

  // Vite middleware for dev or static for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
