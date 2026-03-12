'use client'

import { formatDistanceToNow } from 'date-fns'

interface DeploymentHistoryProps {
  deployedAt: string | null
  deployState: string | null
}

function getDeployStateStyle(state: string): React.CSSProperties {
  switch (state.toUpperCase()) {
    case 'READY':
      return { color: '#22C55E' }
    case 'ERROR':
      return { color: '#EF4444' }
    case 'BUILDING':
      return { color: '#EAB308' }
    default:
      return { color: 'var(--text-muted)' }
  }
}

export default function DeploymentHistory({ deployedAt, deployState }: DeploymentHistoryProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
      {deployedAt === null ? (
        <span style={{ color: 'var(--text-muted)' }}>
          <span style={{ marginRight: '8px' }}>—</span>
          <span style={{ color: 'var(--text-muted)' }}>
            Add VERCEL_TOKEN to enable deployment tracking.
          </span>
        </span>
      ) : (
        <>
          <span
            style={{ color: 'var(--text-secondary)' }}
            title={deployedAt}
          >
            {formatDistanceToNow(new Date(deployedAt), { addSuffix: true })}
          </span>
          {deployState !== null && (
            <span style={getDeployStateStyle(deployState)}>
              {deployState}
            </span>
          )}
        </>
      )}
    </div>
  )
}
