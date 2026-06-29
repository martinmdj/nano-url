import { useState, useEffect } from 'react';
import client from '../api/client';

type StatsOverview = {
  totalUrls: number;
  totalClicks: number;
  activeUrls: number;
  topUrls: { id: number; shortCode: string; longUrl: string; clicks: number }[];
};

export default function Stats() {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get<{ success: boolean; data: StatsOverview }>('/stats/overview')
      .then((res) => setOverview(res.data.data))
      .catch(() => setError('Failed to load statistics'));
  }, []);

  if (error) return <div className="text-sm text-red-600 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">{error}</div>;
  if (!overview) return <div className="text-sm text-slate-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Statistics Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-primary-600">{overview.totalUrls}</div>
          <div className="text-xs text-slate-400 mt-1">Total URLs</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-primary-600">{overview.totalClicks}</div>
          <div className="text-xs text-slate-400 mt-1">Total Clicks</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-primary-600">{overview.activeUrls}</div>
          <div className="text-xs text-slate-400 mt-1">Active URLs</div>
        </div>
      </div>

      <h2 className="text-base font-semibold text-slate-700 mb-3">Top 10 URLs</h2>
      <div className="overflow-x-auto card">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-muted">
              <th className="table-header">#</th>
              <th className="table-header">Short Code</th>
              <th className="table-header">Long URL</th>
              <th className="table-header">Clicks</th>
            </tr>
          </thead>
          <tbody>
            {overview.topUrls.map((url, i) => (
              <tr key={url.id} className="hover:bg-surface-hover transition-colors">
                <td className="table-cell">
                  <span className="font-bold text-slate-400">{i + 1}</span>
                </td>
                <td className="table-cell font-medium text-primary-600">{url.shortCode}</td>
                <td className="table-cell max-w-[400px] truncate text-slate-500">{url.longUrl}</td>
                <td className="table-cell font-medium">{url.clicks}</td>
              </tr>
            ))}
            {overview.topUrls.length === 0 && (
              <tr>
                <td className="table-cell text-slate-400" colSpan={4}>No URLs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}