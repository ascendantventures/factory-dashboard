'use client';

import { motion } from 'framer-motion';
import { CreditCard, Edit3, Trash2, Eye, ArrowRight } from 'lucide-react';
import type { FdIssueTemplate } from '@/types';

interface TemplateCardProps {
  template: FdIssueTemplate;
  isAdmin: boolean;
  onPreview: (t: FdIssueTemplate) => void;
  onUse: (t: FdIssueTemplate) => void;
  onEdit: (t: FdIssueTemplate) => void;
  onDelete: (t: FdIssueTemplate) => void;
}

const complexityConfig = {
  simple: {
    label: 'Simple',
    bg: 'rgba(34,197,94,0.15)',
    color: '#22C55E',
    border: '#22C55E',
  },
  medium: {
    label: 'Medium',
    bg: 'rgba(245,158,11,0.15)',
    color: '#F59E0B',
    border: '#F59E0B',
  },
  complex: {
    label: 'Complex',
    bg: 'rgba(239,68,68,0.15)',
    color: '#EF4444',
    border: '#EF4444',
  },
};

export function TemplateCard({
  template,
  isAdmin,
  onPreview,
  onUse,
  onEdit,
  onDelete,
}: TemplateCardProps) {
  const complexity = complexityConfig[template.complexity];

  return (
    <motion.div
      data-testid="template-card"
      whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        borderLeftColor: complexity.border,
        color: 'var(--text-primary)',
      }}
      className="relative flex flex-col rounded-lg border border-l-[4px] overflow-hidden"
    >
      {/* Top section */}
      <div className="flex flex-col gap-2 p-4 pb-3 flex-1">
        {/* Header row: title + admin actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <h3
              className="text-sm font-semibold leading-snug truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {template.name}
            </h3>

            {template.is_default && (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide"
                style={{
                  background: 'rgba(99,102,241,0.15)',
                  color: '#6366F1',
                  border: '1px solid rgba(99,102,241,0.35)',
                }}
              >
                Default
              </span>
            )}

            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
              style={{
                background: complexity.bg,
                color: complexity.color,
                border: `1px solid ${complexity.color}33`,
              }}
            >
              {complexity.label}
            </span>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onEdit(template)}
                aria-label="Edit template"
                className="flex items-center justify-center w-7 h-7 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
                style={{
                  color: 'var(--text-secondary)',
                  background: 'transparent',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--surface-alt)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={() => onDelete(template)}
                aria-label="Delete template"
                className="flex items-center justify-center w-7 h-7 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444]"
                style={{
                  color: 'var(--text-secondary)',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
                  e.currentTarget.style.color = '#EF4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        {template.description && (
          <p
            className="text-xs leading-relaxed line-clamp-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            {template.description}
          </p>
        )}

        {/* Title prefix */}
        {template.title_prefix && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Prefix:</span>{' '}
            <code
              className="rounded px-1 py-0.5 text-[11px] font-mono"
              style={{
                background: 'var(--surface-alt)',
                color: 'var(--text-secondary)',
              }}
            >
              {template.title_prefix}
            </code>
          </p>
        )}

        {/* Labels */}
        {template.labels && template.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.labels.map((label) => (
              <span
                key={label}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  background: 'var(--surface-alt)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Estimated cost */}
        <div className="flex items-center gap-1.5 mt-auto pt-1">
          <CreditCard size={12} style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {template.estimated_cost ? template.estimated_cost : 'Cost TBD'}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)' }} />

      {/* Action buttons */}
      <div className="flex items-center gap-2 p-3">
        <button
          onClick={() => onPreview(template)}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
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
          <Eye size={12} />
          Preview
        </button>

        <button
          onClick={() => onUse(template)}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] ml-auto"
          style={{
            background: '#6366F1',
            color: '#FAFAFA',
            border: '1px solid #6366F1',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = '#4F46E5')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = '#6366F1')
          }
        >
          Use template
          <ArrowRight size={12} />
        </button>
      </div>
    </motion.div>
  );
}
