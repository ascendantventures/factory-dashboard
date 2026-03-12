'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { VercelDeployment } from '@/lib/vercel-api';

interface MetricsChartProps {
  deployments: VercelDeployment[];
}

interface ChartPoint {
  label: string;
  buildSeconds?: number;
  bundleKB?: number;
}

function shortDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const tooltipStyle = {
  background: '#24242E',
  border: '1px solid #2A2A36',
  borderRadius: 6,
  fontSize: 12,
  color: '#F4F4F5',
};

export default function MetricsChart({ deployments }: MetricsChartProps) {
  // Build chart data — only include points with valid data
  const buildTimeData: ChartPoint[] = deployments
    .filter((d) => d.buildDurationMs !== undefined)
    .map((d) => ({
      label: shortDate(d.createdAt),
      buildSeconds: Math.round((d.buildDurationMs ?? 0) / 1000),
    }))
    .reverse();

  const hasBuildData = buildTimeData.length > 0;

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 20px' }}>
        Deployment Metrics
      </h3>

      {/* Build Duration Chart */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
          Build Duration (seconds)
        </div>
        {hasBuildData ? (
          <div data-testid="build-time-chart" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={buildTimeData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F28" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#71717A' }}
                  axisLine={{ stroke: '#2A2A36' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#71717A' }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [`${v}s`, 'Build Time']}
                />
                <Line
                  type="monotone"
                  dataKey="buildSeconds"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 4, stroke: '#3B82F6', strokeWidth: 2, fill: '#141419' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div
            data-testid="build-time-chart"
            style={{ height: 180, background: '#1C1C24', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No build duration data</span>
          </div>
        )}
      </div>

      {/* Bundle size placeholder — Vercel API doesn't always expose this per-deployment */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
          Bundle Size Trend
        </div>
        <div
          data-testid="bundle-size-chart"
          style={{ height: 180, background: '#1C1C24', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Bundle size data requires deployment detail fetch</span>
        </div>
      </div>
    </div>
  );
}
