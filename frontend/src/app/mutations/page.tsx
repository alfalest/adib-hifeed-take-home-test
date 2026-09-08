'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMutations, type StockMutation } from '@/lib/api';
import MutationTable from '@/components/MutationTable';
import MutationFilter from '@/components/MutationFilter';

export default function MutationsPage() {
  const [mutations, setMutations] = useState<StockMutation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchMutations = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: page.toString(),
        limit: '20',
      };
      if (type) params.type = type;
      if (search) params.search = search;

      const res = await getMutations(params);
      setMutations(res.data);
      setTotalPages(res.pagination.total_pages);
      setTotal(res.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch mutations');
    } finally {
      setLoading(false);
    }
  }, [type, search, page]);

  useEffect(() => {
    fetchMutations();
  }, [fetchMutations]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [type, search]);

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❌</div>
        <h4>Gagal memuat data</h4>
        <p>{error}</p>
        <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Pastikan backend API berjalan di http://localhost:3001
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h2>📋 Riwayat Mutasi Stok</h2>
        <p>Stock Ledger — Catatan audit pergerakan stok pakan</p>
      </div>

      <div className="table-container" style={{ marginBottom: '24px' }}>
        <MutationFilter
          type={type}
          search={search}
          onTypeChange={setType}
          onSearchChange={setSearch}
        />

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <div className="loading-text">Memuat riwayat mutasi...</div>
          </div>
        ) : (
          <>
            <MutationTable mutations={mutations} />

            {/* Pagination */}
            <div className="pagination">
              <div className="pagination-info">
                Menampilkan {mutations.length} dari {total} mutasi
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    className={`pagination-btn ${p === page ? 'active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="pagination-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
