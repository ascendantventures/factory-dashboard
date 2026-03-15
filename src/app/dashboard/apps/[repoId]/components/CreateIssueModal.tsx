'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Bug, Sparkles, Palette, Zap, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

type IssueType = 'Bug Report' | 'Feature Request' | 'Design Change' | 'Performance Fix';

interface QuickType {
  id: IssueType;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  colors: { bg: string; text: string };
  testId: string;
}

const QUICK_TYPES: QuickType[] = [
  {
    id: 'Bug Report',
    label: 'Bug Report',
    icon: Bug,
    colors: { bg: '#7F1D1D', text: '#FCA5A5' },
    testId: 'quick-type-bug',
  },
  {
    id: 'Feature Request',
    label: 'Feature Request',
    icon: Sparkles,
    colors: { bg: '#1E3A5F', text: '#60A5FA' },
    testId: 'quick-type-feature',
  },
  {
    id: 'Design Change',
    label: 'Design Change',
    icon: Palette,
    colors: { bg: '#4C1D95', text: '#A78BFA' },
    testId: 'quick-type-design',
  },
  {
    id: 'Performance Fix',
    label: 'Performance Fix',
    icon: Zap,
    colors: { bg: '#713F12', text: '#FBBF24' },
    testId: 'quick-type-performance',
  },
];

interface Props {
  repoId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateIssueModal({ repoId, onClose, onSuccess }: Props) {
  const [type, setType] = useState<IssueType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Phase 2: CLAUDE.md indicator state
  const [hasClaude, setHasClaude] = useState(false);

  // Phase 2: prefetch CLAUDE.md existence when modal opens
  useEffect(() => {
    if (!repoId) return;
    const checkClaude = async () => {
      try {
        const res = await fetch(`/api/apps/${encodeURIComponent(repoId)}/claude-check`);
        const data = await res.json() as { exists?: boolean };
        setHasClaude(data.exists === true);
      } catch {
        setHasClaude(false);
      }
    };
    checkClaude();
  }, [repoId]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    },
    [onClose, submitting],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  async function handleSubmit() {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/apps/${encodeURIComponent(repoId)}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type ?? undefined,
          title: title.trim(),
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to create issue');
        setSubmitting(false);
        return;
      }
      onSuccess();
    } catch {
      setError('Network error — please try again');
      setSubmitting(false);
    }
  }

  const inputBase: React.CSSProperties = {
    width: '100%',
    background: '#1C1C1C',
    border: '1px solid #262626',
    borderRadius: '6px',
    padding: '0 12px',
    height: '40px',
    color: '#FAFAFA',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
  };

  const labelBase: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#FAFAFA',
    marginBottom: '8px',
    fontFamily: 'Inter, sans-serif',
  };

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      {/* Modal */}
      <div
        data-testid="create-issue-modal"
        style={{
          background: '#18181B',
          border: '1px solid #3F3F46',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
          padding: '24px',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
            New Issue
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717A', padding: '4px' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Repository indicator */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelBase}>Target Repository</label>
          <div
            style={{
              ...inputBase,
              display: 'flex',
              alignItems: 'center',
              color: '#A1A1AA',
              background: '#141414',
              cursor: 'default',
            }}
          >
            {decodeURIComponent(repoId)}
          </div>

          {/* Phase 2: CLAUDE.md indicator */}
          {hasClaude && (
            <div
              className="animate-in fade-in duration-200"
              data-testid="claude-context-indicator"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}
            >
              <CheckCircle2 size={14} style={{ color: '#22C55E', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#22C55E', lineHeight: 1.4 }}>
                CLAUDE.md context will be auto-injected
              </span>
            </div>
          )}
        </div>

        {/* Issue type */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelBase}>Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {QUICK_TYPES.map((qt) => {
              const Icon = qt.icon;
              const selected = type === qt.id;
              return (
                <button
                  key={qt.id}
                  data-testid={qt.testId}
                  onClick={() => setType(selected ? null : qt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${selected ? qt.colors.text : '#3F3F46'}`,
                    background: selected ? qt.colors.bg : 'transparent',
                    color: selected ? qt.colors.text : '#A1A1AA',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 150ms ease',
                  }}
                >
                  <Icon size={14} style={{ flexShrink: 0 }} />
                  {qt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelBase}>
            Issue Title <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input
            data-testid="issue-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            placeholder="Brief description of the issue…"
            style={inputBase}
            autoFocus
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelBase}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional context, steps to reproduce, etc. (optional)"
            rows={4}
            style={{
              ...inputBase,
              height: 'auto',
              padding: '10px 12px',
              resize: 'vertical',
              lineHeight: '1.5',
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: '#EF4444',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #3F3F46',
              background: 'transparent',
              color: '#A1A1AA',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            data-testid="create-issue-submit"
            onClick={handleSubmit}
            disabled={submitting || !title.trim()}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: submitting || !title.trim() ? '#3F3F46' : '#6366F1',
              color: '#FAFAFA',
              fontSize: '14px',
              fontWeight: 600,
              cursor: submitting || !title.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 150ms ease',
            }}
          >
            {submitting && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            {submitting ? 'Creating…' : 'Create Issue'}
          </button>
        </div>
      </div>
    </div>
  );
}
