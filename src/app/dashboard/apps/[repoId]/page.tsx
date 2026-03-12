'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, Github } from 'lucide-react';
import Link from 'next/link';
import AppStatusBadge from '@/components/apps/AppStatusBadge';
import AppIssueList from '@/components/apps/AppIssueList';
import DeploymentPanel from '@/components/apps/DeploymentPanel';

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

  // Derive the Vercel project ID: use vercel_project_id if set, else fall back to repoId slug
  const vercelProjectId = data?.app.vercel_project_id ?? repoId;

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
            <div className="flex items-center gap-3 mb-2">
              <h1
                className="text-2xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {data.app.display_name}
              </h1>
              <AppStatusBadge status={data.app.status} />
            </div>

            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {data.app.issue_counts.total} issues · {data.app.issue_counts.open} open · {data.app.issue_counts.done} done
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

          {/* Issues */}
          <div
            className="rounded-xl border p-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: 'var(--text-muted)' }}
            >
              Issues
            </h2>
            <AppIssueList issues={data.issues} />
          </div>
        </>
      )}
    </div>
  );
}
