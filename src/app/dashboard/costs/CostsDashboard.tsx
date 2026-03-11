'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DollarSign, Download, Loader2, BarChart2 } from 'lucide-react';
import { STATION_COLORS, STATION_LABELS, STATIONS } from '@/lib/constants';

interface CostRun {
  station: string;
  model: string;
  cost_usd: number | null;
  duration_seconds: number | null;
}

interface CostIssue {
  issue_number: number;
  title: string;
  repo: string;
  total_cost_usd: number;
  runs: CostRun[];
}

interface CostSummary {
  total_usd: number;
  by_station: Record<string, number>;
  by_model: Record<string, number>;
}

interface CostData {
  issues: CostIssue[];
  summary: CostSummary;
  has_data: boolean;
}

export default function CostsDashboard() {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [filterRepo, setFilterRepo] = useState('');
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (filterRepo) params.set('repo', filterRepo);
      const res = await fetch(`/api/metrics/costs?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [from, to, filterRepo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function exportCsv() {
    if (!data) return;
    const rows: string[][] = [['issue_number', 'title', 'repo', 'station', 'model', 'cost_usd', 'duration_seconds']];
    for (const issue of data.issues) {
      for (const run of issue.runs) {
        rows.push([
          String(issue.issue_number),
          `"${issue.title.replace(/"/g, '""')}"`,
          issue.repo,
          run.station,
          run.model,
          run.cost_usd !== null ? run.cost_usd.toFixed(4) : '',
          run.duration_seconds !== null ? String(run.duration_seconds) : '',
        ]);
      }
    }
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'costs.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleExpand(key: string) {
    setExpandedIssues((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const stationChartData = STATIONS.map((s) => ({
    name: STATION_LABELS[s],
    cost: Number((data?.summary?.by_station?.[s] ?? 0).toFixed(4)),
    color: STATION_COLORS[s],
  })).filter((d) => d.cost > 0);

  const modelChartData = Object.entries(data?.summary?.by_model ?? {}).map(([model, cost]) => ({
    name: model.replace('claude-', '').replace('-latest', ''),
    cost: Number(cost.toFixed(4)),
  }));

  return (
    <div className="flex flex-col p-6 gap-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
          >
            Cost Tracking
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Estimated delivery costs per issue — admin only
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={!data?.has_data}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all disabled:opacity-40"
          style={{
            background: 'transparent',
            color: 'var(--text-primary)',
            borderColor: 'var(--border)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-alt)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap gap-4 p-4 rounded-lg border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 rounded-md text-sm border"
            style={{
              background: 'var(--surface-alt)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 rounded-md text-sm border"
            style={{
              background: 'var(--surface-alt)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Repo</label>
          <input
            type="text"
            value={filterRepo}
            onChange={(e) => setFilterRepo(e.target.value)}
            placeholder="owner/repo"
            className="px-3 py-2 rounded-md text-sm border"
            style={{
              background: 'var(--surface-alt)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
              minWidth: '180px',
            }}
          />
        </div>
        {(from || to || filterRepo) && (
          <button
            onClick={() => { setFrom(''); setTo(''); setFilterRepo(''); }}
            className="self-end px-3 py-2 rounded-md text-sm border transition-all"
            style={{ background: 'transparent', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : !data?.has_data ? (
        /* Empty state */
        <div
          className="flex flex-col items-center justify-center py-16 rounded-lg border text-center gap-4"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          data-testid="costs-empty-state"
        >
          <BarChart2 className="w-12 h-12" style={{ color: '#71717A' }} />
          <div>
            <p className="text-base font-semibold" style={{ color: 'var(--text-secondary)' }}>
              No cost data yet
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
              Cost data will appear here once the harness runner reports usage.
              No action needed — data will populate automatically.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="costs-summary">
            <div
              className="rounded-lg border p-5"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="w-5 h-5" style={{ color: '#3B82F6' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Cost</span>
              </div>
              <p
                className="text-3xl font-bold"
                style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
              >
                ${(data?.summary?.total_usd ?? 0).toFixed(4)}
              </p>
            </div>
            <div
              className="rounded-lg border p-5"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Issues Tracked</p>
              <p
                className="text-3xl font-bold"
                style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
              >
                {data?.issues?.length ?? 0}
              </p>
            </div>
            <div
              className="rounded-lg border p-5"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Total Agent Runs</p>
              <p
                className="text-3xl font-bold"
                style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
              >
                {data?.issues?.reduce((acc, i) => acc + i.runs.length, 0) ?? 0}
              </p>
            </div>
          </div>

          {/* Charts */}
          {stationChartData.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* By station */}
              <div
                className="rounded-lg border p-6"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Cost by Stage
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stationChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis type="number" tick={{ fill: '#71717A', fontSize: 11 }} stroke="#262626" />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#A1A1AA', fontSize: 12 }} stroke="#262626" width={60} />
                    <Tooltip
                      contentStyle={{ background: '#1A1A1A', border: '1px solid #262626', borderRadius: '6px', color: '#FAFAFA' }}
                      formatter={(v) => [`$${Number(v ?? 0).toFixed(4)}`, 'Cost']}
                    />
                    <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                      {stationChartData.map((entry, i) => (
                        <rect key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* By model */}
              {modelChartData.length > 0 && (
                <div
                  className="rounded-lg border p-6"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Cost by Model
                  </h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={modelChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis type="number" tick={{ fill: '#71717A', fontSize: 11 }} stroke="#262626" />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#A1A1AA', fontSize: 12 }} stroke="#262626" width={100} />
                      <Tooltip
                        contentStyle={{ background: '#1A1A1A', border: '1px solid #262626', borderRadius: '6px', color: '#FAFAFA' }}
                        formatter={(v) => [`$${Number(v ?? 0).toFixed(4)}`, 'Cost']}
                      />
                      <Bar dataKey="cost" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Issues table */}
          <div
            className="rounded-lg border overflow-hidden"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-alt)' }}
            >
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Cost by Issue
              </h3>
              <span
                className="text-sm"
                style={{ color: '#3B82F6', fontFamily: 'JetBrains Mono, monospace' }}
              >
                Total: ${(data?.summary?.total_usd ?? 0).toFixed(4)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Issue</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Runs</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.issues ?? []).map((issue) => {
                    const key = `${issue.repo}::${issue.issue_number}`;
                    const isExpanded = expandedIssues.has(key);
                    return (
                      <>
                        <tr
                          key={key}
                          onClick={() => toggleExpand(key)}
                          className="cursor-pointer transition-colors"
                          style={{ borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(59,130,246,0.05)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs"
                                style={{ color: '#3B82F6', fontFamily: 'JetBrains Mono, monospace' }}
                              >
                                #{issue.issue_number}
                              </span>
                              <span style={{ color: 'var(--text-primary)' }}>{issue.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center" style={{ color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
                            {issue.runs.length}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                            {issue.total_cost_usd > 0 ? `$${issue.total_cost_usd.toFixed(4)}` : '—'}
                          </td>
                        </tr>
                        {isExpanded && issue.runs.map((run, ri) => (
                          <tr
                            key={`${key}-run-${ri}`}
                            style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}
                          >
                            <td className="px-4 py-2 pl-10">
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-xs px-2 py-0.5 rounded"
                                  style={{
                                    background: `${STATION_COLORS[run.station as keyof typeof STATION_COLORS] ?? '#6B7280'}20`,
                                    color: STATION_COLORS[run.station as keyof typeof STATION_COLORS] ?? '#6B7280',
                                    fontSize: '11px',
                                  }}
                                >
                                  {STATION_LABELS[run.station as keyof typeof STATION_LABELS] ?? run.station}
                                </span>
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{run.model}</span>
                                {run.duration_seconds && (
                                  <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                                    {run.duration_seconds}s
                                  </span>
                                )}
                              </div>
                            </td>
                            <td />
                            <td className="px-4 py-2 text-right text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                              {run.cost_usd !== null ? `$${run.cost_usd.toFixed(4)}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
