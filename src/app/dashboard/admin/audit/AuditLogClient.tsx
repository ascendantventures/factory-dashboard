'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText } from 'lucide-react';

interface AuditEntry {
  id: string;
  actor_id: string | null;
  target_user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
  actor: { email: string; display_name: string } | null;
  target: { email: string; display_name: string } | null;
}

const ACTION_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  invite: { label: 'Invite', bg: '#DBEAFE', color: '#1D4ED8' },
  role_change: { label: 'Role Change', bg: '#EDE9FE', color: '#7C3AED' },
  deactivate: { label: 'Deactivate', bg: '#FEE2E2', color: '#DC2626' },
  reactivate: { label: 'Reactivate', bg: '#D1FAE5', color: '#059669' },
  password_change: { label: 'Password Change', bg: '#FEF3C7', color: '#D97706' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export function AuditLogClient() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pageSize = 50;

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit?page=${page}&pageSize=${pageSize}`);
      const data = await res.json();
      if (res.ok) {
        setEntries(data.entries);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ padding: '32px', maxWidth: '1280px', fontFamily: "'Outfit', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Audit Log</h1>
        <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>History of user management actions</p>
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', width: '160px' }}>Timestamp</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actor</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', width: '140px' }}>Action</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ padding: '64px 16px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>Loading…</td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '64px 16px', textAlign: 'center' }}>
                  <FileText size={48} style={{ color: '#CBD5E1', marginBottom: '12px' }} />
                  <p style={{ fontSize: '16px', fontWeight: 600, color: '#334155', margin: '0 0 4px' }}>No activity yet</p>
                  <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
                    Actions will appear here as users are invited, roles change, or accounts are deactivated.
                  </p>
                </td>
              </tr>
            ) : (
              entries.map((entry, idx) => {
                const actionStyle = ACTION_LABELS[entry.action] ?? { label: entry.action, bg: '#F1F5F9', color: '#334155' };
                const isExpanded = expandedId === entry.id;
                return (
                  <>
                    <tr
                      key={entry.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        cursor: entry.details ? 'pointer' : 'default',
                        transition: 'background 150ms ease',
                      }}
                      onClick={() => entry.details && setExpandedId(isExpanded ? null : entry.id)}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#F8FAFC'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B', width: '160px' }}>
                        {formatDate(entry.created_at)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {entry.actor ? (
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: 500, color: '#0F172A', margin: 0 }}>{entry.actor.display_name}</p>
                            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>{entry.actor.email}</p>
                          </div>
                        ) : <span style={{ fontSize: '13px', color: '#94A3B8' }}>System</span>}
                      </td>
                      <td style={{ padding: '14px 16px', width: '140px' }}>
                        <span style={{
                          background: actionStyle.bg, color: actionStyle.color,
                          fontSize: '12px', fontWeight: 600, padding: '4px 8px', borderRadius: '4px',
                        }}>
                          {actionStyle.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {entry.target ? (
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: 500, color: '#0F172A', margin: 0 }}>{entry.target.display_name}</p>
                            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>{entry.target.email}</p>
                          </div>
                        ) : <span style={{ fontSize: '13px', color: '#94A3B8' }}>—</span>}
                      </td>
                    </tr>
                    {isExpanded && entry.details && (
                      <tr key={`${entry.id}-details`} style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                        <td colSpan={4} style={{ padding: '12px 16px 16px 32px' }}>
                          <pre style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: '12px', color: '#334155',
                            background: '#F1F5F9', padding: '12px', borderRadius: '6px',
                            margin: 0, overflow: 'auto', maxHeight: '200px',
                          }}>
                            {JSON.stringify(entry.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {total > pageSize && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total} entries
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'transparent', fontSize: '13px', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#CBD5E1' : '#334155' }}>
                ‹
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'transparent', fontSize: '13px', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#CBD5E1' : '#334155' }}>
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
