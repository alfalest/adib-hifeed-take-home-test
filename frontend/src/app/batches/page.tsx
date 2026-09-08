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
      setError(err.message || 'Gagal memuat batch');
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
        <h2>🏷️ Batch Pakan & Generator QR Code</h2>
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
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            width: '320px',
            fontSize: '14px',
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
            <h3>📋 Daftar Batch Pakan ({filteredBatches.length})</h3>
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
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  batch.qr_payload
                )}`;

                return (
                  <tr key={batch.id}>
                    <td>
                      <code style={{ fontWeight: 600, color: 'var(--accent-primary-hover)' }}>
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
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--accent-primary)',
                          background: 'rgba(99, 102, 241, 0.1)',
                          color: 'var(--accent-primary-hover)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '13px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        📱 Tampilkan QR
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
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              padding: '28px',
              borderRadius: '16px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              border: '1px solid var(--border-color)',
            }}
          >
            <h3 style={{ marginBottom: '4px', fontSize: '18px', color: 'var(--text-main)' }}>📱 QR Code Batch</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>{selectedQr.name}</p>

            <div
              style={{
                background: '#ffffff',
                padding: '16px',
                borderRadius: '12px',
                display: 'inline-block',
                marginBottom: '16px',
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
                background: 'var(--bg-body)',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                color: 'var(--text-muted)',
                marginBottom: '20px',
                textAlign: 'left',
              }}
            >
              <strong>Payload QR:</strong>
              <br />
              {selectedQr.qrPayload}
            </div>

            <button
              onClick={() => setSelectedQr(null)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--accent-primary)',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
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
