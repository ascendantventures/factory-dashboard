'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Eye, Users, Clock, AlertTriangle, RefreshCw, AlertCircle, BarChart3 } from 'lucide-react'

interface AnalyticsMetrics {
  pageviews: number
  unique_visitors: number
  p75_latency_ms: number
  error_rate_pct: number
}

interface AnalyticsResponse {
  repo_full_name: string
  configured: boolean
  cached: boolean
  fetched_at: string | null
  metrics: AnalyticsMetrics | null
  error?: string
}

interface AppAnalyticsPanelProps {
  repoId: string
  initialData?: AnalyticsResponse | null
}

const metricCardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.2,
      ease: [0.25, 1, 0.5, 1] as [number, number, number, number],
    },
  }),
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  unit?: string
  colorVar: string
  iconBg: string
  index: number
  testId: string
}

function MetricCard({ icon, label, value, unit, colorVar, iconBg, index, testId }: MetricCardProps) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={metricCardVariants}
      data-testid={testId}
      style={{
        background: 'var(--surface-alt, #27272A)',
        borderRadius: '6px',
        padding: '16px',
        border: '1px solid var(--border, #3F3F46)',
      }}
    >
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
      <div
        style={{
          fontSize: '32px',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--text-primary, #FAFAFA)',
          lineHeight: 1,
          marginBottom: '4px',
        }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && (
          <span style={{ fontSize: '14px', fontWeight: 400, color: colorVar, marginLeft: '2px' }}>
            {unit}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--text-muted, #71717A)',
        }}
      >
        {label}
      </div>
    </motion.div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
      }}
      aria-hidden="true"
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            height: '100px',
            borderRadius: '6px',
            background: 'var(--surface-alt, #27272A)',
          }}
        />
      ))}
    </div>
  )
}

function formatCacheAge(fetchedAt: string): string {
  const diff = Date.now() - new Date(fetchedAt).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}

export default function AppAnalyticsPanel({ repoId, initialData }: AppAnalyticsPanelProps) {
  const [data, setData] = useState<AnalyticsResponse | null>(initialData ?? null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const res = await fetch(`/api/apps/${repoId}/analytics`)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }
      const json: AnalyticsResponse = await res.json()
      setData(json)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [repoId])

  // Auto-fetch on mount if no initial data
  useState(() => {
    if (!initialData) {
      fetchAnalytics()
    }
  })

  if (loading) {
    return <AnalyticsSkeleton />
  }

  // Analytics not configured
  if (data && !data.configured) {
    return (
      <div
        data-testid="analytics-unconfigured"
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
        <BarChart3
          size={32}
          style={{ color: 'var(--text-muted, #71717A)', opacity: 0.4 }}
        />
        <div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-secondary, #A1A1AA)',
              marginBottom: '6px',
            }}
          >
            Analytics not configured
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted, #71717A)', maxWidth: '280px' }}>
            Add <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>VERCEL_ANALYTICS_TOKEN</code> to your environment variables to see app performance metrics.
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div
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
        <AlertCircle size={24} style={{ color: '#EF4444' }} />
        <div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-secondary, #A1A1AA)',
              marginBottom: '4px',
            }}
          >
            Failed to load analytics
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted, #71717A)', marginBottom: '12px' }}>
            Try refreshing or check your Vercel Analytics configuration.
          </div>
          <button
            onClick={() => fetchAnalytics(true)}
            style={{
              background: 'none',
              border: '1px solid var(--border, #3F3F46)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '13px',
              color: 'var(--text-secondary, #A1A1AA)',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const metrics = data?.metrics

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
        <MetricCard
          testId="analytics-pageviews"
          index={0}
          icon={<Eye size={18} color="#6366F1" />}
          label="Page Views (7d)"
          value={metrics?.pageviews ?? 0}
          iconBg="rgba(99,102,241,0.15)"
          colorVar="#6366F1"
        />
        <MetricCard
          testId="analytics-visitors"
          index={1}
          icon={<Users size={18} color="#22C55E" />}
          label="Unique Visitors"
          value={metrics?.unique_visitors ?? 0}
          iconBg="rgba(34,197,94,0.15)"
          colorVar="#22C55E"
        />
        <MetricCard
          testId="analytics-latency"
          index={2}
          icon={<Clock size={18} color="#F59E0B" />}
          label="p75 Latency"
          value={metrics?.p75_latency_ms ?? 0}
          unit="ms"
          iconBg="rgba(245,158,11,0.15)"
          colorVar="#F59E0B"
        />
        <MetricCard
          testId="analytics-errorrate"
          index={3}
          icon={<AlertTriangle size={18} color="#EF4444" />}
          label="Error Rate"
          value={metrics?.error_rate_pct ?? 0}
          unit="%"
          iconBg="rgba(239,68,68,0.15)"
          colorVar="#EF4444"
        />
      </div>

      {/* Cache notice */}
      {data?.fetched_at && (
        <div
          data-testid="analytics-cache-notice"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-muted, #71717A)',
            }}
          >
            <Clock size={12} style={{ flexShrink: 0 }} />
            Updated {formatCacheAge(data.fetched_at)}
            {data.cached && ' (cached)'}
          </div>

          <button
            data-testid="analytics-refresh"
            aria-label="Refresh analytics"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              color: 'var(--text-muted, #71717A)',
              padding: '4px',
              borderRadius: '4px',
              fontSize: '12px',
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            <RefreshCw
              size={14}
              className={refreshing ? 'refresh-spinning' : undefined}
            />
          </button>
        </div>
      )}
    </div>
  )
}
