import type { StockMutation } from '@/lib/api';

interface MutationTableProps {
  mutations: StockMutation[];
}

export default function MutationTable({ mutations }: MutationTableProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Baru saja';
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return formatDate(dateStr);
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h3>Stock Ledger / Riwayat Mutasi</h3>
        <div className="table-actions">
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {mutations.length} mutasi
          </span>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Nama Pakan</th>
            <th>Batch Number</th>
            <th>Tipe</th>
            <th>Kuantitas</th>
            <th>Operator</th>
            <th>Catatan</th>
          </tr>
        </thead>
        <tbody>
          {mutations.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-state-icon">📝</div>
                  <h4>Tidak ada data mutasi</h4>
                  <p>Belum ada riwayat mutasi stok</p>
                </div>
              </td>
            </tr>
          ) : (
            mutations.map((mutation) => (
              <tr key={mutation.id}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {formatDate(mutation.created_at)}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {formatRelativeTime(mutation.created_at)}
                    </span>
                  </div>
                </td>
                <td className="name-cell">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{mutation.feed_item.name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {mutation.feed_item.sku}
                    </span>
                  </div>
                </td>
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
                    {mutation.batch.batch_number}
                  </code>
                </td>
                <td>
                  <span className={`badge badge-${mutation.type === 'INBOUND' ? 'inbound' : 'dispatch'}`}>
                    {mutation.type === 'INBOUND' ? '↓ IN' : '↑ OUT'}
                  </span>
                </td>
                <td>
                  <span style={{
                    fontWeight: 700,
                    fontSize: '15px',
                    color: mutation.type === 'INBOUND' ? 'var(--accent-success)' : 'var(--accent-secondary)'
                  }}>
                    {mutation.type === 'INBOUND' ? '+' : '-'}{mutation.quantity}
                  </span>
                </td>
                <td>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    color: 'var(--text-primary)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}>
                    👤 {mutation.created_by}
                  </div>
                </td>
                <td>
                  <span style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    maxWidth: '200px',
                    display: 'inline-block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {mutation.notes || '-'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
