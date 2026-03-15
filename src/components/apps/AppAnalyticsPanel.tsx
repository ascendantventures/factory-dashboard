'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Eye, Users, Clock, AlertTriangle, RefreshCw, BarChart3, AlertCircle } from 'lucide-react'

interface AnalyticsMetrics {
  pageviews: number
  unique_visitors: number
  p75_latency_ms: number
  error_rate_pct: number
}

interface AnalyticsResponse {
  repo_full_name: string
  cached: boolean
  fetched_at: string | null
  metrics: AnalyticsMetrics | null
  unconfigured?: boolean
}

interface AppAnalyticsPanelProps {
  repoId: string
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  const diffHours = Math.floor(diffMins / 60)
  return `${diffHours}h ago`
}

function latencyColor(ms: number): string {
  if (ms < 200) return 'var(--success, #22C55E)'
  if (ms < 500) return 'var(--warning, #F59E0B)'
  return 'var(--error, #EF4444)'
}

function errorRateColor(pct: number): string {
  if (pct < 1) return 'var(--success, #22C55E)'
  if (pct < 5) return 'var(--warning, #F59E0B)'
  return 'var(--error, #EF4444)'
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.2, ease: [0.25, 1, 0.5, 1] as const },
  }),
}

interface MetricCardProps {
  icon: React.ReactNode
  iconBg: string
  value: string | number
  label: string
  unit?: string
  valueColor?: string
  index: number
}

function MetricCard({ icon, iconBg, value, label, unit, valueColor, index }: MetricCardProps) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      style={{
        background: 'var(--surface-alt)',
        borderRadius: '6px',
        padding: '16px',
        border: '1px solid var(--border)',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
          background: iconBg,
        }}
      >
        {icon}
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: '32px',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
          color: valueColor ?? 'var(--text-primary)',
          marginBottom: '4px',
        }}
      >
        {value}
      </div>

      {/* Label + unit */}
      <div
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {label}
        {unit && (
          <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>{unit}</span>
        )}
      </div>
    </motion.div>
  )
}

export default function AppAnalyticsPanel({ repoId }: AppAnalyticsPanelProps) {
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      if (forceRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      try {
        const url = `/api/apps/${repoId}/analytics${forceRefresh ? '?refresh=true' : ''}`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Failed: ${res.status}`)
        const json = await res.json() as AnalyticsResponse
        setData(json)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [repoId],
  )

  useEffect(() => {
    void fetchData(false)
  }, [fetchData])

  if (loading) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            aria-hidden="true"
            className="animate-pulse"
            style={{
              height: '100px',
              borderRadius: '6px',
              backgroundColor: 'var(--surface-alt)',
            }}
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          background: 'var(--surface-alt)',
          border: '1px dashed var(--border)',
          borderRadius: '6px',
          padding: '32px',
          textAlign: 'center',
        }}
      >
        <AlertCircle
          size={24}
          style={{ color: 'var(--error, #EF4444)', display: 'block', margin: '0 auto 8px' }}
        />
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Failed to load analytics
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          {error}
        </div>
        <button
          onClick={() => void fetchData(true)}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '13px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  // Unconfigured state
  if (data.unconfigured || !data.metrics) {
    return (
      <div
        data-testid="analytics-unconfigured"
        style={{
          background: 'var(--surface-alt)',
          border: '1px dashed var(--border)',
          borderRadius: '6px',
          padding: '32px',
          textAlign: 'center',
        }}
      >
        <BarChart3
          size={32}
          style={{
            color: 'var(--text-muted)',
            opacity: 0.4,
            display: 'block',
            margin: '0 auto 12px',
          }}
        />
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '4px',
          }}
        >
          Analytics not configured
        </div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 400,
            color: 'var(--text-secondary)',
            maxWidth: '280px',
            margin: '0 auto',
            lineHeight: 1.5,
          }}
        >
          Add{' '}
          <code
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '12px',
              background: 'var(--surface)',
              padding: '1px 4px',
              borderRadius: '3px',
            }}
          >
            VERCEL_ANALYTICS_TOKEN
          </code>{' '}
          to your environment variables to see app performance metrics.
        </div>
      </div>
    )
  }

  const m = data.metrics

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Metric grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
        }}
      >
        <div data-testid="analytics-pageviews">
          <MetricCard
            index={0}
            icon={<Eye size={18} style={{ color: '#6366F1' }} />}
            iconBg="rgba(99,102,241,0.15)"
            value={m.pageviews.toLocaleString()}
            label="Page Views"
            unit="7d"
          />
        </div>
        <div data-testid="analytics-visitors">
          <MetricCard
            index={1}
            icon={<Users size={18} style={{ color: '#6366F1' }} />}
            iconBg="rgba(99,102,241,0.15)"
            value={m.unique_visitors.toLocaleString()}
            label="Unique Visitors"
            unit="7d"
          />
        </div>
        <div data-testid="analytics-latency">
          <MetricCard
            index={2}
            icon={<Clock size={18} style={{ color: '#F59E0B' }} />}
            iconBg="rgba(245,158,11,0.15)"
            value={m.p75_latency_ms}
            label="p75 Latency"
            unit="ms"
            valueColor={latencyColor(m.p75_latency_ms)}
          />
        </div>
        <div data-testid="analytics-errorrate">
          <MetricCard
            index={3}
            icon={<AlertTriangle size={18} style={{ color: '#EF4444' }} />}
            iconBg="rgba(239,68,68,0.15)"
            value={m.error_rate_pct}
            label="Error Rate"
            unit="%"
            valueColor={errorRateColor(m.error_rate_pct)}
          />
        </div>
      </div>

      {/* Cache notice */}
      {data.fetched_at && (
        <div
          data-testid="analytics-cache-notice"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 400,
            color: 'var(--text-muted)',
          }}
        >
          <Clock size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span>Updated {formatRelativeTime(data.fetched_at)}</span>
          <button
            aria-label="Refresh analytics"
            data-testid="analytics-refresh"
            onClick={() => void fetchData(true)}
            disabled={refreshing}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: refreshing ? 'default' : 'pointer',
              color: 'var(--text-muted)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
              }}
            />
          </button>
        </div>
      )}
    </div>
  )
}
