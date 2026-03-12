'use client';

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

interface DeploymentRowProps {
  deployment: VercelDeployment;
  onClick: (deployment: VercelDeployment) => void;
}

export default function DeploymentRow({ deployment, onClick }: DeploymentRowProps) {
  const sha = deployment.meta?.githubCommitSha?.slice(0, 7) ?? '—';
  const message = deployment.meta?.githubCommitMessage?.slice(0, 80) ?? '—';
  const author = deployment.meta?.githubCommitAuthorName ?? '—';
  const relative = formatRelativeTime(deployment.createdAt);

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="deployment-row"
      onClick={() => onClick(deployment)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(deployment)}
      style={{
        display: 'grid',
        gridTemplateColumns: '60px 1fr 100px 80px',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        height: 56,
        borderBottom: '1px solid #1F1F28',
        cursor: 'pointer',
        transition: 'background 150ms ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#1C1C24')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* SHA */}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#60A5FA' }}>
        {sha}
      </span>

      {/* Message + author */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {message}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{author}</div>
      </div>

      {/* Status */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <StatusBadge state={deployment.state} />
      </div>

      {/* Timestamp */}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{relative}</div>
    </div>
  );
}
