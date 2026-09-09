'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Staff alert modal state
  const [staffAlertModal, setStaffAlertModal] = useState<{
    isOpen: boolean;
    name: string;
    id: string;
  } | null>(null);

  const { login, logout, user } = useAuth();
  const router = useRouter();

  // If already logged in as supervisor, redirect to dashboard
  // If logged in as field_operator, log them out and stay on login
  useEffect(() => {
    if (user) {
      if (user.role === 'supervisor') {
        router.replace('/');
      } else {
        // Staff detected in storage: clear it
        logout();
      }
    }
  }, [user, router, logout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) {
      setError('Harap isi User ID dan Password.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const loggedUser = await login(userId.trim(), password);

      // Check role: Staff Lapangan is forbidden from web dashboard!
      if (loggedUser.role !== 'supervisor') {
        // Clear token/session from web immediately
        logout();

        // Show alert modal prohibiting web access and directing to mobile app
        setStaffAlertModal({
          isOpen: true,
          name: loggedUser.name,
          id: loggedUser.id,
        });
        return;
      }

      // Supervisor proceeds to dashboard
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa User ID dan Password Anda.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillQuickAccount = (id: string, pass: string) => {
    setUserId(id);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="login-container">
      {/* Background ambient glow */}
      <div className="login-bg-glow" />

      <div className="login-card">
        {/* Header with Logo */}
        <div className="login-header">
          <div className="login-logo-wrapper">
            <img src="/hifeed_logo.png" alt="HiFeed Logo" className="login-logo" />
          </div>
          <h1 className="login-title">HiFeed SCOM</h1>
          <p className="login-subtitle">
            Supply Chain & Operations Management System
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="login-error-alert">
            <svg
              className="login-error-icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="userId" className="login-label">
              User ID
            </label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </span>
              <input
                id="userId"
                type="text"
                placeholder="Contoh: supervisor-01"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="login-input"
                autoComplete="username"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="password" className="login-label">
              Password
            </label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                autoComplete="current-password"
                disabled={submitting}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={submitting}
          >
            {submitting ? (
              <div className="login-btn-content">
                <span className="login-spinner" />
                <span>Memproses Masuk...</span>
              </div>
            ) : (
              <div className="login-btn-content">
                <span>Masuk ke Dashboard</span>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            )}
          </button>
        </form>

        {/* Demo Fast Logins */}
        <div className="login-demo-section">
          <div className="login-demo-divider">
            <span>Akun Uji Coba (Pilih Cepat)</span>
          </div>

          <div className="login-demo-grid">
            <button
              type="button"
              className="login-demo-card supervisor"
              onClick={() => fillQuickAccount('supervisor-01', 'super123')}
            >
              <div className="login-demo-badge">Supervisor</div>
              <div className="login-demo-name">Supervisor Gudang</div>
              <div className="login-demo-cred">ID: <code>supervisor-01</code></div>
              <div className="login-demo-role-desc">Akses penuh Dashboard Web</div>
            </button>

            <button
              type="button"
              className="login-demo-card staff"
              onClick={() => fillQuickAccount('staff-01', 'staff123')}
            >
              <div className="login-demo-badge staff-badge">Staff Lapangan (Uji Proteksi)</div>
              <div className="login-demo-name">Ahmad Fauzi</div>
              <div className="login-demo-cred">ID: <code>staff-01</code></div>
              <div className="login-demo-role-desc">Memicu alert wajib pakai Mobile App</div>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="login-footer-info">
          <p>
            HiFeed SCOM • Dashboard Web dikhususkan untuk Supervisor Gudang
          </p>
        </div>
      </div>

      {/* Staff Alert Modal */}
      {staffAlertModal && staffAlertModal.isOpen && (
        <div className="alert-modal-backdrop" role="alertdialog" aria-modal="true">
          <div className="alert-modal-card">
            <div className="alert-modal-header">
              <div className="alert-modal-icon-wrapper">
                <span className="alert-modal-icon">📱</span>
              </div>
              <span className="alert-modal-badge">Akses Ditolak</span>
            </div>

            <h2 className="alert-modal-title">Akses Khusus Aplikasi Mobile</h2>

            <div className="alert-modal-body">
              <p className="alert-modal-greeting">
                Halo <strong>{staffAlertModal.name}</strong>, akun Anda terdaftar sebagai <span className="alert-role-tag">Staff Lapangan</span>.
              </p>
              
              <div className="alert-modal-warning-box">
                <svg className="alert-warning-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  <strong>Staff Lapangan tidak diizinkan mengakses data Dashboard Web.</strong> Anda diwajibkan menggunakan <strong>Aplikasi Mobile HiFeed Scanner</strong>.
                </span>
              </div>

              <div className="alert-modal-instructions">
                <div className="instruction-item">
                  <div className="instruction-num">1</div>
                  <div className="instruction-text">Buka aplikasi <strong>HiFeed Scanner</strong> pada smartphone Anda.</div>
                </div>
                <div className="instruction-item">
                  <div className="instruction-num">2</div>
                  <div className="instruction-text">Masuk dengan User ID: <code>{staffAlertModal.id}</code></div>
                </div>
                <div className="instruction-item">
                  <div className="instruction-num">3</div>
                  <div className="instruction-text">Lakukan pemindaian barcode/QR untuk Inbound & Dispatch di lapangan.</div>
                </div>
              </div>
            </div>

            <div className="alert-modal-footer">
              <button
                type="button"
                className="alert-modal-close-btn"
                onClick={() => setStaffAlertModal(null)}
              >
                Saya Mengerti, Kembali ke Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
