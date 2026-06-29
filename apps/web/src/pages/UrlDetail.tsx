import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import type { UrlResponse } from '@nano-url/shared';

type UrlStats = {
  totalClicks: number;
  uniqueVisitors: number;
  clicksByDay: { date: string; count: number }[];
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

  if (!url) return (
    <div className="text-sm text-slate-500 py-8">
      {error || 'Loading...'}
    </div>
  );

  const maxDayCount = stats?.clicksByDay?.length ? Math.max(...stats.clicksByDay.map((d) => d.count), 1) : 1;

  return (
    <div>
      <Link to="/dashboard" className="text-sm text-primary-600 hover:text-primary-700 no-underline inline-flex items-center gap-1 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">URL Details</h1>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-4">{error}</div>}
      {success && <div className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 mb-4">{success}</div>}

      <div className="card p-5 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Short Code</div>
            <div className="text-sm font-semibold text-slate-900">{url.shortCode}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Clicks</div>
            <div className="text-sm font-semibold text-slate-900">{url.clicks}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Created</div>
            <div className="text-sm text-slate-700">{new Date(url.createdAt).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Status</div>
            <span className={url.isActive ? 'badge-active' : 'badge-inactive'}>
              {url.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-surface-border">
          <div className="text-xs text-slate-400 mb-0.5">Long URL</div>
          <div className="text-sm text-slate-600 break-all">{url.longUrl}</div>
        </div>
      </div>

      <div className="card p-5 mb-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Edit URL</h3>
        <div className="mb-3">
          <label className="block text-xs text-slate-400 mb-1">Long URL</label>
          <input
            className="input"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-surface-border text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-slate-700">Active</span>
        </label>
        <button className="btn-primary px-5 py-2 text-sm" onClick={handleUpdate}>Save Changes</button>
      </div>

      {stats && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Statistics</h3>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-surface-muted rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-primary-600">{stats.totalClicks}</div>
              <div className="text-xs text-slate-400 mt-1">Total Clicks</div>
            </div>
            <div className="bg-surface-muted rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-primary-600">{stats.uniqueVisitors}</div>
              <div className="text-xs text-slate-400 mt-1">Unique Visitors</div>
            </div>
          </div>

          {stats.clicksByDay.length > 0 && (
            <div>
              <div className="text-xs text-slate-400 mb-3">Clicks by Day</div>
              <div className="flex items-end gap-1 h-28">
                {stats.clicksByDay.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-primary-500 rounded-t-md relative"
                      style={{ height: `${(day.count / maxDayCount) * 100}%`, minHeight: 4 }}
                    >
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap">
                        {day.count}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
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