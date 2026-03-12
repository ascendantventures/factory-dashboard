'use client';

import { AuditLogEntry } from './types';
import { FileText, ExternalLink } from 'lucide-react';

const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || 'ascendantventures/harness-beta-test';

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  start_loop: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E' },
  stop_loop: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444' },
  force_tick: { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6' },
  clear_locks: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
  clear_backoff: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
  skip_issue: { bg: 'rgba(107,116,137,0.15)', text: '#6B7489' },
  block_issue: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444' },
  retry_issue: { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6' },
  advance_issue: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E' },
  revert_issue: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
  config_update: { bg: 'rgba(139,92,246,0.15)', text: '#8B5CF6' },
};

function formatTimestamp(isoString: string): string {
  const d = new Date(isoString);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function truncateEmail(email: string | null): string {
  if (!email) return '—';
  if (email.length > 24) return email.slice(0, 21) + '...';
  return email;
}

interface Props {
  entries: AuditLogEntry[];
}

export default function AuditLogTable({ entries }: Props) {
  return (
    <div
      data-testid="audit-log-table"
      style={{
        background: '#141721',
        border: '1px solid #2A2F42',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #2A2F42',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <h3
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '18px',
            fontWeight: 600,
            color: '#F1F3F9',
          }}
        >
          Recent Activity
        </h3>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px',
            color: '#6B7489',
          }}
        >
          (last 50 entries)
        </span>
      </div>

      {entries.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <FileText size={40} color="#6B7489" />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7489', fontWeight: 500 }}>
            No activity yet
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7489', textAlign: 'center' }}>
            Pipeline actions will appear here as they occur.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: '#1C1F2E', borderBottom: '1px solid #2A2F42' }}>
                <th role="columnheader" style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7489' }}>Timestamp</th>
                <th role="columnheader" style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7489' }}>Action</th>
                <th role="columnheader" style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7489' }}>Issue</th>
                <th role="columnheader" style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7489' }}>Operator</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const color = ACTION_COLORS[entry.action_name] || { bg: 'rgba(107,116,137,0.15)', text: '#6B7489' };
                return (
                  <tr
                    key={entry.id}
                    style={{
                      borderBottom: i < entries.length - 1 ? '1px solid #2A2F42' : 'none',
                      transition: 'background 100ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td
                      style={{
                        padding: '14px 16px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '13px',
                        color: '#6B7489',
                      }}
                      title={entry.created_at}
                    >
                      {formatTimestamp(entry.created_at)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          background: color.bg,
                          color: color.text,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {entry.action_name.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#B4BCCE' }}>
                      {entry.issue_number ? (
                        <a
                          href={`https://github.com/${GITHUB_REPO}/issues/${entry.issue_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                        >
                          #{entry.issue_number}
                          <ExternalLink size={12} />
                        </a>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#B4BCCE' }}>
                      {truncateEmail(entry.operator_email)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
