'use client';

import { useEffect, useState } from 'react';
import { LogOut, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { SessionCard } from './SessionCard';
import { RevokeConfirmDialog } from './RevokeConfirmDialog';
import { type SessionInfo } from '@/lib/session-utils';

export function SessionList() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    fetch('/api/auth/sessions')
      .then(r => r.json() as Promise<{ sessions?: SessionInfo[]; error?: string }>)
      .then(data => {
        if (data.sessions) setSessions(data.sessions);
        else setError(data.error ?? 'Failed to load sessions');
      })
      .catch(() => setError('Failed to load sessions'))
      .finally(() => setLoading(false));
  }, []);

  function handleRevoked(id: string) {
    setSessions(prev => prev.filter(s => s.id !== id));
  }

  async function handleRevokeAll() {
    setRevoking(true);
    try {
      const res = await fetch('/api/auth/sessions', { method: 'DELETE' });
      const data = await res.json() as { sessions_revoked?: number; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to revoke sessions');
        return;
      }
      setSessions(prev => prev.filter(s => s.is_current));
      setShowConfirm(false);
      toast.success(`Revoked ${data.sessions_revoked ?? 'all other'} sessions`);
    } catch {
      toast.error('Failed to revoke sessions');
    } finally {
      setRevoking(false);
    }
  }

  const hasOtherSessions = sessions.some(s => !s.is_current);

  return (
    <>
      <div
        style={{
          background: '#18181B', border: '1px solid #3F3F46',
          borderRadius: '12px', padding: '24px',
        }}
      >
        {/* Header row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '8px',
        }}>
          <h3 style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0,
          }}>
            Active Sessions
          </h3>
          {hasOtherSessions && (
            <button
              data-testid="revoke-all-sessions-btn"
              onClick={() => setShowConfirm(true)}
              disabled={revoking}
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
              Revoke all other sessions
            </button>
          )}
        </div>

        <p style={{ fontSize: '12px', color: '#71717A', margin: '0 0 16px 0' }}>
          Devices where you&apos;re currently signed in
        </p>

        {loading && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '14px' }}>
            Loading sessions…
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '16px', color: '#EF4444', fontSize: '14px' }}>{error}</div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div style={{
            padding: '32px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '8px',
          }}>
            <Shield size={32} color="#71717A" />
            <span style={{ fontSize: '14px', color: '#71717A' }}>No active sessions found</span>
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <ul
            data-testid="active-sessions"
            style={{
              listStyle: 'none', margin: 0, padding: 0,
              display: 'flex', flexDirection: 'column', gap: '0',
            }}
          >
            {sessions.map((session, i) => (
              <div
                key={session.id}
                style={{
                  borderBottom: i < sessions.length - 1 ? '1px solid #3F3F46' : 'none',
                }}
              >
                <SessionCard session={session} onRevoked={handleRevoked} />
              </div>
            ))}
          </ul>
        )}

        {!loading && !error && !hasOtherSessions && sessions.length > 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            padding: '16px 0 0',
          }}>
            <span style={{ fontSize: '12px', color: '#71717A', textAlign: 'center' }}>
              {"You're only signed in on this device"}
            </span>
          </div>
        )}
      </div>

      {showConfirm && (
        <RevokeConfirmDialog
          onConfirm={handleRevokeAll}
          onCancel={() => setShowConfirm(false)}
          loading={revoking}
        />
      )}
    </>
  );
}
