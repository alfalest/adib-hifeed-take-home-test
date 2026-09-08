interface StatsCardsProps {
  totalItems: number;
  totalActiveBatches: number;
  nearExpiryBatches: number;
  lowStockItems: number;
}

export default function StatsCards({ totalItems, totalActiveBatches, nearExpiryBatches, lowStockItems }: StatsCardsProps) {
  return (
    <div className="stats-grid">
      <div className="stat-card primary">
        <div className="stat-card-header">
          <span className="stat-card-label">Total Item</span>
          <div className="stat-card-icon">📋</div>
        </div>
        <div className="stat-card-value">{totalItems}</div>
        <div className="stat-card-desc">Produk pakan terdaftar</div>
      </div>

      <div className="stat-card success">
        <div className="stat-card-header">
          <span className="stat-card-label">Batch Aktif</span>
          <div className="stat-card-icon">✅</div>
        </div>
        <div className="stat-card-value">{totalActiveBatches}</div>
        <div className="stat-card-desc">Batch dengan stok tersedia</div>
      </div>

      <div className="stat-card warning">
        <div className="stat-card-header">
          <span className="stat-card-label">Hampir Kedaluwarsa</span>
          <div className="stat-card-icon">⚠️</div>
        </div>
        <div className="stat-card-value">{nearExpiryBatches}</div>
        <div className="stat-card-desc">Batch expires dalam 30 hari</div>
      </div>

      <div className="stat-card danger">
        <div className="stat-card-header">
          <span className="stat-card-label">Stok Rendah</span>
          <div className="stat-card-icon">🔴</div>
        </div>
        <div className="stat-card-value">{lowStockItems}</div>
        <div className="stat-card-desc">Item di bawah minimum stok</div>
      </div>
    </div>
  );
}
