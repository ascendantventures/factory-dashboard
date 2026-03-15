'use client';

import { useState } from 'react';
import { Monitor, Smartphone, Globe, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { type SessionInfo, parseUserAgent, formatSessionDate } from '@/lib/session-utils';

interface SessionCardProps {
  session: SessionInfo;
  onRevoked: (id: string) => void;
}

const IconMap = { Monitor, Smartphone, Globe };

export function SessionCard({ session, onRevoked }: SessionCardProps) {
  const [revoking, setRevoking] = useState(false);
  const { device, icon } = parseUserAgent(session.user_agent);
  const DeviceIcon = IconMap[icon];

  async function handleRevoke() {
    setRevoking(true);
    try {
      const res = await fetch(`/api/auth/sessions/${session.id}`, { method: 'DELETE' });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to revoke session');
        return;
      }
      onRevoked(session.id);
      toast.success('Session revoked');
    } catch {
      toast.error('Failed to revoke session');
    } finally {
      setRevoking(false);
    }
  }

  return (
    <li
      data-testid="session-card"
      data-current={session.is_current ? 'true' : 'false'}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        borderRadius: '8px',
        background: session.is_current ? 'rgba(34,197,94,0.08)' : 'transparent',
        borderLeft: session.is_current ? '3px solid #22C55E' : '3px solid transparent',
        transition: 'background 150ms ease-out',
        gap: '12px',
      }}
      onMouseEnter={e => {
        if (!session.is_current) (e.currentTarget as HTMLLIElement).style.background = 'rgba(99,102,241,0.05)';
      }}
      onMouseLeave={e => {
        if (!session.is_current) (e.currentTarget as HTMLLIElement).style.background = 'transparent';
      }}
    >
      {/* Left: icon + details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        <DeviceIcon size={20} color="#71717A" style={{ flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#FAFAFA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {device || 'Unknown device'}
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px', fontWeight: 400, color: '#71717A',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {[session.ip, formatSessionDate(session.created_at)].filter(Boolean).join(' · ')}
          </span>
        </div>
      </div>

      {/* Right: badge or revoke button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        {session.is_current ? (
          <span
            data-testid="current-badge"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              color: '#22C55E',
              background: 'rgba(34,197,94,0.15)',
              padding: '4px 8px', borderRadius: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            This device
          </span>
        ) : (
          <button
            data-testid="revoke-session-btn"
            onClick={handleRevoke}
            disabled={revoking}
            aria-label="Revoke session"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'transparent', border: 'none',
              color: '#EF4444', cursor: revoking ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontWeight: 500,
              padding: '6px 10px', borderRadius: '6px',
              opacity: revoking ? 0.5 : 1,
              transition: 'background 150ms ease-out',
            }}
            onMouseEnter={e => { if (!revoking) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <LogOut size={14} />
            {revoking ? 'Revoking…' : 'Revoke'}
          </button>
        )}
      </div>
    </li>
  );
}
