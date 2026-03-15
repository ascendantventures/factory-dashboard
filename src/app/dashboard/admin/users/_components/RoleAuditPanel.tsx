'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, ChevronDown, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';

interface AuditRow {
  id: string;
  changed_at: string;
  target_email: string;
  changed_by_email: string;
  old_role: string;
  new_role: string;
  notes: string | null;
}

interface AuditResponse {
  data: AuditRow[];
  total: number;
  page: number;
  per_page: number;
}

const STORAGE_KEY = 'users-admin-panels';
const PANEL_KEY = 'roleAudit';
const PER_PAGE = 25;

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function RolePill({ role }: { role: string }) {
  const isAdmin = role === 'admin';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '4px',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.02em',
      background: isAdmin ? 'rgba(99,102,241,0.15)' : 'rgba(161,161,170,0.12)',
      border: `1px solid ${isAdmin ? 'rgba(99,102,241,0.35)' : 'rgba(161,161,170,0.25)'}`,
      color: isAdmin ? '#818CF8' : '#A1A1AA',
    }}>
      {role}
    </span>
  );
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

export function RoleAuditPanel() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setOpen(loadPanelState());
  }, []);

  const fetchAudit = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/role-audit?page=${p}&per_page=${PER_PAGE}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? 'Failed to load audit log');
        return;
      }
      const data: AuditResponse = await res.json();
      setRows(data.data);
      setTotal(data.total);
    } catch {
      setError('Network error loading audit log');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchAudit(page);
    }
  }, [open, page, fetchAudit]);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    savePanelState(next);
    if (next && rows.length === 0 && !loading) {
      fetchAudit(1);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  if (!mounted) return null;

  return (
    <div
      data-testid="role-audit-panel"
      style={{
        background: '#18181B',
        border: '1px solid #3F3F46',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        data-testid="role-audit-panel-toggle"
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
          background: 'rgba(99,102,241,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ClipboardList size={16} style={{ color: '#818CF8' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#FAFAFA',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}>
            Role Change Audit Log
          </div>
          <div style={{
            fontSize: '12px',
            color: '#71717A',
            marginTop: '2px',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}>
            Track all role changes made to user accounts
          </div>
        </div>
        {total > 0 && (
          <span style={{
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.25)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            fontWeight: 600,
            color: '#818CF8',
          }}>
            {total}
          </span>
        )}
        <div style={{ color: '#71717A', flexShrink: 0 }}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div>
          {loading ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#71717A', fontSize: '14px', fontFamily: "'Inter', system-ui, sans-serif" }}>
              Loading…
            </div>
          ) : error ? (
            <div style={{ padding: '24px', background: 'rgba(239,68,68,0.08)', borderTop: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: '#FCA5A5', fontFamily: "'Inter', system-ui, sans-serif" }}>
              {error}
            </div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <ClipboardList size={40} style={{ color: '#3F3F46', marginBottom: '12px' }} />
              <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '16px', fontWeight: 600, color: '#A1A1AA', margin: '0 0 6px' }}>
                No role changes recorded yet
              </p>
              <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '13px', color: '#71717A', margin: 0 }}>
                Role changes will appear here once they occur.
              </p>
            </div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#27272A', borderBottom: '1px solid #3F3F46', height: '40px' }}>
                    {['Changed At', 'User', 'Changed By', 'Role Change'].map(h => (
                      <th key={h} style={{
                        padding: '0 16px',
                        textAlign: 'left' as const,
                        fontSize: '11px',
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
                  {rows.map((row, idx) => (
                    <tr
                      key={row.id}
                      data-testid="audit-row"
                      style={{
                        borderBottom: idx < rows.length - 1 ? '1px solid #2D2D33' : 'none',
                        background: idx % 2 === 0 ? '#18181B' : '#1F1F23',
                        height: '48px',
                      }}
                    >
                      <td style={{ padding: '0 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#71717A', whiteSpace: 'nowrap' as const }}>
                        {formatDateTime(row.changed_at)}
                      </td>
                      <td style={{ padding: '0 16px', fontSize: '13px', color: '#FAFAFA', fontFamily: "'Inter', system-ui, sans-serif", maxWidth: '200px' }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }} title={row.target_email}>
                          {row.target_email}
                        </span>
                      </td>
                      <td style={{ padding: '0 16px', fontSize: '13px', color: '#A1A1AA', fontFamily: "'Inter', system-ui, sans-serif", maxWidth: '200px' }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }} title={row.changed_by_email}>
                          {row.changed_by_email}
                        </span>
                      </td>
                      <td style={{ padding: '0 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <RolePill role={row.old_role} />
                          <ArrowRight size={12} style={{ color: '#71717A', flexShrink: 0 }} />
                          <RolePill role={row.new_role} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid #3F3F46', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#71717A', fontFamily: "'Inter', system-ui, sans-serif" }}>
                    Page {page} of {totalPages} &middot; {total} total
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { key: 'prev', icon: <ChevronLeft size={16} />, disabled: page === 1, action: () => setPage(p => Math.max(1, p - 1)) },
                      { key: 'next', icon: <ChevronRight size={16} />, disabled: page === totalPages, action: () => setPage(p => Math.min(totalPages, p + 1)) },
                    ].map(btn => (
                      <button
                        key={btn.key}
                        onClick={btn.action}
                        disabled={btn.disabled}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          border: '1px solid #3F3F46',
                          borderRadius: '6px',
                          background: '#18181B',
                          color: btn.disabled ? '#3F3F46' : '#A1A1AA',
                          cursor: btn.disabled ? 'not-allowed' : 'pointer',
                          opacity: btn.disabled ? 0.4 : 1,
                          transition: 'all 150ms ease',
                        }}
                        onMouseEnter={e => { if (!btn.disabled) { (e.currentTarget as HTMLButtonElement).style.background = '#27272A'; (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA'; } }}
                        onMouseLeave={e => { if (!btn.disabled) { (e.currentTarget as HTMLButtonElement).style.background = '#18181B'; (e.currentTarget as HTMLButtonElement).style.color = '#A1A1AA'; } }}
                      >
                        {btn.icon}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
