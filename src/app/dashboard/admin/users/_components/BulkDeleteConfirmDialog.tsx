'use client';

import { AlertTriangle, AlertCircle, X } from 'lucide-react';

interface Props {
  count: number;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BulkDeleteConfirmDialog({ count, loading, onConfirm, onCancel }: Props) {
  const plural = count !== 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        data-testid="bulk-delete-dialog"
        style={{
          width: '440px',
          background: '#323238',
          border: '1px solid #3F3F46',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
          padding: '24px',
          animation: 'modal-enter 200ms ease-out',
        }}
      >
        {/* Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
          <button
            onClick={onCancel}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', border: 'none', background: 'transparent',
              cursor: 'pointer', borderRadius: '4px', color: '#71717A',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#27272A'; (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#71717A'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Icon + Title */}
        <div style={{ marginBottom: '16px' }}>
          <AlertTriangle size={24} style={{ color: '#EF4444', marginBottom: '12px' }} />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#FAFAFA', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Delete {count} User{plural ? 's' : ''}
          </h2>
        </div>

        {/* Body */}
        <div style={{ marginBottom: '24px', fontFamily: "'Inter', system-ui, sans-serif" }}>
          <p style={{ fontSize: '14px', color: '#A1A1AA', lineHeight: 1.6, margin: '0 0 12px' }}>
            You are about to permanently delete {count} user account{plural ? 's' : ''}. This action cannot be undone.
          </p>
          {count > 5 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#FCA5A5',
                lineHeight: 1.5,
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              This will delete {count} accounts. Consider exporting user data first.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            data-testid="confirm-cancel"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '10px 16px',
              border: '1px solid #3F3F46',
              borderRadius: '6px',
              background: 'transparent',
              fontSize: '14px',
              fontWeight: 500,
              color: '#A1A1AA',
              cursor: 'pointer',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#27272A'; (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#A1A1AA'; }}
          >
            Keep Users
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: '6px',
              background: loading ? 'rgba(239, 68, 68, 0.5)' : '#EF4444',
              fontSize: '14px',
              fontWeight: 600,
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Inter', system-ui, sans-serif",
              transition: 'background 150ms ease',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'oklch(55% 0.22 25)'; }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#EF4444'; }}
          >
            {loading ? 'Deleting…' : `Delete ${count} User${plural ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
