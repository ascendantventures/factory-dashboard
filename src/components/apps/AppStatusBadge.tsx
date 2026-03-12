'use client'

interface AppStatusBadgeProps {
  status: 'active' | 'idle' | 'error'
}

const statusConfig = {
  active: {
    dot: '#22C55E',
    text: 'Active',
    bg: 'rgba(34,197,94,0.15)',
    border: 'rgba(34,197,94,0.3)',
    pulse: true,
  },
  idle: {
    dot: '#71717A',
    text: 'Idle',
    bg: 'rgba(113,113,122,0.15)',
    border: 'rgba(113,113,122,0.3)',
    pulse: false,
  },
  error: {
    dot: '#EF4444',
    text: 'Error',
    bg: 'rgba(239,68,68,0.15)',
    border: 'rgba(239,68,68,0.3)',
    pulse: true,
  },
}

export default function AppStatusBadge({ status }: AppStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      data-testid="app-status-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        paddingLeft: '8px',
        paddingRight: '8px',
        paddingTop: '2px',
        paddingBottom: '2px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.dot,
      }}
    >
      <span
        className={config.pulse ? 'animate-pulse' : undefined}
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '9999px',
          backgroundColor: config.dot,
          flexShrink: 0,
        }}
      />
      {config.text}
    </span>
  )
}
