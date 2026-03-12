'use client';

import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import type { FdIssueTemplate } from '@/types';
import { modalOverlay, modalContent } from '@/lib/motion';

interface TemplateFormModalProps {
  template: FdIssueTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: FdIssueTemplate) => void;
}

interface FormValues {
  name: string;
  description: string;
  title_prefix: string;
  body_template: string;
  complexity: FdIssueTemplate['complexity'];
  estimated_cost: string;
}

interface FormErrors {
  name?: string;
  body_template?: string;
}

const defaultValues: FormValues = {
  name: '',
  description: '',
  title_prefix: '',
  body_template: '',
  complexity: 'simple',
  estimated_cost: '',
};

function toFormValues(t: FdIssueTemplate): FormValues {
  return {
    name: t.name,
    description: t.description,
    title_prefix: t.title_prefix,
    body_template: t.body_template,
    complexity: t.complexity,
    estimated_cost: t.estimated_cost,
  };
}

const inputBase: React.CSSProperties = {
  background: 'var(--surface-alt)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: 6,
  width: '100%',
  fontSize: 13,
  padding: '7px 10px',
  outline: 'none',
  transition: 'border-color 0.15s',
};

const inputError: React.CSSProperties = {
  ...inputBase,
  borderColor: '#EF4444',
};

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium mb-1"
      style={{ color: 'var(--text-secondary)' }}
    >
      {children}
      {required && (
        <span className="ml-0.5" style={{ color: '#EF4444' }}>
          *
        </span>
      )}
    </label>
  );
}

function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs" style={{ color: '#EF4444' }}>
      {message}
    </p>
  );
}

export function TemplateFormModal({
  template,
  isOpen,
  onClose,
  onSave,
}: TemplateFormModalProps) {
  const isEdit = template !== null;
  const [values, setValues] = useState<FormValues>(defaultValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Reset form when modal opens or template changes
  useEffect(() => {
    if (isOpen) {
      setValues(template ? toFormValues(template) : defaultValues);
      setErrors({});
      setServerError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, template]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    },
    [onClose, isSubmitting]
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

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function validate(): boolean {
    const next: FormErrors = {};
    if (!values.name.trim()) next.name = 'Name is required.';
    if (!values.body_template.trim())
      next.body_template = 'Body template is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const url = isEdit
        ? `/api/templates/${template!.id}`
        : '/api/templates';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }

      const saved: FdIssueTemplate = await res.json();
      onSave(saved);
      onClose();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="form-overlay"
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={() => !isSubmitting && onClose()}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            key="form-content"
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col w-full rounded-xl overflow-hidden"
            style={{
              maxWidth: 640,
              maxHeight: '92vh',
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
              <h2
                className="text-base font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {isEdit ? 'Edit template' : 'Create template'}
              </h2>
              <button
                onClick={() => !isSubmitting && onClose()}
                aria-label="Close"
                disabled={isSubmitting}
                className="flex items-center justify-center w-7 h-7 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] disabled:opacity-50"
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

            {/* Form body */}
            <form
              id="template-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 px-5 py-5 overflow-y-auto flex-1"
              noValidate
            >
              {/* Name */}
              <div>
                <FieldLabel htmlFor="tmpl-name" required>
                  Name
                </FieldLabel>
                <input
                  id="tmpl-name"
                  type="text"
                  value={values.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Bug report"
                  autoComplete="off"
                  disabled={isSubmitting}
                  style={errors.name ? inputError : inputBase}
                  onFocus={(e) => {
                    if (!errors.name)
                      e.currentTarget.style.borderColor = '#6366F1';
                  }}
                  onBlur={(e) => {
                    if (!errors.name)
                      e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                />
                <InlineError message={errors.name} />
              </div>

              {/* Description */}
              <div>
                <FieldLabel htmlFor="tmpl-desc">Description</FieldLabel>
                <input
                  id="tmpl-desc"
                  type="text"
                  value={values.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Short description of this template"
                  autoComplete="off"
                  disabled={isSubmitting}
                  style={inputBase}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = '#6366F1')
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = 'var(--border)')
                  }
                />
              </div>

              {/* Title prefix */}
              <div>
                <FieldLabel htmlFor="tmpl-prefix">Title prefix</FieldLabel>
                <input
                  id="tmpl-prefix"
                  type="text"
                  value={values.title_prefix}
                  onChange={(e) => set('title_prefix', e.target.value)}
                  placeholder="e.g. [BUG]"
                  autoComplete="off"
                  disabled={isSubmitting}
                  style={inputBase}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = '#6366F1')
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = 'var(--border)')
                  }
                />
              </div>

              {/* Body template */}
              <div>
                <FieldLabel htmlFor="tmpl-body" required>
                  Body template
                </FieldLabel>
                <textarea
                  id="tmpl-body"
                  value={values.body_template}
                  onChange={(e) => set('body_template', e.target.value)}
                  placeholder={'## Description\n\nDescribe the issue here.\n\n## Steps to reproduce\n\n1. \n2. \n\n## Expected behavior\n\n## Actual behavior'}
                  rows={10}
                  disabled={isSubmitting}
                  style={{
                    ...(errors.body_template ? inputError : inputBase),
                    resize: 'vertical',
                    fontFamily: 'monospace',
                    lineHeight: 1.6,
                    minHeight: 140,
                  }}
                  onFocus={(e) => {
                    if (!errors.body_template)
                      e.currentTarget.style.borderColor = '#6366F1';
                  }}
                  onBlur={(e) => {
                    if (!errors.body_template)
                      e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                />
                <InlineError message={errors.body_template} />
              </div>

              {/* Complexity + estimated cost row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel htmlFor="tmpl-complexity">Complexity</FieldLabel>
                  <select
                    id="tmpl-complexity"
                    value={values.complexity}
                    onChange={(e) =>
                      set(
                        'complexity',
                        e.target.value as FdIssueTemplate['complexity']
                      )
                    }
                    disabled={isSubmitting}
                    style={{
                      ...inputBase,
                      cursor: 'pointer',
                      appearance: 'auto',
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = '#6366F1')
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = 'var(--border)')
                    }
                  >
                    <option value="simple">Simple</option>
                    <option value="medium">Medium</option>
                    <option value="complex">Complex</option>
                  </select>
                </div>

                <div>
                  <FieldLabel htmlFor="tmpl-cost">Estimated cost</FieldLabel>
                  <input
                    id="tmpl-cost"
                    type="text"
                    value={values.estimated_cost}
                    onChange={(e) => set('estimated_cost', e.target.value)}
                    placeholder="e.g. $50 – $200"
                    autoComplete="off"
                    disabled={isSubmitting}
                    style={inputBase}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = '#6366F1')
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = 'var(--border)')
                    }
                  />
                </div>
              </div>

              {/* Server error */}
              {serverError && (
                <div
                  className="rounded-md px-3 py-2.5 text-sm"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#EF4444',
                  }}
                >
                  {serverError}
                </div>
              )}
            </form>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-2 px-5 py-4"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <button
                type="button"
                onClick={() => !isSubmitting && onClose()}
                disabled={isSubmitting}
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
                Cancel
              </button>

              <button
                type="submit"
                form="template-form"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] disabled:opacity-60"
                style={{ background: '#6366F1', color: '#FAFAFA' }}
                onMouseEnter={(e) => {
                  if (!isSubmitting)
                    e.currentTarget.style.background = '#4F46E5';
                }}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = '#6366F1')
                }
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                {isSubmitting
                  ? isEdit
                    ? 'Saving...'
                    : 'Creating...'
                  : isEdit
                  ? 'Save changes'
                  : 'Create template'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
