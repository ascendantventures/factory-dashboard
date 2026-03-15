'use client'

import { useEffect, useState } from 'react'
import { X, ExternalLink, Github, LayoutDashboard, BarChart3, GitBranch } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AppStatusBadge from './AppStatusBadge'
import AppIssueList from './AppIssueList'
import DeploymentHistory from './DeploymentHistory'
import AppAnalyticsPanel from './AppAnalyticsPanel'
import StationTimeline from './StationTimeline'

type ActiveTab = 'overview' | 'analytics' | 'timeline'

interface AppDetailDrawerProps {
  appId: string | null
  onClose: () => void
}

interface AppIssue {
  id: number
  issue_number: number
  title: string
  station: string | null
  labels: string[]
  updated_at: string
  github_issue_url: string | null
}

interface Deployment {
  vercel_deployment_id: string | null
  deploy_url: string | null
  deploy_state: string | null
  deployed_at: string | null
}

interface AppDetailResponse {
  app: {
    id: string
    display_name: string
    live_url: string | null
    github_url: string
    status: 'active' | 'idle' | 'error'
    last_deployed_at: string | null
    deploy_state: string | null
  }
  issues: AppIssue[]
  deployments: Deployment[]
}

function SkeletonRows() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            height: '16px',
            borderRadius: '4px',
            backgroundColor: 'var(--surface-alt)',
            width: i === 1 ? '75%' : i === 2 ? '60%' : '100%',
          }}
        />
      ))}
    </div>
  )
}

const TABS: { id: ActiveTab; label: string; icon: React.ReactNode; testId: string }[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <LayoutDashboard size={16} />,
    testId: 'drawer-tab-overview',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 size={16} />,
    testId: 'drawer-tab-analytics',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: <GitBranch size={16} />,
    testId: 'drawer-tab-timeline',
  },
]

const tabContentVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.15, ease: [0.25, 1, 0.5, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.1, ease: [0.25, 1, 0.5, 1] as const },
  },
}

export default function AppDetailDrawer({ appId, onClose }: AppDetailDrawerProps) {
  const [data, setData] = useState<AppDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')

  useEffect(() => {
    if (!appId) {
      setData(null)
      setError(null)
      setActiveTab('overview')
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setData(null)
    setActiveTab('overview')

    fetch(`/api/apps/${appId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load app: ${res.status}`)
        return res.json()
      })
      .then((json) => {
        if (!cancelled) {
          setData(json)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message ?? 'Unknown error')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [appId])

  const isOpen = appId !== null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              zIndex: 40,
            }}
          />

          {/* Drawer */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={data?.app.display_name ?? 'App detail'}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              height: '100%',
              width: '100%',
              maxWidth: '480px',
              zIndex: 50,
              backgroundColor: 'var(--surface)',
              borderLeft: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div
              style={{
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: '20px',
                paddingRight: '20px',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {data?.app.display_name ?? ''}
              </span>
              <button
                aria-label="Close"
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                  borderRadius: '6px',
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab bar */}
            <div
              role="tablist"
              aria-label="App detail sections"
              style={{
                height: '40px',
                display: 'flex',
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                flexShrink: 0,
              }}
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`tab-panel-${tab.id}`}
                    id={`tab-${tab.id}`}
                    data-testid={tab.testId}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0 12px',
                      height: '40px',
                      border: 'none',
                      borderBottom: isActive
                        ? '2px solid var(--primary)'
                        : '2px solid transparent',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                      transition: 'color 150ms ease, border-color 150ms ease',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingLeft: '20px',
                paddingRight: '20px',
                paddingTop: '16px',
                paddingBottom: '16px',
              }}
            >
              <AnimatePresence mode="wait">
                {/* ---- OVERVIEW ---- */}
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    id="tab-panel-overview"
                    role="tabpanel"
                    aria-labelledby="tab-overview"
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                  >
                    {loading && <SkeletonRows />}

                    {error && (
                      <div style={{ fontSize: '14px', color: 'var(--error, #EF4444)' }}>
                        Error: {error}
                      </div>
                    )}

                    {!loading && !error && data && (
                      <>
                        {/* App meta section */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {data.app.live_url && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <ExternalLink size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                              <a
                                href={data.app.live_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '13px',
                                  color: '#6366F1',
                                  textDecoration: 'none',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {data.app.live_url}
                              </a>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Github size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <a
                              href={data.app.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: '13px',
                                color: '#6366F1',
                                textDecoration: 'none',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {data.app.github_url}
                            </a>
                          </div>
                        </div>

                        {/* Status + deployment */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <AppStatusBadge status={data.app.status} />
                          <DeploymentHistory
                            deployedAt={data.app.last_deployed_at}
                            deployState={data.app.deploy_state}
                          />
                        </div>

                        {/* Issues */}
                        <div>
                          <AppIssueList issues={data.issues ?? []} />
                        </div>

                        {/* Latest Deployment */}
                        {data.deployments && data.deployments.length > 0 && (
                          <div>
                            <div
                              style={{
                                borderTop: '1px solid var(--border)',
                                paddingTop: '16px',
                                marginBottom: '8px',
                                fontSize: '12px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: 'var(--text-muted)',
                              }}
                            >
                              Latest Deployment
                            </div>
                            <div
                              style={{
                                fontSize: '13px',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                              }}
                            >
                              <div>
                                State:{' '}
                                <span
                                  style={{
                                    color:
                                      data.deployments[0].deploy_state === 'READY'
                                        ? '#22C55E'
                                        : data.deployments[0].deploy_state === 'ERROR'
                                        ? '#EF4444'
                                        : data.deployments[0].deploy_state === 'BUILDING'
                                        ? '#EAB308'
                                        : 'var(--text-muted)',
                                  }}
                                >
                                  {data.deployments[0].deploy_state ?? '—'}
                                </span>
                              </div>
                              {data.deployments[0].deploy_url && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />
                                  <a
                                    href={data.deployments[0].deploy_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: '#6366F1',
                                      textDecoration: 'none',
                                      fontSize: '13px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {data.deployments[0].deploy_url}
                                  </a>
                                </div>
                              )}
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {data.deployments[0].deployed_at
                                  ? new Date(data.deployments[0].deployed_at).toLocaleString()
                                  : '—'}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}

                {/* ---- ANALYTICS ---- */}
                {activeTab === 'analytics' && appId && (
                  <motion.div
                    key="analytics"
                    id="tab-panel-analytics"
                    role="tabpanel"
                    aria-labelledby="tab-analytics"
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <AppAnalyticsPanel repoId={appId} />
                  </motion.div>
                )}

                {/* ---- TIMELINE ---- */}
                {activeTab === 'timeline' && appId && (
                  <motion.div
                    key="timeline"
                    id="tab-panel-timeline"
                    role="tabpanel"
                    aria-labelledby="tab-timeline"
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <StationTimeline repoId={appId} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
