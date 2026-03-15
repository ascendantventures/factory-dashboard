'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, Eye, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, X, AlertCircle, Clock } from 'lucide-react';
import { TestAccountBadge } from './TestAccountBadge';

const STORAGE_KEY = 'users-admin-panels';
const PANEL_KEY = 'qaPurge';

interface PurgePreviewData {
  emails: string[];
  dry_run: boolean;
  skipped: number;
}

interface PurgeResult {
  deleted: number;
  skipped: number;
  emails: string[];
  dry_run: boolean;
  error?: string;
}

interface PurgeLogEntry {
  id: string;
  purged_at: string;
  triggered_by: string;
  accounts_deleted: number;
  accounts_skipped: number;
  deleted_emails: string[];
  error_message: string | null;
}

function loadPanelState(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed[PANEL_KEY] === true;
  } catch {
    return false;
  }
}

function savePanelState(open: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[PANEL_KEY] = open;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch { /* ignore */ }
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── PurgePreviewList ────────────────────────────────────────────────────────

function PurgePreviewList({ preview, onDismiss }: { preview: PurgePreviewData; onDismiss: () => void }) {
  return (
    <div data-testid="purge-preview-result" style={{ marginTop: '16px' }}>
      <div style={{
        padding: '10px 14px',
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: '6px 6px 0 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: 'none',
      }}>
        <Eye size={13} style={{ color: '#F59E0B', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#FCD34D', fontFamily: "'Inter', system-ui, sans-serif", flex: 1 }}>
          Preview — {preview.emails.length} account{preview.emails.length !== 1 ? 's' : ''} would be deleted
          {preview.skipped > 0 && ` · ${preview.skipped} skipped (older than 30 days)`}
        </span>
        <button
          data-testid="purge-preview-dismiss"
          onClick={onDismiss}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '20px', height: '20px', border: 'none', background: 'transparent',
            cursor: 'pointer', borderRadius: '4px', color: '#71717A', flexShrink: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#71717A'; }}
        >
          <X size={12} />
        </button>
      </div>
      <div style={{
        background: '#18181B',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: '0 0 6px 6px',
        maxHeight: '200px',
        overflowY: 'auto' as const,
      }}>
        {preview.emails.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#71717A', fontFamily: "'Inter', system-ui, sans-serif" }}>
            No matching test accounts found.
          </div>
        ) : (
          preview.emails.map((email, idx) => (
            <div
              key={email}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 14px',
                borderBottom: idx < preview.emails.length - 1 ? '1px solid #2D2D33' : 'none',
                background: idx % 2 === 0 ? '#18181B' : '#1F1F23',
              }}
            >
              <span style={{ fontSize: '13px', color: '#FAFAFA', fontFamily: "'Inter', system-ui, sans-serif", flex: 1 }}>
                {email}
              </span>
              <TestAccountBadge />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── PurgeConfirmDialog ──────────────────────────────────────────────────────

function PurgeConfirmDialog({
  count,
  loading,
  onConfirm,
  onCancel,
}: {
  count: number;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        data-testid="purge-confirm-dialog"
        style={{
          width: '440px',
          background: '#323238',
          border: '1px solid #3F3F46',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
          padding: '24px',
        }}
      >
        {/* Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
          <button
            onClick={onCancel}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', border: 'none', background: 'transparent',
              cursor: 'pointer', borderRadius: '4px', color: '#71717A',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#27272A'; (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#71717A'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Icon + Title */}
        <div style={{ marginBottom: '16px' }}>
          <Trash2 size={24} style={{ color: '#EF4444', marginBottom: '12px' }} />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#FAFAFA', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Purge QA Accounts
          </h2>
        </div>

        {/* Body */}
        <div style={{ marginBottom: '24px', fontFamily: "'Inter', system-ui, sans-serif" }}>
          <p style={{ fontSize: '14px', color: '#A1A1AA', lineHeight: 1.6, margin: '0 0 12px' }}>
            {count > 0
              ? `This will permanently delete ${count} test account${count !== 1 ? 's' : ''}. This action cannot be undone.`
              : 'This will permanently delete all matching QA/test accounts less than 30 days old. This action cannot be undone.'}
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '12px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#FCA5A5',
            lineHeight: 1.5,
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
            Accounts older than 30 days are automatically skipped as a safety guard.
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            data-testid="purge-confirm-cancel"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '10px 16px',
              border: '1px solid #3F3F46',
              borderRadius: '6px',
              background: 'transparent',
              fontSize: '14px',
              fontWeight: 500,
              color: '#A1A1AA',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
            onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.background = '#27272A'; (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA'; } }}
            onMouseLeave={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#A1A1AA'; } }}
          >
            Cancel
          </button>
          <button
            data-testid="purge-confirm-submit"
            onClick={onConfirm}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              border: 'none',
              borderRadius: '6px',
              background: loading ? 'rgba(239,68,68,0.5)' : '#EF4444',
              fontSize: '14px',
              fontWeight: 600,
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Inter', system-ui, sans-serif",
              transition: 'background 150ms ease',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#DC2626'; }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#EF4444'; }}
          >
            <Trash2 size={14} />
            {loading ? 'Purging…' : 'Purge Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PurgeResultAlert ────────────────────────────────────────────────────────

function PurgeResultAlert({ result, onDismiss }: { result: PurgeResult; onDismiss: () => void }) {
  const isError = !!result.error;

  return (
    <div
      data-testid="purge-result-alert"
      style={{
        marginTop: '16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        background: isError ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
        border: `1px solid ${isError ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
        borderRadius: '6px',
      }}
    >
      {isError
        ? <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: '1px' }} />
        : <CheckCircle size={16} style={{ color: '#22C55E', flexShrink: 0, marginTop: '1px' }} />
      }
      <div style={{ flex: 1, fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: isError ? '#FCA5A5' : '#86EFAC', marginBottom: '2px' }}>
          {isError ? 'Purge encountered an error' : `Purge complete — ${result.deleted} account${result.deleted !== 1 ? 's' : ''} deleted`}
        </div>
        <div style={{ fontSize: '12px', color: '#A1A1AA' }}>
          {isError
            ? result.error
            : `${result.skipped} account${result.skipped !== 1 ? 's' : ''} skipped (older than 30 days).`
          }
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '24px', height: '24px', border: 'none', background: 'transparent',
          cursor: 'pointer', borderRadius: '4px', color: '#71717A', flexShrink: 0,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#71717A'; }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── PurgeHistoryTable ───────────────────────────────────────────────────────

function PurgeHistoryTable({ entries }: { entries: PurgeLogEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div data-testid="purge-history-table" style={{ marginTop: '24px' }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        color: '#71717A',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
        fontFamily: "'Inter', system-ui, sans-serif",
        marginBottom: '8px',
        paddingLeft: '2px',
      }}>
        Recent Purge History
      </div>
      <div style={{ background: '#18181B', border: '1px solid #3F3F46', borderRadius: '6px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#27272A', borderBottom: '1px solid #3F3F46', height: '36px' }}>
              {['When', 'Triggered By', 'Deleted', 'Skipped', 'Status'].map(h => (
                <th key={h} style={{
                  padding: '0 12px',
                  textAlign: 'left' as const,
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#71717A',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap' as const,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => (
              <tr
                key={entry.id}
                style={{
                  borderBottom: idx < entries.length - 1 ? '1px solid #2D2D33' : 'none',
                  background: idx % 2 === 0 ? '#18181B' : '#1F1F23',
                  height: '44px',
                }}
              >
                <td style={{ padding: '0 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#71717A', whiteSpace: 'nowrap' as const }}>
                  {formatDateTime(entry.purged_at)}
                </td>
                <td style={{ padding: '0 12px', fontSize: '12px', color: '#A1A1AA', fontFamily: "'Inter', system-ui, sans-serif", maxWidth: '160px' }}>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }} title={entry.triggered_by}>
                    {entry.triggered_by}
                  </span>
                </td>
                <td style={{ padding: '0 12px', textAlign: 'center' as const }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '12px',
                    fontWeight: 600,
                    color: entry.accounts_deleted > 0 ? '#EF4444' : '#71717A',
                  }}>
                    {entry.accounts_deleted}
                  </span>
                </td>
                <td style={{ padding: '0 12px', textAlign: 'center' as const }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '12px',
                    color: '#71717A',
                  }}>
                    {entry.accounts_skipped}
                  </span>
                </td>
                <td style={{ padding: '0 12px' }}>
                  {entry.error_message ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: 'rgba(239,68,68,0.12)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px',
                      fontWeight: 600,
                      color: '#FCA5A5',
                      textTransform: 'uppercase' as const,
                    }}>
                      ERROR
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: 'rgba(34,197,94,0.10)',
                      border: '1px solid rgba(34,197,94,0.2)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px',
                      fontWeight: 600,
                      color: '#86EFAC',
                      textTransform: 'uppercase' as const,
                    }}>
                      OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── QaPurgePanel (main export) ──────────────────────────────────────────────

export function QaPurgePanel() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [previewData, setPreviewData] = useState<PurgePreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [purgeLoading, setPurgeLoading] = useState(false);
  const [purgeResult, setPurgeResult] = useState<PurgeResult | null>(null);

  const [historyEntries, setHistoryEntries] = useState<PurgeLogEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    setOpen(loadPanelState());
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/admin/qa-purge/history');
      if (res.ok) {
        const d = await res.json();
        setHistoryEntries(d.data ?? []);
      }
    } catch { /* non-blocking */ } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open, fetchHistory]);

  // Auto-dismiss success result after 8s
  useEffect(() => {
    if (purgeResult && !purgeResult.error) {
      const timer = setTimeout(() => setPurgeResult(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [purgeResult]);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    savePanelState(next);
  }

  async function handlePreview() {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewData(null);
    try {
      const res = await fetch('/api/admin/qa-purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.error ?? 'Preview failed');
        return;
      }
      setPreviewData({ emails: data.emails ?? [], dry_run: true, skipped: data.skipped ?? 0 });
    } catch {
      setPreviewError('Network error during preview');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handlePurge() {
    setPurgeLoading(true);
    try {
      const res = await fetch('/api/admin/qa-purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPurgeResult({ deleted: 0, skipped: 0, emails: [], dry_run: false, error: data.error ?? 'Purge failed' });
      } else {
        setPurgeResult({ deleted: data.deleted ?? 0, skipped: data.skipped ?? 0, emails: data.emails ?? [], dry_run: false });
        setPreviewData(null);
        fetchHistory();
      }
    } catch {
      setPurgeResult({ deleted: 0, skipped: 0, emails: [], dry_run: false, error: 'Network error during purge' });
    } finally {
      setPurgeLoading(false);
      setShowConfirm(false);
    }
  }

  if (!mounted) return null;

  return (
    <>
      <div
        data-testid="qa-purge-panel"
        style={{
          background: '#18181B',
          border: '1px solid #3F3F46',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <button
          data-testid="qa-purge-header"
          onClick={toggleOpen}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            background: '#1A1A1E',
            border: 'none',
            borderBottom: open ? '1px solid #3F3F46' : 'none',
            cursor: 'pointer',
            textAlign: 'left' as const,
            transition: 'background 150ms ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#222228'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1A1A1E'; }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'rgba(239,68,68,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Trash2 size={16} style={{ color: '#EF4444' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#FAFAFA',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}>
              QA Account Purge
            </div>
            <div style={{
              fontSize: '12px',
              color: '#71717A',
              marginTop: '2px',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}>
              Clean up test accounts &mdash; 30-day safety guard applies
            </div>
          </div>
          <div style={{ color: '#71717A', flexShrink: 0 }}>
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        </button>

        {/* Body */}
        {open && (
          <div style={{ padding: '20px' }}>
            {/* Description */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              background: 'rgba(245,158,11,0.07)',
              border: '1px solid rgba(245,158,11,0.18)',
              borderRadius: '6px',
              marginBottom: '20px',
            }}>
              <AlertTriangle size={14} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '1px' }} />
              <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#FCD34D', marginBottom: '4px' }}>
                  30-day safety guard active
                </div>
                <div style={{ fontSize: '12px', color: '#A1A1AA', lineHeight: 1.5 }}>
                  Accounts matching QA patterns (<code style={{ background: '#27272A', padding: '0 4px', borderRadius: '3px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>qa_</code>, <code style={{ background: '#27272A', padding: '0 4px', borderRadius: '3px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>qa-</code>, <code style={{ background: '#27272A', padding: '0 4px', borderRadius: '3px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>testuser+</code>) created within the last 30 days will be deleted. Older accounts are automatically skipped.
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const }}>
              <button
                data-testid="purge-run-button"
                onClick={handlePreview}
                disabled={previewLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  border: '1px solid #3F3F46',
                  borderRadius: '6px',
                  background: 'transparent',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: previewLoading ? '#71717A' : '#A1A1AA',
                  cursor: previewLoading ? 'not-allowed' : 'pointer',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={e => { if (!previewLoading) { (e.currentTarget as HTMLButtonElement).style.background = '#27272A'; (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#71717A'; } }}
                onMouseLeave={e => { if (!previewLoading) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#A1A1AA'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#3F3F46'; } }}
              >
                <Eye size={14} />
                {previewLoading ? 'Loading preview…' : 'Preview'}
              </button>

              <button
                data-testid="purge-now-btn"
                onClick={() => setShowConfirm(true)}
                disabled={purgeLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: purgeLoading ? 'rgba(239,68,68,0.5)' : '#EF4444',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#fff',
                  cursor: purgeLoading ? 'not-allowed' : 'pointer',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={e => { if (!purgeLoading) (e.currentTarget as HTMLButtonElement).style.background = '#DC2626'; }}
                onMouseLeave={e => { if (!purgeLoading) (e.currentTarget as HTMLButtonElement).style.background = '#EF4444'; }}
              >
                <Trash2 size={14} />
                Purge Now
              </button>
            </div>

            {/* Preview error */}
            {previewError && (
              <div style={{
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#FCA5A5',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}>
                <AlertCircle size={13} style={{ flexShrink: 0 }} />
                {previewError}
              </div>
            )}

            {/* Preview list */}
            {previewData && <PurgePreviewList preview={previewData} onDismiss={() => setPreviewData(null)} />}

            {/* Result alert */}
            {purgeResult && (
              <PurgeResultAlert result={purgeResult} onDismiss={() => setPurgeResult(null)} />
            )}

            {/* History */}
            {historyLoading ? (
              <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#71717A', fontSize: '13px', fontFamily: "'Inter', system-ui, sans-serif" }}>
                <Clock size={13} />
                Loading history…
              </div>
            ) : (
              <PurgeHistoryTable entries={historyEntries} />
            )}
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <PurgeConfirmDialog
          count={previewData ? previewData.emails.length : 0}
          loading={purgeLoading}
          onConfirm={handlePurge}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
