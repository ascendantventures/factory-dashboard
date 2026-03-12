'use client';

import { useState, useEffect, useCallback } from 'react';
import { AttachmentUploader } from './AttachmentUploader';
import { AttachmentList } from './AttachmentList';
import { AttachmentPreview } from './AttachmentPreview';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { UatAttachment } from './AttachmentRow';

interface IssueAttachmentsPanelProps {
  issueNumber: number;
}

export function IssueAttachmentsPanel({ issueNumber }: IssueAttachmentsPanelProps) {
  const [attachments, setAttachments] = useState<UatAttachment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UatAttachment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttachments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/uat/attachments?issue=${issueNumber}`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [issueNumber]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleUploadSuccess = useCallback((newAttachment: {
    id: string;
    file_url: string;
    file_name: string;
    file_type: string;
  }) => {
    fetchAttachments();
    setSelectedId(newAttachment.id);
  }, [fetchAttachments]);

  const handleDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const res = await fetch(`/api/uat/attachments/${pendingDelete.id}`, { method: 'DELETE' });
    if (res.ok) {
      setAttachments((prev) => prev.filter((a) => a.id !== pendingDelete.id));
      if (selectedId === pendingDelete.id) setSelectedId(null);
    }
    setPendingDelete(null);
  }, [pendingDelete, selectedId]);

  const selectedAttachment = attachments.find((a) => a.id === selectedId) ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      {/* Issue number display */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 4px',
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#FAFAFA',
            margin: 0,
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: '-0.02em',
          }}>
            Attachments
          </h1>
          <p style={{ fontSize: '13px', color: '#71717A', margin: '4px 0 0' }}>
            Issue #{issueNumber} · {attachments.length} file{attachments.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Uploader */}
      <AttachmentUploader issueNumber={issueNumber} onUploadSuccess={handleUploadSuccess} />

      {/* Split pane */}
      <div style={{
        display: 'flex',
        gap: '0',
        flex: 1,
        minHeight: 0,
        border: '1px solid #3F3F46',
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#18181B',
      }}>
        {/* List pane */}
        <div style={{
          width: '400px',
          flexShrink: 0,
          borderRight: '1px solid #27272A',
          overflowY: 'auto',
          padding: '8px',
        }}>
          {isLoading ? (
            <div style={{ padding: '24px', color: '#71717A', fontSize: '14px', textAlign: 'center' }}>
              Loading…
            </div>
          ) : (
            <AttachmentList
              attachments={attachments}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDelete={setPendingDelete}
              issueNumber={issueNumber}
            />
          )}
        </div>

        {/* Preview pane */}
        <AttachmentPreview attachment={selectedAttachment} />
      </div>

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <DeleteConfirmModal
          fileName={pendingDelete.file_name}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
