import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import type { UrlResponse } from '@nano-url/shared';

type UrlStats = {
  totalClicks: number;
  uniqueVisitors: number;
  clicksByDay: { date: string; count: number }[];
};

const styles: Record<string, React.CSSProperties> = {
  title: { fontSize: 24, fontWeight: 700, marginBottom: 20 },
  back: { color: '#1a73e8', textDecoration: 'none', fontSize: 14, display: 'inline-block', marginBottom: 16 },
  card: {
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  label: { fontSize: 13, color: '#888', marginBottom: 2 },
  value: { fontSize: 16, fontWeight: 600 },
  row: { display: 'flex', gap: 24, flexWrap: 'wrap' as const },
  col: { flex: '1 1 120px' },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: 4,
    fontSize: 15,
    marginBottom: 8,
    boxSizing: 'border-box' as const,
  },
  btn: {
    padding: '8px 20px',
    background: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 15,
    cursor: 'pointer',
    marginRight: 8,
  },
  barChart: { display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, marginTop: 12 },
  bar: {
    flex: 1,
    background: '#1a73e8',
    borderRadius: '4px 4px 0 0',
    minWidth: 20,
    position: 'relative' as const,
  },
  barLabel: { position: 'absolute' as const, top: -18, left: '50%', transform: 'translateX(-50%)', fontSize: 11, whiteSpace: 'nowrap' as const },
  barDate: { textAlign: 'center' as const, fontSize: 10, marginTop: 2, color: '#888' },
  error: { color: '#d32f2f', fontSize: 14, marginBottom: 12 },
  success: { color: '#2e7d32', fontSize: 14, marginBottom: 12 },
};

export default function UrlDetail() {
  const { id } = useParams<{ id: string }>();
  const [url, setUrl] = useState<UrlResponse | null>(null);
  const [stats, setStats] = useState<UrlStats | null>(null);
  const [longUrl, setLongUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!id) return;
    client.get<{ success: boolean; data: UrlResponse }>(`/urls/${id}`)
      .then((res) => {
        setUrl(res.data.data);
        setLongUrl(res.data.data.longUrl);
        setIsActive(res.data.data.isActive);
      })
      .catch(() => setError('Failed to load URL details'));

    client.get<{ success: boolean; data: UrlStats }>(`/stats/${id}/stats`)
      .then((res) => setStats(res.data.data))
      .catch(() => {});
  }, [id]);

  const handleUpdate = async () => {
    if (!id || !url) return;
    setError('');
    setSuccess('');
    try {
      const res = await client.patch<{ success: boolean; data: UrlResponse }>(`/urls/${id}`, {
        longUrl,
        isActive,
      });
      setUrl(res.data.data);
      setSuccess('URL updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update URL');
    }
  };

  if (!url) return <div style={{ padding: 24 }}>{error || 'Loading...'}</div>;

  const maxDayCount = stats?.clicksByDay?.length ? Math.max(...stats.clicksByDay.map((d) => d.count), 1) : 1;

  return (
    <div>
      <Link to="/dashboard" style={styles.back}>← Back to Dashboard</Link>
      <h1 style={styles.title}>URL Details</h1>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.card}>
        <div style={styles.row}>
          <div style={styles.col}>
            <div style={styles.label}>Short Code</div>
            <div style={styles.value}>{url.shortCode}</div>
          </div>
          <div style={styles.col}>
            <div style={styles.label}>Clicks</div>
            <div style={styles.value}>{url.clicks}</div>
          </div>
          <div style={styles.col}>
            <div style={styles.label}>Created</div>
            <div style={{ fontSize: 14 }}>{new Date(url.createdAt).toLocaleDateString()}</div>
          </div>
          <div style={styles.col}>
            <div style={styles.label}>Status</div>
            <div style={styles.value}>{url.isActive ? 'Active' : 'Inactive'}</div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={styles.label}>Long URL</div>
          <div style={{ fontSize: 14, wordBreak: 'break-all' }}>{url.longUrl}</div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ marginBottom: 12 }}>Edit URL</h3>
        <div>
          <div style={styles.label}>Long URL</div>
          <input
            style={styles.input}
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <span style={{ fontSize: 14 }}>Active</span>
        </label>
        <button style={styles.btn} onClick={handleUpdate}>Save Changes</button>
      </div>

      {stats && (
        <div style={styles.card}>
          <h3 style={{ marginBottom: 12 }}>Statistics</h3>
          <div style={styles.row}>
            <div style={styles.col}>
              <div style={styles.label}>Total Clicks</div>
              <div style={{ ...styles.value, fontSize: 28 }}>{stats.totalClicks}</div>
            </div>
            <div style={styles.col}>
              <div style={styles.label}>Unique Visitors</div>
              <div style={{ ...styles.value, fontSize: 28 }}>{stats.uniqueVisitors}</div>
            </div>
          </div>

          {stats.clicksByDay.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ ...styles.label, marginBottom: 4 }}>Clicks by Day</div>
              <div style={styles.barChart}>
                {stats.clicksByDay.map((day) => (
                  <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        ...styles.bar,
                        height: `${(day.count / maxDayCount) * 100}%`,
                      }}
                    >
                      <span style={styles.barLabel}>{day.count}</span>
                    </div>
                    <div style={styles.barDate}>
                      {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}