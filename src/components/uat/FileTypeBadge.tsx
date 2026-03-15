'use client';

interface FileTypeBadgeProps {
  fileType: 'png' | 'pdf' | 'other';
}

const config = {
  png: {
    label: 'PNG',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.15)',
  },
  pdf: {
    label: 'PDF',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.15)',
  },
  other: {
    label: 'FILE',
    color: '#71717A',
    bg: 'rgba(113,113,122,0.15)',
  },
};

export function FileTypeBadge({ fileType }: FileTypeBadgeProps) {
  const { label, color, bg } = config[fileType] ?? config.other;
  return (
    <span
      data-testid="file-badge"
      aria-label={`File type: ${label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        color,
        background: bg,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {label}
    </span>
  );
}
