'use client';

import { useState, useEffect, useCallback } from 'react';
import { FolderOpen, RefreshCw } from 'lucide-react';
import AppCard from '@/components/apps/AppCard';
import AppGrid from '@/components/apps/AppGrid';
import AppDetailDrawer from '@/components/apps/AppDetailDrawer';
import type { AppSummary } from '@/app/api/apps/route';

function SkeletonCard() {
  return (
    <div
      data-testid="skeleton"
      className="animate-pulse rounded-xl border p-5"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="h-4 rounded" style={{ background: 'var(--surface-alt)', width: '55%' }} />
        <div className="h-5 w-14 rounded-full" style={{ background: 'var(--surface-alt)' }} />
      </div>
      <div className="h-3 rounded mb-4" style={{ background: 'var(--surface-alt)', width: '70%' }} />
      <div className="h-3 rounded mb-3" style={{ background: 'var(--surface-alt)', width: '40%' }} />
      <div className="h-3 rounded mb-3" style={{ background: 'var(--surface-alt)', width: '60%' }} />
      <div className="flex gap-2">
        <div className="h-5 w-16 rounded" style={{ background: 'var(--surface-alt)' }} />
        <div className="h-5 w-12 rounded" style={{ background: 'var(--surface-alt)' }} />
      </div>
    </div>
  );
}

export default function AppsPage() {
  const [apps, setApps] = useState<AppSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchApps = useCallback(async () => {
    try {
      const res = await fetch('/api/apps');
      if (!res.ok) throw new Error(`Failed to fetch apps: ${res.status}`);
      const data = await res.json();
      setApps(data.apps ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load apps');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if current user is admin
  useEffect(() => {
    async function checkRole() {
      try {
        const { createSupabaseBrowserClient } = await import('@/lib/supabase');
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('dash_user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        if (data?.role === 'admin') setIsAdmin(true);
      } catch {
        // ignore — non-admin by default
      }
    }
    checkRole();
  }, []);

  useEffect(() => {
    fetchApps();
    // Poll every 30s
    const interval = setInterval(fetchApps, 30_000);
    return () => clearInterval(interval);
  }, [fetchApps]);

  async function handleRefreshDeployments() {
    setRefreshing(true);
    try {
      await fetch('/api/apps/refresh-deployments', { method: 'POST' });
      await fetchApps();
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }

  function handleCardClick(app: AppSummary) {
    if (window.innerWidth >= 768) {
      setSelectedAppId(app.id);
    } else {
      window.location.href = `/dashboard/apps/${app.id}`;
    }
  }

  return (
    <div className="px-6 py-6">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            Apps
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Portfolio view of all managed applications
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleRefreshDeployments}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              background: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: refreshing ? 'spin 1s linear infinite' : undefined,
              }}
            />
            {refreshing ? 'Refreshing…' : 'Refresh deployments'}
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <AppGrid>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </AppGrid>
      )}

      {/* Error state */}
      {!loading && error && (
        <div
          className="rounded-xl border p-6 text-center"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-muted)',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && apps.length === 0 && (
        <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
          <div
            data-testid="empty-state"
            className="flex flex-col items-center justify-center text-center px-6 py-16 mx-auto"
            style={{ maxWidth: '400px' }}
          >
            <FolderOpen
              size={48}
              strokeWidth={1.5}
              style={{ color: 'var(--border)', marginBottom: '16px' }}
            />
            <h2
              className="mb-2"
              style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}
            >
              No apps yet
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Apps will appear here once BUILD completes at least one issue.
            </p>
          </div>
        </div>
      )}

      {/* App grid */}
      {!loading && !error && apps.length > 0 && (
        <AppGrid>
          {apps.map((app) => (
            <AppCard key={app.id} app={app} onClick={() => handleCardClick(app)} />
          ))}
        </AppGrid>
      )}

      {/* Detail drawer (desktop) */}
      <AppDetailDrawer
        appId={selectedAppId}
        onClose={() => setSelectedAppId(null)}
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
