'use client';

import { useState, useEffect, useCallback } from 'react';
import ProductionBadge from './ProductionBadge';
import DeploymentList from './DeploymentList';
import BuildLogDrawer from './BuildLogDrawer';
import RedeployButton from './RedeployButton';
import DomainList from './DomainList';
import EnvVarList from './EnvVarList';
import MetricsChart from './MetricsChart';
import type { VercelDeployment, VercelDomain, VercelEnvVar } from '@/lib/vercel-api';

interface DeploymentPanelProps {
  repoId: string;
}

interface DeploymentData {
  deployments: VercelDeployment[];
  cachedAt: string;
}

function SkeletonCard({ height = 160 }: { height?: number }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        height,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, #1C1C24 0%, #24242E 50%, #1C1C24 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
    </div>
  );
}

export default function DeploymentPanel({ repoId }: DeploymentPanelProps) {
  const [deploymentData, setDeploymentData] = useState<DeploymentData | null>(null);
  const [domains, setDomains] = useState<VercelDomain[]>([]);
  const [envVars, setEnvVars] = useState<VercelEnvVar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeployment, setSelectedDeployment] = useState<VercelDeployment | null>(null);

  const fetchDeployments = useCallback(async () => {
    const res = await fetch(`/api/deployments/${repoId}`);
    if (res.ok) {
      const data = await res.json();
      setDeploymentData(data);
    }
  }, [repoId]);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      await Promise.all([
        fetchDeployments(),
        fetch(`/api/deployments/${repoId}/domains`)
          .then((r) => r.ok ? r.json() : { domains: [] })
          .then((d) => setDomains(d.domains ?? [])),
        fetch(`/api/deployments/${repoId}/env`)
          .then((r) => r.ok ? r.json() : { vars: [] })
          .then((d) => setEnvVars(d.vars ?? [])),
      ]);
      setLoading(false);
    }
    loadAll();
  }, [repoId, fetchDeployments]);

  // Auto-refresh every 60s when any deployment is BUILDING
  useEffect(() => {
    if (!deploymentData) return;
    const hasBuilding = deploymentData.deployments.some(
      (d) => d.state === 'BUILDING' || d.state === 'QUEUED'
    );
    if (!hasBuilding) return;
    const interval = setInterval(fetchDeployments, 60000);
    return () => clearInterval(interval);
  }, [deploymentData, fetchDeployments]);

  const deployments = deploymentData?.deployments ?? [];
  const productionDeploy = deployments.find((d) => d.target === 'production') ?? deployments[0];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SkeletonCard height={120} />
        <SkeletonCard height={300} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <SkeletonCard height={220} />
          <SkeletonCard height={220} />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page header with Redeploy */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
            Vercel Deployments
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            {deployments.length > 0 ? `${deployments.length} recent deployments` : 'No deployments found'}
          </p>
        </div>
        <RedeployButton repoId={repoId} onSuccess={fetchDeployments} />
      </div>

      {/* Production status */}
      {productionDeploy && (
        <div style={{ marginBottom: 16 }}>
          <ProductionBadge deployment={productionDeploy} />
        </div>
      )}

      {/* Recent deployments + Metrics (2-col grid on desktop) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Deployment list */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>
            Recent Deployments
          </div>
          <DeploymentList deployments={deployments} onSelectDeployment={setSelectedDeployment} />
        </div>

        {/* Metrics */}
        <MetricsChart deployments={deployments} />
      </div>

      {/* Domains + Env Vars (2-col grid) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        <DomainList domains={domains} repoId={repoId} />
        <EnvVarList vars={envVars} repoId={repoId} />
      </div>

      {/* Build Log Drawer */}
      <BuildLogDrawer
        repoId={repoId}
        deployment={selectedDeployment}
        onClose={() => setSelectedDeployment(null)}
      />
    </>
  );
}
