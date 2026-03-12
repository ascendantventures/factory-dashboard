'use client';

import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import DesignReferenceTag from './DesignReferenceTag';

interface Props {
  repoId: string;
  issueNumber: number;
  onSuccess?: () => void;
}

export default function DesignUploadButton({ repoId, issueNumber, onSuccess }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!file.name.endsWith('.pen')) {
      setError('Only .pen files are accepted');
      return;
    }
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('repoId', repoId);
    formData.append('issueNumber', String(issueNumber));

    const res = await fetch('/api/designs/upload', { method: 'POST', body: formData });
    setUploading(false);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' })) as { error?: string };
      setError(err.error ?? 'Upload failed');
      return;
    }

    setUploaded(true);
    onSuccess?.();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? '#E85D4C' : '#E8E5E1'}`,
          borderStyle: dragging ? 'solid' : 'dashed',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          background: dragging ? '#FEF1EF' : '#FDFCFB',
          cursor: uploading ? 'wait' : 'pointer',
          transition: 'all 200ms ease',
          opacity: uploading ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!dragging) {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#E85D4C';
            (e.currentTarget as HTMLDivElement).style.background = '#FEF1EF';
          }
        }}
        onMouseLeave={(e) => {
          if (!dragging) {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#E8E5E1';
            (e.currentTarget as HTMLDivElement).style.background = '#FDFCFB';
          }
        }}
      >
        <Upload
          size={32}
          color={dragging ? '#E85D4C' : '#9C9792'}
          style={{ margin: '0 auto 12px', display: 'block' }}
        />
        <div style={{
          fontFamily: '"Instrument Sans", system-ui, sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          color: '#5C5955',
          marginBottom: '4px',
        }}>
          {uploading ? 'Uploading...' : 'Drop a .pen file here or click to upload'}
        </div>
        <div style={{
          fontFamily: '"Instrument Sans", system-ui, sans-serif',
          fontSize: '12px',
          color: '#9C9792',
        }}>
          Pencil.dev design files only
        </div>
        <input
          ref={inputRef}
          data-testid="pen-upload-input"
          type="file"
          accept=".pen"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {error && (
        <div
          data-testid="upload-error"
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: '#FEE2E2',
            borderRadius: '6px',
            fontFamily: '"Instrument Sans", system-ui, sans-serif',
            fontSize: '13px',
            color: '#DC2626',
          }}
        >
          {error}
        </div>
      )}

      {uploaded && (
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DesignReferenceTag />
          <span style={{
            fontFamily: '"Instrument Sans", system-ui, sans-serif',
            fontSize: '13px',
            color: '#16A34A',
          }}>
            Design reference uploaded
          </span>
        </div>
      )}
    </div>
  );
}
