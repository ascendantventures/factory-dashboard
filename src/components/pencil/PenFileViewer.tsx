'use client';

import { useState } from 'react';
import { usePenParser } from '@/hooks/usePenParser';
import PenFrameGrid from './PenFrameGrid';
import PenFrameDetail from './PenFrameDetail';
import PenDesignTokens from './PenDesignTokens';
import PenOpenButton from './PenOpenButton';
import PenDownloadButton from './PenDownloadButton';

interface Props {
  fileUrl: string;
  fileName?: string;
  issueNumber?: number;
  repoId?: string;
  issueTitle?: string;
  attachmentId?: string;
  hasUserDesign?: boolean;
}

type Tab = 'frames' | 'tokens';

export default function PenFileViewer({
  fileUrl,
  fileName,
  issueNumber,
  repoId,
  issueTitle,
  attachmentId,
  hasUserDesign,
}: Props) {
  const { data, loading, error } = usePenParser(fileUrl);
  const [activeTab, setActiveTab] = useState<Tab>('frames');
  const [detailIndex, setDetailIndex] = useState<number | null>(null);

  const variables = data?.canvas.variables ?? [];
  const frames = data?.canvas.frames ?? [];

  return (
    <div style={{ background: '#FDFCFB', minHeight: '100%' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          paddingBottom: '24px',
          borderBottom: '1px solid #E8E5E1',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          {repoId && issueNumber && (
            <nav style={{
              fontFamily: '"Instrument Sans", system-ui, sans-serif',
              fontSize: '14px',
              color: '#9C9792',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <a href="/dashboard/apps" style={{ color: '#9C9792', textDecoration: 'none' }}>Apps</a>
              <span>/</span>
              <a href={`/dashboard/apps/${repoId}`} style={{ color: '#9C9792', textDecoration: 'none' }}>{repoId}</a>
              <span>/</span>
              <a href={`/dashboard/apps/${repoId}/designs`} style={{ color: '#9C9792', textDecoration: 'none' }}>Designs</a>
              <span>/</span>
              <span style={{ color: '#1F1E1C' }}>#{issueNumber}</span>
            </nav>
          )}
          <h1 style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: '40px',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            fontWeight: 400,
            color: '#1F1E1C',
            margin: 0,
          }}>
            {issueTitle ?? fileName ?? `Design #${issueNumber}`}
          </h1>
          {hasUserDesign && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '8px',
              padding: '4px 10px',
              background: '#DCFCE7',
              color: '#16A34A',
              borderRadius: '6px',
              fontFamily: '"Instrument Sans", system-ui, sans-serif',
              fontSize: '12px',
              fontWeight: 500,
            }}>
              has-design-reference
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <PenOpenButton fileUrl={fileUrl} attachmentId={attachmentId} />
          <PenDownloadButton
            fileUrl={fileUrl}
            fileName={fileName}
            issueNumber={issueNumber}
            attachmentId={attachmentId}
          />
        </div>
      </header>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              style={{
                height: '200px',
                borderRadius: '12px',
                background: '#F9F8F6',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: '24px',
          background: '#FEE2E2',
          borderRadius: '12px',
          color: '#DC2626',
          fontFamily: '"Instrument Sans", system-ui, sans-serif',
          fontSize: '14px',
        }}>
          <strong>Failed to load .pen file:</strong> {error}
        </div>
      )}

      {/* Content */}
      {data && !loading && !error && (
        <>
          {/* Tab strip */}
          <div style={{ borderBottom: '1px solid #E8E5E1', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '0' }}>
              {(['frames', 'tokens'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  data-testid={tab === 'tokens' ? 'pen-tab-tokens' : 'pen-tab-frames'}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    padding: '12px 16px',
                    fontFamily: '"Instrument Sans", system-ui, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: activeTab === tab ? '#E85D4C' : '#5C5955',
                    borderBottom: activeTab === tab ? '2px solid #E85D4C' : '2px solid transparent',
                    marginBottom: '-1px',
                    transition: 'all 150ms',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab === 'frames' ? `Frames (${frames.length})` : 'Tokens'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          {activeTab === 'frames' && (
            <PenFrameGrid
              frames={frames}
              variables={variables}
              onFrameClick={setDetailIndex}
            />
          )}
          {activeTab === 'tokens' && (
            <PenDesignTokens variables={variables} />
          )}

          {/* Detail modal */}
          {detailIndex !== null && (
            <PenFrameDetail
              frames={frames}
              variables={variables}
              activeIndex={detailIndex}
              onClose={() => setDetailIndex(null)}
              onNavigate={setDetailIndex}
            />
          )}
        </>
      )}
    </div>
  );
}
