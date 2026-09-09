'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoading && !user && !isLoginPage) {
      router.replace('/login');
    }
  }, [user, isLoading, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
        <p>Memuat HiFeed SCOM...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
        <p>Mengarahkan ke halaman login...</p>
      </div>
    );
  }

  if (user.role !== 'supervisor') {
    return (
      <div className="access-blocked-screen">
        <div className="access-blocked-card">
          <div className="access-blocked-icon-wrapper">
            <span className="access-blocked-icon">🚫</span>
          </div>

          <h2 className="access-blocked-title">Akses Dashboard Dibatasi</h2>

          <p className="access-blocked-subtitle">
            Akun Anda terdaftar sebagai <strong>{user.name}</strong> (<span className="alert-role-tag">Staff Lapangan</span>).
          </p>

          <div className="access-blocked-message-box">
            <p>
              Staff Lapangan <strong>tidak diizinkan</strong> mengakses data dashboard Supervisor Gudang.
            </p>
            <p style={{ marginTop: 8 }}>
              Sesuai dengan SOP operasional, Staff Lapangan <strong>diwajibkan menggunakan Aplikasi Mobile HiFeed Scanner</strong> pada smartphone untuk mencatat penerimaan (Inbound) maupun pemakaian (Dispatch).
            </p>
          </div>

          <button
            type="button"
            className="access-blocked-btn"
            onClick={logout}
          >
            Keluar & Kembali ke Halaman Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
