'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Bug, Sparkles, Palette, Zap, AlertCircle, Loader2 } from 'lucide-react';

type IssueType = 'bug_report' | 'feature_request' | 'design_change' | 'performance_fix';

interface QuickType {
  id: IssueType;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  colors: { bg: string; text: string };
}

const QUICK_TYPES: QuickType[] = [
  { id: 'bug_report', label: 'Bug Report', icon: Bug, colors: { bg: '#7F1D1D', text: '#FCA5A5' } },
  { id: 'feature_request', label: 'Feature Request', icon: Sparkles, colors: { bg: '#1E3A5F', text: '#60A5FA' } },
  { id: 'design_change', label: 'Design Change', icon: Palette, colors: { bg: '#4C1D95', text: '#A78BFA' } },
  { id: 'performance_fix', label: 'Performance Fix', icon: Zap, colors: { bg: '#713F12', text: '#FBBF24' } },
];

interface Props {
  repoId: string;
  buildRepo: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateIssueModal({ repoId, buildRepo, onClose, onSuccess }: Props) {
  const [type, setType] = useState<IssueType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

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
      const res = await fetch(`/api/apps/${repoId}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title: title.trim(), body: description.trim(), build_repo: buildRepo }),
      });
      const data = await res.json();
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

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#B8B4AF',
    marginBottom: '6px',
    fontFamily: 'var(--font-ui, "Plus Jakarta Sans", system-ui, sans-serif)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '44px',
    background: '#1A1918',
    color: '#F5F3F0',
    fontSize: '14px',
    fontFamily: 'var(--font-ui, "Plus Jakarta Sans", system-ui, sans-serif)',
    padding: '0 12px',
    border: '1px solid #3D3937',
    borderRadius: '6px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        data-testid="create-issue-modal"
        style={{
          background: '#1A1918',
          border: '1px solid #3D3937',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          maxWidth: '560px',
          width: '100%',
          maxHeight: 'calc(100vh - 64px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 400,
          animation: 'scale-in 250ms cubic-bezier(0.25,1,0.5,1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px 16px',
            borderBottom: '1px solid #3D3937',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#F5F3F0',
              margin: 0,
              fontFamily: 'var(--font-ui, "Plus Jakarta Sans", system-ui, sans-serif)',
            }}
          >
            Create New Issue
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#7A7672',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: '6px',
              transition: 'color 150ms',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#F5F3F0')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#7A7672')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* Repository */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Repository</label>
            <input
              data-testid="create-issue-repo"
              value={buildRepo}
              disabled
              readOnly
              style={{ ...inputStyle, background: '#252321', color: '#7A7672', cursor: 'not-allowed' }}
            />
            <p style={{ fontSize: '12px', color: '#7A7672', marginTop: '4px', marginBottom: 0 }}>
              Issues will be created in this repository
            </p>
          </div>

          {/* Issue Type */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Issue Type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {QUICK_TYPES.map((qt) => {
                const selected = type === qt.id;
                const Icon = qt.icon;
                return (
                  <button
                    key={qt.id}
                    onClick={() => setType(selected ? null : qt.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: selected ? '#D4A012' : '#252321',
                      color: selected ? '#0F0E0D' : '#B8B4AF',
                      fontSize: '13px',
                      fontWeight: 500,
                      padding: '8px 12px',
                      border: `1px solid ${selected ? '#D4A012' : 'transparent'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-ui, "Plus Jakarta Sans", system-ui, sans-serif)',
                      transition: 'all 150ms',
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) {
                        (e.currentTarget as HTMLButtonElement).style.background = '#3D3937';
                        (e.currentTarget as HTMLButtonElement).style.color = '#F5F3F0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) {
                        (e.currentTarget as HTMLButtonElement).style.background = '#252321';
                        (e.currentTarget as HTMLButtonElement).style.color = '#B8B4AF';
                      }
                    }}
                  >
                    <Icon size={16} />
                    {qt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="issue-title" style={labelStyle}>
              Title <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              id="issue-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              style={{
                ...inputStyle,
                borderColor: error && !title.trim() ? '#EF4444' : '#3D3937',
                boxShadow: error && !title.trim() ? '0 0 0 3px rgba(239,68,68,0.2)' : undefined,
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = '#D4A012';
                (e.currentTarget as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(212,160,18,0.2)';
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = '#3D3937';
                (e.currentTarget as HTMLInputElement).style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '8px' }}>
            <label htmlFor="issue-description" style={labelStyle}>Description</label>
            <textarea
              id="issue-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed explanation..."
              rows={5}
              style={{
                width: '100%',
                background: '#1A1918',
                color: '#F5F3F0',
                fontSize: '14px',
                fontFamily: 'var(--font-ui, "Plus Jakarta Sans", system-ui, sans-serif)',
                padding: '12px',
                border: '1px solid #3D3937',
                borderRadius: '6px',
                outline: 'none',
                resize: 'vertical',
                minHeight: '100px',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLTextAreaElement).style.borderColor = '#D4A012';
                (e.currentTarget as HTMLTextAreaElement).style.boxShadow = '0 0 0 3px rgba(212,160,18,0.2)';
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLTextAreaElement).style.borderColor = '#3D3937';
                (e.currentTarget as HTMLTextAreaElement).style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#EF4444',
                marginTop: '8px',
              }}
            >
              <AlertCircle size={12} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            padding: '16px 20px',
            borderTop: '1px solid #3D3937',
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: '#F5F3F0',
              fontSize: '14px',
              fontWeight: 600,
              padding: '12px 20px',
              border: '1px solid #3D3937',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'var(--font-ui, "Plus Jakarta Sans", system-ui, sans-serif)',
              minHeight: '44px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              background: submitting ? '#3D3937' : '#D4A012',
              color: submitting ? '#7A7672' : '#0F0E0D',
              fontSize: '14px',
              fontWeight: 600,
              padding: '12px 20px',
              border: 'none',
              borderRadius: '6px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-ui, "Plus Jakarta Sans", system-ui, sans-serif)',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {submitting && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            Create Issue
          </button>
        </div>
      </div>
    </div>
  );
}
