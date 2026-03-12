'use client';

import { useEffect, useState } from 'react';
import { FileText, DollarSign, TrendingUp, CheckCircle, Clock, Rocket } from 'lucide-react';

interface StatsData {
  total_issues: number;
  total_cost_usd: number;
  avg_cost_usd: number;
  success_rate: number | null;
  active_issues: number;
  last_deployed_at: string | null;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 30) return `${Math.floor(diffDays / 30)}mo ago`;
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMinutes > 0) return `${diffMinutes}m ago`;
  return 'just now';
}

function SkeletonStat() {
  return (
    <div
      style={{
        background: '#1A1918',
        border: '1px solid #3D3937',
        borderRadius: '8px',
        padding: '16px 20px',
        minWidth: '160px',
        animation: 'skeleton 1.5s ease-in-out infinite',
        height: '88px',
      }}
    />
  );
}

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  testId: string;
}

function StatCard({ label, value, subtext, icon: Icon, testId }: StatCardProps) {
  return (
    <div
      data-testid={testId}
      style={{
        background: '#1A1918',
        border: '1px solid #3D3937',
        borderRadius: '8px',
        padding: '16px 20px',
        minWidth: '160px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <Icon size={20} style={{ color: '#7A7672' }} />
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: '#7A7672',
            fontFamily: 'var(--font-ui, "Plus Jakarta Sans", system-ui, sans-serif)',
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#F5F3F0',
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {subtext && (
        <div style={{ fontSize: '12px', color: '#7A7672', marginTop: '2px' }}>{subtext}</div>
      )}
    </div>
  );
}

export default function AppStatsBar({ repoId }: { repoId: string }) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/apps/${repoId}/stats`)
      .then((r) => r.json())
      .then((d) => {
        setStats(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [repoId]);

  if (loading) {
    return (
      <div
        data-testid="app-stats-bar"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const successRateDisplay =
    stats.success_rate !== null ? `${Math.round(stats.success_rate * 100)}%` : '—';

  const lastDeployedDisplay = stats.last_deployed_at
    ? formatRelativeTime(stats.last_deployed_at)
    : 'Never';

  return (
    <div
      data-testid="app-stats-bar"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}
    >
      <StatCard
        testId="stat-total-issues"
        label="Total Issues"
        value={String(stats.total_issues)}
        icon={FileText}
      />
      <StatCard
        testId="stat-total-cost"
        label="Total Cost"
        value={`$${stats.total_cost_usd.toFixed(2)}`}
        icon={DollarSign}
      />
      <StatCard
        testId="stat-avg-cost"
        label="Avg Cost"
        value={`$${stats.avg_cost_usd.toFixed(2)}`}
        subtext="per issue"
        icon={TrendingUp}
      />
      <StatCard
        testId="stat-success-rate"
        label="Success Rate"
        value={successRateDisplay}
        icon={CheckCircle}
      />
      <StatCard
        testId="stat-active-issues"
        label="Active Issues"
        value={String(stats.active_issues)}
        icon={Clock}
      />
      <StatCard
        testId="stat-last-deployed"
        label="Last Deployed"
        value={lastDeployedDisplay}
        icon={Rocket}
      />
    </div>
  );
}
