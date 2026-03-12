'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface AttachmentUploaderProps {
  issueNumber: number;
  onUploadSuccess: (attachment: {
    id: string;
    file_url: string;
    file_name: string;
    file_type: string;
  }) => void;
}

export function AttachmentUploader({ issueNumber, onUploadSuccess }: AttachmentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setSuccess(false);

    const allowed = ['image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setError('Unsupported file type');
      return;
    }

    setIsUploading(true);
    setProgress(10);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('github_issue_number', String(issueNumber));

    try {
      setProgress(40);
      const res = await fetch('/api/uat/attachments/upload', {
        method: 'POST',
        body: formData,
      });
      setProgress(80);

      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? 'Upload failed');
        return;
      }

      const data = await res.json();
      setProgress(100);
      setSuccess(true);
      onUploadSuccess(data);
      setTimeout(() => { setSuccess(false); setProgress(0); }, 2000);
    } catch {
      setError('Network error — please try again');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [issueNumber, onUploadSuccess]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        data-testid="attachment-dropzone"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '32px',
          borderRadius: '8px',
          border: `2px dashed ${isDragging ? '#6366F1' : '#3F3F46'}`,
          background: isDragging ? 'rgba(99,102,241,0.05)' : '#27272A',
          cursor: 'pointer',
          transition: 'border-color 200ms cubic-bezier(0.25, 1, 0.5, 1), background 200ms cubic-bezier(0.25, 1, 0.5, 1)',
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload file — click or drag and drop"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
      >
        <Upload
          size={48}
          color={isDragging ? '#6366F1' : '#71717A'}
          style={{ transition: 'color 200ms ease' }}
        />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#FAFAFA', margin: 0 }}>
            Drop a PNG or PDF here
          </p>
          <p style={{ fontSize: '13px', color: '#71717A', margin: '4px 0 0' }}>
            or click to browse — max 10MB PNG / 25MB PDF
          </p>
        </div>
        {!isUploading && (
          <button
            data-testid="upload-btn"
            type="button"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              background: '#6366F1',
              color: '#FAFAFA',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.background = '#4F46E5'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.background = '#6366F1'; }}
          >
            Upload file
          </button>
        )}
        {isUploading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366F1' }}>
            <Loader2 size={20} className="animate-spin" />
            <span style={{ fontSize: '14px', color: '#A1A1AA' }}>Uploading…</span>
          </div>
        )}
      </div>

      {isUploading && (
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            height: '4px',
            background: '#27272A',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            className="upload-progress"
            style={{
              height: '100%',
              width: `${progress}%`,
              background: '#6366F1',
              borderRadius: '2px',
              transition: 'width 300ms linear',
            }}
          />
        </div>
      )}

      {error && (
        <div
          data-testid="error-msg"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '6px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid #EF4444',
          }}
        >
          <AlertCircle size={16} color="#EF4444" />
          <span style={{ fontSize: '13px', color: '#EF4444' }}>{error}</span>
        </div>
      )}

      {success && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '6px',
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid #22C55E',
          }}
        >
          <CheckCircle size={16} color="#22C55E" />
          <span style={{ fontSize: '13px', color: '#22C55E' }}>Upload successful</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        data-testid="attachment-file-input"
        type="file"
        accept="image/png,application/pdf"
        onChange={onFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      <div
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
      >
        {isUploading ? 'Uploading file…' : success ? 'File uploaded successfully' : error ? `Error: ${error}` : ''}
      </div>
    </div>
  );
}
