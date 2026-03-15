'use client';

import { useState } from 'react';
import { Image as ImageIcon, FileText, File, Trash2, Download } from 'lucide-react';
import { FileTypeBadge } from './FileTypeBadge';

export interface UatAttachment {
  id: string;
  github_issue_number: number;
  attachment_id: string;
  file_url: string;
  file_name: string;
  file_type: 'png' | 'pdf' | 'other';
  file_size_bytes: number | null;
  uploaded_by: string;
  created_at: string;
}

interface AttachmentRowProps {
  attachment: UatAttachment;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function FileIcon({ fileType }: { fileType: string }) {
  if (fileType === 'png') return <ImageIcon size={20} color="#3B82F6" />;
  if (fileType === 'pdf') return <FileText size={20} color="#EF4444" />;
  return <File size={20} color="#71717A" />;
}

export function AttachmentRow({ attachment, isSelected, onSelect, onDelete }: AttachmentRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      data-testid="attachment-item"
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        background: isSelected
          ? 'rgba(99,102,241,0.1)'
          : isHovered
          ? 'rgba(99,102,241,0.05)'
          : 'transparent',
        border: isSelected ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
        transition: 'background 150ms ease, border-color 150ms ease',
        outline: 'none',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <FileIcon fileType={attachment.file_type} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          data-testid="file-name"
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#FAFAFA',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {attachment.file_name}
        </p>
        <p style={{
          fontSize: '12px',
          color: '#71717A',
          margin: '2px 0 0',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {formatBytes(attachment.file_size_bytes)} · {formatDate(attachment.created_at)}
        </p>
      </div>

      <FileTypeBadge fileType={attachment.file_type} />

      <div
        style={{
          display: 'flex',
          gap: '4px',
          opacity: isHovered || isSelected ? 1 : 0,
          transition: 'opacity 100ms ease',
        }}
      >
        <a
          href={attachment.file_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download attachment"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px',
            borderRadius: '4px',
            color: '#A1A1AA',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 150ms ease, background 150ms ease',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget).style.color = '#FAFAFA';
            (e.currentTarget).style.background = '#3F3F46';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget).style.color = '#A1A1AA';
            (e.currentTarget).style.background = 'transparent';
          }}
        >
          <Download size={16} />
        </a>

        <button
          data-testid="delete-btn"
          aria-label="Delete attachment"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px',
            borderRadius: '4px',
            color: '#A1A1AA',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 150ms ease, background 150ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget).style.color = '#EF4444';
            (e.currentTarget).style.background = 'rgba(239,68,68,0.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget).style.color = '#A1A1AA';
            (e.currentTarget).style.background = 'transparent';
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
