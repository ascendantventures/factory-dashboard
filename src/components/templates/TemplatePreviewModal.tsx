'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, ArrowRight } from 'lucide-react';
import type { FdIssueTemplate } from '@/types';
import { modalOverlay, modalContent } from '@/lib/motion';

interface TemplatePreviewModalProps {
  template: FdIssueTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onUse: (t: FdIssueTemplate) => void;
}

const complexityConfig = {
  simple: {
    label: 'Simple',
    bg: 'rgba(34,197,94,0.15)',
    color: '#22C55E',
    border: 'rgba(34,197,94,0.3)',
  },
  medium: {
    label: 'Medium',
    bg: 'rgba(245,158,11,0.15)',
    color: '#F59E0B',
    border: 'rgba(245,158,11,0.3)',
  },
  complex: {
    label: 'Complex',
    bg: 'rgba(239,68,68,0.15)',
    color: '#EF4444',
    border: 'rgba(239,68,68,0.3)',
  },
};

export function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
  onUse,
}: TemplatePreviewModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
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

  const complexity = template ? complexityConfig[template.complexity] : null;

  return (
    <AnimatePresence>
      {isOpen && template && (
        <motion.div
          key="preview-overlay"
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            key="preview-content"
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col w-full rounded-xl overflow-hidden"
            style={{
              maxWidth: 560,
              maxHeight: '90vh',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-start justify-between gap-3 px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex flex-col gap-1.5 min-w-0">
                <h2
                  className="text-base font-semibold leading-snug truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {template.name}
                </h2>

                <div className="flex flex-wrap items-center gap-2">
                  {complexity && (
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                      style={{
                        background: complexity.bg,
                        color: complexity.color,
                        border: `1px solid ${complexity.border}`,
                      }}
                    >
                      {complexity.label}
                    </span>
                  )}

                  {template.is_default && (
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        background: 'rgba(99,102,241,0.15)',
                        color: '#6366F1',
                        border: '1px solid rgba(99,102,241,0.35)',
                      }}
                    >
                      System template
                    </span>
                  )}

                  {template.estimated_cost && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <CreditCard size={10} />
                      {template.estimated_cost}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Close preview"
                className="flex items-center justify-center w-7 h-7 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] shrink-0 mt-0.5"
                style={{ color: 'var(--text-muted)', background: 'transparent' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--surface-alt)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-4 px-5 py-4 overflow-y-auto flex-1">
              {template.description && (
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {template.description}
                </p>
              )}

              {template.title_prefix && (
                <div className="flex flex-col gap-1">
                  <span
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Title prefix
                  </span>
                  <code
                    className="self-start rounded px-2 py-1 text-xs font-mono"
                    style={{
                      background: 'var(--surface-alt)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {template.title_prefix}
                  </code>
                </div>
              )}

              {template.labels && template.labels.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Labels
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {template.labels.map((label) => (
                      <span
                        key={label}
                        className="rounded px-2 py-0.5 text-xs font-medium"
                        style={{
                          background: 'var(--surface-alt)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <span
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Body template
                </span>
                <pre
                  className="rounded-lg p-3 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-words"
                  style={{
                    background: 'var(--background)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    maxHeight: 320,
                    overflowY: 'auto',
                  }}
                >
                  <code>{template.body_template}</code>
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-2 px-5 py-4"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <button
                onClick={onClose}
                className="rounded-md px-4 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
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
                Cancel
              </button>

              <button
                onClick={() => {
                  onUse(template);
                  onClose();
                }}
                className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
                style={{ background: '#6366F1', color: '#FAFAFA' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = '#4F46E5')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = '#6366F1')
                }
              >
                Use this template
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
