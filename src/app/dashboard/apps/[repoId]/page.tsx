'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, Github, Plus, Clock, FileText } from 'lucide-react';
import Link from 'next/link';
import AppStatusBadge from '@/components/apps/AppStatusBadge';
import AppIssueList from '@/components/apps/AppIssueList';
import DeploymentPanel from '@/components/apps/DeploymentPanel';
import CreateIssueModal from './components/CreateIssueModal';
import { formatDistanceToNow } from 'date-fns';

interface AppDetailResponse {
  app: {
    id: string;
    display_name: string;
    live_url: string | null;
    github_url: string;
    status: 'active' | 'idle' | 'error';
    last_deployed_at: string | null;
    deploy_state: string | null;
    issue_counts: { total: number; open: number; done: number };
    tech_stack: string[];
    vercel_project_id: string | null;
  };
  issues: Array<{
    id: number;
    issue_number: number;
    title: string;
    station: string | null;
    labels: string[];
    updated_at: string;
    github_issue_url: string | null;
  }>;
}

interface TimelineEvent {
  id: string;
  submission_id: string;
  issue_title: string | null;
  issue_number: number | null;
  event_type: string;
  station: string | null;
  occurred_at: string;
  duration_seconds: number | null;
  metadata: Record<string, unknown>;
}

type ActiveTab = 'issues' | 'timeline';

const STATION_LABELS: Record<string, string> = {
  intake: 'Intake',
  spec: 'Spec',
  design: 'Design',
  build: 'Build',
  qa: 'QA',
  bugfix: 'Bugfix',
  done: 'Done',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  station_entered: 'Entered',
  station_exited: 'Exited',
  failure: 'Failure',
  bugfix_loop: 'Bugfix Loop',
  deployed: 'Deployed',
};

const EVENT_COLORS: Record<string, string> = {
  station_entered: '#6366F1',
  station_exited: '#A1A1AA',
  failure: '#EF4444',
  bugfix_loop: '#EAB308',
  deployed: '#22C55E',
};

function SkeletonRow() {
  return (
    <div
      className="animate-pulse"
      style={{ height: '16px', borderRadius: '4px', background: 'var(--surface-alt)', marginBottom: '12px' }}
    />
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export default function AppDetailPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = use(params);
  const [data, setData] = useState<AppDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('issues');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Timeline state
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/apps/${repoId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        return res.json();
      })
      .then((json: AppDetailResponse) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message ?? 'Unknown error');
        setLoading(false);
      });
  }, [repoId]);

  // Load timeline when tab is activated
  useEffect(() => {
    if (activeTab !== 'timeline') return;
    setTimelineLoading(true);
    setTimelineError(null);
    fetch(`/api/apps/${repoId}/timeline`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load timeline: ${res.status}`);
        return res.json();
      })
      .then((json: { events: TimelineEvent[] }) => {
        setTimelineEvents(json.events ?? []);
        setTimelineLoading(false);
      })
      .catch((err: Error) => {
        setTimelineError(err.message ?? 'Unknown error');
        setTimelineLoading(false);
      });
  }, [activeTab, repoId]);

  const vercelProjectId = data?.app.vercel_project_id ?? repoId;

  const tabStyle = (tab: ActiveTab): React.CSSProperties => ({
    padding: '6px 16px',
    borderRadius: '8px',
    border: '1px solid',
    borderColor: activeTab === tab ? '#6366F1' : '#3F3F46',
    background: activeTab === tab ? 'rgba(99,102,241,0.15)' : 'transparent',
    color: activeTab === tab ? '#6366F1' : '#A1A1AA',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 150ms ease',
  });

  return (
    <div className="px-4 py-4 max-w-5xl mx-auto">
      {/* Back nav */}
      <Link
        href="/dashboard/apps"
        className="inline-flex items-center gap-2 mb-6 text-sm font-medium"
        style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
      >
        <ArrowLeft size={16} />
        Back to Apps
      </Link>

      {loading && (
        <div>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {error && (
        <div style={{ color: '#EF4444', fontSize: '14px' }}>Error: {error}</div>
      )}

      {!loading && !error && data && (
        <>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <h1
                  className="text-2xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {data.app.display_name}
                </h1>
                <AppStatusBadge status={data.app.status} />
              </div>

              {/* New Issue button */}
              <button
                data-testid="new-issue-button"
                onClick={() => setShowCreateModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#6366F1',
                  color: '#FAFAFA',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <Plus size={14} />
                New Issue
              </button>
            </div>

            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              <span data-testid="app-issue-count-header">{data.app.issue_counts.total}</span> issues ·{' '}
              {data.app.issue_counts.open} open · {data.app.issue_counts.done} done
            </p>
          </div>

          {/* GitHub link */}
          <div
            className="rounded-xl border p-4 mb-6"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <Github size={14} style={{ color: 'var(--text-muted)' }} />
              <a
                href={data.app.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm"
                style={{ color: '#6366F1', textDecoration: 'none' }}
              >
                {data.app.github_url}
              </a>
            </div>
          </div>

          {/* Vercel Deployment Panel */}
          <div className="mb-6">
            <DeploymentPanel repoId={vercelProjectId} />
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-2 mb-4">
            <button
              data-testid="tab-issues"
              style={tabStyle('issues')}
              onClick={() => setActiveTab('issues')}
            >
              <FileText size={13} />
              Issues
            </button>
            <button
              data-testid="tab-timeline"
              style={tabStyle('timeline')}
              onClick={() => setActiveTab('timeline')}
            >
              <Clock size={13} />
              Timeline
            </button>
            <Link
              href={`/dashboard/apps/${repoId}/designs`}
              data-testid="nav-tab-designs"
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: '1px solid #3F3F46',
                background: 'transparent',
                color: '#A1A1AA',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
              }}
            >
              🎨 Designs
            </Link>
          </div>

          {/* Tab content */}
          <div
            className="rounded-xl border p-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {activeTab === 'issues' && (
              <>
                <h2
                  className="text-sm font-semibold uppercase tracking-wider mb-4"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Issues
                </h2>
                <AppIssueList issues={data.issues} />
              </>
            )}

            {activeTab === 'timeline' && (
              <>
                <h2
                  className="text-sm font-semibold uppercase tracking-wider mb-4"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Timeline
                </h2>

                {timelineLoading && (
                  <div>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </div>
                )}

                {timelineError && (
                  <div style={{ color: '#EF4444', fontSize: '14px' }}>{timelineError}</div>
                )}

                {!timelineLoading && !timelineError && timelineEvents.length === 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '32px 0',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Clock size={28} style={{ opacity: 0.4 }} />
                    <span style={{ fontSize: '14px' }}>No timeline events</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '280px' }}>
                      Events will appear here as issues move through pipeline stations.
                    </span>
                  </div>
                )}

                {!timelineLoading && !timelineError && timelineEvents.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {timelineEvents.map((event, idx) => {
                      const color = EVENT_COLORS[event.event_type] ?? '#A1A1AA';
                      const isLast = idx === timelineEvents.length - 1;
                      return (
                        <div
                          key={event.id}
                          data-testid="timeline-event"
                          style={{
                            display: 'flex',
                            gap: '12px',
                            paddingBottom: isLast ? '0' : '16px',
                            position: 'relative',
                          }}
                        >
                          {/* Timeline line */}
                          {!isLast && (
                            <div
                              style={{
                                position: 'absolute',
                                left: '7px',
                                top: '16px',
                                bottom: '0',
                                width: '1px',
                                background: '#3F3F46',
                              }}
                            />
                          )}

                          {/* Dot */}
                          <div
                            style={{
                              width: '15px',
                              height: '15px',
                              borderRadius: '50%',
                              background: color,
                              flexShrink: 0,
                              marginTop: '2px',
                              border: '2px solid #18181B',
                              boxShadow: `0 0 0 2px ${color}33`,
                            }}
                          />

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '13px', fontWeight: 500, color: '#FAFAFA' }}>
                                {STATION_LABELS[event.station ?? ''] ?? event.station ?? 'Unknown'}
                              </span>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  color,
                                  background: `${color}22`,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
                              </span>
                              {event.duration_seconds != null && (
                                <span style={{ fontSize: '11px', color: '#71717A' }}>
                                  {formatDuration(event.duration_seconds)}
                                </span>
                              )}
                            </div>

                            {event.issue_title && (
                              <div style={{ fontSize: '12px', color: '#A1A1AA', marginTop: '2px' }}>
                                #{event.issue_number} — {event.issue_title}
                              </div>
                            )}

                            <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>
                              {formatDistanceToNow(new Date(event.occurred_at), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Create Issue Modal */}
      {showCreateModal && (
        <CreateIssueModal
          repoId={repoId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            // Refresh the page data
            setLoading(true);
            fetch(`/api/apps/${repoId}`)
              .then((res) => res.json())
              .then((json: AppDetailResponse) => {
                setData(json);
                setLoading(false);
              })
              .catch(() => setLoading(false));
          }}
        />
      )}
    </div>
  );
}
