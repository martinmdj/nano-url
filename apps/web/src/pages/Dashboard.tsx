import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import type { UrlResponse, UrlListResponse } from '@nano-url/shared';

const styles: Record<string, React.CSSProperties> = {
  title: { fontSize: 24, fontWeight: 700, marginBottom: 20 },
  card: {
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  form: { display: 'flex', gap: 12, flexWrap: 'wrap' as const, alignItems: 'flex-end' },
  input: {
    flex: 1,
    minWidth: 200,
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: 4,
    fontSize: 15,
  },
  inputSmall: {
    width: 150,
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: 4,
    fontSize: 15,
  },
  btn: {
    padding: '8px 20px',
    background: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 15,
    cursor: 'pointer',
  },
  btnDanger: {
    padding: '6px 12px',
    background: '#d32f2f',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    cursor: 'pointer',
  },
  btnSmall: {
    padding: '6px 12px',
    background: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '10px 8px', borderBottom: '2px solid #eee', fontSize: 14, fontWeight: 600 },
  td: { padding: '10px 8px', borderBottom: '1px solid #eee', fontSize: 14, verticalAlign: 'middle' as const },
  pagination: { display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 },
  pageBtn: {
    padding: '6px 14px',
    border: '1px solid #ddd',
    borderRadius: 4,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 14,
  },
  activePage: { background: '#1a73e8', color: '#fff', borderColor: '#1a73e8' },
  badge: { padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600 },
  error: { color: '#d32f2f', fontSize: 14, marginBottom: 12 },
};

export default function Dashboard() {
  const [urls, setUrls] = useState<UrlResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [longUrl, setLongUrl] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUrls = useCallback(async (p: number) => {
    try {
      const res = await client.get<UrlListResponse>('/urls', { params: { page: p, limit: 20 } });
      setUrls(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch {
      setError('Failed to load URLs');
    }
  }, []);

  useEffect(() => { fetchUrls(page); }, [page, fetchUrls]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!longUrl.trim()) { setError('URL is required'); return; }
    try {
      const body: Record<string, string> = { longUrl: longUrl.trim() };
      if (shortCode.trim()) body.shortCode = shortCode.trim();
      await client.post('/urls', body);
      setLongUrl('');
      setShortCode('');
      setSuccess('URL created successfully');
      setPage(1);
      fetchUrls(1);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create URL');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this URL?')) return;
    try {
      await client.delete(`/urls/${id}`);
      fetchUrls(page);
    } catch {
      setError('Failed to delete URL');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('Copied to clipboard');
      setTimeout(() => setSuccess(''), 2000);
    });
  };

  const shortUrlBase = import.meta.env.VITE_SHORT_URL_BASE || 'http://localhost:3001';

  return (
    <div>
      <h1 style={styles.title}>Dashboard</h1>

      <div style={styles.card}>
        <h3 style={{ marginBottom: 12 }}>Create Short URL</h3>
        <form style={styles.form} onSubmit={handleCreate}>
          <input
            style={styles.input}
            placeholder="Long URL (https://...)"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
          />
          <input
            style={styles.inputSmall}
            placeholder="Custom code (optional)"
            value={shortCode}
            onChange={(e) => setShortCode(e.target.value)}
          />
          <button style={styles.btn} type="submit">Create</button>
        </form>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={{ color: '#2e7d32', fontSize: 14, marginBottom: 12 }}>{success}</div>}

      <div style={styles.card}>
        <h3 style={{ marginBottom: 12 }}>Your URLs ({total})</h3>
        {urls.length === 0 ? (
          <p style={{ color: '#888' }}>No URLs yet. Create one above.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Short Code</th>
                <th style={styles.th}>Long URL</th>
                <th style={styles.th}>Clicks</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {urls.map((url) => (
                <tr key={url.id}>
                  <td style={styles.td}>
                    <a
                      href={`${shortUrlBase}/${url.shortCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1a73e8', textDecoration: 'none' }}
                    >
                      {url.shortCode}
                    </a>
                    <button
                      onClick={() => copyToClipboard(`${shortUrlBase}/${url.shortCode}`)}
                      style={{ marginLeft: 6, cursor: 'pointer', background: 'none', border: 'none', fontSize: 13, color: '#666' }}
                      title="Copy short URL"
                    >
                      📋
                    </button>
                  </td>
                  <td style={{ ...styles.td, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {url.longUrl}
                  </td>
                  <td style={styles.td}>{url.clicks}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        background: url.isActive ? '#e8f5e9' : '#ffebee',
                        color: url.isActive ? '#2e7d32' : '#d32f2f',
                      }}
                    >
                      {url.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link to={`/urls/${url.id}`} style={styles.btnSmall}>View</Link>
                      <button style={styles.btnDanger} onClick={() => handleDelete(url.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div style={styles.pagination}>
            <button
              style={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                style={{ ...styles.pageBtn, ...(p === page ? styles.activePage : {}) }}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              style={styles.pageBtn}
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}