'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function ChangePasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const nextError = next.length > 0 && next.length < 8 ? 'At least 8 characters required' : '';
  const confirmError = confirm.length > 0 && confirm !== next ? 'Passwords do not match' : '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nextError || confirmError) return;
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Password change failed');
        return;
      }
      setSuccess(true);
      setCurrent(''); setNext(''); setConfirm('');
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  function PasswordInput({
    name,
    value,
    onChange,
    show,
    onToggle,
    placeholder,
    hasError,
  }: {
    name: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggle: () => void;
    placeholder?: string;
    hasError?: boolean;
  }) {
    return (
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required
          style={{
            height: '40px', width: '100%', boxSizing: 'border-box',
            border: `1px solid ${hasError ? '#DC2626' : '#E2E8F0'}`,
            borderRadius: '6px', padding: '0 40px 0 12px',
            fontSize: '14px', color: '#334155', outline: 'none',
            background: hasError ? '#FEF2F2' : '#FFFFFF',
          }}
          onFocus={e => { if (!hasError) { e.currentTarget.style.border = '1px solid #2563EB'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)'; }}}
          onBlur={e => { if (!hasError) { e.currentTarget.style.border = '1px solid #E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', padding: 0,
          }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '24px',
      maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px',
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', margin: 0 }}>Change Password</h3>

      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '6px' }}>
          Current password
        </label>
        <PasswordInput name="current_password" value={current} onChange={setCurrent} show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />
      </div>

      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '6px' }}>
          New password
        </label>
        <PasswordInput name="new_password" value={next} onChange={setNext} show={showNext} onToggle={() => setShowNext(v => !v)} hasError={!!nextError} />
        {nextError
          ? <p style={{ fontSize: '12px', color: '#DC2626', fontWeight: 500, marginTop: '6px' }}>{nextError}</p>
          : <p style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>At least 8 characters.</p>
        }
      </div>

      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '6px' }}>
          Confirm new password
        </label>
        <PasswordInput name="confirm_password" value={confirm} onChange={setConfirm} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} hasError={!!confirmError} />
        {confirmError && <p style={{ fontSize: '12px', color: '#DC2626', fontWeight: 500, marginTop: '6px' }}>{confirmError}</p>}
      </div>

      {error && (
        <p data-testid="error-message" style={{ fontSize: '12px', color: '#DC2626', fontWeight: 500 }}>{error}</p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          data-testid="change-password-btn"
          disabled={loading || !!nextError || !!confirmError}
          style={{
            padding: '10px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600,
            background: loading || nextError || confirmError ? '#93C5FD' : success ? '#059669' : '#2563EB',
            color: '#FFFFFF', border: 'none', cursor: loading || nextError || confirmError ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </div>

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
          Password updated
        </div>
      )}
    </form>
  );
}
