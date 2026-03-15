'use client'

import { motion } from 'framer-motion'

interface StationTimelineItemProps {
  station: string
  fromStation: string | null
  transitionedAt: string
  actor: string
  index: number
}

const STATION_COLORS: Record<string, string> = {
  intake: '#6B7280',
  spec: '#3B82F6',
  design: '#A855F7',
  build: '#F59E0B',
  qa: '#06B6D4',
  bugfix: '#EF4444',
  done: '#22C55E',
}

const ACTOR_BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  harness: { bg: 'rgba(99,102,241,0.15)', color: '#6366F1' },
  human: { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
  agent: { bg: 'rgba(168,85,247,0.15)', color: '#A855F7' },
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const nodeVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.03, duration: 0.15, ease: [0.25, 1, 0.5, 1] as const },
  }),
}

export default function StationTimelineItem({
  station,
  fromStation,
  transitionedAt,
  actor,
  index,
}: StationTimelineItemProps) {
  const dotColor = STATION_COLORS[station] ?? '#6B7280'
  const actorStyle = ACTOR_BADGE_STYLES[actor] ?? ACTOR_BADGE_STYLES.harness
  const absoluteDate = new Date(transitionedAt).toLocaleString()

  return (
    <motion.div
      data-testid="timeline-node"
      custom={index}
      variants={nodeVariants}
      initial="hidden"
      animate="visible"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        paddingTop: '12px',
        paddingBottom: '12px',
        position: 'relative',
      }}
    >
      {/* Station dot (positioned in timeline column) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-20px',
          top: '18px',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          border: '2px solid var(--surface)',
          background: dotColor,
          flexShrink: 0,
        }}
      />

      {/* Text content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {/* Station name + from arrow */}
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            textTransform: 'capitalize',
          }}
        >
          {fromStation ? (
            <span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'capitalize' }}>
                {fromStation}
              </span>
              <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>→</span>
            </span>
          ) : null}
          {station}
        </div>

        {/* Timestamp row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            title={absoluteDate}
            style={{
              fontSize: '11px',
              fontWeight: 400,
              color: 'var(--text-muted)',
              cursor: 'default',
            }}
          >
            {formatRelativeTime(transitionedAt)}
          </span>

          {/* Actor badge */}
          <span
            style={{
              display: 'inline-flex',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              background: actorStyle.bg,
              color: actorStyle.color,
            }}
          >
            {actor}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
