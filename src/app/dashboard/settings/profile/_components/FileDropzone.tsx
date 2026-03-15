'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

interface FileDropzoneProps {
  onFile: (file: File) => void;
  uploading: boolean;
  error?: string;
}

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function FileDropzone({ onFile, uploading, error }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function validate(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPEG, PNG, or WebP images are allowed';
    if (file.size > MAX_SIZE) return 'File must be under 2 MB';
    return null;
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const err = validate(file);
    if (err) {
      // Trigger onFile anyway so parent can show error from client-side validation
      // Actually, we'll let parent handle it — just pass valid files
      // For invalid files, show error immediately without uploading
      onFile(Object.assign(file, { _validationError: err }) as File);
      return;
    }
    onFile(file);
  }

  const borderColor = error ? '#EF4444' : dragging ? '#6366F1' : '#3F3F46';
  const borderStyle = dragging ? 'solid' : 'dashed';
  const bg = dragging ? 'rgba(99,102,241,0.08)' : 'transparent';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        data-testid="avatar-dropzone"
        role="button"
        tabIndex={0}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        style={{
          minHeight: '96px',
          border: `2px ${borderStyle} ${borderColor}`,
          borderRadius: '12px',
          background: bg,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'border-color 150ms ease-out, background 150ms ease-out',
          outline: 'none',
        }}
        onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.4)'; }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        {uploading ? (
          <>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              border: '2px solid #3F3F46', borderTopColor: '#6366F1',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#A1A1AA' }}>Uploading...</span>
          </>
        ) : (
          <>
            <Upload size={24} color="#71717A" />
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#A1A1AA', textAlign: 'center' }}>
              Drag and drop or click to upload
            </span>
            <span style={{ fontSize: '12px', fontWeight: 400, color: '#71717A', textAlign: 'center' }}>
              JPEG, PNG, or WebP up to 2 MB
            </span>
          </>
        )}
      </div>

      {error && (
        <p
          data-testid="avatar-error"
          style={{ fontSize: '12px', fontWeight: 500, color: '#EF4444', margin: 0 }}
          aria-live="polite"
        >
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Upload profile photo"
        style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden' }}
        onChange={e => handleFiles(e.target.files)}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
