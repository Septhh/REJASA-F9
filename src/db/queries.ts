import { db } from './index.ts';
import {
  users,
  adminUsers,
  labRooms,
  journals,
  incidents,
  teachers,
  labSchedules,
  qrCodes,
  journalReviews,
  inventoryItems,
} from './schema.ts';
import { eq, desc, asc, and, ilike, or } from 'drizzle-orm';
import { INITIAL_ROOMS } from '../data/labData.ts';
import { DEFAULT_INVENTORY } from '../data/inventoryData.ts';
import { DEFAULT_TEACHERS } from '../data/teacherData.ts';
import crypto from 'crypto';

// Password hashing utility with SHA-256 + salt
export function hashPassword(password: string): string {
  const salt = 'rejasa_lab_salt_2026';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// Verify password
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Admin management queries
export async function authenticateAdmin(adminCode: string, passwordAttempt: string) {
  try {
    const formattedCode = adminCode.trim().toUpperCase();
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.adminCode, formattedCode))
      .limit(1);

    if (!admin) {
      return { success: false, error: `Kode Admin '${formattedCode}' tidak terdaftar.` };
    }

    if (!admin.isActive) {
      return { success: false, error: `Akun Admin '${formattedCode}' dinonaktifkan.` };
    }

    const isValid = verifyPassword(passwordAttempt, admin.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Password otorisasi salah.' };
    }

    // Update lastLoginAt
    await db
      .update(adminUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(adminUsers.id, admin.id));

    return {
      success: true,
      admin: {
        id: admin.id,
        adminCode: admin.adminCode,
        name: admin.name,
        role: admin.role,
      },
    };
  } catch (error) {
    console.error('Error authenticating admin:', error);
    throw new Error('Gagal memverifikasi kredensial admin.', { cause: error });
  }
}

export async function getAllAdmins() {
  try {
    const list = await db.select({
      id: adminUsers.id,
      adminCode: adminUsers.adminCode,
      name: adminUsers.name,
      role: adminUsers.role,
      isActive: adminUsers.isActive,
      lastLoginAt: adminUsers.lastLoginAt,
      createdAt: adminUsers.createdAt,
    }).from(adminUsers).orderBy(adminUsers.adminCode);
    return list;
  } catch (error) {
    console.error('Error fetching admins:', error);
    throw new Error('Gagal mengambil daftar admin.', { cause: error });
  }
}

export async function createOrUpdateAdmin(data: {
  adminCode: string;
  name: string;
  password?: string;
  role?: string;
}) {
  try {
    const formattedCode = data.adminCode.trim().toUpperCase();
    const existing = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.adminCode, formattedCode))
      .limit(1);

    if (existing.length > 0) {
      // Update existing admin
      const updateData: any = {
        name: data.name,
        role: data.role || existing[0].role,
        updatedAt: new Date(),
      };
      if (data.password && data.password.trim() !== '') {
        updateData.passwordHash = hashPassword(data.password);
      }
      const updated = await db
        .update(adminUsers)
        .set(updateData)
        .where(eq(adminUsers.adminCode, formattedCode))
        .returning({
          id: adminUsers.id,
          adminCode: adminUsers.adminCode,
          name: adminUsers.name,
          role: adminUsers.role,
        });
      return updated[0];
    } else {
      // Create new admin
      if (!data.password || data.password.trim() === '') {
        throw new Error('Password wajib diisi untuk admin baru.');
      }
      const created = await db
        .insert(adminUsers)
        .values({
          adminCode: formattedCode,
          name: data.name,
          passwordHash: hashPassword(data.password),
          role: data.role || 'Laboran',
        })
        .returning({
          id: adminUsers.id,
          adminCode: adminUsers.adminCode,
          name: adminUsers.name,
          role: adminUsers.role,
        });
      return created[0];
    }
  } catch (error) {
    console.error('Error creating/updating admin:', error);
    throw error;
  }
}

export async function updateAdminPassword(adminCode: string, oldPassword: string, newPassword: string) {
  try {
    const authResult = await authenticateAdmin(adminCode, oldPassword);
    if (!authResult.success) {
      return authResult;
    }
    await db
      .update(adminUsers)
      .set({
        passwordHash: hashPassword(newPassword),
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.adminCode, adminCode.trim().toUpperCase()));

    return { success: true };
  } catch (error) {
    console.error('Error updating admin password:', error);
    throw error;
  }
}

// ==========================================
// TEACHER QUERIES (Role: GURU)
// ==========================================
export async function authenticateTeacher(rawCode: string) {
  try {
    const trimmed = rawCode.trim().toUpperCase();
    
    // Support aliases: ML -> GUR-IPA-01, KP1 -> GUR-FIS-02, SK -> GUR-KIM-03
    const aliasMap: Record<string, string> = {
      'ML': 'GUR-IPA-01',
      'KP1': 'GUR-FIS-02',
      'SK': 'GUR-KIM-03',
      'KOM': 'GUR-KOM-04',
      'BHS': 'GUR-BHS-05',
    };

    const targetCode = aliasMap[trimmed] || trimmed;

    const [teacher] = await db
      .select()
      .from(teachers)
      .where(or(
        eq(teachers.teacherCode, targetCode),
        ilike(teachers.teacherCode, trimmed)
      ))
      .limit(1);

    if (!teacher) {
      return { success: false, error: `Kode Guru '${rawCode}' tidak terdaftar dalam sistem.` };
    }

    if (teacher.status !== 'ACTIVE') {
      return { success: false, error: `Akun Guru '${teacher.name}' sedang non-aktif.` };
    }

    return {
      success: true,
      teacher: {
        id: String(teacher.id),
        teacherCode: teacher.teacherCode,
        name: teacher.name,
        nip: teacher.nip || undefined,
        subject: teacher.subject,
        primaryLab: teacher.primaryLab as any,
        status: teacher.status as any,
        phone: teacher.phone || undefined,
        avatarColor: teacher.avatarColor,
        joinedDate: teacher.createdAt ? teacher.createdAt.toISOString().slice(0, 10) : '2026-01-01',
      },
    };
  } catch (error) {
    console.error('Error authenticating teacher:', error);
    throw new Error('Gagal memverifikasi kode guru.', { cause: error });
  }
}

export async function getAllTeachers() {
  try {
    const list = await db.select().from(teachers).orderBy(asc(teachers.teacherCode));
    return list.map(t => ({
      id: String(t.id),
      teacherCode: t.teacherCode,
      name: t.name,
      nip: t.nip || undefined,
      subject: t.subject,
      primaryLab: t.primaryLab as any,
      status: t.status as any,
      phone: t.phone || undefined,
      avatarColor: t.avatarColor,
      joinedDate: t.createdAt ? t.createdAt.toISOString().slice(0, 10) : '2026-01-01',
    }));
  } catch (error) {
    console.error('Error fetching teachers:', error);
    throw new Error('Gagal mengambil daftar guru.', { cause: error });
  }
}

export async function createTeacher(data: {
  teacherCode: string;
  name: string;
  nip?: string;
  subject: string;
  primaryLab: string;
  phone?: string;
  avatarColor?: string;
}) {
  try {
    const created = await db
      .insert(teachers)
      .values({
        teacherCode: data.teacherCode.trim().toUpperCase(),
        name: data.name.trim(),
        nip: data.nip?.trim() || null,
        subject: data.subject.trim(),
        primaryLab: data.primaryLab,
        status: 'ACTIVE',
        phone: data.phone?.trim() || null,
        avatarColor: data.avatarColor || 'bg-emerald-700',
      })
      .returning();
    return created[0];
  } catch (error) {
    console.error('Error creating teacher:', error);
    throw error;
  }
}

export async function updateTeacher(id: number, data: Partial<{
  name: string;
  nip?: string;
  subject: string;
  primaryLab: string;
  status: string;
  phone?: string;
}>) {
  try {
    const updated = await db
      .update(teachers)
      .set(data as any)
      .where(eq(teachers.id, id))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Error updating teacher:', error);
    throw error;
  }
}

export async function deleteTeacher(id: number) {
  try {
    await db.delete(teachers).where(eq(teachers.id, id));
    return { success: true };
  } catch (error) {
    console.error('Error deleting teacher:', error);
    throw error;
  }
}

// ==========================================
// QR CODE & LAB IDENTIFICATION
// ==========================================
export async function getLabByQRToken(token: string) {
  try {
    const trimmed = token.trim();
    const [found] = await db
      .select()
      .from(qrCodes)
      .where(eq(qrCodes.token, trimmed))
      .limit(1);

    const labCode = found ? found.labCode : (trimmed.replace('QR-LAB-', '') as any);

    // Fetch lab room
    const [room] = await db
      .select()
      .from(labRooms)
      .where(eq(labRooms.badgeCode, labCode))
      .limit(1);

    // Fetch schedules for this lab
    const schedules = await db
      .select()
      .from(labSchedules)
      .where(eq(labSchedules.labCode, labCode))
      .orderBy(asc(labSchedules.id));

    const labNameMap: Record<string, string> = {
      BIO: 'Lab Biologi Terpadu',
      FIS: 'Lab Fisika Modern',
      KIM: 'Lab Kimia Anorganik',
      COM: 'Lab Komputer Sains',
      BSM: 'Smartclass & Bahasa',
    };

    return {
      valid: true,
      token: trimmed,
      lab: {
        code: labCode,
        name: room?.name || labNameMap[labCode] || `Laboratorium ${labCode}`,
        schoolName: 'SMAN 3 Salatiga',
        status: room?.status || 'Standby',
        statusDetail: room?.statusDetail || 'Ruangan siap digunakan.',
        workstations: room?.workstations || 36,
      },
      schedules: schedules.map(s => ({
        id: s.id,
        timeSlot: s.timeSlot,
        className: s.className,
        subject: s.subject,
        teacherCode: s.teacherCode,
        teacherName: s.teacherName,
        topic: s.topic,
      })),
    };
  } catch (error) {
    console.error('Error resolving QR token:', error);
    throw new Error('Gagal mengidentifikasi laboratorium dari QR.', { cause: error });
  }
}

export async function getAllQRCodes() {
  try {
    return await db.select().from(qrCodes).orderBy(asc(qrCodes.labCode));
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    throw error;
  }
}

export async function createOrRegisterQRCode(labCode: string, title?: string) {
  try {
    const token = `QR-LAB-${labCode.toUpperCase()}`;
    const labNameMap: Record<string, string> = {
      BIO: 'Lab Biologi Terpadu',
      FIS: 'Lab Fisika Modern',
      KIM: 'Lab Kimia Anorganik',
      COM: 'Lab Komputer Sains',
      BSM: 'Smartclass & Bahasa',
    };
    const [existing] = await db.select().from(qrCodes).where(eq(qrCodes.token, token)).limit(1);
    if (existing) return existing;

    const [created] = await db.insert(qrCodes).values({
      token,
      labCode: labCode.toUpperCase(),
      labName: labNameMap[labCode.toUpperCase()] || `Laboratorium ${labCode}`,
      title: title || `QR Pintu ${labNameMap[labCode.toUpperCase()] || labCode}`,
    }).returning();
    return created;
  } catch (error) {
    console.error('Error creating QR code:', error);
    throw error;
  }
}

// ==========================================
// SCHEDULES
// ==========================================
export async function getSchedulesForLab(labCode: string) {
  try {
    return await db.select().from(labSchedules).where(eq(labSchedules.labCode, labCode.toUpperCase()));
  } catch (error) {
    console.error('Error fetching schedules:', error);
    throw error;
  }
}

// ==========================================
// JOURNALS & REVIEW HISTORY
// ==========================================
export async function getJournals() {
  try {
    const list = await db.select().from(journals).orderBy(desc(journals.createdAt));
    
    // Attach review history for each journal
    const allReviews = await db.select().from(journalReviews).orderBy(asc(journalReviews.createdAt));
    const reviewsByJournalId: Record<number, any[]> = {};
    for (const r of allReviews) {
      if (!reviewsByJournalId[r.journalId]) reviewsByJournalId[r.journalId] = [];
      reviewsByJournalId[r.journalId].push(r);
    }

    return list.map(j => ({
      ...j,
      id: String(j.id),
      reviews: reviewsByJournalId[j.id] || [],
    }));
  } catch (error) {
    console.error("Error fetching journals:", error);
    throw new Error("Gagal mengambil data jurnal.", { cause: error });
  }
}

export async function getJournalsByTeacher(teacherCode: string) {
  try {
    const trimmed = teacherCode.trim().toUpperCase();
    const list = await db
      .select()
      .from(journals)
      .where(ilike(journals.teacherCode, trimmed))
      .orderBy(desc(journals.createdAt));

    const allReviews = await db.select().from(journalReviews).orderBy(asc(journalReviews.createdAt));
    const reviewsByJournalId: Record<number, any[]> = {};
    for (const r of allReviews) {
      if (!reviewsByJournalId[r.journalId]) reviewsByJournalId[r.journalId] = [];
      reviewsByJournalId[r.journalId].push(r);
    }

    return list.map(j => ({
      ...j,
      id: String(j.id),
      reviews: reviewsByJournalId[j.id] || [],
    }));
  } catch (error) {
    console.error("Error fetching journals for teacher:", error);
    throw error;
  }
}

export async function getJournalById(id: number) {
  try {
    const [journal] = await db.select().from(journals).where(eq(journals.id, id)).limit(1);
    if (!journal) return null;

    const reviews = await db
      .select()
      .from(journalReviews)
      .where(eq(journalReviews.journalId, id))
      .orderBy(asc(journalReviews.createdAt));

    return {
      ...journal,
      id: String(journal.id),
      reviews,
    };
  } catch (error) {
    console.error("Error fetching journal by id:", error);
    throw error;
  }
}

export async function createJournal(entry: any, userUid?: string) {
  try {
    // Generate robust journal code: JR-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = entry.code || `JR-${dateStr}-${randSuffix}`;

    const [created] = await db.insert(journals).values({
      code,
      session: entry.session || '07:30 - 09:00 WIB',
      time: entry.time || '07:30 WIB',
      labCode: entry.labCode,
      labName: entry.labName,
      teacherCode: entry.teacherCode || null,
      teacherName: entry.teacherName,
      teacherInitials: entry.teacherInitials || entry.teacherName.slice(0, 2).toUpperCase(),
      teacherAvatarColor: entry.teacherAvatarColor || 'bg-emerald-700',
      className: entry.className,
      subject: entry.subject || null,
      topic: entry.topic,
      status: 'SUBMITTED', // Initial status is always SUBMITTED
      notes: entry.notes || null,
      studentsCount: entry.studentsCount || 32,
      conditionBefore: entry.conditionBefore || 'Baik',
      conditionAfter: entry.conditionAfter || 'Baik',
      issueType: entry.issueType || null,
      issueDescription: entry.issueDescription || null,
      sopComplied: entry.sopComplied ?? true,
      incidentReported: entry.incidentReported || null,
      submittedByUid: userUid || null,
    }).returning();

    // Automatically record initial submission in journal_reviews
    await db.insert(journalReviews).values({
      journalId: created.id,
      reviewerRole: 'GURU',
      reviewerName: created.teacherName,
      reviewerCode: created.teacherCode || undefined,
      status: 'SUBMITTED',
      notes: 'Jurnal praktikum berhasil disubmit oleh guru.',
    });

    const reviews = await db.select().from(journalReviews).where(eq(journalReviews.journalId, created.id));
    return {
      ...created,
      id: String(created.id),
      reviews,
    };
  } catch (error) {
    console.error("Error creating journal:", error);
    throw new Error("Gagal menyimpan jurnal.", { cause: error });
  }
}

// Review action by Admin/Laboran
export async function reviewJournal(
  id: number,
  status: 'REVIEWED' | 'NEEDS_CORRECTION',
  notes: string,
  reviewerName: string = 'Laboran',
  reviewerRole: 'LABORAN' | 'ADMIN' = 'LABORAN',
  reviewerCode?: string
) {
  try {
    const [updated] = await db
      .update(journals)
      .set({
        status,
        notes: notes || undefined,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(journals.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Jurnal dengan ID ${id} tidak ditemukan.`);
    }

    // Insert review audit log entry
    await db.insert(journalReviews).values({
      journalId: updated.id,
      reviewerRole,
      reviewerName,
      reviewerCode: reviewerCode || null,
      status,
      notes: notes || (status === 'REVIEWED' ? 'Jurnal disahkan dan diverifikasi.' : 'Perlu koreksi dari guru pengampu.'),
    });

    const reviews = await db
      .select()
      .from(journalReviews)
      .where(eq(journalReviews.journalId, updated.id))
      .orderBy(asc(journalReviews.createdAt));

    return {
      ...updated,
      id: String(updated.id),
      reviews,
    };
  } catch (error) {
    console.error("Error reviewing journal:", error);
    throw error;
  }
}

// Resubmit action by Teacher after correction
export async function resubmitJournal(
  id: number,
  updatedData: Partial<{
    topic: string;
    notes: string;
    className: string;
    studentsCount: number;
    conditionBefore: string;
    conditionAfter: string;
    issueType: string;
    issueDescription: string;
  }>,
  resubmissionNotes?: string,
  teacherName: string = 'Guru'
) {
  try {
    const [updated] = await db
      .update(journals)
      .set({
        ...updatedData,
        status: 'SUBMITTED', // Return to SUBMITTED state
        updatedAt: new Date(),
      })
      .where(eq(journals.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Jurnal dengan ID ${id} tidak ditemukan.`);
    }

    // Insert resubmit audit log entry
    await db.insert(journalReviews).values({
      journalId: updated.id,
      reviewerRole: 'GURU',
      reviewerName: teacherName || updated.teacherName,
      reviewerCode: updated.teacherCode || null,
      status: 'SUBMITTED',
      notes: resubmissionNotes || 'Jurnal diperbaiki dan dikirim ulang oleh guru.',
    });

    const reviews = await db
      .select()
      .from(journalReviews)
      .where(eq(journalReviews.journalId, updated.id))
      .orderBy(asc(journalReviews.createdAt));

    return {
      ...updated,
      id: String(updated.id),
      reviews,
    };
  } catch (error) {
    console.error("Error resubmitting journal:", error);
    throw error;
  }
}

export async function getReviewsByJournalId(journalId: number) {
  try {
    return await db
      .select()
      .from(journalReviews)
      .where(eq(journalReviews.journalId, journalId))
      .orderBy(asc(journalReviews.createdAt));
  } catch (error) {
    console.error("Error fetching reviews for journal:", error);
    throw error;
  }
}

export async function updateJournal(
  id: number,
  updates: Partial<{
    topic: string;
    notes: string;
    className: string;
    studentsCount: number;
    conditionBefore: string;
    conditionAfter: string;
    issueType: string;
    issueDescription: string;
    status: 'DRAFT' | 'NEEDS_CORRECTION' | 'SUBMITTED' | 'REVIEWED';
  }>
) {
  try {
    const [updated] = await db
      .update(journals)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(journals.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Jurnal dengan ID ${id} tidak ditemukan.`);
    }

    const reviews = await db
      .select()
      .from(journalReviews)
      .where(eq(journalReviews.journalId, updated.id))
      .orderBy(asc(journalReviews.createdAt));

    return {
      ...updated,
      id: String(updated.id),
      reviews,
    };
  } catch (error) {
    console.error("Error updating journal:", error);
    throw error;
  }
}

export async function updateJournalStatus(id: number, status: string, notes?: string, userUid?: string) {
  return reviewJournal(id, status as any, notes || '', 'Laboran', 'LABORAN');
}

// ==========================================
// INVENTORY (ADMIN ONLY - SERVER SIDE RESTRICTED)
// ==========================================
export async function getInventoryItems(labCode?: string) {
  try {
    if (labCode && labCode !== 'ALL') {
      return await db
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.labCode, labCode.toUpperCase()))
        .orderBy(asc(inventoryItems.itemCode));
    }
    return await db.select().from(inventoryItems).orderBy(asc(inventoryItems.itemCode));
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    throw error;
  }
}

export async function createInventoryItem(item: any) {
  try {
    const [created] = await db.insert(inventoryItems).values({
      itemCode: item.itemCode.trim().toUpperCase(),
      name: item.name.trim(),
      brandModel: item.brandModel?.trim() || '-',
      labCode: item.labCode.toUpperCase(),
      category: item.category,
      quantityTotal: Number(item.quantityTotal) || 0,
      quantityGood: Number(item.quantityGood) || 0,
      quantityMinorDamage: Number(item.quantityMinorDamage) || 0,
      quantityHeavyDamage: Number(item.quantityHeavyDamage) || 0,
      status: item.status || 'Tersedia',
      storageLocation: item.storageLocation || 'Rak Penyimpanan',
      procurementYear: Number(item.procurementYear) || 2024,
      fundingSource: item.fundingSource || 'Dana BOS',
      specs: item.specs || '',
      unit: item.unit || 'Unit',
      lastInspectedAt: item.lastInspectedAt || new Date().toISOString().slice(0, 10),
      inspectedBy: item.inspectedBy || 'Laboran',
      notes: item.notes || null,
    }).returning();
    return created;
  } catch (error) {
    console.error("Error creating inventory item:", error);
    throw error;
  }
}

export async function updateInventoryItem(id: number, item: any) {
  try {
    const [updated] = await db
      .update(inventoryItems)
      .set({
        ...item,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, id))
      .returning();
    return updated;
  } catch (error) {
    console.error("Error updating inventory item:", error);
    throw error;
  }
}

export async function deleteInventoryItem(id: number) {
  try {
    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    throw error;
  }
}

// User helper
export async function getOrCreateUser(uid: string, email: string, name?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        name: name || email.split('@')[0],
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          name: name || email.split('@')[0],
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database user sync failed:", error);
    throw new Error("Failed to synchronize user.", { cause: error });
  }
}

// Seed initial rooms and sample data if database is empty
export async function seedInitialDataIfEmpty() {
  try {
    const existingRooms = await db.select().from(labRooms).limit(1);
    if (existingRooms.length === 0) {
      console.log("Seeding initial lab rooms into Cloud SQL...");
      for (const room of INITIAL_ROOMS) {
        await db.insert(labRooms).values({
          code: room.code,
          name: room.name,
          badgeCode: room.badgeCode,
          badgeBg: room.badgeBg,
          badgeColor: room.badgeColor,
          status: room.status,
          statusType: room.statusType,
          className: room.className,
          topic: room.topic,
          teacher: room.teacher,
          statusDetail: room.statusDetail,
          statusDetailType: room.statusDetailType,
          workstations: room.workstations || 36,
        }).onConflictDoNothing();
      }
    }

    // Seed default admin accounts with distinct authorization passwords (hashed)
    const existingAdmins = await db.select().from(adminUsers).limit(1);
    if (existingAdmins.length === 0) {
      console.log("Seeding default admin accounts (RDT1, ADM2, LAB01)...");
      const defaultAdmins = [
        {
          adminCode: 'RDT1',
          name: 'Raditya Aditama',
          password: 'password123',
          role: 'Admin Utama',
        },
        {
          adminCode: 'ADM2',
          name: 'Budi Santoso, S.Pd',
          password: 'labadmin2026',
          role: 'Laboran Senior',
        },
        {
          adminCode: 'LAB01',
          name: 'Siti Rahmawati, S.Si',
          password: 'otorisasi99',
          role: 'Laboran Biologi',
        },
      ];

      for (const admin of defaultAdmins) {
        await db.insert(adminUsers).values({
          adminCode: admin.adminCode,
          name: admin.name,
          passwordHash: hashPassword(admin.password),
          role: admin.role,
        }).onConflictDoNothing();
      }
    }

    // Seed default teachers (ML, KP1, SK, GUR-IPA-01, etc.)
    const existingTeachers = await db.select().from(teachers).limit(1);
    if (existingTeachers.length === 0) {
      console.log("Seeding default teachers into Cloud SQL...");
      for (const t of DEFAULT_TEACHERS) {
        await db.insert(teachers).values({
          teacherCode: t.teacherCode,
          name: t.name,
          nip: t.nip || null,
          subject: t.subject,
          primaryLab: t.primaryLab,
          status: t.status,
          phone: t.phone || null,
          avatarColor: t.avatarColor,
        }).onConflictDoNothing();
      }
    }

    // Seed QR codes for all 5 labs
    const existingQRs = await db.select().from(qrCodes).limit(1);
    if (existingQRs.length === 0) {
      console.log("Seeding lab QR codes into Cloud SQL...");
      const labList = [
        { code: 'BIO', name: 'Lab Biologi Terpadu' },
        { code: 'FIS', name: 'Lab Fisika Modern' },
        { code: 'KIM', name: 'Lab Kimia Anorganik' },
        { code: 'COM', name: 'Lab Komputer Sains' },
        { code: 'BSM', name: 'Smartclass & Bahasa' },
      ];
      for (const lab of labList) {
        await db.insert(qrCodes).values({
          token: `QR-LAB-${lab.code}`,
          labCode: lab.code,
          labName: lab.name,
          title: `QR Pintu ${lab.name}`,
        }).onConflictDoNothing();
      }
    }

    // Seed lab schedules (Jadwal Penggunaan)
    const existingSchedules = await db.select().from(labSchedules).limit(1);
    if (existingSchedules.length === 0) {
      console.log("Seeding lab schedules into Cloud SQL...");
      const schedules = [
        {
          labCode: 'BIO',
          dayOfWeek: 'Jumat',
          date: '2026-09-18',
          timeSlot: '08.00–10.00 WIB',
          className: 'XI IPA 1',
          subject: 'Biologi',
          teacherCode: 'GUR-IPA-01',
          teacherName: 'Drs. Bambang Haryanto, M.Pd.',
          topic: 'Pengamatan Jaringan Daun Tumbuhan C3 & C4',
        },
        {
          labCode: 'FIS',
          dayOfWeek: 'Jumat',
          date: '2026-09-18',
          timeSlot: '10.15–12.00 WIB',
          className: 'XII MIPA 2',
          subject: 'Fisika',
          teacherCode: 'GUR-FIS-02',
          teacherName: 'Dra. Siti Nurhaliza, M.Si.',
          topic: 'Percobaan Resonansi Gelombang Bunyi',
        },
        {
          labCode: 'KIM',
          dayOfWeek: 'Jumat',
          date: '2026-09-18',
          timeSlot: '13.00–14.30 WIB',
          className: 'XI MIPA 3',
          subject: 'Kimia',
          teacherCode: 'GUR-KIM-03',
          teacherName: 'Hendra Wijaya, S.Si., M.Pd.',
          topic: 'Titrasi Asam-Basa Menggunakan Indikator Alami',
        },
        {
          labCode: 'COM',
          dayOfWeek: 'Jumat',
          date: '2026-09-18',
          timeSlot: '07.30–09.30 WIB',
          className: 'X-4',
          subject: 'Informatika',
          teacherCode: 'GUR-KOM-04',
          teacherName: 'Raditya Pratama, S.Kom., M.T.',
          topic: 'Simulasi Topologi Jaringan & Subnetting',
        },
        {
          labCode: 'BSM',
          dayOfWeek: 'Jumat',
          date: '2026-09-18',
          timeSlot: '09.30–11.00 WIB',
          className: 'XI Bahasa',
          subject: 'Smart Multimedia',
          teacherCode: 'GUR-BHS-05',
          teacherName: 'Nurul Aisyah, S.Pd., M.Hum.',
          topic: 'Interactive English Listening Comprehension',
        },
      ];
      for (const s of schedules) {
        await db.insert(labSchedules).values(s).onConflictDoNothing();
      }
    }

    // Seed inventory items into Cloud SQL
    const existingInventory = await db.select().from(inventoryItems).limit(1);
    if (existingInventory.length === 0) {
      console.log("Seeding inventory items into Cloud SQL...");
      for (const item of DEFAULT_INVENTORY) {
        await db.insert(inventoryItems).values({
          itemCode: item.itemCode,
          name: item.name,
          brandModel: item.brandModel,
          labCode: item.labCode,
          category: item.category,
          quantityTotal: item.quantityTotal,
          quantityGood: item.quantityGood,
          quantityMinorDamage: item.quantityMinorDamage,
          quantityHeavyDamage: item.quantityHeavyDamage,
          status: item.status,
          storageLocation: item.storageLocation,
          procurementYear: item.procurementYear,
          fundingSource: item.fundingSource,
          specs: item.specs,
          unit: item.unit,
          lastInspectedAt: item.lastInspectedAt,
          inspectedBy: item.inspectedBy,
          notes: item.notes || null,
        }).onConflictDoNothing();
      }
    }

  } catch (error) {
    console.error("Initial data seeding notice:", error);
  }
}

// Lab Rooms
export async function getLabRooms() {
  try {
    return await db.select().from(labRooms);
  } catch (error) {
    console.error("Error fetching lab rooms:", error);
    throw new Error("Gagal mengambil data laboratorium.", { cause: error });
  }
}

// Incidents
export async function getIncidents() {
  try {
    return await db.select().from(incidents).orderBy(desc(incidents.createdAt));
  } catch (error) {
    console.error("Error fetching incidents:", error);
    throw new Error("Gagal mengambil data insiden.", { cause: error });
  }
}

export async function createIncident(item: any) {
  try {
    const result = await db.insert(incidents).values({
      assetCode: item.assetCode,
      time: item.time,
      title: item.title,
      description: item.description,
      reporter: item.reporter,
      className: item.className,
      labCode: item.labCode,
      photoUrl: item.photoUrl,
      photoAlt: item.photoAlt,
      status: item.status || 'Open',
      actionType: item.actionType || 'repair',
      actionLabel: item.actionLabel || 'Ajukan Servis',
    }).returning();
    return result[0];
  } catch (error) {
    console.error("Error creating incident:", error);
    throw new Error("Gagal mencatat insiden.", { cause: error });
  }
}

export async function updateIncidentStatus(id: number, status: 'Open' | 'Disposed' | 'Resolved') {
  try {
    const result = await db.update(incidents)
      .set({
        status,
        resolvedAt: status === 'Resolved' ? new Date() : undefined,
      })
      .where(eq(incidents.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error("Error updating incident status:", error);
    throw new Error("Gagal memperbarui status insiden.", { cause: error });
  }
}

