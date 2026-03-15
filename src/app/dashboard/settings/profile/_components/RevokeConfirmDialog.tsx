'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface RevokeConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export function RevokeConfirmDialog({ onConfirm, onCancel, loading }: RevokeConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Trap focus and handle Escape
  useEffect(() => {
    confirmRef.current?.focus();
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      }}
      onClick={onCancel}
      aria-hidden="false"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="revoke-all-title"
        aria-describedby="revoke-all-desc"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#18181B', border: '1px solid #3F3F46',
          borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
          <AlertTriangle size={24} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
          <h3
            id="revoke-all-title"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '18px', fontWeight: 600, color: '#FAFAFA',
              margin: 0, flex: 1,
            }}
          >
            Revoke all other sessions?
          </h3>
          <button
            onClick={onCancel}
            aria-label="Close dialog"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#71717A', padding: '2px', borderRadius: '4px',
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <p
          id="revoke-all-desc"
          style={{ fontSize: '14px', color: '#A1A1AA', lineHeight: 1.5, marginBottom: '24px', marginTop: 0 }}
        >
          {"You'll be logged out of all other devices. Your current session will remain active."}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500,
              background: 'transparent', color: '#FAFAFA', border: '1px solid #3F3F46',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            data-testid="confirm-revoke-all"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              background: '#EF4444', color: '#FFFFFF', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              transition: 'background 150ms ease-out',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#DC2626'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#EF4444'; }}
          >
            {loading ? 'Revoking…' : 'Revoke all sessions'}
          </button>
        </div>
      </div>
    </div>
  );
}
