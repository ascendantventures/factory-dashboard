'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { AvatarPreview } from './AvatarPreview';
import { FileDropzone } from './FileDropzone';

interface AvatarUploadProps {
  initialAvatarUrl?: string | null;
  displayName?: string;
  email?: string;
}

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function AvatarUpload({ initialAvatarUrl, displayName, email = '' }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  async function handleFile(file: File) {
    setError('');

    // Client-side validation (mirrors server-side)
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, or WebP images are allowed');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File must be under 2 MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/auth/profile/avatar', { method: 'POST', body: formData });
      const data = await res.json() as { avatar_url?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Upload failed');
        return;
      }
      setAvatarUrl(data.avatar_url ?? null);
      toast.success('Profile photo updated');
    } catch {
      setError('Upload failed — please try again');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setShowConfirmRemove(false);
    setUploading(true);
    try {
      const res = await fetch('/api/auth/profile/avatar', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        toast.error(data.error ?? 'Failed to remove photo');
        return;
      }
      setAvatarUrl(null);
      toast.success('Profile photo removed');
    } catch {
      toast.error('Failed to remove photo');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {/* Horizontal layout: preview + dropzone */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        flexWrap: 'wrap',
      }}>
        <AvatarPreview avatarUrl={avatarUrl} displayName={displayName} email={email} size={96} />
        <FileDropzone onFile={handleFile} uploading={uploading} error={error} />
      </div>

      {/* Remove button — only visible when avatar exists */}
      {avatarUrl && !uploading && (
        <button
          data-testid="remove-avatar-btn"
          onClick={() => setShowConfirmRemove(true)}
          style={{
            marginTop: '12px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#EF4444',
            transition: 'background 150ms ease-out',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <X size={14} />
          Remove photo
        </button>
      )}

      {/* Confirm remove dialog */}
      {showConfirmRemove && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowConfirmRemove(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-remove-title"
            onClick={e => e.stopPropagation()}
            style={{
              background: '#18181B', border: '1px solid #3F3F46',
              borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '100%',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            <h3 id="confirm-remove-title" style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '18px', fontWeight: 600, color: '#FAFAFA', marginTop: 0, marginBottom: '12px',
            }}>
              Remove profile photo?
            </h3>
            <p style={{ fontSize: '14px', color: '#A1A1AA', lineHeight: 1.5, marginBottom: '24px' }}>
              Your initials will be shown as a fallback.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirmRemove(false)}
                style={{
                  padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500,
                  background: 'transparent', color: '#FAFAFA', border: '1px solid #3F3F46',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                data-testid="confirm-remove-avatar"
                onClick={handleRemove}
                style={{
                  padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                  background: '#EF4444', color: '#FFFFFF', border: 'none', cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#DC2626'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#EF4444'; }}
              >
                Remove photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
