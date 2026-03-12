'use client';

import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import type { FdIssueTemplate } from '@/types';
import { modalOverlay, modalContent } from '@/lib/motion';

interface DeleteConfirmModalProps {
  template: FdIssueTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmModal({
  template,
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
      setError(null);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) onClose();
    },
    [onClose, isDeleting]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  async function handleConfirm() {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      // onConfirm is expected to close the modal on success (caller handles it)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete template.';
      // Provide a friendly message for the common case
      setError(
        message.toLowerCase().includes('system') || message.toLowerCase().includes('default')
          ? 'System templates cannot be deleted.'
          : message
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && template && (
        <motion.div
          key="delete-overlay"
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={() => !isDeleting && onClose()}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            key="delete-content"
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col w-full rounded-xl overflow-hidden"
            style={{
              maxWidth: 400,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-md"
                  style={{ background: 'rgba(239,68,68,0.15)' }}
                >
                  <AlertTriangle size={15} style={{ color: '#EF4444' }} />
                </div>
                <h2
                  className="text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Delete template
                </h2>
              </div>

              <button
                onClick={() => !isDeleting && onClose()}
                aria-label="Close"
                disabled={isDeleting}
                className="flex items-center justify-center w-7 h-7 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] disabled:opacity-50"
                style={{ color: 'var(--text-muted)', background: 'transparent' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--surface-alt)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-3 px-5 py-5">
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Are you sure you want to delete{' '}
                <span
                  className="font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {template.name}
                </span>
                ? This action cannot be undone.
              </p>

              {template.is_default && (
                <div
                  className="rounded-md px-3 py-2.5 text-xs"
                  style={{
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    color: '#F59E0B',
                  }}
                >
                  This is a system (default) template. Deletion may be
                  restricted.
                </div>
              )}

              {error && (
                <div
                  className="rounded-md px-3 py-2.5 text-sm"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#EF4444',
                  }}
                >
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-2 px-5 py-4"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <button
                type="button"
                onClick={() => !isDeleting && onClose()}
                disabled={isDeleting}
                className="rounded-md px-4 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] disabled:opacity-50"
                style={{
                  background: 'var(--surface-alt)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = 'var(--text-primary)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = 'var(--text-secondary)')
                }
              >
                Keep template
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] disabled:opacity-60"
                style={{
                  background: isDeleting
                    ? 'rgba(239,68,68,0.7)'
                    : '#EF4444',
                  color: '#FAFAFA',
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting)
                    e.currentTarget.style.background = '#DC2626';
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting)
                    e.currentTarget.style.background = '#EF4444';
                }}
              >
                {isDeleting && <Loader2 size={13} className="animate-spin" />}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
