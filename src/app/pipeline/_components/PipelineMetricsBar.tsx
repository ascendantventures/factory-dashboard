'use client';

import { Counts } from './types';

interface MetricItemProps {
  value: number;
  label: string;
  accentColor?: string;
}

function MetricItem({ value, label, accentColor = '#3B82F6' }: MetricItemProps) {
  return (
    <div
      style={{
        flex: 1,
        padding: '16px 20px',
        borderLeft: `3px solid ${accentColor}`,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '32px',
          fontWeight: 700,
          color: '#F1F3F9',
          lineHeight: 1.1,
        }}
      >
        {value.toLocaleString()}
      </div>
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#6B7489',
          marginTop: '4px',
        }}
      >
        {label}
      </div>
    </div>
  );
}

interface Props {
  counts: Counts;
}

export default function PipelineMetricsBar({ counts }: Props) {
  return (
    <div
      data-testid="pipeline-metrics-bar"
      style={{
        background: '#141721',
        border: '1px solid #2A2F42',
        borderRadius: '12px',
        flex: 1,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0,
        overflow: 'hidden',
      }}
    >
      <MetricItem value={counts.processed_today} label="Processed Today" accentColor="#3B82F6" />
      <div style={{ width: '1px', background: '#2A2F42', margin: '12px 0' }} />
      <MetricItem value={counts.processed_week} label="This Week" accentColor="#8B5CF6" />
      <div style={{ width: '1px', background: '#2A2F42', margin: '12px 0' }} />
      <MetricItem value={counts.processed_total} label="All Time" accentColor="#6B7489" />
      <div style={{ width: '1px', background: '#2A2F42', margin: '12px 0' }} />
      <MetricItem value={counts.active_agents} label="Active Agents" accentColor="#22C55E" />
      <div style={{ width: '1px', background: '#2A2F42', margin: '12px 0' }} />
      <MetricItem value={counts.errors_today} label="Errors Today" accentColor={counts.errors_today > 0 ? '#EF4444' : '#6B7489'} />
    </div>
  );
}
