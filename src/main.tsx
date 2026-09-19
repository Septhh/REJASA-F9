import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AdminAuthProvider } from './context/AdminAuthContext.tsx';
import { TeacherAuthProvider } from './context/TeacherAuthContext.tsx';
import { InventoryProvider } from './context/InventoryContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminAuthProvider>
      <TeacherAuthProvider>
        <InventoryProvider>
          <App />
        </InventoryProvider>
      </TeacherAuthProvider>
    </AdminAuthProvider>
  </StrictMode>,
);
