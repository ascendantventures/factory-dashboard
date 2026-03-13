'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload } from 'lucide-react';
import DesignGallery from '@/components/pencil/DesignGallery';

function useAppDisplayName(repoId: string): { displayName: string; loading: boolean } {
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!repoId) return;
    fetch(`/api/apps/${repoId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setDisplayName(data?.app?.display_name ?? '');
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [repoId]);

  return { displayName, loading };
}

function formatFallbackName(repoId: string): string {
  // If it looks like a UUID, shorten it; otherwise return as-is
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(repoId)) {
    return repoId.slice(0, 8) + '…';
  }
  return repoId;
}

export default function DesignGalleryPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = use(params);
  const { displayName, loading } = useAppDisplayName(repoId);

  const appName = displayName || (loading ? '' : formatFallbackName(repoId));

  return (
    <div style={{
      background: '#FDFCFB',
      minHeight: '100vh',
      padding: '32px',
    }}>
      {/* Breadcrumb nav */}
      <nav aria-label="breadcrumb" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link
          href="/dashboard/apps"
          style={{
            fontFamily: '"Instrument Sans", system-ui, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#9C9792',
            textDecoration: 'none',
          }}
        >
          Apps
        </Link>
        <span style={{ color: '#9C9792', fontSize: '14px' }}>/</span>
        <Link
          href={`/dashboard/apps/${repoId}`}
          style={{
            fontFamily: '"Instrument Sans", system-ui, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#9C9792',
            textDecoration: 'none',
          }}
        >
          {appName || <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', background: '#F0EFEB', padding: '2px 6px', borderRadius: '4px' }}>{formatFallbackName(repoId)}</span>}
        </Link>
        <span style={{ color: '#9C9792', fontSize: '14px' }}>/</span>
        <span style={{
          fontFamily: '"Instrument Sans", system-ui, sans-serif',
          fontSize: '14px',
          fontWeight: 600,
          color: '#1F1E1C',
        }}>
          Designs
        </span>
      </nav>

      {/* Page header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '32px',
        paddingBottom: '24px',
        borderBottom: '1px solid #E8E5E1',
        flexWrap: 'wrap',
      }}>
        <div>
          <h1
            data-testid="page-title"
            style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: '40px',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              fontWeight: 400,
              color: '#1F1E1C',
              margin: '0 0 8px 0',
            }}
          >
            {appName ? `${appName} — Designs` : 'Designs'}
          </h1>
          <p style={{
            fontFamily: '"Instrument Sans", system-ui, sans-serif',
            fontSize: '16px',
            color: '#5C5955',
            margin: 0,
            lineHeight: 1.6,
          }}>
            All .pen design files across issues{appName ? ` for ${appName}` : ''}
          </p>
        </div>
      </div>

      {/* Gallery */}
      <DesignGallery repoId={repoId} />
    </div>
  );
}
