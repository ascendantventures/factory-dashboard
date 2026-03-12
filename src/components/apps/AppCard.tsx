'use client'

import { ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import AppStatusBadge from './AppStatusBadge'
import AppTechStack from './AppTechStack'
import DeploymentHistory from './DeploymentHistory'

type AppSummary = {
  id: string
  repo_full_name: string
  display_name: string
  live_url: string | null
  github_url: string
  status: 'active' | 'idle' | 'error'
  last_deployed_at: string | null
  deploy_state: string | null
  issue_counts: { total: number; open: number; done: number }
  tech_stack: string[]
}

interface AppCardProps {
  app: AppSummary
  onClick: () => void
}

export default function AppCard({ app, onClick }: AppCardProps) {
  return (
    <motion.div
      data-testid="app-card"
      onClick={onClick}
      style={{
        borderRadius: '12px',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        padding: '20px',
        cursor: 'pointer',
      }}
      whileHover={{
        y: -2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        borderColor: 'rgba(99,102,241,0.4)',
      }}
      transition={{ duration: 0.15 }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span
          data-testid="app-name"
          style={{
            fontWeight: 600,
            fontSize: '15px',
            color: 'var(--text-primary)',
            flexShrink: 1,
            minWidth: 0,
            marginRight: '8px',
          }}
        >
          {app.display_name}
        </span>
        <AppStatusBadge status={app.status} />
      </div>

      {/* Live URL row */}
      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {app.live_url ? (
          <>
            <ExternalLink size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <a
              href={app.live_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: '12px',
                color: '#6366F1',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '280px',
                textDecoration: 'none',
              }}
            >
              {app.live_url}
            </a>
          </>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
        )}
      </div>

      {/* Deployment history row */}
      <div style={{ marginTop: '12px' }}>
        <DeploymentHistory deployedAt={app.last_deployed_at} deployState={app.deploy_state} />
      </div>

      {/* Issue counts row */}
      <div
        style={{
          marginTop: '12px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span>{app.issue_counts.total} total</span>
        <span>·</span>
        <span>{app.issue_counts.open} open</span>
        <span>·</span>
        <span>{app.issue_counts.done} done</span>
      </div>

      {/* Tech stack row */}
      <div style={{ marginTop: '12px' }}>
        <AppTechStack stack={app.tech_stack} />
      </div>
    </motion.div>
  )
}
