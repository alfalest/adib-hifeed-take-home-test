import type { FeedItem } from '@/lib/api';

interface StockTableProps {
  items: FeedItem[];
}

export default function StockTable({ items }: StockTableProps) {
  const getStockLevel = (item: FeedItem) => {
    if (item.min_stock === 0) return 'good';
    const ratio = item.current_stock / item.min_stock;
    if (ratio <= 1) return 'danger';
    if (ratio <= 1.5) return 'warning';
    return 'good';
  };

  const getStockBarWidth = (item: FeedItem) => {
    if (item.min_stock === 0) return 100;
    const ratio = (item.current_stock / (item.min_stock * 3)) * 100;
    return Math.min(ratio, 100);
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h3>Daftar Produk Pakan</h3>
        <div className="table-actions">
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {items.length} item
          </span>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Nama Produk</th>
            <th>Kategori</th>
            <th>Unit</th>
            <th>Stok Saat Ini</th>
            <th>Min. Stok</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <h4>Tidak ada data</h4>
                  <p>Belum ada produk pakan terdaftar</p>
                </div>
              </td>
            </tr>
          ) : (
            items.map((item) => {
              const level = getStockLevel(item);
              return (
                <tr key={item.id}>
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
                      {item.sku}
                    </code>
                  </td>
                  <td className="name-cell">
                    {item.is_low_stock && <span className="low-stock-dot" />}
                    {item.name}
                  </td>
                  <td>
                    <span className={`category-tag ${item.category.toLowerCase()}`}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    {item.unit}
                  </td>
                  <td>
                    <div className="qty-display">
                      <span className="qty-value" style={{
                        color: level === 'danger' ? 'var(--accent-danger)' :
                          level === 'warning' ? 'var(--accent-warning)' :
                            'var(--accent-success)'
                      }}>
                        {item.current_stock}
                      </span>
                      <div className="stock-bar">
                        <div
                          className={`stock-bar-fill ${level}`}
                          style={{ width: `${getStockBarWidth(item)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.min_stock}</td>
                  <td>
                    {item.is_low_stock ? (
                      <span className="badge badge-danger">⚠️ Low Stock</span>
                    ) : (
                      <span className="badge badge-success">✓ Normal</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
