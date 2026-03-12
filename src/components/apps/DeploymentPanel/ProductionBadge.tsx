'use client';

import { ExternalLink } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { VercelDeployment } from '@/lib/vercel-api';

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

function formatDuration(ms: number | undefined): string {
  if (!ms) return '';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${minutes}m ${rem}s`;
}

interface ProductionBadgeProps {
  deployment: VercelDeployment;
}

export default function ProductionBadge({ deployment }: ProductionBadgeProps) {
  const url = deployment.url ? `https://${deployment.url}` : null;
  const relative = formatRelativeTime(deployment.createdAt);
  const duration = formatDuration(deployment.buildDurationMs);

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          Production Deployment
        </span>
        <StatusBadge state={deployment.state} data-testid="production-status-badge" />
      </div>

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="production-deployment-url"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#3B82F6',
            fontSize: 14,
            textDecoration: 'none',
            wordBreak: 'break-all',
          }}
        >
          <ExternalLink size={14} style={{ flexShrink: 0 }} />
          {url}
        </a>
      )}

      <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text-muted)' }}>
        <span>{relative}</span>
        {duration && <span>· Built in {duration}</span>}
      </div>

      {deployment.meta?.githubCommitSha && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {deployment.meta.githubCommitSha.slice(0, 7)}
          {deployment.meta.githubCommitMessage && (
            <span style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)', marginLeft: 8 }}>
              {deployment.meta.githubCommitMessage.slice(0, 80)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
