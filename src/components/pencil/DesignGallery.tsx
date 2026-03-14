'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDesigns } from '@/hooks/useDesigns';
import type { PencilDesignRow } from '@/lib/pen-types';
import EmptyGallery from './EmptyGallery';
import DesignVersionHistory from './DesignVersionHistory';
import DesignUploadButton from './DesignUploadButton';

interface Props {
  repoId: string;
}

function groupByIssue(designs: PencilDesignRow[]): Map<number, PencilDesignRow[]> {
  const map = new Map<number, PencilDesignRow[]>();
  for (const d of designs) {
    const existing = map.get(d.issue_number) ?? [];
    map.set(d.issue_number, [...existing, d]);
  }
  return map;
}

function SkeletonCard() {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E8E5E1',
      borderRadius: '12px',
      padding: '24px',
    }}>
      {[40, 60, 30].map((w, i) => (
        <div key={i} style={{
          height: '14px',
          borderRadius: '4px',
          background: '#F9F8F6',
          width: `${w}%`,
          marginBottom: '12px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  );
}

export default function DesignGallery({ repoId }: Props) {
  const { designs, loading, error, refetch } = useDesigns(repoId);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadIssue, setUploadIssue] = useState<number | null>(null);
  const [issueInputValue, setIssueInputValue] = useState('');

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '24px',
        background: '#FEE2E2',
        borderRadius: '12px',
        color: '#DC2626',
        fontFamily: '"Instrument Sans", system-ui, sans-serif',
        fontSize: '14px',
      }}>
        Failed to load designs: {error}
      </div>
    );
  }

  if (designs.length === 0) {
    return (
      <div>
        <EmptyGallery onUpload={() => setShowUpload(true)} />
        {showUpload && (
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {uploadIssue === null ? (
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E8E5E1',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '320px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                animation: 'pencilFadeIn 200ms ease',
              }}>
                <p style={{
                  fontFamily: '"Instrument Sans", system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#5C5955',
                  textAlign: 'center',
                  margin: 0,
                }}>
                  Which issue is this design for?
                </p>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input
                    type="number"
                    min="1"
                    placeholder="Issue number (e.g. 42)"
                    value={issueInputValue}
                    onChange={(e) => setIssueInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt(issueInputValue, 10);
                        if (val > 0) setUploadIssue(val);
                      }
                    }}
                    data-testid="upload-issue-input"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 12px',
                      border: '1px solid #E8E5E1',
                      borderRadius: '8px',
                      fontFamily: '"Instrument Sans", system-ui, sans-serif',
                      fontSize: '14px',
                      color: '#1F1E1C',
                      background: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{
                    fontFamily: '"Instrument Sans", system-ui, sans-serif',
                    fontSize: '12px',
                    color: '#9C9792',
                  }}>
                    Enter the GitHub issue number to associate with this design
                  </span>
                </div>
                <button
                  disabled={!(parseInt(issueInputValue, 10) > 0)}
                  onClick={() => {
                    const val = parseInt(issueInputValue, 10);
                    if (val > 0) setUploadIssue(val);
                  }}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 20px',
                    background: '#E85D4C',
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: '"Instrument Sans", system-ui, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#FFFFFF',
                    cursor: parseInt(issueInputValue, 10) > 0 ? 'pointer' : 'not-allowed',
                    opacity: parseInt(issueInputValue, 10) > 0 ? 1 : 0.4,
                    transition: 'background 150ms ease',
                  }}
                >
                  Continue
                </button>
                <button
                  onClick={() => {
                    setShowUpload(false);
                    setUploadIssue(null);
                    setIssueInputValue('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: '"Instrument Sans", system-ui, sans-serif',
                    fontSize: '13px',
                    color: '#9C9792',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <DesignUploadButton
                repoId={repoId}
                issueNumber={uploadIssue}
                onSuccess={() => {
                  setShowUpload(false);
                  setUploadIssue(null);
                  setIssueInputValue('');
                  refetch();
                }}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  const grouped = groupByIssue(designs);
  // Sort by most recently updated
  const sortedIssues = [...grouped.keys()].sort((a, b) => {
    const aLatest = grouped.get(a)![0];
    const bLatest = grouped.get(b)![0];
    return new Date(bLatest.updated_at).getTime() - new Date(aLatest.updated_at).getTime();
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px',
        }}
      >
        {sortedIssues.map((issueNumber) => {
          const versions = grouped.get(issueNumber)!;
          const latest = versions.sort((a, b) => b.version - a.version)[0];
          const hasUserDesign = versions.some((v) => v.source === 'user');

          return (
            <article
              key={issueNumber}
              data-testid="design-gallery-item"
              style={{
                background: '#FFFFFF',
                border: '1px solid #E8E5E1',
                borderRadius: '12px',
                padding: '24px',
                transition: 'all 200ms ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = '0 4px 6px rgba(31, 30, 28, 0.04), 0 2px 4px rgba(31, 30, 28, 0.06)';
                el.style.borderColor = 'rgba(232, 93, 76, 0.3)';
                el.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = 'none';
                el.style.borderColor = '#E8E5E1';
                el.style.transform = 'translateY(0)';
              }}
            >
              {/* Issue info */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                  <Link
                    href={`/dashboard/apps/${repoId}/designs/${issueNumber}`}
                    style={{
                      fontFamily: '"Instrument Sans", system-ui, sans-serif',
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#1F1E1C',
                      textDecoration: 'none',
                    }}
                  >
                    Issue #{issueNumber}
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {hasUserDesign && (
                      <span style={{
                        padding: '2px 8px',
                        background: '#DCFCE7',
                        color: '#16A34A',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        fontFamily: '"Instrument Sans", system-ui, sans-serif',
                      }}>
                        user
                      </span>
                    )}
                    {versions.length > 1 && (
                      <span style={{
                        padding: '2px 8px',
                        background: '#FEF1EF',
                        color: '#E85D4C',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        fontFamily: '"Instrument Sans", system-ui, sans-serif',
                      }}>
                        v{latest.version}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{
                  fontFamily: '"Instrument Sans", system-ui, sans-serif',
                  fontSize: '13px',
                  color: '#9C9792',
                }}>
                  {latest.source === 'pipeline' ? 'Pipeline design' : 'User upload'} ·{' '}
                  {new Date(latest.updated_at).toLocaleDateString()}
                </div>
              </div>

              {/* Design thumbnail placeholder */}
              <div style={{
                aspectRatio: '16/10',
                background: '#F9F8F6',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Link
                  href={`/dashboard/apps/${repoId}/designs/${issueNumber}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    fontFamily: '"Instrument Sans", system-ui, sans-serif',
                    fontSize: '13px',
                    color: '#9C9792',
                    textAlign: 'center',
                  }}>
                    Click to view design
                  </div>
                </Link>
              </div>

              <DesignVersionHistory
                repoId={repoId}
                issueNumber={issueNumber}
                versions={versions}
              />
            </article>
          );
        })}
      </div>
    </div>
  );
}
