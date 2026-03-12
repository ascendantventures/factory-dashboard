'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface ApproveConfirmDialogProps {
  onConfirm: (notes?: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ApproveConfirmDialog({ onConfirm, onCancel, loading }: ApproveConfirmDialogProps) {
  const [notes, setNotes] = useState('');

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
        data-testid="approve-confirm-dialog"
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
            Approve this spec?
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#475569', marginTop: 4 }}>
            This will mark the spec as approved for the Design phase.
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>
            Approval notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add approval notes (optional)"
            style={{
              width: '100%', minHeight: 100,
              fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#0F172A',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 8, padding: 12,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
          />
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
            data-testid="approve-confirm-btn"
            onClick={() => onConfirm(notes || undefined)}
            disabled={loading}
            style={{
              fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
              padding: '10px 20px', borderRadius: 8,
              background: loading ? '#94A3B8' : '#2563EB',
              border: 'none', color: '#FFFFFF',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'all 150ms ease-out',
            }}
          >
            <CheckCircle style={{ width: 16, height: 16 }} />
            {loading ? 'Approving…' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}
