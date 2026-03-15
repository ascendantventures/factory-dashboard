'use client';

import { useEffect, useRef } from 'react';
import { X, Trash2, AlertCircle } from 'lucide-react';

interface DeleteConfirmModalProps {
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ fileName, onConfirm, onCancel }: DeleteConfirmModalProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Trap focus and handle Escape
  useEffect(() => {
    confirmBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      {/* Overlay */}
      <div
        onClick={onCancel}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          animation: 'uat-overlay-in 150ms ease',
        }}
      />
      {/* Dialog */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        style={{
          position: 'relative',
          background: '#18181B',
          border: '1px solid #3F3F46',
          borderRadius: '12px',
          padding: '24px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          animation: 'uat-modal-enter 200ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <button
          onClick={onCancel}
          aria-label="Close dialog"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#A1A1AA',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(239,68,68,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <AlertCircle size={20} color="#EF4444" />
            </div>
            <div>
              <h2
                id="delete-dialog-title"
                style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}
              >
                Delete attachment?
              </h2>
              <p style={{ fontSize: '13px', color: '#71717A', margin: '4px 0 0' }}>
                This action cannot be undone.
              </p>
            </div>
          </div>

          <p style={{
            fontSize: '13px',
            color: '#A1A1AA',
            background: '#27272A',
            padding: '10px 12px',
            borderRadius: '6px',
            margin: 0,
            fontFamily: "'JetBrains Mono', monospace",
            wordBreak: 'break-all',
          }}>
            {fileName}
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: 'transparent',
                border: '1px solid #3F3F46',
                color: '#A1A1AA',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.background = '#27272A'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent'; }}
            >
              Cancel
            </button>
            <button
              ref={confirmBtnRef}
              data-testid="confirm-delete"
              onClick={onConfirm}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '6px',
                background: '#EF4444',
                border: 'none',
                color: '#FAFAFA',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget).style.background = '#DC2626'; }}
              onMouseLeave={(e) => { (e.currentTarget).style.background = '#EF4444'; }}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes uat-overlay-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes uat-modal-enter {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
