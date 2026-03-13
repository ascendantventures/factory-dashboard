'use client';

import { useState, useEffect, useRef as useRefFQ, DragEvent } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { X, Plus, Loader2, AlertCircle, FolderOpen, ExternalLink, ChevronDown, Upload as UploadIcon, X as XIcon } from 'lucide-react';
import { TargetAppDropdown } from './TargetAppDropdown';
import type { IssueAttachment } from '@/lib/attachments';
import { isAllowedFileType, MAX_FILE_SIZE, formatFileSize } from '@/lib/attachments';

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
  const [createdIssueNumber, setCreatedIssueNumber] = useState<number | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<IssueAttachment[]>([]);

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
      if (e.key === 'Escape' && !isSubmitting) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSubmitting]);

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

      // Upload queued attachments to the new issue
      if (pendingAttachments.length > 0 && result.number) {
        setCreatedIssueNumber(result.number);
        for (const file of pendingAttachments) {
          try {
            const formData = new globalThis.FormData();
            formData.append('file', file);
            await fetch(`/api/issues/${result.number}/attachments`, {
              method: 'POST',
              body: formData,
            });
          } catch {
            // Non-fatal: issue already created, skip failed attachment
          }
        }
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
      setPendingAttachments([]);
      setUploadedAttachments([]);
      setCreatedIssueNumber(null);
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

              {/* Attachments */}
              <div>
                <label style={{ ...labelStyle, marginBottom: '4px' }}>
                  Attachments{' '}
                  <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 400 }}>(optional)</span>
                </label>
                <p style={{ fontSize: '12px', color: '#71717A', marginBottom: '10px', fontFamily: 'Inter, sans-serif' }}>
                  Add images, mockups, or design files. Pipeline agents will use these as reference.
                </p>
                <ModalFileQueue
                  files={pendingAttachments}
                  onFilesAdd={(newFiles) => {
                    setPendingAttachments((prev) => {
                      const combined = [...prev, ...newFiles];
                      return combined.slice(0, 10);
                    });
                  }}
                  onFileRemove={(idx) => {
                    setPendingAttachments((prev) => prev.filter((_, i) => i !== idx));
                  }}
                />
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

// ── Inline file queue for the NewIssueModal (deferred upload) ─────────────────

interface ModalFileQueueProps {
  files: File[];
  onFilesAdd: (files: File[]) => void;
  onFileRemove: (index: number) => void;
}

function ModalFileQueue({ files, onFilesAdd, onFileRemove }: ModalFileQueueProps) {
  const inputRef = useRefFQ<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);

  function processFiles(fileList: FileList | File[]) {
    setQueueError(null);
    const arr = Array.from(fileList);
    const valid: File[] = [];
    const errors: string[] = [];

    for (const f of arr) {
      if (!isAllowedFileType(f)) {
        errors.push(`${f.name}: type not supported`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        errors.push(`${f.name}: exceeds 10MB`);
        continue;
      }
      valid.push(f);
    }

    if (errors.length) setQueueError(errors.join('; '));
    if (valid.length) onFilesAdd(valid);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Drop zone */}
      <div
        data-testid="attachment-dropzone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? '#2563EB' : queueError ? '#DC2626' : '#3F3F46'}`,
          background: dragOver ? 'rgba(37,99,235,0.08)' : queueError ? 'rgba(220,38,38,0.06)' : '#1C1C1C',
          borderRadius: '8px',
          padding: '28px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 200ms ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.gif,.svg,.pdf,.pen"
          data-testid="attachment-file-input"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files) processFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <UploadIcon size={28} color={dragOver ? '#2563EB' : '#71717A'} />
        <span style={{ fontSize: '13px', color: '#A1A1AA' }}>
          Drop files or{' '}
          <span style={{ color: '#10B981', fontWeight: 500 }}>browse</span>
          {' '}— PNG, JPG, GIF, SVG, PDF, .pen · max 10MB
        </span>
      </div>

      {queueError && (
        <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '6px' }} role="alert">
          {queueError}
        </p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              data-testid="attachment-preview"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#1C1C1C',
                border: '1px solid #262626',
                borderRadius: '6px',
                padding: '8px 10px',
              }}
            >
              {/* Tiny preview */}
              {file.type.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: '36px', height: '36px', borderRadius: '4px', background: '#27272A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#71717A', textTransform: 'uppercase' }}>
                    {file.name.split('.').pop()}
                  </span>
                </div>
              )}
              <span style={{ flex: 1, fontSize: '13px', color: '#FAFAFA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </span>
              <span style={{ fontSize: '11px', color: '#71717A', flexShrink: 0 }}>
                {formatFileSize(file.size)}
              </span>
              <button
                onClick={() => onFileRemove(idx)}
                aria-label={`Remove ${file.name}`}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: '#71717A', padding: '2px', display: 'flex', flexShrink: 0,
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#71717A'; }}
              >
                <XIcon size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
