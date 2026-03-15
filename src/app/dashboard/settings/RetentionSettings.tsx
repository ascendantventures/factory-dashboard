'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RetentionConfig {
  retention_days: number;
  updated_at: string;
  updated_by_email?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export function RetentionSettings() {
  const [config, setConfig] = useState<RetentionConfig | null>(null);
  const [days, setDays] = useState<number>(90);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/audit/retention')
      .then(r => r.json())
      .then(data => {
        if (data.retention_days) {
          setConfig(data);
          setDays(data.retention_days);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (days < 7) {
      setError('Minimum retention period is 7 days.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/audit/retention', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retention_days: days }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to save retention settings.');
        return;
      }
      setConfig(data);
      setDays(data.retention_days);
      toast.success('Retention settings saved', {
        description: `Entries older than ${data.retention_days} days will be purged.`,
      });
    } catch {
      setError('Failed to save retention settings.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          background: 'var(--surface, #18181B)',
          border: '1px solid var(--border, #3F3F46)',
          borderRadius: '8px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-muted, #71717A)',
          fontSize: '14px',
        }}
      >
        <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
        Loading retention settings…
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--surface, #18181B)',
        border: '1px solid var(--border, #3F3F46)',
        borderRadius: '8px',
        padding: '24px',
      }}
    >
      <h3
        style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--text-primary, #FAFAFA)',
          margin: '0 0 4px',
        }}
      >
        Audit Log Retention
      </h3>
      <p
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '14px',
          color: 'var(--text-secondary, #A1A1AA)',
          margin: '0 0 24px',
        }}
      >
        Configure how long audit entries are retained before auto-purge at midnight UTC daily.
      </p>

      <label
        htmlFor="retention-days"
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--text-secondary, #A1A1AA)',
          marginBottom: '8px',
        }}
      >
        Retention Period
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <input
          id="retention-days"
          type="number"
          min={7}
          value={days}
          onChange={e => {
            setDays(Number(e.target.value));
            setError(null);
          }}
          data-testid="retention-days-input"
          aria-describedby="retention-helper"
          aria-invalid={error ? 'true' : 'false'}
          style={{
            width: '120px',
            height: '40px',
            padding: '0 12px',
            background: 'var(--background, #09090B)',
            border: `1px solid ${error ? 'var(--error, #EF4444)' : 'var(--border, #3F3F46)'}`,
            borderRadius: '6px',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '14px',
            color: 'var(--text-primary, #FAFAFA)',
            outline: 'none',
            boxShadow: error ? '0 0 0 3px rgba(239,68,68,0.15)' : 'none',
          }}
          onFocus={e => {
            if (!error) {
              e.currentTarget.style.borderColor = 'var(--primary, #6366F1)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
            }
          }}
          onBlur={e => {
            if (!error) {
              e.currentTarget.style.borderColor = 'var(--border, #3F3F46)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        />
        <span style={{ fontSize: '14px', color: 'var(--text-muted, #71717A)' }}>days</span>
      </div>

      <p
        id="retention-helper"
        style={{
          fontSize: '12px',
          color: 'var(--text-muted, #71717A)',
          marginTop: '8px',
          lineHeight: 1.5,
        }}
      >
        Minimum: 7 days. Entries older than this will be automatically purged at midnight UTC daily.
      </p>

      {error && (
        <p
          data-testid="retention-error"
          style={{
            fontSize: '12px',
            color: 'var(--error, #EF4444)',
            marginTop: '8px',
          }}
        >
          {error}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginTop: '24px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={handleSave}
          disabled={saving}
          data-testid="retention-save-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'var(--primary, #6366F1)',
            color: '#FFFFFF',
            borderRadius: '6px',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.5 : 1,
            transition: 'background 150ms ease',
          }}
          onMouseEnter={e => {
            if (!saving) (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary-hover, #4F46E5)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary, #6366F1)';
          }}
        >
          {saving && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
          Save Changes
        </button>

        {config && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #71717A)' }}>
            Last updated: {formatDate(config.updated_at)}
            {config.updated_by_email ? ` by ${config.updated_by_email}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}
