'use client'

import { useEffect, useState } from 'react'
import { GitBranch } from 'lucide-react'
import StationTimelineItem from './StationTimelineItem'

interface StationTransition {
  from_station: string | null
  station: string
  transitioned_at: string
  actor: string
}

interface IssueWithHistory {
  issue_number: number
  title: string
  transitions: StationTransition[]
}

interface StationTimelineProps {
  repoId: string
}

function SkeletonTimeline() {
  return (
    <div
      aria-hidden="true"
      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            className="animate-pulse"
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: 'var(--surface-alt)',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              className="animate-pulse"
              style={{
                height: '13px',
                borderRadius: '4px',
                backgroundColor: 'var(--surface-alt)',
                width: '60%',
              }}
            />
            <div
              className="animate-pulse"
              style={{
                height: '11px',
                borderRadius: '4px',
                backgroundColor: 'var(--surface-alt)',
                width: '40%',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyTimeline() {
  return (
    <div
      data-testid="timeline-empty"
      style={{
        background: 'var(--surface-alt)',
        border: '1px dashed var(--border)',
        borderRadius: '6px',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <GitBranch
        size={24}
        style={{ color: 'var(--text-muted)', marginBottom: '8px', display: 'block', margin: '0 auto 8px' }}
      />
      <div
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--text-secondary)',
        }}
      >
        No history recorded
      </div>
      <div
        style={{
          fontSize: '12px',
          fontWeight: 400,
          color: 'var(--text-muted)',
          marginTop: '4px',
        }}
      >
        Timeline populates after the next station transition.
      </div>
    </div>
  )
}

export default function StationTimeline({ repoId }: StationTimelineProps) {
  const [issues, setIssues] = useState<IssueWithHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/apps/${repoId}/history`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load history: ${res.status}`)
        return res.json()
      })
      .then((json: { issues?: IssueWithHistory[] }) => {
        if (!cancelled) {
          setIssues(json.issues ?? [])
          setLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [repoId])

  if (loading) return <SkeletonTimeline />

  if (error) {
    return (
      <div style={{ fontSize: '13px', color: 'var(--error, #EF4444)' }}>
        Failed to load timeline: {error}
      </div>
    )
  }

  const hasAnyTransitions = issues.some((i) => i.transitions.length > 0)

  if (!hasAnyTransitions) {
    return <EmptyTimeline />
  }

  let globalIndex = 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {issues.map((issue) => {
        if (issue.transitions.length === 0) return null

        return (
          <div key={issue.issue_number} data-testid="timeline-issue-group">
            {/* Issue header */}
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px',
                paddingLeft: '20px',
              }}
            >
              <a
                href={`https://github.com/ascendantventures/harness-beta-test/issues/${issue.issue_number}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--primary)',
                  textDecoration: 'none',
                }}
              >
                #{issue.issue_number}
              </a>
              {' '}
              <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
                {issue.title}
              </span>
            </div>

            {/* Timeline items */}
            <div
              style={{
                position: 'relative',
                paddingLeft: '20px',
              }}
            >
              {/* Connector line */}
              {issue.transitions.length > 1 && (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '7px',
                    top: '20px',
                    bottom: '20px',
                    width: '2px',
                    background: 'var(--border)',
                  }}
                />
              )}

              {issue.transitions.map((t) => {
                const idx = globalIndex++
                return (
                  <StationTimelineItem
                    key={`${issue.issue_number}-${t.station}-${t.transitioned_at}`}
                    station={t.station}
                    fromStation={t.from_station}
                    transitionedAt={t.transitioned_at}
                    actor={t.actor}
                    index={idx}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
