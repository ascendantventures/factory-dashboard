'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { STATION_COLORS } from '@/lib/constants';

interface DurationDataPoint {
  station: string;
  avg_hours: number;
}

interface DurationChartProps {
  data: DurationDataPoint[];
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
      <p className="font-mono font-medium">{payload[0].value.toFixed(1)}h avg</p>
    </div>
  );
};

export function DurationChart({ data }: DurationChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-48 rounded-lg border border-dashed text-sm"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        No duration data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="station"
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          unit="h"
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="avg_hours" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={STATION_COLORS[entry.station as keyof typeof STATION_COLORS] ?? 'var(--primary)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
