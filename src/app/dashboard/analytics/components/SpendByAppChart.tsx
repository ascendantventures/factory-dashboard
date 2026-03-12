'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SpendByAppChartProps {
  data: { repo: string; cost_usd: number; issue_count: number }[];
  loading: boolean;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { repo: string; cost_usd: number; issue_count: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#1A1B24',
      border: '1px solid #2A2B36',
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    }}>
      <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B', marginBottom: '8px' }}>
        {d.repo}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <span style={{ fontSize: '13px', color: '#CBD5E1' }}>Cost</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC', fontVariantNumeric: 'tabular-nums' }}>${d.cost_usd.toFixed(4)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <span style={{ fontSize: '13px', color: '#CBD5E1' }}>Issues</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>{d.issue_count}</span>
      </div>
    </div>
  );
}

export default function SpendByAppChart({ data, loading }: SpendByAppChartProps) {
  const shortLabel = (repo: string) => repo.split('/').pop() ?? repo;

  return (
    <div
      data-testid="chart-spend-by-app"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
      }}
    >
      <h3 style={{
        fontFamily: 'var(--font-ui, "Instrument Sans", system-ui, sans-serif)',
        fontSize: '18px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: '20px',
        margin: '0 0 20px 0',
      }}>
        Spend by App
      </h3>
      {loading ? (
        <div style={{ height: '300px', background: 'var(--surface-alt)', borderRadius: '8px' }} />
      ) : data.length === 0 ? (
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          No data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2B36" vertical={false} />
            <XAxis
              dataKey="repo"
              tickFormatter={shortLabel}
              tick={{ fill: '#64748B', fontSize: 12 }}
              axisLine={{ stroke: '#2A2B36' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => `$${v}`}
              tick={{ fill: '#64748B', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cost_usd" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
