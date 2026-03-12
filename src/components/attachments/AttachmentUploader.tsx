'use client';

import { useState, useRef, useCallback, DragEvent } from 'react';
import { Upload, X, Check, Loader2, AlertCircle } from 'lucide-react';
import {
  IssueAttachment,
  isAllowedFileType,
  formatFileSize,
  isImageType,
  MAX_FILE_SIZE,
  MAX_FILES_PER_ISSUE,
  uploadAttachment,
} from '@/lib/attachments';

interface UploadItem {
  id: string;
  file: File;
  previewUrl?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  result?: IssueAttachment;
}

interface AttachmentUploaderProps {
  issueNumber: number;
  existingCount?: number;
  onUploaded?: (attachment: IssueAttachment) => void;
}

export function AttachmentUploader({ issueNumber, existingCount = 0, onUploaded }: AttachmentUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [zoneError, setZoneError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateItem(id: string, patch: Partial<UploadItem>) {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, ...patch } : it));
  }

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setZoneError(null);
    const fileArr = Array.from(files);

    const currentTotal = existingCount + items.filter((i) => i.status !== 'error').length;
    const slots = MAX_FILES_PER_ISSUE - currentTotal;
    if (slots <= 0) {
      setZoneError(`Maximum ${MAX_FILES_PER_ISSUE} attachments per issue reached.`);
      return;
    }

    const toProcess = fileArr.slice(0, slots);
    const rejected: string[] = [];

    const newItems: UploadItem[] = [];
    for (const file of toProcess) {
      if (!isAllowedFileType(file)) {
        rejected.push(`${file.name}: unsupported file type`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name}: exceeds 10MB limit`);
        continue;
      }

      const id = crypto.randomUUID();
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      newItems.push({ id, file, previewUrl, progress: 0, status: 'pending' });
    }

    if (rejected.length > 0) {
      setZoneError(rejected.join('; '));
    }

    if (newItems.length === 0) return;

    setItems((prev) => [...prev, ...newItems]);

    // Upload each file
    for (const item of newItems) {
      updateItem(item.id, { status: 'uploading' });
      try {
        const result = await uploadAttachment(issueNumber, item.file, (pct) => {
          updateItem(item.id, { progress: pct });
        });
        updateItem(item.id, { status: 'done', result, progress: 100 });
        onUploaded?.(result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        updateItem(item.id, { status: 'error', error: msg });
      }
    }
  }, [existingCount, items, issueNumber, onUploaded]);

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }

  const dropZoneBg = dragOver ? '#DBEAFE' : zoneError ? '#FEE2E2' : '#FAFBFC';
  const dropZoneBorder = dragOver ? '#2563EB' : zoneError ? '#DC2626' : '#CBD0D8';

  return (
    <div style={{ fontFamily: 'Instrument Sans, Inter, sans-serif' }}>
      {/* Drop zone */}
      <div
        data-testid="attachment-dropzone"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dropZoneBorder}`,
          background: dropZoneBg,
          borderRadius: '12px',
          padding: '40px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 200ms ease',
          minHeight: '160px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.gif,.svg,.pdf,.pen"
          data-testid="attachment-file-input"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
        <Upload
          size={40}
          color={dragOver ? '#2563EB' : zoneError ? '#DC2626' : '#94A3B8'}
          style={{ transition: 'color 200ms ease' }}
        />
        <div
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#0F172A',
            marginTop: '16px',
          }}
        >
          Drop files here or click to browse
        </div>
        <div
          style={{
            fontSize: '13px',
            color: '#94A3B8',
            marginTop: '8px',
          }}
        >
          PNG, JPG, GIF, SVG, PDF, or .pen files up to 10MB
        </div>
      </div>

      {/* Zone error */}
      {zoneError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#DC2626',
            marginTop: '8px',
          }}
          role="alert"
        >
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{zoneError}</span>
        </div>
      )}

      {/* Upload queue */}
      {items.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '12px',
            marginTop: '16px',
          }}
        >
          {items.map((item) => (
            <UploadItemCard key={item.id} item={item} onRemove={() => removeItem(item.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function UploadItemCard({ item, onRemove }: { item: UploadItem; onRemove: () => void }) {
  return (
    <div
      data-testid="attachment-preview"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E4E9',
        borderRadius: '8px',
        padding: '12px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        position: 'relative',
        animation: 'slideUp 200ms ease-out',
        fontFamily: 'Instrument Sans, Inter, sans-serif',
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '6px',
          background: '#F3F4F6',
          flexShrink: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {item.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.previewUrl}
            alt={item.file.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
            {item.file.name.split('.').pop()}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#0F172A',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.file.name}
        </div>
        <div style={{ fontSize: '13px', color: '#94A3B8' }}>
          {formatFileSize(item.file.size)}
        </div>

        {/* Progress bar or status */}
        {item.status === 'uploading' && (
          <div
            style={{
              height: '4px',
              background: '#E2E4E9',
              borderRadius: '2px',
              marginTop: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: '#2563EB',
                borderRadius: '2px',
                width: `${item.progress}%`,
                transition: 'width 100ms linear',
              }}
            />
          </div>
        )}

        {item.status === 'error' && (
          <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>
            {item.error}
          </div>
        )}
      </div>

      {/* Status icon or cancel */}
      <div style={{ flexShrink: 0 }}>
        {item.status === 'uploading' && (
          <Loader2 size={18} color="#2563EB" style={{ animation: 'spin 1s linear infinite' }} />
        )}
        {item.status === 'done' && (
          <Check
            size={20}
            color="#059669"
            style={{ animation: 'scaleIn 200ms ease-out' }}
          />
        )}
        {(item.status === 'pending' || item.status === 'error') && (
          <button
            onClick={onRemove}
            aria-label={`Remove ${item.file.name}`}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: '2px',
              display: 'flex',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#DC2626'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8'; }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
