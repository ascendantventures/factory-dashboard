'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: ReactNode;
  icon?: ReactNode;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  loading?: boolean;
  children?: ReactNode;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  icon,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  loading = false,
  children,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const confirmBg = confirmVariant === 'danger' ? '#EF4444' : '#3B82F6';
  const confirmHoverBg = confirmVariant === 'danger' ? '#DC2626' : '#2563EB';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 300, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col"
        style={{
          background: '#141721',
          border: '1px solid #2A2F42',
          borderRadius: '16px',
          maxWidth: '480px',
          width: 'calc(100% - 32px)',
          padding: '24px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          animation: 'fadeInUp 250ms cubic-bezier(0.25,1,0.5,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            background: 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7489',
          }}
        >
          <X size={18} />
        </button>

        {/* Icon */}
        {icon && (
          <div className="flex justify-center mb-4">
            {icon}
          </div>
        )}

        {/* Title */}
        <h2
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '20px',
            fontWeight: 600,
            color: '#F1F3F9',
            marginBottom: '12px',
            textAlign: icon ? 'center' : 'left',
          }}
        >
          {title}
        </h2>

        {/* Body */}
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            color: '#B4BCCE',
            lineHeight: 1.6,
            textAlign: icon ? 'center' : 'left',
          }}
        >
          {body}
        </p>

        {/* Optional extra content (e.g. reason input) */}
        {children && <div className="mt-4">{children}</div>}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #2A2F42',
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #2A2F42',
              background: 'transparent',
              color: '#F1F3F9',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              minHeight: '40px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: confirmBg,
              color: '#FFFFFF',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              minHeight: '40px',
              opacity: loading ? 0.6 : 1,
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.target as HTMLButtonElement).style.background = confirmHoverBg;
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = loading ? confirmBg : confirmBg;
            }}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
