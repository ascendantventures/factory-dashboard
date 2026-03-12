'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import type { VercelDeployment } from '@/lib/vercel-api';

interface DeploymentDetail {
  uid: string;
  url: string;
  state: string;
  buildDurationMs?: number;
  outputSizeBytes?: number;
  meta?: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
    githubCommitAuthorName?: string;
  };
  target?: string | null;
  previewUrl?: string;
  logs?: Array<{ text: string; timestamp: number }>;
}

interface BuildLogDrawerProps {
  repoId: string;
  deployment: VercelDeployment | null;
  onClose: () => void;
}

function formatDuration(ms: number | undefined): string {
  if (!ms) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatBytes(bytes: number | undefined): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function BuildLogDrawer({ repoId, deployment, onClose }: BuildLogDrawerProps) {
  const [detail, setDetail] = useState<DeploymentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const isOpen = deployment !== null;

  useEffect(() => {
    if (!deployment) {
      setDetail(null);
      return;
    }
    setLoading(true);
    setDetail(null);
    fetch(`/api/deployments/${repoId}/${deployment.uid}`)
      .then((r) => r.json())
      .then((d) => {
        setDetail(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [deployment, repoId]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
          }}
        />
      )}

      {/* Drawer */}
      <div
        data-testid="build-log-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(560px, 100vw)',
          background: '#141419',
          borderLeft: '1px solid #2A2A36',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          zIndex: 101,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            height: 64,
            padding: '0 24px',
            borderBottom: '1px solid #2A2A36',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <h3 style={{ fontSize: 20, fontWeight: 600, color: '#F4F4F5', margin: 0 }}>Build Log</h3>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#A1A1AA',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#1C1C24';
              (e.currentTarget as HTMLButtonElement).style.color = '#F4F4F5';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = '#A1A1AA';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[120, 80, 200, 60, 160].map((w, i) => (
                <div
                  key={i}
                  style={{ height: 14, width: `${w}px`, borderRadius: 4, background: '#1C1C24', animation: 'shimmer 1.5s infinite' }}
                />
              ))}
            </div>
          )}

          {!loading && detail && (
            <>
              {/* Commit info */}
              {detail.meta?.githubCommitSha && (
                <div
                  style={{
                    background: '#1C1C24',
                    border: '1px solid #2A2A36',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <span
                      data-testid="commit-sha"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#60A5FA' }}
                    >
                      {detail.meta.githubCommitSha}
                    </span>
                  </div>
                  {detail.meta.githubCommitMessage && (
                    <div style={{ fontSize: 14, color: '#F4F4F5', marginBottom: 4 }}>
                      {detail.meta.githubCommitMessage}
                    </div>
                  )}
                  {detail.meta.githubCommitAuthorName && (
                    <div
                      data-testid="commit-author"
                      style={{ fontSize: 12, color: '#A1A1AA' }}
                    >
                      {detail.meta.githubCommitAuthorName}
                    </div>
                  )}
                </div>
              )}

              {/* Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div style={{ background: '#1C1C24', border: '1px solid #2A2A36', borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Build Time</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#F4F4F5' }}>{formatDuration(detail.buildDurationMs)}</div>
                </div>
                <div style={{ background: '#1C1C24', border: '1px solid #2A2A36', borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Bundle Size</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#F4F4F5' }}>{formatBytes(detail.outputSizeBytes)}</div>
                </div>
              </div>

              {/* Preview URL */}
              {detail.previewUrl && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Preview URL</div>
                  <a
                    href={detail.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#3B82F6', fontSize: 13, textDecoration: 'none' }}
                  >
                    <ExternalLink size={12} />
                    {detail.previewUrl}
                  </a>
                </div>
              )}

              {/* Build logs */}
              <div style={{ fontSize: 11, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Build Output</div>
              <div
                data-testid="build-log-content"
                style={{
                  background: '#0A0A0F',
                  border: '1px solid #2A2A36',
                  borderRadius: 8,
                  padding: 16,
                  maxHeight: 400,
                  overflowY: 'auto',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                {detail.logs && detail.logs.length > 0 ? (
                  detail.logs.map((log, i) => (
                    <div key={i} style={{ padding: '2px 0' }}>
                      <span style={{ color: '#71717A', marginRight: 12, userSelect: 'none' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span style={{ color: '#A1A1AA' }}>{log.text}</span>
                    </div>
                  ))
                ) : (
                  <span style={{ color: '#71717A' }}>No log output available.</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
