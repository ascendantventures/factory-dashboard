'use client'

import { GitBranch } from 'lucide-react'
import StationTimelineItem from './StationTimelineItem'

interface Transition {
  from_station: string | null
  station: string
  transitioned_at: string
  actor: string
}

interface IssueHistory {
  issue_number: number
  title: string
  transitions: Transition[]
}

interface StationTimelineProps {
  issues: IssueHistory[]
}

function TimelineSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', paddingTop: '12px' }}>
          {/* Dot skeleton */}
          <div
            className="animate-pulse"
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: 'var(--surface-alt, #27272A)',
              flexShrink: 0,
              marginTop: '2px',
            }}
          />
          {/* Text skeletons */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div
              className="animate-pulse"
              style={{
                height: '13px',
                borderRadius: '4px',
                background: 'var(--surface-alt, #27272A)',
                width: '100%',
              }}
            />
            <div
              className="animate-pulse"
              style={{
                height: '11px',
                borderRadius: '4px',
                background: 'var(--surface-alt, #27272A)',
                width: '60%',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function StationTimeline({ issues }: StationTimelineProps) {
  const hasAnyTransitions = issues.some((i) => i.transitions.length > 0)

  if (!hasAnyTransitions) {
    return (
      <div
        data-testid="timeline-empty"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '32px 16px',
          textAlign: 'center',
        }}
      >
        <GitBranch size={24} style={{ color: 'var(--text-muted, #71717A)' }} />
        <div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary, #A1A1AA)' }}>
            No history recorded
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted, #71717A)', marginTop: '4px' }}>
            Timeline populates after the next station transition.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {issues.map((issue) => (
        <div key={issue.issue_number} data-testid="timeline-issue-group">
          {/* Issue header */}
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted, #71717A)',
              marginBottom: '4px',
            }}
          >
            #{issue.issue_number}
          </div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-secondary, #A1A1AA)',
              marginBottom: '8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {issue.title}
          </div>

          {issue.transitions.length === 0 ? (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-muted, #71717A)',
                fontStyle: 'italic',
              }}
            >
              No transitions recorded for this issue yet.
            </div>
          ) : (
            <div style={{ paddingLeft: '0' }}>
              {issue.transitions.map((t, idx) => (
                <StationTimelineItem
                  key={`${t.station}-${t.transitioned_at}`}
                  station={t.station}
                  fromStation={t.from_station}
                  transitionedAt={t.transitioned_at}
                  actor={t.actor}
                  index={idx}
                  isLast={idx === issue.transitions.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export { TimelineSkeleton }
