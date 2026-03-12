'use client';

import { BackoffEntry } from './types';
import { Timer, ExternalLink } from 'lucide-react';

const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || 'ascendantventures/harness-beta-test';

function formatUntil(isoString: string): string {
  const d = new Date(isoString);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (diff <= 0) return 'Expired';
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

interface Props {
  backoffs: BackoffEntry[];
}

export default function BackoffsList({ backoffs }: Props) {
  return (
    <div
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
          justifyContent: 'space-between',
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
          Backoff Timers
        </h3>
        {backoffs.length > 0 && (
          <span
            style={{
              background: 'rgba(245,158,11,0.15)',
              color: '#F59E0B',
              padding: '4px 10px',
              borderRadius: '6px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            {backoffs.length}
          </span>
        )}
      </div>

      {backoffs.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Timer size={40} color="#6B7489" />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7489', fontWeight: 500 }}>
            No backoff timers
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7489', textAlign: 'center' }}>
            No issues are currently in crash backoff.
          </p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#1C1F2E', borderBottom: '1px solid #2A2F42' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7489' }}>Issue</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7489' }}>Until</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7489' }}>Crashes</th>
            </tr>
          </thead>
          <tbody>
            {backoffs.map((backoff, i) => (
              <tr
                key={`${backoff.issue}-${i}`}
                style={{
                  borderBottom: i < backoffs.length - 1 ? '1px solid #2A2F42' : 'none',
                  transition: 'background 100ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '14px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500, color: '#F1F3F9' }}>
                  <a
                    href={`https://github.com/${GITHUB_REPO}/issues/${backoff.issue}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                  >
                    #{backoff.issue}
                    <ExternalLink size={12} />
                  </a>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    style={{
                      background: 'rgba(245,158,11,0.15)',
                      color: '#F59E0B',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {formatUntil(backoff.until)}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: backoff.crash_count >= 3 ? '#EF4444' : '#F59E0B' }}>
                  {backoff.crash_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
