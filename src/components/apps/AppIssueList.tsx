'use client'

import { FileText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface AppIssue {
  id: number
  issue_number: number
  title: string
  station: string | null
  labels: string[]
  updated_at: string
  github_issue_url: string | null
}

interface AppIssueListProps {
  issues: AppIssue[]
}

const STATION_ORDER = ['intake', 'spec', 'design', 'build', 'qa', 'bugfix', 'done']

const STATION_DISPLAY_NAMES: Record<string, string> = {
  intake: 'Intake',
  spec: 'Spec',
  design: 'Design',
  build: 'Build',
  qa: 'QA',
  bugfix: 'Bugfix',
  done: 'Done',
}

export default function AppIssueList({ issues }: AppIssueListProps) {
  if (!issues || issues.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          paddingTop: '32px',
          paddingBottom: '32px',
        }}
      >
        <FileText size={32} style={{ color: 'var(--border)' }} />
        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          No issues found for this app.
        </span>
      </div>
    )
  }

  // Group issues by station
  const grouped: Record<string, AppIssue[]> = {}
  for (const issue of issues) {
    const station = issue.station ?? 'intake'
    if (!grouped[station]) {
      grouped[station] = []
    }
    grouped[station].push(issue)
  }

  // Render in pipeline order, skipping empty groups
  const stationsWithIssues = STATION_ORDER.filter((s) => grouped[s] && grouped[s].length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {stationsWithIssues.map((station) => (
        <div key={station}>
          <div
            data-testid="station-group-heading"
            style={{
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              paddingBottom: '4px',
              marginBottom: '4px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {STATION_DISPLAY_NAMES[station] ?? station}
          </div>
          <div>
            {grouped[station].map((issue) => (
              <div
                key={issue.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  paddingTop: '6px',
                  paddingBottom: '6px',
                  fontSize: '14px',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >
                  #{issue.issue_number}
                </span>
                <a
                  href={issue.github_issue_url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    minWidth: 0,
                    transition: 'color 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.color = '#6366F1'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)'
                  }}
                >
                  {issue.title}
                </a>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                    marginLeft: 'auto',
                  }}
                >
                  {formatDistanceToNow(new Date(issue.updated_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
