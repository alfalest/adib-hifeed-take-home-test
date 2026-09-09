import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="empty-state-icon">🔍</div>
      <h4>Halaman Tidak Ditemukan (404)</h4>
      <p>Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.</p>
      <Link
        href="/"
        style={{
          marginTop: 16,
          padding: '10px 20px',
          background: 'var(--accent-primary)',
          color: '#fff',
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
