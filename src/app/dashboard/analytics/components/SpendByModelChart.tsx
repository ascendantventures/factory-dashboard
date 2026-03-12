'use client';

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SpendByModelChartProps {
  data: { model: string; cost_usd: number; count: number }[];
  loading: boolean;
}

const MODEL_COLORS: Record<string, string> = {
  'claude-opus-4-6': '#3B82F6',
  'claude-sonnet-4-6': '#A855F7',
  'claude-haiku-4-5': '#22C55E',
  'opus': '#3B82F6',
  'sonnet': '#A855F7',
  'haiku': '#22C55E',
};

function getModelColor(model: string): string {
  for (const [key, color] of Object.entries(MODEL_COLORS)) {
    if (model.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return '#64748B';
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { model: string; cost_usd: number; count: number } }> }) {
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
        {d.model}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <span style={{ fontSize: '13px', color: '#CBD5E1' }}>Cost</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>${d.cost_usd.toFixed(4)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <span style={{ fontSize: '13px', color: '#CBD5E1' }}>Runs</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>{d.count}</span>
      </div>
    </div>
  );
}

export default function SpendByModelChart({ data, loading }: SpendByModelChartProps) {
  const chartData = data.map(d => ({
    ...d,
    fill: getModelColor(d.model),
  }));

  return (
    <div
      data-testid="chart-spend-by-model"
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
        margin: '0 0 20px 0',
      }}>
        Spend by Model
      </h3>
      {loading ? (
        <div style={{ height: '300px', background: 'var(--surface-alt)', borderRadius: '8px' }} />
      ) : data.length === 0 ? (
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          No data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2B36" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={v => `$${v}`}
              tick={{ fill: '#64748B', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="model"
              tick={{ fill: '#64748B', fontSize: 12 }}
              axisLine={{ stroke: '#2A2B36' }}
              tickLine={false}
              width={120}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cost_usd" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
