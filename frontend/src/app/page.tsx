'use client';

import { useState, useEffect } from 'react';
import { getItems, getBatches, type FeedItem, type StockBatch } from '@/lib/api';
import StatsCards from '@/components/StatsCards';
import StockTable from '@/components/StockTable';

export default function StockOverview() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [itemsRes, batchesRes] = await Promise.all([
          getItems({ limit: '100' }),
          getBatches({ limit: '100' }),
        ]);
        setItems(itemsRes.data);
        setBatches(batchesRes.data);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <div className="loading-text">Memuat data inventori...</div>
      </div>
    );
  }

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

  const totalItems = items.length;
  const totalActiveBatches = batches.filter(b => b.status === 'ACTIVE').length;
  const nearExpiryBatches = batches.filter(b => b.is_near_expiry).length;
  const lowStockItems = items.filter(i => i.is_low_stock).length;

  return (
    <>
      <div className="page-header">
        <h2>Stock Overview</h2>
        <p>Pantau stok pakan ternak secara realtime</p>
      </div>

      <StatsCards
        totalItems={totalItems}
        totalActiveBatches={totalActiveBatches}
        nearExpiryBatches={nearExpiryBatches}
        lowStockItems={lowStockItems}
      />

      <StockTable items={items} />
    </>
  );
}
