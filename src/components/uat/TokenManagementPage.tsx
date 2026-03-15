'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Key, ShieldOff, Info, X, AlertTriangle, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

interface ApiToken {
  id: string;
  description: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface CreatedToken extends ApiToken {
  raw_token: string;
}

export function TokenManagementPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createdToken, setCreatedToken] = useState<CreatedToken | null>(null);
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchTokens = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/uat/tokens');
      if (res.ok) {
        const data = await res.json();
        setTokens(data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  const handleCreate = async () => {
    if (!description.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/uat/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedToken(data);
        setDescription('');
        fetchTokens();
      } else {
        const err = await res.json();
        toast.error(err.error ?? 'Failed to create token');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    const res = await fetch(`/api/uat/tokens/${id}`, { method: 'PATCH' });
    if (res.ok) {
      toast.success('Token revoked');
      setTokens(prev => prev.map(t => t.id === id ? { ...t, is_active: false } : t));
    } else {
      toast.error('Failed to revoke token');
    }
  };

  const handleCopy = async () => {
    if (!createdToken?.raw_token) return;
    await navigator.clipboard.writeText(createdToken.raw_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeDialog = () => {
    setShowCreateDialog(false);
    setCreatedToken(null);
    setDescription('');
    setCopied(false);
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#FAFAFA', margin: 0, fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>
            API Tokens
          </h1>
          <p style={{ fontSize: '14px', color: '#A1A1AA', marginTop: '4px', marginBottom: 0 }}>
            Manage API tokens for pipeline agent authentication
          </p>
        </div>
        <button
          data-testid="create-token-btn"
          onClick={() => setShowCreateDialog(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            height: '36px', padding: '0 16px', background: '#6366F1', color: '#FFFFFF',
            fontSize: '14px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = '#4F46E5'; }}
          onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = '#6366F1'; }}
        >
          <Plus size={16} />
          Create Token
        </button>
      </div>

      {/* Info Banner */}
      {showInfoBanner && tokens.length < 3 && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '12px', padding: '16px', marginBottom: '24px',
        }}>
          <Info size={20} color="#6366F1" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ flex: 1, fontSize: '14px', color: '#A1A1AA', margin: 0 }}>
            API tokens allow pipeline agents to authenticate via Authorization header. Tokens are shown once at creation — store them securely.
          </p>
          <button
            onClick={() => setShowInfoBanner(false)}
            style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Token Table */}
      <div style={{ background: '#18181B', border: '1px solid #3F3F46', borderRadius: '12px', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#71717A', fontSize: '14px' }}>Loading...</div>
        ) : tokens.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <Key size={48} color="#3F3F46" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', fontFamily: "'DM Sans', sans-serif", margin: '0 0 8px' }}>No API tokens yet</p>
            <p style={{ fontSize: '14px', color: '#A1A1AA', margin: '0 0 24px' }}>Create a token to allow pipeline agents to access attachment data.</p>
            <button
              onClick={() => setShowCreateDialog(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '36px', padding: '0 16px', background: '#6366F1', color: '#FFFFFF', fontSize: '14px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
            >
              <Plus size={16} />
              Create your first token
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                {['Description', 'Status', 'Last Used', 'Created', 'Actions'].map(col => (
                  <th key={col} style={{
                    height: '44px', padding: '0 16px', background: '#27272A', color: '#A1A1AA',
                    fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                    textAlign: 'left', borderBottom: '1px solid #3F3F46',
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr key={token.id} style={{ borderBottom: '1px solid #27272A' }}>
                  <td style={{ height: '52px', padding: '0 16px', color: '#FAFAFA', fontWeight: 500 }}>
                    {token.description}
                  </td>
                  <td style={{ height: '52px', padding: '0 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                      background: token.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(113, 113, 122, 0.1)',
                      color: token.is_active ? '#22C55E' : '#71717A',
                    }}>
                      {token.is_active && <span style={{ width: '6px', height: '6px', background: '#22C55E', borderRadius: '50%' }} />}
                      {token.is_active ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td style={{ height: '52px', padding: '0 16px', color: '#A1A1AA' }}>
                    {token.last_used_at
                      ? formatDistanceToNow(new Date(token.last_used_at), { addSuffix: true })
                      : 'Never'}
                  </td>
                  <td style={{ height: '52px', padding: '0 16px', color: '#71717A' }}>
                    {format(new Date(token.created_at), 'MMM d, yyyy')}
                  </td>
                  <td style={{ height: '52px', padding: '0 16px' }}>
                    {token.is_active ? (
                      <button
                        data-testid="revoke-token-btn"
                        onClick={() => handleRevoke(token.id)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          height: '32px', padding: '0 12px', background: 'transparent',
                          color: '#EF4444', fontSize: '13px', fontWeight: 500,
                          borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)', cursor: 'pointer',
                        }}
                      >
                        <ShieldOff size={14} />
                        Revoke
                      </button>
                    ) : (
                      <span style={{ color: '#3F3F46' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Token Dialog */}
      {showCreateDialog && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50,
        }}>
          <div style={{
            background: '#18181B', border: '1px solid #3F3F46', borderRadius: '16px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)', maxWidth: '480px', width: '100%', padding: '24px',
            animation: 'dialogEnter 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            {/* Dialog Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                  {createdToken ? 'Token Created' : 'Create API Token'}
                </h2>
                <p style={{ fontSize: '14px', color: '#A1A1AA', marginTop: '4px', marginBottom: 0 }}>
                  {createdToken ? 'Copy this token now — you won\'t see it again' : 'Generate a new token for pipeline agents'}
                </p>
              </div>
              <button
                data-testid="close-token-dialog"
                onClick={closeDialog}
                style={{ background: 'none', border: 'none', color: '#A1A1AA', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            {!createdToken ? (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#A1A1AA', marginBottom: '6px' }}>
                    Description
                  </label>
                  <input
                    name="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder='E.g., "Build agent production"'
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    style={{
                      height: '40px', width: '100%', padding: '0 12px',
                      background: '#18181B', color: '#FAFAFA', fontSize: '14px',
                      border: '1px solid #3F3F46', borderRadius: '8px', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#71717A', marginTop: '4px' }}>
                    A label to identify this token&apos;s purpose
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button onClick={closeDialog} style={{ height: '36px', padding: '0 16px', background: 'transparent', color: '#FAFAFA', fontSize: '14px', fontWeight: 500, borderRadius: '8px', border: '1px solid #3F3F46', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button
                    data-testid="generate-token-btn"
                    onClick={handleCreate}
                    disabled={isCreating || !description.trim()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '36px', padding: '0 16px', background: '#6366F1', color: '#FFFFFF', fontSize: '14px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer', opacity: (isCreating || !description.trim()) ? 0.5 : 1 }}
                  >
                    {isCreating ? 'Generating...' : 'Generate Token'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Token reveal */}
                <div style={{ background: '#09090B', border: '1px solid #3F3F46', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '12px', fontWeight: 500, color: '#A1A1AA' }}>
                    <AlertTriangle size={14} color="#F59E0B" />
                    Your API Token
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#22C55E',
                    background: '#18181B', border: '1px solid #27272A', borderRadius: '6px', padding: '12px',
                    animation: 'tokenReveal 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}>
                    <span data-testid="token-value" style={{ wordBreak: 'break-all' }}>{createdToken.raw_token}</span>
                    <button
                      onClick={handleCopy}
                      style={{ flexShrink: 0, padding: '6px', background: 'transparent', border: 'none', color: copied ? '#22C55E' : '#71717A', cursor: 'pointer', borderRadius: '4px' }}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: '#A1A1AA', marginBottom: '24px' }}>
                  Store this token in a secure location. It will only be shown once.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={closeDialog}
                    style={{ height: '36px', padding: '0 16px', background: '#6366F1', color: '#FFFFFF', fontSize: '14px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes dialogEnter {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes tokenReveal {
          from { opacity: 0; transform: translateY(8px); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>
    </div>
  );
}
