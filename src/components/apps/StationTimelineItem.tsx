'use client'

import { motion } from 'framer-motion'

interface StationTimelineItemProps {
  station: string
  fromStation: string | null
  transitionedAt: string
  actor: string
  index: number
  isLast: boolean
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

const ACTOR_STYLES: Record<string, { bg: string; color: string }> = {
  harness: { bg: 'rgba(99,102,241,0.15)', color: '#6366F1' },
  human: { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
  agent: { bg: 'rgba(168,85,247,0.15)', color: '#A855F7' },
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const nodeVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.15,
      ease: [0.25, 1, 0.5, 1] as [number, number, number, number],
    },
  }),
}

export default function StationTimelineItem({
  station,
  fromStation,
  transitionedAt,
  actor,
  index,
  isLast,
}: StationTimelineItemProps) {
  const dotColor = STATION_COLORS[station] ?? '#6B7280'
  const actorStyle = ACTOR_STYLES[actor] ?? ACTOR_STYLES.harness
  const absoluteDate = new Date(transitionedAt).toLocaleString()
  const relativeTime = formatRelativeTime(transitionedAt)

  return (
    <motion.div
      data-testid="timeline-node"
      custom={index}
      initial="hidden"
      animate="visible"
      variants={nodeVariants}
      style={{
        display: 'flex',
        gap: '12px',
        paddingTop: '12px',
        paddingBottom: '12px',
        position: 'relative',
      }}
    >
      {/* Connector line */}
      {!isLast && (
        <div
          style={{
            position: 'absolute',
            left: '6px',
            top: '28px',
            bottom: '-12px',
            width: '2px',
            background: 'var(--border, #3F3F46)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Dot */}
      <div style={{ flexShrink: 0, paddingTop: '2px' }}>
        <div
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: dotColor,
            border: '2px solid var(--surface, #18181B)',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {fromStation ? (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--text-muted, #71717A)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ color: STATION_COLORS[fromStation] ?? '#6B7280', textTransform: 'capitalize' }}>
                {fromStation}
              </span>
              →
              <span style={{ color: STATION_COLORS[station] ?? '#6B7280', textTransform: 'capitalize' }}>
                {station}
              </span>
            </span>
          ) : (
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-secondary, #A1A1AA)',
                textTransform: 'capitalize',
              }}
            >
              {station}
            </span>
          )}

          {/* Actor badge */}
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              padding: '2px 6px',
              borderRadius: '4px',
              background: actorStyle.bg,
              color: actorStyle.color,
            }}
          >
            {actor}
          </span>
        </div>

        {/* Timestamp */}
        <time
          dateTime={transitionedAt}
          title={absoluteDate}
          style={{
            fontSize: '11px',
            color: 'var(--text-muted, #71717A)',
            display: 'block',
            marginTop: '2px',
          }}
        >
          {relativeTime}
        </time>
      </div>
    </motion.div>
  )
}
