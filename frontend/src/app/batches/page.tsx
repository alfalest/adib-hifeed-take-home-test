'use client';

import { useState, useEffect } from 'react';
import { getBatches, type StockBatch } from '@/lib/api';

export default function BatchesPage() {
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQr, setSelectedQr] = useState<{ batchNumber: string; name: string; qrPayload: string } | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await getBatches({ limit: '100' });
      setBatches(res.data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data Batch');
    } finally {
      setLoading(false);
    }
  }

  const filteredBatches = batches.filter(
    (b) =>
      b.batch_number.toLowerCase().includes(search.toLowerCase()) ||
      b.feed_item.name.toLowerCase().includes(search.toLowerCase()) ||
      b.feed_item.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <h2>Batch Pakan & Generator QR Code</h2>
        <p>Lihat daftar batch aktif dan pindai (scan) QR code langsung dari layar laptop/HP Anda</p>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
        <input
          type="text"
          placeholder="Cari No. Batch, SKU, atau Nama Pakan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            background: '#ffffff',
            color: 'var(--text-primary)',
            width: '320px',
            fontSize: '14px',
            outline: 'none',
          }}
        />
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <div className="loading-text">Memuat daftar batch...</div>
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <h4>Gagal memuat data</h4>
          <p>{error}</p>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-header">
            <h3>Daftar Batch Pakan ({filteredBatches.length})</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>No. Batch</th>
                <th>Produk Pakan</th>
                <th>SKU</th>
                <th>Sisa Qty</th>
                <th>Tgl Expired</th>
                <th>Status</th>
                <th>Aksi / QR</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((batch) => {
                return (
                  <tr key={batch.id}>
                    <td>
                      <code style={{
                        background: 'var(--hifeed-light)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--accent-dark)',
                        border: '1px solid rgba(0, 171, 126, 0.18)'
                      }}>
                        {batch.batch_number}
                      </code>
                    </td>
                    <td>{batch.feed_item.name}</td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{batch.feed_item.sku}</span>
                    </td>
                    <td>
                      <strong style={{ color: batch.current_qty > 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                        {batch.current_qty}
                      </strong>{' '}
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{batch.feed_item.unit}</span>
                    </td>
                    <td>{new Date(batch.expired_date).toLocaleDateString('id-ID')}</td>
                    <td>
                      {batch.status === 'ACTIVE' ? (
                        batch.is_near_expiry ? (
                          <span className="badge badge-warning">⚠️ Hampir Expired</span>
                        ) : (
                          <span className="badge badge-success">✓ Aktif</span>
                        )
                      ) : batch.status === 'DEPLETED' ? (
                        <span className="badge badge-danger">Habis</span>
                      ) : (
                        <span className="badge badge-danger">Expired</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() =>
                          setSelectedQr({
                            batchNumber: batch.batch_number,
                            name: batch.feed_item.name,
                            qrPayload: batch.qr_payload,
                          })
                        }
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: '1px solid rgba(0, 171, 126, 0.25)',
                          background: 'var(--hifeed-light)',
                          color: 'var(--accent-primary)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '13px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        Generate QR Code
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Code Viewer Modal */}
      {selectedQr && (
        <div
          onClick={() => setSelectedQr(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              padding: '28px',
              borderRadius: '20px',
              maxWidth: '420px',
              width: '90%',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-color)',
            }}
          >
            <h3 style={{ marginBottom: '4px', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              QR Code Batch
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>{selectedQr.name}</p>

            <div
              style={{
                background: '#ffffff',
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                display: 'inline-block',
                marginBottom: '20px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* Render QR code via QRServer API */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  selectedQr.qrPayload
                )}`}
                alt={`QR Code ${selectedQr.batchNumber}`}
                width={220}
                height={220}
                style={{ display: 'block' }}
              />
            </div>

            <div
              style={{
                background: '#f8fafc',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                color: 'var(--text-secondary)',
                marginBottom: '24px',
                textAlign: 'left',
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>Payload QR:</strong>
              <br />
              {selectedQr.qrPayload}
            </div>

            <button
              onClick={() => setSelectedQr(null)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--accent-primary)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 171, 126, 0.3)',
                transition: 'all var(--transition-fast)'
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
