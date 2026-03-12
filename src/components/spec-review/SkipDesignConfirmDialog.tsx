'use client';

import { FastForward } from 'lucide-react';

interface SkipDesignConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function SkipDesignConfirmDialog({ onConfirm, onCancel, loading }: SkipDesignConfirmDialogProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        data-testid="skip-design-confirm-dialog"
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          boxShadow: '0 20px 25px rgba(15, 23, 42, 0.08), 0 8px 10px rgba(15, 23, 42, 0.04)',
          width: 440,
          maxWidth: 'calc(100vw - 32px)',
          overflow: 'hidden',
          animation: 'dialogEnter 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 600, color: '#0F172A' }}>
            Skip design phase?
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{
            background: '#FEF3C7',
            borderLeft: '3px solid #D97706',
            padding: '12px 16px',
            borderRadius: '0 8px 8px 0',
          }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#0F172A', margin: 0, lineHeight: 1.6 }}>
              This will approve the spec and advance the issue directly to the <strong>Build station</strong>, skipping the Design phase entirely.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          background: '#FAFBFC',
          borderTop: '1px solid #E2E8F0',
          display: 'flex', gap: 12, justifyContent: 'flex-end',
        }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
              padding: '10px 16px', borderRadius: 8,
              background: 'transparent', border: 'none',
              color: '#475569', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            data-testid="skip-design-confirm-btn"
            onClick={onConfirm}
            disabled={loading}
            style={{
              fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
              padding: '10px 20px', borderRadius: 8,
              background: 'transparent',
              border: '1px solid #E2E8F0',
              color: '#475569',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'all 150ms ease-out',
            }}
          >
            <FastForward style={{ width: 16, height: 16 }} />
            {loading ? 'Skipping…' : 'Skip to Build'}
          </button>
        </div>
      </div>
    </div>
  );
}
