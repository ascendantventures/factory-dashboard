'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { PipelineStatus, StationConfig, AuditLogEntry } from './_components/types';
import PipelineStatusCard from './_components/PipelineStatusCard';
import PipelineMetricsBar from './_components/PipelineMetricsBar';
import PipelineControls from './_components/PipelineControls';
import LocksList from './_components/LocksList';
import BackoffsList from './_components/BackoffsList';
import StationConfigPanel from './_components/StationConfigPanel';
import AuditLogTable from './_components/AuditLogTable';
import IssueActionMenu from './_components/IssueActionMenu';
import { createSupabaseBrowserClient } from '@/lib/supabase';

const POLL_INTERVAL = 30000;

export default function PipelinePage() {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [config, setConfig] = useState<StationConfig[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Read ?issue= from URL for IssueActionMenu
  const [issueFromUrl, setIssueFromUrl] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const issueParam = params.get('issue');
    if (issueParam) setIssueFromUrl(parseInt(issueParam, 10));
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/harness-status');
      if (!res.ok) {
        if (res.status === 401) {
          setError('Not authenticated');
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setStatus(data);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      setError(`Failed to load status: ${err instanceof Error ? err.message : 'unknown'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/pipeline/config');
      if (!res.ok) return;
      const data = await res.json();
      setConfig(data.stations || []);
    } catch {
      // silently ignore
    }
  }, []);

  const fetchAuditLog = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from('pipeline_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setAuditLog(data as AuditLogEntry[]);
    } catch {
      // silently ignore
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchStatus(), fetchAuditLog()]);
  }, [fetchStatus, fetchAuditLog]);

  // Initial load
  useEffect(() => {
    fetchStatus();
    fetchConfig();
    fetchAuditLog();
  }, [fetchStatus, fetchConfig, fetchAuditLog]);

  // Poll status every 5s
  useEffect(() => {
    const interval = setInterval(refreshAll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refreshAll]);

  if (loading) {
    return (
      <div
        style={{
          background: '#0C0E14',
          minHeight: '100vh',
          padding: '32px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#6B7489' }}>
          <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}>
            Loading pipeline...
          </span>
        </div>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: '#0C0E14',
          minHeight: '100vh',
          padding: '32px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: '#EF4444', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}>
          {error}
        </div>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div
      style={{
        background: '#0C0E14',
        minHeight: '100vh',
        padding: '32px 48px 64px',
        maxWidth: '1440px',
        margin: '0 auto',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '32px',
              fontWeight: 700,
              color: '#F1F3F9',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Pipeline Control
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '6px',
            }}
          >
            <RefreshCw size={13} color="#6B7489" />
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px',
                color: '#6B7489',
              }}
            >
              Auto-refreshes every 30s — last update{' '}
              {lastRefresh.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Controls in header */}
        <PipelineControls
          loop={status.loop}
          onActionComplete={refreshAll}
        />
      </div>

      {/* Status + Metrics row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', alignItems: 'stretch', flexWrap: 'wrap' }}>
        <PipelineStatusCard
          loop={status.loop}
          lastSeen={(status as any).lastSeen ?? null}
          onStartLoop={() => {
            fetch('/api/pipeline/control', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'start_loop' }),
            }).then(() => refreshAll());
          }}
        />
        <PipelineMetricsBar counts={status.counts} />
      </div>

      {/* Locks & Backoffs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <LocksList locks={status.locks} />
        <BackoffsList backoffs={status.backoffs} />
      </div>

      {/* Station Config */}
      {config.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <StationConfigPanel stations={config} onSaved={fetchConfig} />
        </div>
      )}

      {/* Audit Log */}
      <div style={{ marginBottom: '32px' }}>
        <AuditLogTable entries={auditLog} />
      </div>

      {/* Issue Action Menu (shown when ?issue= is in URL) */}
      {issueFromUrl && (
        <div
          style={{
            background: '#141721',
            border: '1px solid #2A2F42',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                color: '#F1F3F9',
              }}
            >
              Issue #{issueFromUrl}
            </div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                color: '#6B7489',
                marginTop: '2px',
              }}
            >
              Manage this issue in the pipeline
            </div>
          </div>
          <IssueActionMenu
            issueNumber={issueFromUrl}
            onActionComplete={refreshAll}
          />
        </div>
      )}

      {/* Font imports */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400&display=swap"
        rel="stylesheet"
      />
    </div>
  );
}
