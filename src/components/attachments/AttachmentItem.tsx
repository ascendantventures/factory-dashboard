'use client';

import { useState } from 'react';
import { FileText, ZoomIn, Download, Trash2 } from 'lucide-react';
import { IssueAttachment, isImageType, isPdfType, isPenType } from '@/lib/attachments';
import { PenFileBadge } from './PenFileBadge';

interface AttachmentItemProps {
  attachment: IssueAttachment;
  canDelete: boolean;
  onZoom?: () => void;
  onPdfPreview?: () => void;
  onDelete?: () => void;
}

export function AttachmentItem({ attachment, canDelete, onZoom, onPdfPreview, onDelete }: AttachmentItemProps) {
  const [hovered, setHovered] = useState(false);
  const isImage = isImageType(attachment.file_type, attachment.filename);
  const isPdf = isPdfType(attachment.file_type, attachment.filename);
  const isPen = isPenType(attachment.file_type, attachment.filename);

  // .pen files render as PenFileBadge (full width, not in grid thumbnail)
  if (isPen) {
    return (
      <PenFileBadge
        attachment={attachment}
        showDelete={canDelete}
        onDelete={onDelete}
      />
    );
  }

  const fileTypeBadge = isPdf
    ? { bg: '#FEE2E2', color: '#DC2626', label: 'PDF' }
    : { bg: '#F3F4F6', color: '#475569', label: attachment.filename.split('.').pop()?.toUpperCase() ?? 'FILE' };

  return (
    <div
      data-testid="attachment-item"
      style={{
        background: '#FFFFFF',
        border: `1px solid ${hovered ? '#CBD0D8' : '#E2E4E9'}`,
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 200ms ease-out',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 4px 8px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)'
          : '0 1px 2px rgba(15, 23, 42, 0.05)',
        fontFamily: 'Instrument Sans, Inter, sans-serif',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (isImage) onZoom?.();
        else if (isPdf) onPdfPreview?.();
      }}
    >
      {/* Thumbnail area */}
      <div
        style={{
          aspectRatio: '1 / 1',
          background: '#F3F4F6',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={attachment.url}
            alt={attachment.filename}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <FileText size={40} color="#94A3B8" />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '4px 8px',
                borderRadius: '6px',
                background: fileTypeBadge.bg,
                color: fileTypeBadge.color,
              }}
            >
              {fileTypeBadge.label}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 150ms ease',
          }}
        >
          {isImage && (
            <button
              aria-label="Zoom in"
              onClick={(e) => { e.stopPropagation(); onZoom?.(); }}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '9999px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.35)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)'; }}
            >
              <ZoomIn size={20} />
            </button>
          )}

          <a
            href={`/api/attachments/${attachment.id}`}
            onClick={(e) => e.stopPropagation()}
            aria-label="Download"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              textDecoration: 'none',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.35)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.2)'; }}
          >
            <Download size={20} />
          </a>

          {canDelete && (
            <button
              aria-label="Delete"
              data-testid="delete-attachment-btn"
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '9999px',
                background: 'rgba(220,38,38,0.8)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(220,38,38,1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(220,38,38,0.8)'; }}
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* File info */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid #E2E4E9',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#0F172A',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {attachment.filename}
        </div>
      </div>
    </div>
  );
}
