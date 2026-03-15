'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface DeploymentHistoryProps {
  deployedAt: string | null
  deployState: string | null
  isAdmin?: boolean
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

export default function DeploymentHistory({ deployedAt, deployState, isAdmin }: DeploymentHistoryProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
      {deployedAt === null ? (
        <span
          data-testid="deployment-status"
          style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>Deployment tracking not configured</span>
          {isAdmin && (
            <Link
              href="/dashboard/settings"
              data-testid="deployment-settings-link"
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#6366F1',
                textDecoration: 'none',
              }}
            >
              Configure →
            </Link>
          )}
        </span>
      ) : (
        <>
          <span
            data-testid="deployment-status"
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
