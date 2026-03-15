'use client';

import { Image as ImageIcon, Maximize2 } from 'lucide-react';
import { UatAttachment } from './AttachmentRow';
import { FileTypeBadge } from './FileTypeBadge';

interface AttachmentPreviewProps {
  attachment: UatAttachment | null;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentPreview({ attachment }: AttachmentPreviewProps) {
  if (!attachment) {
    return (
      <div
        data-testid="attachment-preview"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: '#71717A',
          padding: '48px',
        }}
      >
        <ImageIcon size={64} color="#3F3F46" />
        <p style={{ fontSize: '14px', color: '#71717A', margin: 0 }}>
          Select a file to preview
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="attachment-preview"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid #27272A',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <FileTypeBadge fileType={attachment.file_type} />
          <span style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#FAFAFA',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {attachment.file_name}
          </span>
        </div>
        <a
          href={attachment.file_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open in new tab"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px',
            borderRadius: '4px',
            color: '#A1A1AA',
            textDecoration: 'none',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget).style.color = '#FAFAFA'; (e.currentTarget).style.background = '#3F3F46'; }}
          onMouseLeave={(e) => { (e.currentTarget).style.color = '#A1A1AA'; (e.currentTarget).style.background = 'transparent'; }}
        >
          <Maximize2 size={16} />
        </a>
      </div>

      {/* Preview content */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '20px' }}>
        {attachment.file_type === 'png' ? (
          <img
            data-testid="preview-image"
            src={attachment.file_url}
            alt={attachment.file_name}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '6px',
              animation: 'uat-preview-fade-in 300ms cubic-bezier(0.16,1,0.3,1)',
              display: 'block',
              margin: '0 auto',
            }}
          />
        ) : attachment.file_type === 'pdf' ? (
          <iframe
            data-testid="preview-pdf"
            src={attachment.file_url}
            title={attachment.file_name}
            style={{
              width: '100%',
              height: '100%',
              minHeight: '400px',
              border: 'none',
              borderRadius: '6px',
            }}
          />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            height: '200px',
            color: '#71717A',
          }}>
            <p style={{ fontSize: '14px' }}>Preview not available for this file type</p>
            <a
              href={attachment.file_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#6366F1', fontSize: '13px' }}
            >
              Download file
            </a>
          </div>
        )}
      </div>

      {/* Metadata footer */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid #27272A',
        display: 'flex',
        gap: '24px',
        flexShrink: 0,
      }}>
        <div>
          <span style={{ fontSize: '11px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Size</span>
          <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '2px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>
            {formatBytes(attachment.file_size_bytes)}
          </p>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Issue</span>
          <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '2px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>
            #{attachment.github_issue_number}
          </p>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Uploaded</span>
          <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '2px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>
            {new Date(attachment.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes uat-preview-fade-in {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
