'use client';

import { DollarSign, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import type { ROIData } from '../hooks/useAnalyticsROI';

interface ROIMetricsGridProps {
  data: ROIData | null;
  loading: boolean;
}

interface ROICardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  testId: string;
  loading: boolean;
  color?: string;
}

function ROICard({ icon, label, value, subtitle, testId, loading, color = 'var(--text-primary)' }: ROICardProps) {
  return (
    <div
      data-testid={testId}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px 24px',
        minHeight: '120px',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start',
      }}
    >
      <div style={{
        color: 'var(--text-muted)',
        marginTop: '2px',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-ui, "Instrument Sans", system-ui, sans-serif)',
          display: 'block',
          marginBottom: '8px',
        }}>
          {label}
        </span>
        {loading ? (
          <div style={{ height: '32px', borderRadius: '6px', background: 'var(--surface-alt)' }} />
        ) : (
          <>
            <span style={{
              fontFamily: '"Space Grotesk", system-ui, sans-serif',
              fontSize: '28px',
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"tnum" 1',
              color,
              display: 'block',
            }}>
              {value}
            </span>
            {subtitle && (
              <span style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-ui, "Instrument Sans", system-ui, sans-serif)',
                marginTop: '4px',
                display: 'block',
              }}>
                {subtitle}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ROIMetricsGrid({ data, loading }: ROIMetricsGridProps) {
  const qaColor = data
    ? data.qa_first_try_rate >= 70 ? '#22C55E' : data.qa_first_try_rate >= 40 ? '#EAB308' : '#EF4444'
    : 'var(--text-primary)';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
    }}>
      <ROICard
        icon={<DollarSign size={24} />}
        label="Cost per Issue"
        value={`$${(data?.cost_per_issue ?? 0).toFixed(4)}`}
        testId="roi-cost-per-issue"
        loading={loading}
      />
      <ROICard
        icon={<Clock size={24} />}
        label="Avg Time-to-Deploy"
        value={`${data?.avg_time_to_deploy_hours ?? 0}h`}
        subtitle="wall-clock per issue"
        testId="roi-time-to-deploy"
        loading={loading}
      />
      <ROICard
        icon={<CheckCircle2 size={24} />}
        label="QA First-Try Rate"
        value={`${data?.qa_first_try_rate ?? 0}%`}
        subtitle="passed QA without bugfix"
        testId="roi-qa-first-try"
        loading={loading}
        color={qaColor}
      />
      <ROICard
        icon={<TrendingUp size={24} />}
        label="Issues Completed"
        value={String(data?.issues_completed ?? 0)}
        subtitle={`vs ~${data?.estimated_manual_hours ?? 0}h manual est.`}
        testId="roi-issues-completed"
        loading={loading}
      />
    </div>
  );
}
