'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ImageOff, Upload } from 'lucide-react';
import { useDesigns } from '@/hooks/useDesigns';
import { usePenParser } from '@/hooks/usePenParser';
import type { PencilDesignRow } from '@/lib/pen-types';
import PenFrameCanvas from './PenFrameCanvas';
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

// Lazy-loaded canvas thumbnail for a design
function DesignThumbnail({ fileUrl }: { fileUrl: string }) {
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: penData, loading, error } = usePenParser(isInView ? fileUrl : null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsInView(true); },
      { rootMargin: '100px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const firstFrame = penData?.canvas?.frames?.[0];
  const variables = penData?.canvas?.variables ?? [];

  return (
    <div
      ref={containerRef}
      data-testid="design-thumbnail"
      style={{
        aspectRatio: '16/10',
        background: '#F9F8F6',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* Skeleton while loading */}
      {(loading || (!isInView)) && !firstFrame && (
        <div
          className="design-thumbnail-loading"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #F9F8F6 25%, #F0EFEB 50%, #F9F8F6 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      )}

      {/* Rendered canvas */}
      {isInView && !loading && firstFrame && (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 1, transition: 'opacity 200ms ease-out' }}>
          <PenFrameCanvas
            frame={firstFrame}
            variables={variables}
            scale={Math.min(320 / (firstFrame.width || 1), 200 / (firstFrame.height || 1))}
          />
        </div>
      )}

      {/* Fallback on error */}
      {isInView && !loading && error && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <ImageOff size={24} style={{ color: '#9C9792' }} />
          <span style={{
            fontFamily: '"Instrument Sans", system-ui, sans-serif',
            fontSize: '12px',
            color: '#9C9792',
          }}>
            Preview unavailable
          </span>
        </div>
      )}
    </div>
  );
}

// Upload zone component
interface UploadZoneProps {
  repoId: string;
  onSuccess: () => void;
}

function DesignUploadZone({ repoId, onSuccess }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [issueNumber, setIssueNumber] = useState<number | null>(null);
  const [showIssueInput, setShowIssueInput] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  function validateFile(file: File): string | null {
    if (!file.name.endsWith('.pen')) return 'Only .pen files are supported. Please try again.';
    if (file.size > 10 * 1024 * 1024) return 'File exceeds 10MB limit.';
    return null;
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragActive(true);
    setUploadError(null);
  }

  function handleDragLeave() {
    setIsDragActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setUploadError(err); return; }
    setPendingFile(file);
    setShowIssueInput(true);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setUploadError(err); return; }
    setPendingFile(file);
    setShowIssueInput(true);
  }

  async function handleUpload() {
    if (!pendingFile || !issueNumber) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', pendingFile);
      formData.append('repoId', repoId);
      formData.append('issueNumber', String(issueNumber));
      const res = await fetch('/api/designs/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      setPendingFile(null);
      setShowIssueInput(false);
      setIssueNumber(null);
      onSuccess();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div
        data-testid="design-upload-zone"
        aria-label="Drop .pen files here or click to browse"
        role="button"
        tabIndex={0}
        onClick={() => { setUploadError(null); fileInputRef.current?.click(); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${uploadError ? '#DC2626' : isDragActive ? '#E85D4C' : '#D4D1CD'}`,
          borderStyle: isDragActive ? 'solid' : 'dashed',
          borderRadius: '12px',
          padding: '32px 24px',
          textAlign: 'center',
          background: uploadError ? 'rgba(220, 38, 38, 0.04)' : isDragActive ? 'rgba(232, 93, 76, 0.08)' : '#FDFCFB',
          cursor: 'pointer',
          transition: 'all 200ms ease',
          transform: isDragActive ? 'scale(1.01)' : 'scale(1)',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pen"
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
        <Upload size={32} style={{ color: '#9C9792', marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
        <div style={{ fontFamily: '"Instrument Sans", system-ui, sans-serif', fontSize: '14px', color: '#5C5955' }}>
          Drop .pen files here or{' '}
          <span style={{ color: '#E85D4C', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '2px' }}>
            browse
          </span>
        </div>
        <div style={{ fontFamily: '"Instrument Sans", system-ui, sans-serif', fontSize: '12px', color: '#9C9792', marginTop: '8px' }}>
          Supported formats: .pen design files
        </div>
      </div>

      {uploadError && (
        <div
          role="alert"
          data-testid="upload-error"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '12px',
            padding: '8px 12px',
            background: 'rgba(220, 38, 38, 0.08)',
            borderRadius: '6px',
            fontFamily: '"Instrument Sans", system-ui, sans-serif',
            fontSize: '13px',
            color: '#DC2626',
          }}
        >
          {uploadError}
        </div>
      )}

      {showIssueInput && pendingFile && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: '"Instrument Sans", system-ui, sans-serif', fontSize: '13px', color: '#5C5955' }}>
            Issue #
          </span>
          <input
            type="number"
            placeholder="Issue number"
            value={issueNumber ?? ''}
            onChange={(e) => setIssueNumber(e.target.value ? parseInt(e.target.value, 10) : null)}
            style={{
              border: '1px solid #D4D1CD',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '13px',
              width: '120px',
              fontFamily: '"Instrument Sans", system-ui, sans-serif',
            }}
          />
          <button
            onClick={handleUpload}
            disabled={!issueNumber || isUploading}
            style={{
              padding: '6px 16px',
              background: '#E85D4C',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontFamily: '"Instrument Sans", system-ui, sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              opacity: !issueNumber || isUploading ? 0.5 : 1,
            }}
          >
            {isUploading ? 'Uploading…' : 'Upload'}
          </button>
          <button
            onClick={() => { setPendingFile(null); setShowIssueInput(false); }}
            style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #D4D1CD', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontFamily: '"Instrument Sans", system-ui, sans-serif', color: '#5C5955' }}
          >
            Cancel
          </button>
          <span style={{ fontFamily: '"Instrument Sans", system-ui, sans-serif', fontSize: '12px', color: '#9C9792' }}>
            {pendingFile.name}
          </span>
        </div>
      )}
    </div>
  );
}

export default function DesignGallery({ repoId }: Props) {
  const { designs, loading, error, refetch } = useDesigns(repoId);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadIssue, setUploadIssue] = useState<number | null>(null);

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
      <>
        <DesignUploadZone repoId={repoId} onSuccess={refetch} />
        <EmptyGallery onUpload={() => setShowUpload(true)} />
        {showUpload && uploadIssue !== null && (
          <DesignUploadButton
            repoId={repoId}
            issueNumber={uploadIssue}
            onSuccess={() => { setShowUpload(false); refetch(); }}
          />
        )}
      </>
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
      {/* Upload zone always visible above gallery */}
      <DesignUploadZone repoId={repoId} onSuccess={refetch} />

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

              {/* Canvas thumbnail */}
              <DesignThumbnail fileUrl={latest.file_url} />

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
