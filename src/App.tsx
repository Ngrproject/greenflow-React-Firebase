import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { JadwalPage } from './pages/Jadwal';
import { AnalisisPage } from './pages/Analisis';
import { PengaturanAlatPage } from './pages/PengaturanAlat';
import { AdminPage } from './pages/Admin';
import { useAuthStore, useUIStore } from './stores/index';
import { NotifikasiPage } from './pages/Notifikasi'; // Sesuaikan folder tempat kamu menyimpan file NotifikasiPage
import type { User } from './types';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">GreenFlow Dashboard</h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Memuat...</p>
      </div>
    </div>
  );
}

export default function App() {
  const { setUser } = useAuthStore();
  const { theme } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              role: 'viewer',
              deviceIds: [],
              createdAt: Date.now(),
              lastLoginAt: Date.now(),
            };
            setUser(newUser);
          }
          setFirestoreError(false);
        } catch (err: any) {
          const offlineUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            role: 'viewer',
            deviceIds: [],
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
          };
          setUser(offlineUser);
          setFirestoreError(true);
          if (err?.code === 'permission-denied' || err?.message?.includes('blocked')) {
            console.warn('Firestore blocked by browser/adblocker. Running in offline mode.');
          }
        }
      } else {
        setUser(null);
        setFirestoreError(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [setUser]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      {firestoreError && (
        <div className="fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 shadow-lg animate-slide-down">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-300 text-sm">Firestore tidak tersedia</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                Data user bersifat sementara (local). 
                <button onClick={() => setFirestoreError(false)} className="ml-2 underline">Tutup</button>
              </p>
            </div>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/jadwal" element={
            <ProtectedRoute requiredRole="operator"><JadwalPage /></ProtectedRoute>
          } />
          <Route path="/analisis" element={
            <ProtectedRoute><AnalisisPage /></ProtectedRoute>
          } />
          <Route path="/pengaturan-alat" element={
            <ProtectedRoute requiredRole="operator"><PengaturanAlatPage /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin"><AdminPage /></ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/notifikasi" element={<NotifikasiPage />} />
        </Route>
      </Routes>
    </>
  );
}