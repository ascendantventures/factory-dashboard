'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, Github, Plus } from 'lucide-react';
import Link from 'next/link';
import AppStatusBadge from '@/components/apps/AppStatusBadge';
import DeploymentPanel from '@/components/apps/DeploymentPanel';
import AppTabNav, { type AppTab } from './components/AppTabNav';
import AppStatsBar from './components/AppStatsBar';
import IssueHistoryTab from './components/IssueHistoryTab';
import TimelineTab from './components/TimelineTab';
import CreateIssueModal from './components/CreateIssueModal';

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
    repo_full_name: string;
  };
}

function SkeletonRow() {
  return (
    <div
      className="animate-pulse"
      style={{ height: '16px', borderRadius: '4px', background: 'var(--surface-alt)', marginBottom: '12px' }}
    />
  );
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
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [issueRefreshKey, setIssueRefreshKey] = useState(0);

  useEffect(() => {
    fetch(`/api/apps/${repoId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? 'Unknown error');
        setLoading(false);
      });
  }, [repoId]);

  const vercelProjectId = repoId;
  const buildRepo = data?.app.repo_full_name ?? '';

  function handleIssueCreated() {
    setShowCreateModal(false);
    setIssueRefreshKey((k) => k + 1);
    setActiveTab('issues');
  }

  return (
    <div style={{ padding: '16px 32px', maxWidth: '1280px', margin: '0 auto' }}>
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
        </div>
      )}

      {error && (
        <div style={{ color: '#EF4444', fontSize: '14px' }}>Error: {error}</div>
      )}

      {!loading && !error && data && (
        <>
          {/* Page Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '32px',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#7A7672',
                  marginBottom: '4px',
                  fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                }}
              >
                <Link href="/dashboard/apps" style={{ color: '#7A7672', textDecoration: 'none' }}>
                  Apps
                </Link>
                {' › '}
                <span style={{ color: '#B8B4AF' }}>{data.app.display_name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1
                  style={{
                    fontSize: '32px',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: '#F5F3F0',
                    margin: 0,
                    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                  }}
                >
                  {data.app.display_name}
                </h1>
                <AppStatusBadge status={data.app.status} />
              </div>
              <p style={{ fontSize: '14px', color: '#7A7672', margin: '4px 0 0' }}>
                {data.app.issue_counts.total} issues · {data.app.issue_counts.open} open · {data.app.issue_counts.done} done
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#D4A012',
                color: '#0F0E0D',
                fontSize: '14px',
                fontWeight: 600,
                padding: '12px 20px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                minHeight: '44px',
                transition: 'all 150ms cubic-bezier(0.25,1,0.5,1)',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#A67C0E';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#D4A012';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              }}
            >
              <Plus size={18} />
              New Issue
            </button>
          </div>

          {/* Stats Bar */}
          <AppStatsBar repoId={repoId} />

          {/* Tab Navigation */}
          <AppTabNav activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div>
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

              {/* Designs tab link */}
              <Link
                href={`/dashboard/apps/${repoId}/designs`}
                data-testid="nav-tab-designs"
                className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                }}
              >
                View Designs
              </Link>
            </div>
          )}

          {activeTab === 'issues' && (
            <IssueHistoryTab
              repoId={repoId}
              onOpenCreateModal={() => setShowCreateModal(true)}
              refreshKey={issueRefreshKey}
            />
          )}

          {activeTab === 'timeline' && <TimelineTab repoId={repoId} />}
        </>
      )}

      {/* Create Issue Modal */}
      {showCreateModal && (
        <CreateIssueModal
          repoId={repoId}
          buildRepo={buildRepo}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleIssueCreated}
        />
      )}
    </div>
  );
}
