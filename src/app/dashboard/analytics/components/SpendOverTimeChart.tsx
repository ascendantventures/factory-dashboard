'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Granularity } from '../hooks/useAnalyticsTrends';

interface SpendOverTimeChartProps {
  data: { date: string; cost_usd: number; issue_count: number }[];
  loading: boolean;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: { issue_count: number } }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1A1B24',
      border: '1px solid #2A2B36',
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    }}>
      <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B', marginBottom: '8px' }}>
        {label}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <span style={{ fontSize: '13px', color: '#CBD5E1' }}>Cost</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>${payload[0].value.toFixed(4)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <span style={{ fontSize: '13px', color: '#CBD5E1' }}>Issues</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>{payload[0].payload.issue_count}</span>
      </div>
    </div>
  );
}

const GRANULARITIES: Granularity[] = ['day', 'week', 'month'];

export default function SpendOverTimeChart({ data, loading, granularity, onGranularityChange }: SpendOverTimeChartProps) {
  return (
    <div
      data-testid="chart-spend-over-time"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{
          fontFamily: 'var(--font-ui, "Instrument Sans", system-ui, sans-serif)',
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
        }}>
          Spend Over Time
        </h3>
        <div style={{ display: 'flex', gap: '4px' }}>
          {GRANULARITIES.map(g => (
            <button
              key={g}
              onClick={() => onGranularityChange(g)}
              aria-pressed={granularity === g}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'var(--font-ui, "Instrument Sans", system-ui, sans-serif)',
                background: granularity === g ? '#3B82F6' : 'transparent',
                color: granularity === g ? '#0A0B0F' : '#CBD5E1',
                transition: 'all 150ms ease-out',
                textTransform: 'capitalize',
              }}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div style={{ height: '300px', background: 'var(--surface-alt)', borderRadius: '8px' }} />
      ) : data.length === 0 ? (
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          No data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2B36" vertical={false} />
            <XAxis
              dataKey="date"
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
            <Line
              type="monotone"
              dataKey="cost_usd"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3B82F6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
