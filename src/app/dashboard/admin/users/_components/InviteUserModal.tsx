'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteUserModal({ onClose, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [role, setRole] = useState<'viewer' | 'operator' | 'admin'>('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function validateEmail(value: string) {
    if (!value) return '';
    return EMAIL_REGEX.test(value) ? '' : 'Email address is invalid.';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailValidationError = validateEmail(email);
    if (emailValidationError) { setEmailError(emailValidationError); return; }
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
        const rawError: string = data.error ?? 'Invite failed';
        setError(
          rawError.toLowerCase().includes('rate limit')
            ? 'Too many invites sent. Please wait a moment before trying again.'
            : rawError
        );
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
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(15,23,42,0.1), 0 8px 10px -6px rgba(15,23,42,0.05)',
          maxWidth: '420px',
          width: '100%',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', margin: 0 }}>Invite User</h2>
          <button
            onClick={onClose}
            style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Email address
              </label>
              <input
                type="text"
                name="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(validateEmail(e.target.value)); }}
                onBlur={e => setEmailError(validateEmail(e.target.value))}
                placeholder="Enter email"
                required
                style={{
                  height: '40px', width: '100%', boxSizing: 'border-box',
                  border: `1px solid ${emailError ? '#DC2626' : '#E2E8F0'}`, borderRadius: '6px',
                  padding: '0 12px', fontSize: '14px', color: '#334155',
                  outline: 'none',
                }}
                onFocus={e => { if (!emailError) { e.currentTarget.style.border = '1px solid #2563EB'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)'; } }}
              />
              {emailError && <p style={{ fontSize: '12px', color: '#DC2626', fontWeight: 500, marginTop: '6px' }}>{emailError}</p>}
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Role
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  name="role"
                  value={role}
                  onChange={e => setRole(e.target.value as typeof role)}
                  style={{
                    height: '40px', width: '100%', boxSizing: 'border-box',
                    border: '1px solid #E2E8F0', borderRadius: '6px',
                    padding: '0 36px 0 12px', fontSize: '14px', color: '#334155',
                    appearance: 'none', background: '#FFFFFF', cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="viewer">Viewer</option>
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
                Choose the permissions level for this user.
              </p>
            </div>

            {error && (
              <p style={{ fontSize: '12px', color: '#DC2626', fontWeight: 500 }}>{error}</p>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500,
                border: '1px solid #E2E8F0', background: 'transparent', color: '#334155', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="send-invite-btn"
              disabled={loading}
              style={{
                padding: '10px 20px', borderRadius: '6px', fontSize: '14px', fontWeight: 600,
                background: loading ? '#93C5FD' : '#2563EB', color: '#FFFFFF', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                minWidth: '120px',
                pointerEvents: loading ? 'none' : 'auto',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Sending...
                </>
              ) : (
                'Send Invite'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
