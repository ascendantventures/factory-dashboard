'use client';

interface TotalsGridProps {
  totals: {
    all_time: number;
    this_month: number;
    this_week: number;
    today: number;
  } | null;
  loading: boolean;
}

function fmt(n: number) {
  return `$${n.toFixed(4)}`;
}

interface MetricCardProps {
  label: string;
  value: string;
  testId: string;
  loading: boolean;
}

function MetricCard({ label, value, testId, loading }: MetricCardProps) {
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
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <span style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-ui, "Instrument Sans", system-ui, sans-serif)',
      }}>
        {label}
      </span>
      {loading ? (
        <div style={{
          height: '48px',
          borderRadius: '6px',
          background: 'var(--surface-alt)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ) : (
        <span style={{
          fontFamily: '"Space Grotesk", system-ui, sans-serif',
          fontSize: '32px',
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
          fontVariantNumeric: 'tabular-nums',
          fontFeatureSettings: '"tnum" 1',
          color: 'var(--text-primary)',
        }}>
          {value}
        </span>
      )}
    </div>
  );
}

export default function TotalsGrid({ totals, loading }: TotalsGridProps) {
  return (
    <div
      data-testid="totals-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      }}
    >
      <MetricCard label="All-Time Spend" value={fmt(totals?.all_time ?? 0)} testId="total-all-time" loading={loading} />
      <MetricCard label="This Month" value={fmt(totals?.this_month ?? 0)} testId="total-this-month" loading={loading} />
      <MetricCard label="This Week" value={fmt(totals?.this_week ?? 0)} testId="total-this-week" loading={loading} />
      <MetricCard label="Today" value={fmt(totals?.today ?? 0)} testId="total-today" loading={loading} />
    </div>
  );
}
