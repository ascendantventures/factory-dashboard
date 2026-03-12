'use client';

import { AlertCircle, Loader2, XCircle } from 'lucide-react';

type DeployState = 'READY' | 'BUILDING' | 'ERROR' | 'CANCELED' | 'QUEUED' | string;

interface StatusBadgeProps {
  state: DeployState;
  'data-testid'?: string;
}

const STATE_CONFIG: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  READY: {
    bg: 'rgba(34,197,94,0.15)',
    text: '#22C55E',
    icon: (
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#22C55E',
          display: 'inline-block',
          animation: 'vercel-dot-pulse 2s infinite',
        }}
      />
    ),
  },
  BUILDING: {
    bg: 'rgba(234,179,8,0.15)',
    text: '#EAB308',
    icon: <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />,
  },
  QUEUED: {
    bg: 'rgba(234,179,8,0.15)',
    text: '#EAB308',
    icon: <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />,
  },
  ERROR: {
    bg: 'rgba(239,68,68,0.15)',
    text: '#EF4444',
    icon: <AlertCircle size={14} />,
  },
  CANCELED: {
    bg: 'rgba(113,113,122,0.15)',
    text: '#71717A',
    icon: <XCircle size={14} />,
  },
};

export default function StatusBadge({ state, 'data-testid': testId }: StatusBadgeProps) {
  const config = STATE_CONFIG[state] ?? STATE_CONFIG['CANCELED'];
  const label = state.charAt(0) + state.slice(1).toLowerCase();

  return (
    <span
      data-testid={testId}
      data-state={state}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 24,
        padding: '4px 10px',
        borderRadius: 6,
        background: config.bg,
        color: config.text,
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {config.icon}
      {label}
    </span>
  );
}
