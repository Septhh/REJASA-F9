import React, { createContext, useContext, useState, useEffect } from 'react';
import { Teacher } from '../types';
import { DEFAULT_TEACHERS, getStoredTeachers, saveTeachers } from '../data/teacherData';

interface TeacherAuthContextType {
  currentTeacher: Teacher | null;
  teachers: Teacher[];
  loginWithTeacherCode: (code: string) => Promise<{ success: boolean; error?: string; teacher?: Teacher }>;
  logoutTeacher: () => void;
  addTeacher: (data: Omit<Teacher, 'id' | 'joinedDate'>) => { success: boolean; teacher?: Teacher; error?: string };
  updateTeacher: (id: string, updates: Partial<Teacher>) => { success: boolean; error?: string };
  deleteTeacher: (id: string) => { success: boolean; error?: string };
  resetDefaultTeachers: () => void;
}

const TeacherAuthContext = createContext<TeacherAuthContextType>({
  currentTeacher: null,
  teachers: [],
  loginWithTeacherCode: async () => ({ success: false }),
  logoutTeacher: () => {},
  addTeacher: () => ({ success: false }),
  updateTeacher: () => ({ success: false }),
  deleteTeacher: () => ({ success: false }),
  resetDefaultTeachers: () => {},
});

const SESSION_KEY = 'lab_active_teacher_session_v1';

export const TeacherAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);

  // Initialize teachers and session
  useEffect(() => {
    const loaded = getStoredTeachers();
    setTeachers(loaded);

    try {
      const storedSession = localStorage.getItem(SESSION_KEY);
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        // Verify still exists in teachers list
        const matched = loaded.find(t => t.id === parsed.id && t.status === 'ACTIVE');
        if (matched) {
          setCurrentTeacher(matched);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to restore teacher session:', e);
    }
  }, []);

  const loginWithTeacherCode = async (code: string): Promise<{ success: boolean; error?: string; teacher?: Teacher }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, error: 'Kode Guru wajib dimasukkan.' };
    }

    try {
      // Authenticate with server-side Cloud SQL endpoint
      const res = await fetch('/api/auth/teacher-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherCode: cleanCode }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.teacher) {
          const teacherObj: Teacher = {
            id: String(data.teacher.id),
            teacherCode: data.teacher.teacherCode,
            name: data.teacher.name,
            nip: data.teacher.nip || '',
            subject: data.teacher.subject,
            primaryLab: data.teacher.primaryLab,
            phone: data.teacher.phone || '',
            status: data.teacher.status || 'ACTIVE',
            joinedDate: data.teacher.createdAt ? data.teacher.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          };
          setCurrentTeacher(teacherObj);
          localStorage.setItem(SESSION_KEY, JSON.stringify(teacherObj));
          return { success: true, teacher: teacherObj };
        }
      }
    } catch (apiErr) {
      console.warn('Teacher login server fetch error, checking local fallback:', apiErr);
    }

    // Local fallback
    const found = teachers.find(t => t.teacherCode.trim().toUpperCase() === cleanCode);
    if (!found) {
      return {
        success: false,
        error: `Kode Guru "${cleanCode}" tidak terdaftar. Hubungi Admin untuk penambahan akun.`,
      };
    }

    if (found.status === 'INACTIVE') {
      return {
        success: false,
        error: `Akun Guru "${found.name}" (${cleanCode}) sedang dinonaktifkan oleh Admin.`,
      };
    }

    setCurrentTeacher(found);
    localStorage.setItem(SESSION_KEY, JSON.stringify(found));
    return { success: true, teacher: found };
  };

  const logoutTeacher = () => {
    setCurrentTeacher(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const addTeacher = (data: Omit<Teacher, 'id' | 'joinedDate'>) => {
    const cleanCode = data.teacherCode.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, error: 'Kode Guru tidak boleh kosong.' };
    }

    // Check unique code
    const existing = teachers.find(t => t.teacherCode.trim().toUpperCase() === cleanCode);
    if (existing) {
      return { success: false, error: `Kode Guru "${cleanCode}" sudah digunakan oleh ${existing.name}.` };
    }

    const newTeacher: Teacher = {
      ...data,
      id: `tch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      teacherCode: cleanCode,
      name: data.name.trim(),
      joinedDate: new Date().toISOString().slice(0, 10),
    };

    const updated = [newTeacher, ...teachers];
    setTeachers(updated);
    saveTeachers(updated);

    return { success: true, teacher: newTeacher };
  };

  const updateTeacher = (id: string, updates: Partial<Teacher>) => {
    if (updates.teacherCode) {
      const cleanCode = updates.teacherCode.trim().toUpperCase();
      const conflict = teachers.find(t => t.id !== id && t.teacherCode.trim().toUpperCase() === cleanCode);
      if (conflict) {
        return { success: false, error: `Kode Guru "${cleanCode}" sudah digunakan oleh guru lain.` };
      }
      updates.teacherCode = cleanCode;
    }

    const updated = teachers.map(t => {
      if (t.id === id) {
        const merged = { ...t, ...updates };
        if (currentTeacher?.id === id) {
          setCurrentTeacher(merged);
          localStorage.setItem(SESSION_KEY, JSON.stringify(merged));
        }
        return merged;
      }
      return t;
    });

    setTeachers(updated);
    saveTeachers(updated);
    return { success: true };
  };

  const deleteTeacher = (id: string) => {
    const updated = teachers.filter(t => t.id !== id);
    setTeachers(updated);
    saveTeachers(updated);

    if (currentTeacher?.id === id) {
      logoutTeacher();
    }
    return { success: true };
  };

  const resetDefaultTeachers = () => {
    setTeachers(DEFAULT_TEACHERS);
    saveTeachers(DEFAULT_TEACHERS);
    logoutTeacher();
  };

  return (
    <TeacherAuthContext.Provider
      value={{
        currentTeacher,
        teachers,
        loginWithTeacherCode,
        logoutTeacher,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        resetDefaultTeachers,
      }}
    >
      {children}
    </TeacherAuthContext.Provider>
  );
};

export const useTeacherAuth = () => useContext(TeacherAuthContext);
