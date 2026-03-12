'use client';

const COMPLEXITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  simple:  { bg: '#064E3B', text: '#34D399', border: '#10B981' },
  medium:  { bg: '#713F12', text: '#FBBF24', border: '#F59E0B' },
  complex: { bg: '#7F1D1D', text: '#FCA5A5', border: '#EF4444' },
};

const DEFAULT = { bg: '#252321', text: '#B8B4AF', border: '#3D3937' };

export default function ComplexityBadge({ complexity }: { complexity: string | null }) {
  if (!complexity) return null;
  const colors = COMPLEXITY_COLORS[complexity.toLowerCase()] ?? DEFAULT;

  return (
    <span
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
      {complexity}
    </span>
  );
}
