'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Globe, Slack } from 'lucide-react';
import { PIPELINE_EVENTS, EVENT_CATEGORIES } from '@/lib/webhook-events';
import IntegrationPresets, { type PresetConfig, PRESETS } from './IntegrationPresets';
import type { FormatType } from '@/lib/webhook-dispatcher';

// Custom Discord SVG icon (Lucide has no Discord icon)
function DiscordIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

const FORMAT_OPTIONS: { value: FormatType; label: string; hint: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { value: 'standard', label: 'Standard', hint: 'Generic JSON payload', Icon: Globe },
  { value: 'slack', label: 'Slack', hint: 'Block Kit format for Incoming Webhooks', Icon: Slack },
  { value: 'discord', label: 'Discord', hint: 'Embed format for Discord webhooks', Icon: DiscordIcon },
];

interface WebhookFormProps {
  mode: 'create' | 'edit';
  webhookId?: string;
  initialUrl?: string;
  initialEvents?: string[];
  initialEnabled?: boolean;
  initialFormatType?: FormatType;
  defaultPreset?: 'discord' | 'slack';
}

export default function WebhookForm({
  mode,
  webhookId,
  initialUrl = '',
  initialEvents = [],
  initialEnabled = true,
  initialFormatType = 'standard',
  defaultPreset,
}: WebhookFormProps) {
  const router = useRouter();

  const presetConfig = defaultPreset ? PRESETS.find((p) => p.type === defaultPreset) : undefined;
  const [url, setUrl] = useState(presetConfig?.urlPlaceholder ?? initialUrl);
  const [secret, setSecret] = useState('');
  const [formatType, setFormatType] = useState<FormatType>(initialFormatType);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(
    new Set(presetConfig?.defaultEvents ?? initialEvents)
  );
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>(defaultPreset);
  const [urlError, setUrlError] = useState('');
  const [eventsError, setEventsError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function handlePreset(preset: PresetConfig) {
    setUrl(preset.urlPlaceholder);
    setSelectedEvents(new Set(preset.defaultEvents));
    setSelectedPreset(preset.type);
    setUrlError('');
    setEventsError('');
  }

  function toggleEvent(event: string) {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(event)) next.delete(event);
      else next.add(event);
      return next;
    });
    setEventsError('');
  }

  function validate(): boolean {
    let valid = true;
    setUrlError('');
    setEventsError('');
    setSubmitError('');

    if (!url.trim()) {
      setUrlError('URL is required');
      valid = false;
    } else {
      try {
        const parsed = new URL(url.trim());
        if (parsed.protocol !== 'https:') {
          setUrlError('URL must use HTTPS');
          valid = false;
        }
      } catch {
        setUrlError('Enter a valid URL');
        valid = false;
      }
    }

    if (selectedEvents.size === 0) {
      setEventsError('Select at least one event');
      valid = false;
    }

    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        url: url.trim(),
        events: Array.from(selectedEvents),
        format_type: formatType,
      };
      if (secret.trim()) payload.secret = secret.trim();
      if (mode === 'edit') payload.enabled = initialEnabled;

      const endpoint =
        mode === 'create'
          ? '/api/settings/webhooks'
          : `/api/settings/webhooks/${webhookId}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.error ?? 'Something went wrong');
        return;
      }

      router.push('/dashboard/settings/webhooks');
      router.refresh();
    } catch {
      setSubmitError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Integration Presets */}
      {mode === 'create' && (
        <div className="mb-8">
          <div
            className="mb-4"
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B7380',
            }}
          >
            Start with a preset
          </div>
          <IntegrationPresets onSelect={handlePreset} compact selectedPreset={selectedPreset} />
          <div className="flex items-center gap-4 my-6">
            <div style={{ flex: 1, height: '1px', background: '#2E353D' }} />
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#6B7380', padding: '0 4px' }}>
              or configure manually
            </span>
            <div style={{ flex: 1, height: '1px', background: '#2E353D' }} />
          </div>
        </div>
      )}

      {/* URL Field */}
      <div className="mb-5">
        <label
          htmlFor="webhook-url"
          style={{
            display: 'block',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            fontWeight: 500,
            color: '#B8BFC7',
            marginBottom: '6px',
          }}
        >
          Endpoint URL
        </label>
        <input
          id="webhook-url"
          name="url"
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setUrlError(''); }}
          placeholder="https://hooks.example.com/webhook"
          style={{
            width: '100%',
            height: '44px',
            background: '#1E2329',
            border: `1px solid ${urlError ? '#EF4444' : '#2E353D'}`,
            borderRadius: '8px',
            padding: '0 12px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#F0F2F4',
            outline: 'none',
            boxShadow: urlError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
          }}
          onFocus={(e) => {
            if (!urlError) {
              e.currentTarget.style.borderColor = '#E85D04';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232, 93, 4, 0.2)';
            }
          }}
          onBlur={(e) => {
            if (!urlError) {
              e.currentTarget.style.borderColor = '#2E353D';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        />
        {urlError ? (
          <div
            data-testid="url-error"
            className="flex items-center gap-1 mt-1.5"
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#EF4444' }}
          >
            <AlertCircle size={14} />
            {urlError}
          </div>
        ) : (
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#6B7380', marginTop: '6px' }}>
            Must be HTTPS
          </div>
        )}
      </div>

      {/* Payload Format Selector */}
      <div className="mb-6" style={{ marginTop: '24px' }}>
        <fieldset data-testid="format-selector" style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#B8BFC7',
              marginBottom: '12px',
              display: 'block',
            }}
          >
            Payload Format
          </legend>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            {FORMAT_OPTIONS.map(({ value, label, hint, Icon }) => {
              const selected = formatType === value;
              return (
                <label
                  key={value}
                  data-testid={`format-option-${value}`}
                  data-selected={selected}
                  style={{
                    flex: '1 1 140px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    background: selected ? 'rgba(99, 102, 241, 0.08)' : '#161A1F',
                    border: `1px solid ${selected ? '#6366F1' : '#2E353D'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'border-color 150ms ease, background 150ms ease',
                    minWidth: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      e.currentTarget.style.borderColor = '#3A424D';
                      e.currentTarget.style.background = '#1E2329';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      e.currentTarget.style.borderColor = '#2E353D';
                      e.currentTarget.style.background = '#161A1F';
                    }
                  }}
                >
                  <input
                    type="radio"
                    name="format_type"
                    value={value}
                    checked={selected}
                    onChange={() => setFormatType(value)}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                  />
                  <Icon size={18} />
                  <div>
                    <div
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#FAFAFB',
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '12px',
                        color: '#6B7380',
                        marginTop: '2px',
                      }}
                    >
                      {hint}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* Secret Field */}
      <div className="mb-6" style={{ marginTop: '24px' }}>
        <label
          htmlFor="webhook-secret"
          className="flex items-center gap-2"
          style={{
            display: 'flex',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            fontWeight: 500,
            color: '#B8BFC7',
            marginBottom: '6px',
          }}
        >
          Signing Secret
          <span
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              padding: '2px 6px',
              borderRadius: '4px',
              background: '#1E2329',
              color: '#6B7380',
              border: '1px solid #2E353D',
            }}
          >
            optional
          </span>
        </label>
        <input
          id="webhook-secret"
          name="secret"
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder={mode === 'edit' ? 'Enter new secret to replace existing' : 'Enter a secret for HMAC signing'}
          style={{
            width: '100%',
            height: '44px',
            background: '#1E2329',
            border: '1px solid #2E353D',
            borderRadius: '8px',
            padding: '0 12px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#F0F2F4',
            outline: 'none',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#E85D04';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232, 93, 4, 0.2)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#2E353D';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#6B7380', marginTop: '6px' }}>
          Used to sign payloads via <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>X-Factory-Signature</code>. Keep this secure.
        </div>
      </div>

      {/* Events Section */}
      <div className="mb-8">
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 600, color: '#F0F2F4', marginBottom: '4px' }}>
          Subscribe to Events
        </div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#6B7380', marginBottom: '16px' }}>
          Select which events trigger this webhook
        </div>
        {eventsError && (
          <div
            id="events-error"
            data-testid="events-error"
            role="alert"
            aria-live="polite"
            className="flex items-center gap-1 mb-3"
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#EF4444' }}
          >
            <AlertCircle size={14} />
            {eventsError}
          </div>
        )}

        {EVENT_CATEGORIES.map((category) => {
          const catEvents = PIPELINE_EVENTS.filter((e) => e.category === category);
          return (
            <div key={category} className="mb-4">
              <div
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase' as const,
                  color: '#6B7380',
                  marginBottom: '8px',
                }}
              >
                {category}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {catEvents.map((ev) => {
                  const checked = selectedEvents.has(ev.value);
                  return (
                    <label
                      key={ev.value}
                      className="flex items-center gap-2.5 cursor-pointer rounded-lg transition-colors"
                      style={{ padding: '8px 12px', minHeight: '44px', background: 'transparent' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#1E2329'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <input
                        type="checkbox"
                        data-testid={`event-${ev.value}`}
                        value={ev.value}
                        checked={checked}
                        onChange={() => toggleEvent(ev.value)}
                        className="sr-only"
                      />
                      <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: `2px solid ${checked ? '#E85D04' : '#2E353D'}`,
                          background: checked ? '#E85D04' : 'transparent',
                          transition: 'all 150ms ease',
                        }}
                      >
                        {checked && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#F0F2F4' }}>
                        {ev.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Error */}
      {submitError && (
        <div
          className="flex items-center gap-2 mb-4 p-3 rounded-lg"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#EF4444',
          }}
        >
          <AlertCircle size={16} />
          {submitError}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            background: 'transparent',
            border: '1px solid #2E353D',
            borderRadius: '8px',
            padding: '12px 20px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#F0F2F4',
            cursor: 'pointer',
            minHeight: '44px',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1E2329'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? '#C44D03' : '#E85D04',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            color: '#FFFFFF',
            cursor: loading ? 'not-allowed' : 'pointer',
            minHeight: '44px',
            opacity: loading ? 0.7 : 1,
            transition: 'all 150ms cubic-bezier(0.25, 1, 0.5, 1)',
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#C44D03'; }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#E85D04'; }}
        >
          {loading ? 'Saving…' : mode === 'create' ? 'Create Webhook' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
