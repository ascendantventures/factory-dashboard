'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { RoleBadge } from '@/app/dashboard/admin/users/_components/RoleBadge';

interface Props {
  displayName: string;
  email: string;
  role: string;
}

export function ProfileForm({ displayName: initialName, email, role }: Props) {
  const [displayName, setDisplayName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const nameError = displayName.length > 0 && (displayName.length < 2 || displayName.length > 50)
    ? 'Display name must be 2–50 characters' : '';

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (nameError) return;
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Update failed'); return; }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSave} style={{
      background: '#18181B', border: '1px solid #3F3F46', borderRadius: '8px', padding: '24px',
      maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px',
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>Profile Information</h3>

      {/* Display name */}
      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>
          Display name
        </label>
        <input
          type="text"
          name="display_name"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          minLength={2}
          maxLength={50}
          required
          style={{
            height: '40px', width: '100%', boxSizing: 'border-box',
            border: `1px solid ${nameError ? '#EF4444' : '#3F3F46'}`,
            borderRadius: '6px', padding: '0 12px', fontSize: '14px', color: '#FAFAFA', outline: 'none',
            background: nameError ? 'rgba(239, 68, 68, 0.1)' : '#18181B',
          }}
          onFocus={e => { if (!nameError) { e.currentTarget.style.border = '1px solid #6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)'; }}}
          onBlur={e => { if (!nameError) { e.currentTarget.style.border = '1px solid #3F3F46'; e.currentTarget.style.boxShadow = 'none'; }}}
        />
        {nameError && <p style={{ fontSize: '12px', color: '#EF4444', fontWeight: 500, marginTop: '6px' }}>{nameError}</p>}
      </div>

      {/* Email — read-only */}
      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>
          Email
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type="email"
            value={email}
            readOnly
            disabled
            style={{
              height: '40px', width: '100%', boxSizing: 'border-box',
              border: '1px solid #3F3F46', borderRadius: '6px',
              padding: '0 40px 0 12px', fontSize: '14px', color: '#71717A',
              background: '#27272A', cursor: 'not-allowed',
            }}
          />
          <Lock size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717A' }} />
        </div>
      </div>

      {/* Role — read-only */}
      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>
          Role
        </label>
        <RoleBadge role={role} />
      </div>

      {error && <p style={{ fontSize: '12px', color: '#EF4444', fontWeight: 500 }}>{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          data-testid="save-profile-btn"
          disabled={loading || !!nameError}
          style={{
            padding: '10px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600,
            background: loading || nameError ? '#4F46E5' : success ? '#10B981' : '#6366F1',
            color: '#FFFFFF', border: 'none', cursor: loading || nameError ? 'not-allowed' : 'pointer',
          }}
        >
          {success ? 'Saved!' : loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Success toast */}
      {success && (
        <div
          data-testid="toast-success"
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
            background: '#0F172A', color: '#FFFFFF', padding: '14px 16px',
            borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px',
            minWidth: '280px', boxShadow: '0 10px 15px -3px rgba(15,23,42,0.25)',
            fontSize: '14px', fontWeight: 500,
          }}
        >
          <span style={{ color: '#10B981', fontSize: '18px' }}>✓</span>
          Profile updated
        </div>
      )}
    </form>
  );
}
