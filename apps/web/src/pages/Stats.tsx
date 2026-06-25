import { useState, useEffect } from 'react';
import client from '../api/client';

type StatsOverview = {
  totalUrls: number;
  totalClicks: number;
  activeUrls: number;
  topUrls: { id: number; shortCode: string; longUrl: string; clicks: number }[];
};

const styles: Record<string, React.CSSProperties> = {
  title: { fontSize: 24, fontWeight: 700, marginBottom: 20 },
  grid: { display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' as const },
  card: {
    flex: '1 1 180px',
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: 8,
    padding: 20,
    textAlign: 'center' as const,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  cardValue: { fontSize: 32, fontWeight: 700, color: '#1a73e8' },
  cardLabel: { fontSize: 14, color: '#888', marginTop: 4 },
  table: { width: '100%', borderCollapse: 'collapse' as const, background: '#fff', borderRadius: 8, overflow: 'hidden' },
  th: { textAlign: 'left' as const, padding: '10px 12px', background: '#f5f5f5', fontSize: 14, fontWeight: 600, borderBottom: '2px solid #eee' },
  td: { padding: '10px 12px', borderBottom: '1px solid #eee', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: 600, marginBottom: 12 },
  rank: { fontWeight: 700, color: '#888' },
};

export default function Stats() {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get<{ success: boolean; data: StatsOverview }>('/stats/overview')
      .then((res) => setOverview(res.data.data))
      .catch(() => setError('Failed to load statistics'));
  }, []);

  if (error) return <div>{error}</div>;
  if (!overview) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={styles.title}>Statistics Overview</h1>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardValue}>{overview.totalUrls}</div>
          <div style={styles.cardLabel}>Total URLs</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardValue}>{overview.totalClicks}</div>
          <div style={styles.cardLabel}>Total Clicks</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardValue}>{overview.activeUrls}</div>
          <div style={styles.cardLabel}>Active URLs</div>
        </div>
      </div>

      <div style={styles.sectionTitle}>Top 10 URLs</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Short Code</th>
              <th style={styles.th}>Long URL</th>
              <th style={styles.th}>Clicks</th>
            </tr>
          </thead>
          <tbody>
            {overview.topUrls.map((url, i) => (
              <tr key={url.id}>
                <td style={styles.td}><span style={styles.rank}>{i + 1}</span></td>
                <td style={styles.td}>{url.shortCode}</td>
                <td style={{ ...styles.td, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {url.longUrl}
                </td>
                <td style={styles.td}>{url.clicks}</td>
              </tr>
            ))}
            {overview.topUrls.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={4}>No URLs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}