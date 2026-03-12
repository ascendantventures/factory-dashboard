'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface RedeployButtonProps {
  repoId: string;
  onSuccess?: () => void;
}

export default function RedeployButton({ repoId, onSuccess }: RedeployButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleRedeploy() {
    setLoading(true);
    try {
      const res = await fetch(`/api/deployments/${repoId}/redeploy`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      toast.success('Redeploy triggered', { description: 'New deployment is building…' });
      onSuccess?.();
    } catch (err) {
      toast.error('Redeploy failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      data-testid="redeploy-button"
      disabled={loading}
      onClick={handleRedeploy}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        borderRadius: 8,
        background: loading ? 'rgba(59,130,246,0.4)' : '#3B82F6',
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 500,
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 150ms ease-out',
        opacity: loading ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#2563EB';
      }}
      onMouseLeave={(e) => {
        if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#3B82F6';
      }}
    >
      <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
      {loading ? 'Redeploying…' : 'Redeploy'}
    </button>
  );
}
