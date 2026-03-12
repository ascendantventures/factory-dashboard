'use client';

import DeploymentRow from './DeploymentRow';
import type { VercelDeployment } from '@/lib/vercel-api';

interface DeploymentListProps {
  deployments: VercelDeployment[];
  onSelectDeployment: (deployment: VercelDeployment) => void;
}

function SkeletonRow() {
  return (
    <div
      style={{
        height: 56,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderBottom: '1px solid #1F1F28',
      }}
    >
      <div style={{ width: 60, height: 14, borderRadius: 4, background: '#1C1C24', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ flex: 1, height: 14, borderRadius: 4, background: '#1C1C24', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ width: 80, height: 24, borderRadius: 6, background: '#1C1C24', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ width: 60, height: 14, borderRadius: 4, background: '#1C1C24', animation: 'shimmer 1.5s infinite' }} />
    </div>
  );
}

export default function DeploymentList({ deployments, onSelectDeployment }: DeploymentListProps) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr 100px 80px',
          gap: 12,
          padding: '0 16px',
          height: 44,
          alignItems: 'center',
          background: '#1C1C24',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {['COMMIT', 'MESSAGE', 'STATUS', 'WHEN'].map((label) => (
          <span
            key={label}
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              textAlign: label === 'STATUS' || label === 'WHEN' ? 'right' : 'left',
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {deployments.length === 0 && (
        <>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </>
      )}

      {deployments.map((dep) => (
        <DeploymentRow key={dep.uid} deployment={dep} onClick={onSelectDeployment} />
      ))}
    </div>
  );
}
