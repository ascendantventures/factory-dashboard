'use client';

import { Paperclip } from 'lucide-react';
import { AttachmentRow, UatAttachment } from './AttachmentRow';

interface AttachmentListProps {
  attachments: UatAttachment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (attachment: UatAttachment) => void;
  issueNumber: number;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export function AttachmentList({
  attachments,
  selectedId,
  onSelect,
  onDelete,
  issueNumber,
  selectedIds,
  onToggleSelect,
}: AttachmentListProps) {
  if (attachments.length === 0) {
    return (
      <div
        data-testid="empty-state"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '48px 24px',
          textAlign: 'center',
        }}
      >
        <Paperclip size={48} color="#3F3F46" />
        <div>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
            No attachments for issue #{issueNumber}
          </p>
          <p style={{ fontSize: '14px', color: '#71717A', margin: '4px 0 0' }}>
            Upload a PNG or PDF to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="attachment-list"
      style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
    >
      {attachments.map((attachment) => (
        <div key={attachment.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {onToggleSelect && (
            <div style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>
              <input
                type="checkbox"
                data-testid="attachment-checkbox"
                checked={selectedIds?.has(attachment.id) ?? false}
                onChange={() => onToggleSelect(attachment.id)}
                onClick={(e) => e.stopPropagation()}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#6366F1' }}
                aria-label={`Select ${attachment.file_name}`}
              />
            </div>
          )}
          <div style={{ flex: 1, paddingLeft: onToggleSelect ? '32px' : '0' }}>
            <AttachmentRow
              attachment={attachment}
              isSelected={selectedId === attachment.id}
              onSelect={() => onSelect(attachment.id)}
              onDelete={() => onDelete(attachment)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
