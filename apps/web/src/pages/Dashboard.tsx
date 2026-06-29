import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import type { UrlResponse, UrlListResponse } from '@nano-url/shared';

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
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Create Short URL</h3>
        <form className="flex flex-wrap items-end gap-3" onSubmit={handleCreate}>
          <input
            className="input min-w-[200px] flex-1"
            placeholder="Long URL (https://...)"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
          />
          <input
            className="input w-44"
            placeholder="Custom code (optional)"
            value={shortCode}
            onChange={(e) => setShortCode(e.target.value)}
          />
          <button className="btn-primary px-5 py-2 text-sm" type="submit">Create</button>
        </form>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-4">{error}</div>}
      {success && <div className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 mb-4">{success}</div>}

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Your URLs <span className="text-slate-400 font-normal">({total})</span></h3>
        {urls.length === 0 ? (
          <p className="text-sm text-slate-400">No URLs yet. Create one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Short Code</th>
                  <th className="table-header">Long URL</th>
                  <th className="table-header">Clicks</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {urls.map((url) => (
                  <tr key={url.id} className="hover:bg-surface-hover transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`${shortUrlBase}/${url.shortCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 no-underline font-medium text-sm"
                        >
                          {url.shortCode}
                        </a>
                        <button
                          onClick={() => copyToClipboard(`${shortUrlBase}/${url.shortCode}`)}
                          className="bg-transparent border-none cursor-pointer text-xs text-slate-400 hover:text-slate-600 p-0.5"
                          title="Copy short URL"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                      </div>
                    </td>
                    <td className="table-cell max-w-[300px] truncate text-slate-500">
                      {url.longUrl}
                    </td>
                    <td className="table-cell font-medium">{url.clicks}</td>
                    <td className="table-cell">
                      <span className={url.isActive ? 'badge-active' : 'badge-inactive'}>
                        {url.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Link to={`/urls/${url.id}`} className="btn-primary text-xs px-3 py-1.5 no-underline">View</Link>
                        <button className="btn-danger text-xs px-3 py-1.5" onClick={() => handleDelete(url.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5">
            <button
              className="btn-ghost text-xs px-3 py-1.5 border border-surface-border rounded-md disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  p === page
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'btn-ghost border-surface-border'
                }`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="btn-ghost text-xs px-3 py-1.5 border border-surface-border rounded-md disabled:opacity-40"
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