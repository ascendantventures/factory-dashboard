'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteUserModal({ onClose, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'operator' | 'admin'>('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Invite failed');
        return;
      }
      onSuccess();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#18181B',
          borderRadius: '12px',
          border: '1px solid #3F3F46',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          maxWidth: '420px',
          width: '100%',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #3F3F46', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>Invite User</h2>
          <button
            onClick={onClose}
            style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A1A1AA' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#27272A'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter email"
                required
                style={{
                  height: '40px', width: '100%', boxSizing: 'border-box',
                  border: '1px solid #3F3F46', borderRadius: '6px',
                  padding: '0 12px', fontSize: '14px', color: '#FAFAFA',
                  background: '#18181B', outline: 'none',
                }}
                onFocus={e => { e.currentTarget.style.border = '1px solid #6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)'; }}
                onBlur={e => { e.currentTarget.style.border = '1px solid #3F3F46'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>
                Role
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  name="role"
                  value={role}
                  onChange={e => setRole(e.target.value as typeof role)}
                  style={{
                    height: '40px', width: '100%', boxSizing: 'border-box',
                    border: '1px solid #3F3F46', borderRadius: '6px',
                    padding: '0 36px 0 12px', fontSize: '14px', color: '#FAFAFA',
                    appearance: 'none', background: '#18181B', cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="viewer">Viewer</option>
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <p style={{ fontSize: '12px', color: '#71717A', marginTop: '6px' }}>
                Choose the permissions level for this user.
              </p>
            </div>

            {error && (
              <p style={{ fontSize: '12px', color: '#DC2626', fontWeight: 500 }}>{error}</p>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid #3F3F46', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500,
                border: '1px solid #3F3F46', background: 'transparent', color: '#A1A1AA', cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#27272A'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="send-invite-btn"
              disabled={loading}
              style={{
                padding: '10px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600,
                background: loading ? '#4F46E5' : '#6366F1', color: '#FFFFFF', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
