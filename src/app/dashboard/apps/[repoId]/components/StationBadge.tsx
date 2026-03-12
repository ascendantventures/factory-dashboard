'use client';

const STATION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  intake:  { bg: '#252321', text: '#B8B4AF', border: '#3D3937' },
  spec:    { bg: '#1E3A5F', text: '#60A5FA', border: '#3B82F6' },
  design:  { bg: '#4C1D95', text: '#A78BFA', border: '#7C3AED' },
  build:   { bg: '#164E63', text: '#22D3EE', border: '#06B6D4' },
  test:    { bg: '#713F12', text: '#FBBF24', border: '#F59E0B' },
  done:    { bg: '#064E3B', text: '#34D399', border: '#10B981' },
  failed:  { bg: '#7F1D1D', text: '#FCA5A5', border: '#EF4444' },
};

const DEFAULT_COLORS = { bg: '#252321', text: '#B8B4AF', border: '#3D3937' };

export default function StationBadge({ station }: { station: string | null }) {
  if (!station) return null;
  const colors = STATION_COLORS[station.toLowerCase()] ?? DEFAULT_COLORS;

  return (
    <span
      data-testid="station-badge"
      style={{
        display: 'inline-block',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        padding: '4px 8px',
        borderRadius: '4px',
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        color: colors.text,
        fontFamily: 'var(--font-ui, "Plus Jakarta Sans", system-ui, sans-serif)',
        whiteSpace: 'nowrap',
      }}
    >
      {station}
    </span>
  );
}
