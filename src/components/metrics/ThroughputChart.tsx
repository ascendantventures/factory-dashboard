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

interface ThroughputDataPoint {
  period: string;
  count: number;
}

interface ThroughputChartProps {
  data: ThroughputDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg text-sm border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
    >
      <p style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-mono font-medium">{payload[0].value} issues</p>
    </div>
  );
};

export function ThroughputChart({ data }: ThroughputChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-48 rounded-lg border border-dashed text-sm"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        No throughput data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="period"
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
