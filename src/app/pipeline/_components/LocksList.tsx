'use client';

import { LockEntry } from './types';
import { Unlock, ExternalLink } from 'lucide-react';

const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || 'ascendantventures/harness-beta-test';

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

interface Props {
  locks: LockEntry[];
}

export default function LocksList({ locks }: Props) {
  return (
    <div
      data-testid="locks-list"
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
          Active Locks
        </h3>
        {locks.length > 0 && (
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
            {locks.length}
          </span>
        )}
      </div>

      {locks.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Unlock size={40} color="#6B7489" />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B7489', fontWeight: 500 }}>
            No active locks
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7489', textAlign: 'center' }}>
            All agents are either idle or have released their locks.
          </p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#1C1F2E', borderBottom: '1px solid #2A2F42' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7489' }}>Issue</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7489' }}>Station</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7489' }}>Locked At</th>
            </tr>
          </thead>
          <tbody>
            {locks.map((lock, i) => (
              <tr
                key={`${lock.issue}-${i}`}
                style={{
                  borderBottom: i < locks.length - 1 ? '1px solid #2A2F42' : 'none',
                  transition: 'background 100ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '14px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500, color: '#F1F3F9' }}>
                  <a
                    href={`https://github.com/${GITHUB_REPO}/issues/${lock.issue}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                  >
                    #{lock.issue}
                    <ExternalLink size={12} />
                  </a>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    style={{
                      background: 'rgba(59,130,246,0.15)',
                      color: '#3B82F6',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {lock.station}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#B4BCCE' }}>
                  {formatTime(lock.locked_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
