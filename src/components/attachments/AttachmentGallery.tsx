'use client';

import { useState, useEffect, useCallback } from 'react';
import { ImagePlus, Plus, X } from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { AttachmentItem } from './AttachmentItem';
import { AttachmentUploader } from './AttachmentUploader';
import {
  IssueAttachment,
  listAttachments,
  deleteAttachment,
  isImageType,
  isPdfType,
} from '@/lib/attachments';

interface AttachmentGalleryProps {
  issueNumber: number;
  currentUserId?: string;
  isAdmin?: boolean;
}

export function AttachmentGallery({ issueNumber, currentUserId, isAdmin }: AttachmentGalleryProps) {
  const [attachments, setAttachments] = useState<IssueAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [pdfPreview, setPdfPreview] = useState<IssueAttachment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IssueAttachment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await listAttachments(issueNumber);
      setAttachments(data);
    } catch {
      // Silently fail — attachment section is non-critical
    } finally {
      setLoading(false);
    }
  }, [issueNumber]);

  useEffect(() => { load(); }, [load]);

  const imageAttachments = attachments.filter(
    (a) => isImageType(a.file_type, a.filename)
  );

  const lightboxSlides = imageAttachments.map((a) => ({ src: a.url, alt: a.filename }));

  function handleZoom(attachment: IssueAttachment) {
    const idx = imageAttachments.findIndex((a) => a.id === attachment.id);
    setLightboxIndex(Math.max(0, idx));
    setLightboxOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteAttachment(issueNumber, deleteTarget.id);
      setAttachments((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  const canModify = (attachment: IssueAttachment) =>
    !!(currentUserId && (attachment.uploaded_by === currentUserId || isAdmin));

  if (loading) {
    return (
      <div
        style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #E2E4E9',
        }}
      >
        <div
          style={{
            height: '16px',
            width: '120px',
            background: '#F3F4F6',
            borderRadius: '4px',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: '32px',
        paddingTop: '24px',
        borderTop: '1px solid #E2E4E9',
        fontFamily: 'Instrument Sans, Inter, sans-serif',
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
            Attachments
          </span>
          {attachments.length > 0 && (
            <span
              style={{
                background: '#F3F4F6',
                color: '#475569',
                fontSize: '12px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '9999px',
              }}
            >
              {attachments.length}
            </span>
          )}
        </div>

        {currentUserId && (
          <button
            onClick={() => setShowUploader((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: '1px solid #E2E4E9',
              color: '#0F172A',
              fontSize: '13px',
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget;
              btn.style.background = '#F3F4F6';
              btn.style.borderColor = '#CBD0D8';
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget;
              btn.style.background = 'transparent';
              btn.style.borderColor = '#E2E4E9';
            }}
          >
            <Plus size={16} />
            Add file
          </button>
        )}
      </div>

      {/* Inline uploader */}
      {showUploader && (
        <div style={{ marginBottom: '20px' }}>
          <AttachmentUploader
            issueNumber={issueNumber}
            existingCount={attachments.length}
            onUploaded={(attachment) => {
              setAttachments((prev) => [...prev, attachment]);
            }}
          />
        </div>
      )}

      {/* Empty state */}
      {attachments.length === 0 && !showUploader && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px dashed var(--border)',
            borderRadius: '12px',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <ImagePlus size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            No attachments yet
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Images, mockups, and design files attached to this issue will appear here.
          </div>
          {currentUserId && (
            <button
              onClick={() => setShowUploader(true)}
              style={{
                marginTop: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--primary)',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 600,
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 150ms ease-out',
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget;
                btn.style.background = 'var(--primary-hover)';
                btn.style.boxShadow = '0 4px 12px rgba(99,102,241,0.25)';
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget;
                btn.style.background = 'var(--primary)';
                btn.style.boxShadow = 'none';
              }}
            >
              <Plus size={16} />
              Add attachment
            </button>
          )}
        </div>
      )}

      {/* Gallery grid */}
      {attachments.length > 0 && (
        <div
          data-testid="attachment-gallery"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '12px',
          }}
        >
          {attachments.map((attachment) => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              canDelete={canModify(attachment)}
              onZoom={() => handleZoom(attachment)}
              onPdfPreview={() => setPdfPreview(attachment)}
              onDelete={() => setDeleteTarget(attachment)}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxSlides}
        styles={{
          container: { backgroundColor: 'rgba(15, 23, 42, 0.95)' },
        }}
      />

      {/* PDF Preview Modal */}
      {pdfPreview && isPdfType(pdfPreview.file_type, pdfPreview.filename) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setPdfPreview(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 16px 48px rgba(15, 23, 42, 0.2)',
              maxWidth: '900px',
              width: '100%',
              height: '80vh',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              animation: 'modalEnter 200ms ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                fontFamily: 'Instrument Sans, Inter, sans-serif',
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A' }}>
                {pdfPreview.filename}
              </span>
              <button
                onClick={() => setPdfPreview(null)}
                aria-label="Close"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: '1px solid #E2E4E9',
                  color: '#0F172A',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: 'Instrument Sans, Inter, sans-serif',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget;
                  btn.style.background = '#F3F4F6';
                  btn.style.borderColor = '#CBD0D8';
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget;
                  btn.style.background = 'transparent';
                  btn.style.borderColor = '#E2E4E9';
                }}
              >
                <X size={16} />
                Close
              </button>
            </div>

            {/* PDF iframe */}
            <div style={{ flex: 1, paddingTop: '16px', overflow: 'hidden' }}>
              <iframe
                src={pdfPreview.url}
                width="100%"
                height="100%"
                style={{ border: '1px solid #E2E4E9', borderRadius: '8px' }}
                title={pdfPreview.filename}
              />
            </div>

            {/* Footer */}
            <div
              style={{
                paddingTop: '16px',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                fontFamily: 'Instrument Sans, Inter, sans-serif',
              }}
            >
              <a
                href={`/api/attachments/${pdfPreview.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: '1px solid #E2E4E9',
                  color: '#0F172A',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  const a = e.currentTarget;
                  a.style.background = '#F3F4F6';
                  a.style.borderColor = '#CBD0D8';
                }}
                onMouseLeave={(e) => {
                  const a = e.currentTarget;
                  a.style.background = 'transparent';
                  a.style.borderColor = '#E2E4E9';
                }}
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 16px 48px rgba(15, 23, 42, 0.2)',
              maxWidth: '400px',
              width: '100%',
              padding: '24px',
              fontFamily: 'Instrument Sans, Inter, sans-serif',
              animation: 'modalEnter 200ms ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
              Delete attachment?
            </h3>
            <p style={{ fontSize: '14px', color: '#475569', marginTop: '8px', lineHeight: 1.5 }}>
              This will permanently remove{' '}
              <strong>{deleteTarget.filename}</strong>{' '}
              from this issue. This action cannot be undone.
            </p>

            {error && (
              <p style={{ fontSize: '13px', color: '#DC2626', marginTop: '12px' }}>{error}</p>
            )}

            <div
              style={{
                marginTop: '24px',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{
                  background: 'transparent',
                  border: '1px solid #E2E4E9',
                  color: '#0F172A',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  transition: 'all 150ms ease',
                  opacity: deleting ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!deleting) {
                    const btn = e.currentTarget;
                    btn.style.background = '#F3F4F6';
                    btn.style.borderColor = '#CBD0D8';
                  }
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget;
                  btn.style.background = 'transparent';
                  btn.style.borderColor = '#E2E4E9';
                }}
              >
                Keep file
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                style={{
                  background: deleting ? 'rgba(220,38,38,0.4)' : '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!deleting) {
                    const btn = e.currentTarget;
                    btn.style.background = '#B91C1C';
                    btn.style.boxShadow = '0 4px 12px rgba(220,38,38,0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!deleting) {
                    const btn = e.currentTarget;
                    btn.style.background = '#DC2626';
                    btn.style.boxShadow = 'none';
                  }
                }}
              >
                {deleting ? 'Deleting...' : 'Delete file'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalEnter {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
