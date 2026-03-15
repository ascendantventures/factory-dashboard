'use client';

import type { RealtimeStatus } from '@/hooks/useRealtimeEvents';

interface RealtimePulseProps {
  status: RealtimeStatus;
}

const statusConfig = {
  live: {
    label: 'Live',
    dotColor: 'var(--pulse-live, #22C55E)',
    bgColor: 'var(--pulse-live-bg, rgba(34,197,94,0.15))',
    tooltip: 'Events update automatically',
    pulse: true,
  },
  connecting: {
    label: 'Connecting...',
    dotColor: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.1)',
    tooltip: 'Connecting to real-time stream...',
    pulse: false,
  },
  polling: {
    label: 'Polling',
    dotColor: 'var(--pulse-polling, #8B8B95)',
    bgColor: 'var(--pulse-polling-bg, rgba(139,139,149,0.1))',
    tooltip: 'Click Refresh to see new events',
    pulse: false,
  },
};

export default function RealtimePulse({ status }: RealtimePulseProps) {
  const config = statusConfig[status];

  return (
    <span
      data-testid="realtime-pulse"
      title={config.tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        borderRadius: '6px',
        background: config.bgColor,
        border: '1px solid rgba(255,255,255,0.04)',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      {/* Dot with optional pulse ring */}
      <span style={{ position: 'relative', width: '8px', height: '8px', flexShrink: 0, display: 'inline-block' }}>
        <span style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: config.dotColor,
        }} />
        {config.pulse && (
          <span
            className="pulse-ring"
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              background: config.dotColor,
              animation: 'realtime-pulse-ring 2s ease-out infinite',
              opacity: 0.5,
            }}
          />
        )}
        {status === 'connecting' && (
          <span style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: config.dotColor,
            animation: 'pulse-blink 1s ease-in-out infinite',
          }} />
        )}
      </span>

      {/* Label — hidden on mobile via CSS class */}
      <span
        className="realtime-pulse-label"
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--text-secondary, #A1A1AA)',
        }}
      >
        {config.label}
      </span>
    </span>
  );
}
