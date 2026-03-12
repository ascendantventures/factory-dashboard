'use client';

import { PenTool, ExternalLink, Download } from 'lucide-react';
import { IssueAttachment } from '@/lib/attachments';

interface PenFileBadgeProps {
  attachment: IssueAttachment;
  showDelete?: boolean;
  onDelete?: () => void;
}

export function PenFileBadge({ attachment, showDelete, onDelete }: PenFileBadgeProps) {
  const pencilUrl = `pencil://open?url=${encodeURIComponent(attachment.url)}`;

  return (
    <div
      data-testid="pen-file-badge"
      style={{
        background: '#EDE9FE',
        border: '1px solid #DDD6FE',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        fontFamily: 'Instrument Sans, Inter, sans-serif',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '48px',
          height: '48px',
          background: '#7C3AED',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <PenTool size={24} color="#FFFFFF" />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#0F172A',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {attachment.filename}
        </div>
        <div style={{ fontSize: '12px', color: '#7C3AED', marginTop: '2px' }}>
          Pencil.dev Design File
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        <a
          href={pencilUrl}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: '#7C3AED',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: '6px',
            textDecoration: 'none',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#6D28D9'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#7C3AED'; }}
        >
          <ExternalLink size={14} />
          Open in Pencil
        </a>

        <a
          href={`/api/attachments/${attachment.id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: '1px solid #DDD6FE',
            color: '#7C3AED',
            fontSize: '13px',
            fontWeight: 500,
            padding: '6px 12px',
            borderRadius: '6px',
            textDecoration: 'none',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#F5F3FF'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
        >
          <Download size={14} />
          Download
        </a>

        {showDelete && onDelete && (
          <button
            onClick={onDelete}
            aria-label={`Delete ${attachment.filename}`}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#94A3B8',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget;
              btn.style.background = '#FEE2E2';
              btn.style.color = '#DC2626';
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget;
              btn.style.background = 'transparent';
              btn.style.color = '#94A3B8';
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
