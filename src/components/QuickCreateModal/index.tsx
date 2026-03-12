'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FileText,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { modalOverlay, modalContent, staggerContainer, staggerItem } from '@/lib/motion';
import type { FdIssueTemplate } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WizardState = {
  step: 1 | 2 | 3 | 4;
  direction: number;
  selectedTemplate: FdIssueTemplate | null;
  title: string;
  description: string;
  targetRepo: string;
  interpolatedBody: string;
};

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

interface SubmitResult {
  number?: number;
  html_url?: string;
}

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTemplate?: FdIssueTemplate | null;
  trackedRepos: string[];
}

// ---------------------------------------------------------------------------
// CSS variable helpers
// ---------------------------------------------------------------------------

const css = {
  bg: 'var(--background)',
  surface: 'var(--surface)',
  surfaceAlt: 'var(--surface-alt)',
  border: 'var(--border)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  primary: 'var(--primary)',
  primaryHover: 'var(--primary-hover)',
  primaryMuted: 'var(--primary-muted)',
  success: 'var(--success)',
  error: 'var(--error)',
} as const;

// ---------------------------------------------------------------------------
// Step labels
// ---------------------------------------------------------------------------

const STEP_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Template',
  2: 'Details',
  3: 'Review',
  4: 'Submit',
};

// ---------------------------------------------------------------------------
// Complexity badge
// ---------------------------------------------------------------------------

function ComplexityBadge({ complexity }: { complexity: FdIssueTemplate['complexity'] }) {
  const colors: Record<FdIssueTemplate['complexity'], { bg: string; color: string }> = {
    simple: { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
    medium: { bg: 'rgba(234,179,8,0.15)', color: '#EAB308' },
    complex: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' },
  };
  const { bg, color } = colors[complexity];
  return (
    <span
      style={{
        background: bg,
        color,
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '999px',
        textTransform: 'capitalize',
        display: 'inline-block',
      }}
    >
      {complexity}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 | 4 }) {
  const steps: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];

  return (
    <div className="flex items-center justify-center w-full" style={{ marginBottom: '24px' }}>
      {steps.map((step, idx) => {
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        const isUpcoming = step > currentStep;

        return (
          <div key={step} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1">
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isUpcoming ? css.surfaceAlt : css.primary,
                  border: isUpcoming ? `1px solid ${css.border}` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                {isCompleted ? (
                  <Check size={14} color="#fff" strokeWidth={2.5} />
                ) : (
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: isUpcoming ? css.textMuted : '#fff',
                    }}
                  >
                    {step}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: isUpcoming ? css.textMuted : isCurrent ? css.primary : css.textSecondary,
                  whiteSpace: 'nowrap',
                }}
              >
                {STEP_LABELS[step]}
              </span>
            </div>

            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                style={{
                  height: '2px',
                  width: '48px',
                  background: step < currentStep ? css.primary : css.border,
                  transition: 'background 0.3s',
                  marginBottom: '16px',
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Button primitives
// ---------------------------------------------------------------------------

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  children: React.ReactNode;
}

function Button({ variant = 'primary', children, style, disabled, ...rest }: ButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 18px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'background 0.15s, opacity 0.15s',
    opacity: disabled ? 0.5 : 1,
  };

  const variantStyle: React.CSSProperties =
    variant === 'primary'
      ? {
          background: css.primary,
          color: '#fff',
        }
      : {
          background: 'transparent',
          color: css.textSecondary,
          border: `1px solid ${css.border}`,
        };

  return (
    <button
      disabled={disabled}
      style={{ ...base, ...variantStyle, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Input / Textarea helpers
// ---------------------------------------------------------------------------

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: css.surfaceAlt,
  border: `1px solid ${css.border}`,
  borderRadius: '8px',
  padding: '10px 14px',
  color: css.textPrimary,
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function QuickCreateModal({
  isOpen,
  onClose,
  initialTemplate = null,
  trackedRepos,
}: QuickCreateModalProps) {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  const [templates, setTemplates] = useState<FdIssueTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const [wizard, setWizard] = useState<WizardState>({
    step: 1,
    direction: 1,
    selectedTemplate: initialTemplate ?? null,
    title: initialTemplate?.title_prefix ?? '',
    description: '',
    targetRepo: trackedRepos[0] ?? '',
    interpolatedBody: '',
  });

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [submitError, setSubmitError] = useState<string>('');

  // -------------------------------------------------------------------------
  // Fetch templates on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;
    setTemplatesLoading(true);
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data: { templates: FdIssueTemplate[] }) => setTemplates(data.templates ?? []))
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false));
  }, [isOpen]);

  // -------------------------------------------------------------------------
  // Auto-advance when initialTemplate is provided
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (initialTemplate && isOpen) {
      setWizard((prev) => ({
        ...prev,
        step: 2,
        direction: 1,
        selectedTemplate: initialTemplate,
        title: initialTemplate.title_prefix ?? '',
      }));
    }
  }, [initialTemplate, isOpen]);

  // -------------------------------------------------------------------------
  // Reset when modal closes
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!isOpen) {
      setWizard({
        step: 1,
        direction: 1,
        selectedTemplate: initialTemplate ?? null,
        title: initialTemplate?.title_prefix ?? '',
        description: '',
        targetRepo: trackedRepos[0] ?? '',
        interpolatedBody: '',
      });
      setSubmitStatus('idle');
      setSubmitResult(null);
      setSubmitError('');
    }
  }, [isOpen, initialTemplate, trackedRepos]);

  // -------------------------------------------------------------------------
  // Navigation helpers
  // -------------------------------------------------------------------------

  const goTo = useCallback((step: 1 | 2 | 3 | 4, direction: number) => {
    setWizard((prev) => ({ ...prev, step, direction }));
  }, []);

  const goNext = useCallback(() => {
    setWizard((prev) => {
      const next = Math.min(prev.step + 1, 4) as 1 | 2 | 3 | 4;
      return { ...prev, step: next, direction: 1 };
    });
  }, []);

  const goBack = useCallback(() => {
    setWizard((prev) => {
      const next = Math.max(prev.step - 1, 1) as 1 | 2 | 3 | 4;
      return { ...prev, step: next, direction: -1 };
    });
  }, []);

  // -------------------------------------------------------------------------
  // Step 2 → 3: interpolate body
  // -------------------------------------------------------------------------

  const handleStep2Next = useCallback(() => {
    const raw = wizard.selectedTemplate?.body_template ?? '';
    const interpolated = raw.replaceAll('{{description}}', wizard.description);
    setWizard((prev) => ({
      ...prev,
      interpolatedBody: interpolated,
      step: 3,
      direction: 1,
    }));
  }, [wizard.selectedTemplate, wizard.description]);

  // -------------------------------------------------------------------------
  // Step 4: submit
  // -------------------------------------------------------------------------

  const submit = useCallback(async () => {
    setSubmitStatus('loading');
    setSubmitError('');
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: wizard.title,
          body: wizard.interpolatedBody,
          repo: wizard.targetRepo,
          complexityHint: wizard.selectedTemplate?.complexity ?? '',
          issueType: '',
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data: SubmitResult = await res.json();
      setSubmitResult(data);
      setSubmitStatus('success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setSubmitError(message);
      setSubmitStatus('error');
    }
  }, [wizard]);

  // Trigger submit when entering step 4
  useEffect(() => {
    if (wizard.step === 4 && submitStatus === 'idle') {
      submit();
    }
  }, [wizard.step, submitStatus, submit]);

  // -------------------------------------------------------------------------
  // Reset to step 1
  // -------------------------------------------------------------------------

  const resetToStart = useCallback(() => {
    setWizard({
      step: 1,
      direction: -1,
      selectedTemplate: null,
      title: '',
      description: '',
      targetRepo: trackedRepos[0] ?? '',
      interpolatedBody: '',
    });
    setSubmitStatus('idle');
    setSubmitResult(null);
    setSubmitError('');
  }, [trackedRepos]);

  // -------------------------------------------------------------------------
  // Animation variants for step transitions
  // -------------------------------------------------------------------------

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.25, ease: 'easeOut' },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -60 : 60,
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeIn' },
    }),
  };

  // -------------------------------------------------------------------------
  // Step 1: Choose Template
  // -------------------------------------------------------------------------

  function Step1() {
    return (
      <motion.div
        key="step1"
        custom={wizard.direction}
        variants={stepVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className="flex flex-col"
        style={{ gap: '16px' }}
      >
        {templatesLoading ? (
          <div className="flex items-center justify-center" style={{ padding: '40px 0' }}>
            <Loader2
              size={24}
              color={css.primary}
              className="animate-spin"
            />
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            {/* Template cards */}
            {templates.map((tpl) => {
              const isSelected = wizard.selectedTemplate?.id === tpl.id;
              return (
                <motion.div
                  key={tpl.id}
                  variants={staggerItem}
                  onClick={() =>
                    setWizard((prev) => ({
                      ...prev,
                      selectedTemplate: tpl,
                      title: tpl.title_prefix ?? prev.title,
                    }))
                  }
                  style={{
                    background: isSelected ? 'rgba(99,102,241,0.08)' : css.surfaceAlt,
                    border: isSelected
                      ? `2px solid ${css.primary}`
                      : `1px solid ${css.border}`,
                    borderRadius: '10px',
                    padding: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'border 0.15s, background 0.15s',
                  }}
                  whileHover={
                    !isSelected
                      ? { borderColor: 'rgba(99,102,241,0.4)' }
                      : {}
                  }
                >
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: css.textPrimary,
                    }}
                  >
                    {tpl.name}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: css.textSecondary,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {tpl.description}
                  </span>
                  <div className="flex items-center justify-between" style={{ marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: css.textMuted }}>
                      {tpl.estimated_cost || 'Cost TBD'}
                    </span>
                    <ComplexityBadge complexity={tpl.complexity} />
                  </div>
                </motion.div>
              );
            })}

            {/* Start blank card */}
            <motion.div
              variants={staggerItem}
              onClick={() =>
                setWizard((prev) => ({
                  ...prev,
                  selectedTemplate: null,
                  title: '',
                }))
              }
              style={{
                background:
                  wizard.selectedTemplate === null
                    ? 'rgba(99,102,241,0.08)'
                    : 'transparent',
                border:
                  wizard.selectedTemplate === null
                    ? `2px solid ${css.primary}`
                    : `1px dashed ${css.border}`,
                borderRadius: '10px',
                padding: '14px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '100px',
                transition: 'border 0.15s, background 0.15s',
              }}
              whileHover={
                wizard.selectedTemplate !== null
                  ? { borderColor: 'rgba(99,102,241,0.4)' }
                  : {}
              }
            >
              <FileText size={20} color={css.textMuted} />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: css.textSecondary,
                }}
              >
                Start blank
              </span>
            </motion.div>
          </motion.div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-end"
          style={{
            gap: '10px',
            paddingTop: '16px',
            borderTop: `1px solid ${css.border}`,
            marginTop: '8px',
          }}
        >
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={templates.length > 0 && wizard.selectedTemplate === undefined}
            onClick={goNext}
          >
            Next
            <ChevronRight size={15} />
          </Button>
        </div>
      </motion.div>
    );
  }

  // -------------------------------------------------------------------------
  // Step 2: Fill Details
  // -------------------------------------------------------------------------

  function Step2() {
    return (
      <motion.div
        key="step2"
        custom={wizard.direction}
        variants={stepVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className="flex flex-col"
        style={{ gap: '16px' }}
      >
        {/* Title */}
        <div className="flex flex-col" style={{ gap: '6px' }}>
          <label
            style={{ fontSize: '13px', fontWeight: 600, color: css.textSecondary }}
          >
            Title <span style={{ color: css.error }}>*</span>
          </label>
          <input
            style={inputStyle}
            type="text"
            placeholder="Issue title"
            value={wizard.title}
            onChange={(e) =>
              setWizard((prev) => ({ ...prev, title: e.target.value }))
            }
          />
        </div>

        {/* Description */}
        <div className="flex flex-col" style={{ gap: '6px' }}>
          <label
            style={{ fontSize: '13px', fontWeight: 600, color: css.textSecondary }}
          >
            Description
          </label>
          <textarea
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="This will replace {{description}} in the template"
            value={wizard.description}
            onChange={(e) =>
              setWizard((prev) => ({ ...prev, description: e.target.value }))
            }
          />
        </div>

        {/* Target repository */}
        <div className="flex flex-col" style={{ gap: '6px' }}>
          <label
            style={{ fontSize: '13px', fontWeight: 600, color: css.textSecondary }}
          >
            Target repository
          </label>
          {trackedRepos.length > 0 ? (
            <select
              style={{
                ...inputStyle,
                appearance: 'none',
                WebkitAppearance: 'none',
              }}
              value={wizard.targetRepo}
              onChange={(e) =>
                setWizard((prev) => ({ ...prev, targetRepo: e.target.value }))
              }
            >
              {trackedRepos.map((repo) => (
                <option key={repo} value={repo}>
                  {repo}
                </option>
              ))}
            </select>
          ) : (
            <input
              style={inputStyle}
              type="text"
              placeholder="owner/repo"
              value={wizard.targetRepo}
              onChange={(e) =>
                setWizard((prev) => ({ ...prev, targetRepo: e.target.value }))
              }
            />
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between"
          style={{
            paddingTop: '16px',
            borderTop: `1px solid ${css.border}`,
            marginTop: '8px',
          }}
        >
          <Button variant="ghost" onClick={goBack}>
            <ChevronLeft size={15} />
            Back
          </Button>
          <Button
            variant="primary"
            disabled={!wizard.title.trim()}
            onClick={handleStep2Next}
          >
            Next
            <ChevronRight size={15} />
          </Button>
        </div>
      </motion.div>
    );
  }

  // -------------------------------------------------------------------------
  // Step 3: Review Body
  // -------------------------------------------------------------------------

  function Step3() {
    const labels = wizard.selectedTemplate?.labels ?? [];
    return (
      <motion.div
        key="step3"
        custom={wizard.direction}
        variants={stepVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className="flex flex-col"
        style={{ gap: '16px' }}
      >
        {/* Info callout */}
        <div
          style={{
            borderLeft: `3px solid ${css.primary}`,
            background: css.primaryMuted,
            borderRadius: '6px',
            padding: '10px 14px',
            fontSize: '13px',
            color: css.textSecondary,
          }}
        >
          Review the generated issue body below.
        </div>

        {/* Body preview */}
        <pre
          style={{
            background: css.surfaceAlt,
            border: `1px solid ${css.border}`,
            borderRadius: '8px',
            padding: '14px',
            overflowY: 'auto',
            maxHeight: '300px',
            margin: 0,
          }}
        >
          <code
            style={{
              fontSize: '12px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              color: css.textSecondary,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {wizard.interpolatedBody || '(empty body)'}
          </code>
        </pre>

        {/* Labels */}
        {labels.length > 0 && (
          <div className="flex flex-wrap" style={{ gap: '6px' }}>
            {labels.map((label) => (
              <span
                key={label}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: css.primaryMuted,
                  color: css.primary,
                  border: `1px solid ${css.primary}`,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between"
          style={{
            paddingTop: '16px',
            borderTop: `1px solid ${css.border}`,
            marginTop: '8px',
          }}
        >
          <Button variant="ghost" onClick={goBack}>
            <ChevronLeft size={15} />
            Back
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setSubmitStatus('idle');
              goTo(4, 1);
            }}
          >
            Create issue
            <ChevronRight size={15} />
          </Button>
        </div>
      </motion.div>
    );
  }

  // -------------------------------------------------------------------------
  // Step 4: Submit / Result
  // -------------------------------------------------------------------------

  function Step4() {
    return (
      <motion.div
        key="step4"
        custom={wizard.direction}
        variants={stepVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className="flex flex-col"
        style={{ gap: '16px' }}
      >
        {/* Loading */}
        {submitStatus === 'loading' && (
          <div
            className="flex flex-col items-center justify-center"
            style={{ padding: '48px 0', gap: '16px' }}
          >
            <Loader2
              size={40}
              color={css.primary}
              className="animate-spin"
            />
            <span style={{ fontSize: '15px', color: css.textSecondary }}>
              Creating your issue...
            </span>
          </div>
        )}

        {/* Success */}
        {submitStatus === 'success' && (
          <div
            className="flex flex-col items-center"
            style={{ padding: '40px 0', gap: '16px', textAlign: 'center' }}
          >
            <CheckCircle2 size={48} color={css.success} />
            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: css.textPrimary,
              }}
            >
              Issue created!
            </span>
            {submitResult?.html_url && (
              <a
                href={submitResult.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
                style={{
                  gap: '6px',
                  color: css.primary,
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                View issue #{submitResult.number} on GitHub
                <ExternalLink size={14} />
              </a>
            )}
            <button
              onClick={resetToStart}
              style={{
                marginTop: '8px',
                background: 'transparent',
                border: `1px solid ${css.border}`,
                borderRadius: '8px',
                padding: '8px 18px',
                color: css.textSecondary,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Create another
            </button>
          </div>
        )}

        {/* Error */}
        {submitStatus === 'error' && (
          <div
            className="flex flex-col items-center"
            style={{ padding: '40px 0', gap: '16px', textAlign: 'center' }}
          >
            <AlertCircle size={48} color={css.error} />
            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: css.textPrimary,
              }}
            >
              Something went wrong
            </span>
            {submitError && (
              <span
                style={{
                  fontSize: '13px',
                  color: css.textMuted,
                  maxWidth: '400px',
                }}
              >
                {submitError}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        {submitStatus !== 'loading' && (
          <div
            className="flex items-center justify-between"
            style={{
              paddingTop: '16px',
              borderTop: `1px solid ${css.border}`,
              marginTop: '8px',
            }}
          >
            {submitStatus === 'success' && (
              <div className="flex w-full justify-end">
                <Button variant="primary" onClick={onClose}>
                  Close
                </Button>
              </div>
            )}

            {submitStatus === 'error' && (
              <>
                <Button variant="ghost" onClick={goBack}>
                  <ChevronLeft size={15} />
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setSubmitStatus('idle');
                    submit();
                  }}
                >
                  Try again
                </Button>
              </>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-overlay"
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="hidden"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            key="modal-content"
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{
              background: css.surface,
              border: `1px solid ${css.border}`,
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              boxSizing: 'border-box',
            }}
            // Mobile: full screen handled via media query below via className
            className="modal-container"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: css.textMuted,
              }}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div style={{ marginBottom: '20px', paddingRight: '32px' }}>
              <h2
                style={{
                  fontSize: '28px',
                  fontWeight: 600,
                  color: css.textPrimary,
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Create new issue
              </h2>
              <p
                style={{
                  fontSize: '13px',
                  color: css.textMuted,
                  margin: '6px 0 0',
                }}
              >
                {STEP_LABELS[wizard.step]}
              </p>
            </div>

            {/* Step Indicator */}
            <StepIndicator currentStep={wizard.step} />

            {/* Step content */}
            <div style={{ overflow: 'hidden' }}>
              <AnimatePresence mode="wait" custom={wizard.direction}>
                {wizard.step === 1 && <Step1 key="step-1" />}
                {wizard.step === 2 && <Step2 key="step-2" />}
                {wizard.step === 3 && <Step3 key="step-3" />}
                {wizard.step === 4 && <Step4 key="step-4" />}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
