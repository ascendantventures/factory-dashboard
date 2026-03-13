'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SpendByStationChartProps {
  data: { station: string; cost_usd: number; count: number }[];
  loading: boolean;
}

const STATION_COLORS: Record<string, string> = {
  spec: '#3B82F6',
  design: '#A855F7',
  build: '#22C55E',
  qa: '#EAB308',
  bugfix: '#EF4444',
  unknown: '#64748B',
};

function getColor(station: string) {
  return STATION_COLORS[station.toLowerCase()] ?? '#64748B';
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { station: string; cost_usd: number; count: number }; value: number }> }) {
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
        {d.station}
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

export default function SpendByStationChart({ data, loading }: SpendByStationChartProps) {
  return (
    <div
      data-testid="chart-spend-by-station"
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
        Spend by Station
      </h3>
      {loading ? (
        <div style={{ height: '300px', background: 'var(--surface-alt)', borderRadius: '8px' }} />
      ) : data.length === 0 ? (
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          No data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="cost_usd"
              nameKey="station"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={50}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={getColor(entry.station)} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span style={{ fontSize: '13px', color: '#CBD5E1' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
