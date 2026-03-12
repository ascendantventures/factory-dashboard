'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { X, Plus, Loader2, AlertCircle, FolderOpen, ExternalLink, ChevronDown } from 'lucide-react';
import { TargetAppDropdown } from './TargetAppDropdown';

interface FormData {
  title: string;
  description: string;
  repo: string;
  complexityHint: string;
  issueType: string;
}

interface NewIssueModalProps {
  trackedRepos: string[];
  onClose: () => void;
  onSync?: () => void;
}

export function NewIssueModal({ trackedRepos, onClose, onSync }: NewIssueModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({ defaultValues: { complexityHint: '', issueType: '' } });

  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedTargetApp, setSelectedTargetApp] = useState<string>('');

  function handleRepoSelect(repo: string | null) {
    const currentDesc = watch('description') ?? '';
    // Strip any existing build_repo: line (idempotent)
    const stripped = currentDesc.replace(/^build_repo:.*\n(\n)?/m, '');
    if (repo) {
      setValue('description', `build_repo: ${repo}\n\n${stripped}`);
      setSelectedTargetApp(repo);
    } else {
      setValue('description', stripped);
      setSelectedTargetApp('');
    }
  }

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function onSubmit(data: FormData) {
    setApiError(null);
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          body: data.description,
          repo: data.repo,
          complexityHint: data.complexityHint || null,
          issueType: data.issueType || null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setApiError(result.error ?? 'Failed to create issue');
        return;
      }

      toast.success('Issue created', {
        description: (
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'underline' }}
          >
            {result.url} <ExternalLink size={12} />
          </a>
        ) as unknown as string,
        duration: 5000,
      });

      reset();
      onClose();
      onSync?.();
    } catch {
      setApiError('Network error. Please try again.');
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#1C1C1C',
    border: '1px solid #262626',
    borderRadius: '6px',
    padding: '0 12px',
    height: '40px',
    color: '#FAFAFA',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    fontFamily: 'Inter, sans-serif',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    background: '#1C1C1C',
    border: '1px solid #262626',
    borderRadius: '6px',
    padding: '12px',
    minHeight: '200px',
    color: '#FAFAFA',
    fontSize: '14px',
    lineHeight: '1.6',
    outline: 'none',
    resize: 'vertical',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    fontFamily: 'Inter, sans-serif',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#FAFAFA',
    marginBottom: '8px',
    fontFamily: 'Inter, sans-serif',
  };

  const errorStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#EF4444',
    marginTop: '6px',
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          animation: 'fadeIn 150ms ease',
        }}
      />

      {/* Modal container */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          zIndex: 51,
          padding: '32px 16px',
          overflowY: 'auto',
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          style={{
            background: '#141414',
            border: '1px solid #262626',
            borderRadius: '12px',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            maxWidth: '540px',
            width: '100%',
            padding: '24px',
            position: 'relative',
            animation: 'slideInUp 200ms ease',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #262626',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: '#FAFAFA',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Create New Issue
            </h3>
            <button
              onClick={onClose}
              aria-label="Close modal"
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#71717A',
                transition: 'background 150ms ease, color 150ms ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#1C1C1C';
                (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = '#71717A';
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Title */}
              <div>
                <label style={labelStyle} htmlFor="new-issue-title">
                  Title <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                </label>
                <input
                  id="new-issue-title"
                  type="text"
                  placeholder="Enter issue title..."
                  style={{
                    ...inputStyle,
                    ...(errors.title ? { borderColor: '#EF4444', boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.2)' } : {}),
                  }}
                  onFocus={(e) => {
                    if (!errors.title) {
                      e.currentTarget.style.borderColor = '#10B981';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
                    }
                  }}
                  {...register('title', { required: 'Title is required' })}
                />
                {errors.title && (
                  <p style={errorStyle} role="alert">
                    <AlertCircle size={14} /> {errors.title.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle} htmlFor="new-issue-description">
                  Description <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                </label>
                <textarea
                  id="new-issue-description"
                  data-testid="issue-description"
                  placeholder="Describe the feature, bug, or enhancement..."
                  style={{
                    ...textareaStyle,
                    ...(errors.description ? { borderColor: '#EF4444', boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.2)' } : {}),
                  }}
                  onFocus={(e) => {
                    if (!errors.description) {
                      e.currentTarget.style.borderColor = '#10B981';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
                    }
                  }}
                  {...register('description', { required: 'Description is required' })}
                />
                <p style={{ fontSize: '12px', color: '#71717A', marginTop: '6px', fontFamily: 'Inter, sans-serif' }}>
                  Supports markdown formatting
                </p>
                {errors.description && (
                  <p style={errorStyle} role="alert">
                    <AlertCircle size={14} /> {errors.description.message}
                  </p>
                )}
              </div>

              {/* Target App — change request dropdown */}
              <div>
                <label style={labelStyle} htmlFor="target-app">
                  Target App{' '}
                  <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 400 }}>(optional)</span>
                </label>
                <TargetAppDropdown
                  value={selectedTargetApp}
                  onChange={handleRepoSelect}
                />
                <p style={{ fontSize: '12px', color: '#71717A', marginTop: '6px', fontFamily: 'Inter, sans-serif' }}>
                  Select an existing app for change requests
                </p>
              </div>

              {/* Target Repository */}
              <div>
                <label style={labelStyle} htmlFor="new-issue-repo">
                  Target Repository <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                </label>
                {trackedRepos.length === 0 ? (
                  <div
                    style={{
                      background: '#1C1C1C',
                      border: '1px solid #262626',
                      borderRadius: '6px',
                      padding: '16px 12px',
                      textAlign: 'center',
                    }}
                  >
                    <FolderOpen size={24} style={{ color: '#71717A', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '13px', color: '#71717A', margin: '0 0 4px', fontFamily: 'Inter, sans-serif' }}>
                      No repositories tracked
                    </p>
                    <a
                      href="/dashboard/settings"
                      style={{ fontSize: '12px', fontWeight: 500, color: '#10B981', fontFamily: 'Inter, sans-serif' }}
                    >
                      Add repos in Settings
                    </a>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <select
                      id="new-issue-repo"
                      style={{
                        ...selectStyle,
                        ...(errors.repo ? { borderColor: '#EF4444', boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.2)' } : {}),
                      }}
                      onFocus={(e) => {
                        if (!errors.repo) {
                          e.currentTarget.style.borderColor = '#10B981';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
                        }
                      }}
                      {...register('repo', { required: 'Repository is required' })}
                    >
                      <option value="" style={{ background: '#1C1C1C', color: '#71717A' }}>
                        Select a repository
                      </option>
                      {trackedRepos.map((r) => (
                        <option key={r} value={r} style={{ background: '#1C1C1C', color: '#FAFAFA' }}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#71717A',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                )}
                {errors.repo && (
                  <p style={errorStyle} role="alert">
                    <AlertCircle size={14} /> {errors.repo.message}
                  </p>
                )}
              </div>

              {/* Complexity + Type row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                }}
                className="sm-grid-cols-2"
              >
                {/* Complexity */}
                <div>
                  <label style={labelStyle} htmlFor="new-issue-complexity">
                    Complexity <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      id="new-issue-complexity"
                      style={selectStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#10B981';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
                      }}
                      {...register('complexityHint')}
                    >
                      <option value="" style={{ background: '#1C1C1C', color: '#71717A' }}>Select...</option>
                      <option value="simple" style={{ background: '#1C1C1C', color: '#FAFAFA' }}>Simple</option>
                      <option value="medium" style={{ background: '#1C1C1C', color: '#FAFAFA' }}>Medium</option>
                      <option value="complex" style={{ background: '#1C1C1C', color: '#FAFAFA' }}>Complex</option>
                    </select>
                    <ChevronDown
                      size={16}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#71717A',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Issue Type */}
                <div>
                  <label style={labelStyle} htmlFor="new-issue-type">
                    Type <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      id="new-issue-type"
                      style={selectStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#10B981';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
                      }}
                      {...register('issueType')}
                    >
                      <option value="" style={{ background: '#1C1C1C', color: '#71717A' }}>Select...</option>
                      <option value="feature" style={{ background: '#1C1C1C', color: '#FAFAFA' }}>Feature</option>
                      <option value="bug" style={{ background: '#1C1C1C', color: '#FAFAFA' }}>Bug</option>
                      <option value="enhancement" style={{ background: '#1C1C1C', color: '#FAFAFA' }}>Enhancement</option>
                    </select>
                    <ChevronDown
                      size={16}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#71717A',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* API error */}
              {apiError && (
                <p style={{ ...errorStyle, fontSize: '13px', padding: '10px 12px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '6px', margin: 0 }} role="alert">
                  <AlertCircle size={14} style={{ flexShrink: 0 }} /> {apiError}
                </p>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid #262626',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  color: '#A1A1AA',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '10px 16px',
                  border: '1px solid #262626',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget;
                  btn.style.background = '#1C1C1C';
                  btn.style.borderColor = '#3F3F46';
                  btn.style.color = '#FAFAFA';
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget;
                  btn.style.background = 'transparent';
                  btn.style.borderColor = '#262626';
                  btn.style.color = '#A1A1AA';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: isSubmitting ? 'rgba(16, 185, 129, 0.4)' : '#10B981',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 150ms ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'Inter, sans-serif',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    const btn = e.currentTarget;
                    btn.style.background = '#059669';
                    btn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    const btn = e.currentTarget;
                    btn.style.background = '#10B981';
                    btn.style.boxShadow = 'none';
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Create Issue
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
