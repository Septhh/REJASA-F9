import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AdminProfile {
  id: number;
  adminCode: string;
  name: string;
  role: string;
}

interface AdminAuthContextType {
  admin: AdminProfile | null;
  loading: boolean;
  loginAdmin: (adminCode: string, passwordAttempt: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => void;
  refreshAdminSession: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  admin: null,
  loading: true,
  loginAdmin: async () => ({ success: false }),
  logoutAdmin: () => {},
  refreshAdminSession: () => {},
});

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore stored admin session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('rejasa_admin_session');
      if (stored) {
        setAdmin(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse admin session:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginAdmin = async (adminCode: string, passwordAttempt: string) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminCode, password: passwordAttempt }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.admin) {
        setAdmin(data.admin);
        localStorage.setItem('rejasa_admin_session', JSON.stringify(data.admin));
        return { success: true };
      }
      return { success: false, error: data.error || 'Autentikasi kode admin gagal.' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Koneksi ke server gagal.' };
    }
  };

  const logoutAdmin = () => {
    setAdmin(null);
    localStorage.removeItem('rejasa_admin_session');
  };

  const refreshAdminSession = () => {
    try {
      const stored = localStorage.getItem('rejasa_admin_session');
      if (stored) {
        setAdmin(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loading,
        loginAdmin,
        logoutAdmin,
        refreshAdminSession,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
