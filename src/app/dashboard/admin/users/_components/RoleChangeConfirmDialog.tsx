'use client';

import { X, ArrowRight, Shield, User } from 'lucide-react';

interface Props {
  email: string;
  fromRole: string;
  toRole: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function RoleLabel({ role }: { role: string }) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    admin: {
      bg: 'rgba(168, 85, 247, 0.12)',
      color: '#C4B5FD',
      border: 'rgba(168, 85, 247, 0.25)',
    },
    operator: {
      bg: 'rgba(99, 102, 241, 0.12)',
      color: '#A5B4FC',
      border: 'rgba(99, 102, 241, 0.25)',
    },
    viewer: {
      bg: '#27272A',
      color: '#A1A1AA',
      border: '#3F3F46',
    },
  };
  const s = styles[role] ?? styles.viewer;
  const Icon = role === 'admin' ? Shield : User;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '4px',
        background: s.bg,
        border: `1px solid ${s.border}`,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        fontWeight: 500,
        color: s.color,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
      }}
    >
      <Icon size={10} />
      {role}
    </span>
  );
}

export function RoleChangeConfirmDialog({ email, fromRole, toRole, loading, onConfirm, onCancel }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        data-testid="role-confirm-dialog"
        style={{
          width: '400px',
          background: '#323238',
          border: '1px solid #3F3F46',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
          padding: '24px',
          animation: 'modal-enter 200ms ease-out',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#FAFAFA', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Change Role
          </h2>
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

        {/* Body */}
        <div style={{ marginBottom: '24px', fontSize: '14px', color: '#A1A1AA', lineHeight: 1.6, fontFamily: "'Inter', system-ui, sans-serif" }}>
          Change{' '}
          <strong style={{ color: '#FAFAFA' }}>{email}</strong>
          {' '}from{' '}
          <RoleLabel role={fromRole} />
          <ArrowRight size={14} style={{ color: '#71717A', margin: '0 8px', verticalAlign: 'middle' }} />
          <RoleLabel role={toRole} />
          ?
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            data-testid="confirm-cancel"
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
              cursor: 'pointer',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#27272A'; (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#A1A1AA'; }}
          >
            Cancel
          </button>
          <button
            data-testid="confirm-submit"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: '6px',
              background: loading ? 'rgba(99, 102, 241, 0.5)' : '#6366F1',
              fontSize: '14px',
              fontWeight: 600,
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Inter', system-ui, sans-serif",
              transition: 'background 150ms ease',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#4F46E5'; }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#6366F1'; }}
          >
            {loading ? 'Updating…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
