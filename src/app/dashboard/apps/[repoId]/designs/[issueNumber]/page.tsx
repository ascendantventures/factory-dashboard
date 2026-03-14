'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import PenFileViewer from '@/components/pencil/PenFileViewer';
import DesignUploadButton from '@/components/pencil/DesignUploadButton';
import type { PencilDesignRow } from '@/lib/pen-types';
import { useAppDisplayName } from '@/hooks/useAppDisplayName';

export default function DesignDetailPage({
  params,
}: {
  params: Promise<{ repoId: string; issueNumber: string }>;
}) {
  const { repoId, issueNumber } = use(params);
  const issueNum = parseInt(issueNumber, 10);
  const displayName = useAppDisplayName(repoId);

  const [design, setDesign] = useState<PencilDesignRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  function loadDesign() {
    setLoading(true);
    fetch(`/api/designs/${encodeURIComponent(repoId)}/${issueNumber}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        return res.json() as Promise<{ design: PencilDesignRow | null }>;
      })
      .then(({ design }) => {
        setDesign(design);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadDesign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoId, issueNumber]);

  return (
    <div style={{ background: '#FDFCFB', minHeight: '100vh', padding: '32px' }}>
      {/* Breadcrumb */}
      <nav
        aria-label="breadcrumb"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: '"Instrument Sans", system-ui, sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          color: '#9C9792',
          marginBottom: '24px',
        }}
      >
        <Link href="/dashboard/apps" style={{ color: 'inherit', textDecoration: 'none' }}>
          Apps
        </Link>
        <span>/</span>
        <Link href={`/dashboard/apps/${repoId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
          {displayName ?? '…'}
        </Link>
        <span>/</span>
        <Link href={`/dashboard/apps/${repoId}/designs`} style={{ color: 'inherit', textDecoration: 'none' }}>
          Designs
        </Link>
        <span>/</span>
        <span style={{ color: '#1F1E1C' }}>Issue #{issueNum}</span>
      </nav>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{
              height: '200px',
              borderRadius: '12px',
              background: '#F9F8F6',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      )}

      {error && (
        <div style={{
          padding: '24px',
          background: '#FEE2E2',
          borderRadius: '12px',
          color: '#DC2626',
          fontFamily: '"Instrument Sans", system-ui, sans-serif',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {!loading && !error && !design && (
        <div style={{ maxWidth: '600px' }}>
          <h1 style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: '40px',
            lineHeight: 1.15,
            fontWeight: 400,
            color: '#1F1E1C',
            margin: '0 0 16px 0',
          }}>
            Issue #{issueNum}
          </h1>
          <p style={{
            fontFamily: '"Instrument Sans", system-ui, sans-serif',
            fontSize: '16px',
            color: '#5C5955',
            marginBottom: '24px',
          }}>
            No design exists for this issue yet. Upload a .pen file to add one.
          </p>
          <button
            onClick={() => setShowUpload((s) => !s)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#E85D4C',
              border: 'none',
              borderRadius: '8px',
              fontFamily: '"Instrument Sans", system-ui, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#FFFFFF',
              cursor: 'pointer',
              marginBottom: '24px',
            }}
          >
            Upload .pen file
          </button>
          {showUpload && (
            <DesignUploadButton
              repoId={repoId}
              issueNumber={issueNum}
              onSuccess={loadDesign}
            />
          )}
        </div>
      )}

      {!loading && !error && design && (
        <PenFileViewer
          fileUrl={design.file_url}
          fileName={design.attachment?.file_name}
          issueNumber={issueNum}
          repoId={repoId}
          attachmentId={design.attachment?.id}
          hasUserDesign={design.source === 'user'}
        />
      )}
    </div>
  );
}
