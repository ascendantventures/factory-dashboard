'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mail, Send, Check, X, Loader2,
  AlertCircle, Info, ChevronDown,
} from 'lucide-react';
import type { NotificationPreferences } from '@/lib/notification-types';
import { DEFAULT_PREFERENCES } from '@/lib/notification-types';

// ─── IANA Timezones ───────────────────────────────────────────────────────────

const POPULAR_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

function getAllTimezones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return POPULAR_TIMEZONES;
  }
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  height: '44px',
  padding: '0 12px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  background: 'var(--surface)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  lineHeight: '1.5',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 150ms ease-out, box-shadow 150ms ease-out',
};

const monoInputStyle: React.CSSProperties = {
  ...inputStyle,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '13px',
};

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  disabled,
  testId,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  testId: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-testid={testId}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: 'relative',
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: checked ? 'var(--primary)' : 'var(--surface-alt)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 150ms ease-out',
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          width: '20px',
          height: '20px',
          borderRadius: '10px',
          background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </button>
  );
}

// ─── Saved Indicator ─────────────────────────────────────────────────────────

function SavedIndicator({ visible }: { visible: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease-out',
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--success, #22C55E)',
        whiteSpace: 'nowrap',
      }}
    >
      <Check size={14} />
      Saved
    </span>
  );
}

// ─── Test Result Indicator ────────────────────────────────────────────────────

type TestState = 'idle' | 'loading' | 'success' | 'error';

function TestResult({
  state,
  errorMessage,
}: {
  state: TestState;
  errorMessage?: string;
}) {
  if (state === 'idle') return null;
  if (state === 'loading') {
    return (
      <span
        data-testid="test-result"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--text-muted)',
          background: 'var(--surface-alt)',
        }}
      >
        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
        Sending...
      </span>
    );
  }
  if (state === 'success') {
    return (
      <span
        data-testid="test-result"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--success, #22C55E)',
          background: 'rgba(34,197,94,0.12)',
        }}
      >
        <Check size={16} />
        Sent!
      </span>
    );
  }
  return (
    <span
      data-testid="test-result"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--error, #EF4444)',
        background: 'rgba(239,68,68,0.12)',
      }}
    >
      <X size={16} />
      {errorMessage ?? 'Failed'}
    </span>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h2
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: '0 0 4px',
          lineHeight: '1.4',
        }}
      >
        {title}
      </h2>
      {description && (
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            margin: 0,
            lineHeight: '1.5',
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

// ─── Form Row ─────────────────────────────────────────────────────────────────

function FormRow({
  label,
  helper,
  right,
  noBorder,
  children,
}: {
  label: string;
  helper?: string;
  right?: React.ReactNode;
  noBorder?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: '16px 0',
        borderBottom: noBorder ? 'none' : '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: '1.4' }}>
            {label}
          </span>
          {helper && (
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {helper}
            </span>
          )}
        </div>
        {right && (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            {right}
          </div>
        )}
      </div>
      {children && <div style={{ marginTop: '12px' }}>{children}</div>}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '32px',
      }}
    >
      {children}
    </div>
  );
}

// ─── Notification Type Meta ───────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; helper: string }> = {
  spec_ready: { label: 'Spec ready', helper: 'When a spec is approved and ready for design' },
  build_complete: { label: 'Build complete', helper: 'When a build agent finishes' },
  qa_passed: { label: 'QA passed', helper: 'When quality assurance passes successfully' },
  qa_failed: { label: 'QA failed', helper: 'When quality assurance finds issues' },
  deploy_complete: { label: 'Deploy complete', helper: 'When a deployment finishes' },
  agent_stalled: { label: 'Agent stalled', helper: 'When an agent stops responding' },
  pipeline_error: { label: 'Pipeline error', helper: 'When a critical pipeline error occurs' },
};

const NOTIFICATION_TYPES = Object.keys(TYPE_META);

// ─── Main Component ───────────────────────────────────────────────────────────

export function NotificationPreferencesForm() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [savedVisible, setSavedVisible] = useState<Record<string, boolean>>({});
  const [webhookInput, setWebhookInput] = useState('');
  const [webhookError, setWebhookError] = useState('');
  const [emailTestState, setEmailTestState] = useState<TestState>('idle');
  const [emailTestError, setEmailTestError] = useState('');
  const [discordTestState, setDiscordTestState] = useState<TestState>('idle');
  const [discordTestError, setDiscordTestError] = useState('');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allTimezones = getAllTimezones();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/notifications/preferences');
        if (!res.ok) return;
        const data: NotificationPreferences = await res.json();
        setPrefs(data);
        setWebhookInput(data.discord_webhook_url ?? '');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const showSaved = useCallback((key: string) => {
    setSavedVisible((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setSavedVisible((prev) => ({ ...prev, [key]: false }));
    }, 2500);
  }, []);

  const savePrefs = useCallback(
    async (patch: Partial<NotificationPreferences>, savedKey: string) => {
      try {
        const res = await fetch('/api/notifications/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (res.ok) {
          const updated = await res.json();
          setPrefs(updated);
          showSaved(savedKey);
        }
      } catch {
        // silent
      }
    },
    [showSaved]
  );

  function handleTypeToggle(type: string, value: boolean) {
    const patch = { [type]: value } as Partial<NotificationPreferences>;
    setPrefs((prev) => ({ ...prev, ...patch }));
    savePrefs(patch, `type_${type}`);
  }

  function handleQuietHoursToggle(value: boolean) {
    setPrefs((prev) => ({ ...prev, quiet_hours_enabled: value }));
    savePrefs({ quiet_hours_enabled: value }, 'quiet_hours');
  }

  function handleQuietHoursTime(field: 'quiet_hours_start' | 'quiet_hours_end', value: string) {
    setPrefs((prev) => ({ ...prev, [field]: value }));
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      savePrefs({ [field]: value }, 'quiet_hours');
    }, 500);
  }

  function handleEmailToggle(value: boolean) {
    setPrefs((prev) => ({ ...prev, email_enabled: value }));
    savePrefs({ email_enabled: value }, 'email');
  }

  function handleWebhookBlur() {
    const url = webhookInput.trim();
    if (!url) {
      setWebhookError('');
      if (prefs.discord_webhook_url) {
        const patch: Partial<NotificationPreferences> = { discord_webhook_url: null, discord_enabled: false };
        setPrefs((prev) => ({ ...prev, ...patch }));
        savePrefs(patch, 'discord');
      }
      return;
    }
    if (!url.startsWith('https://discord.com/api/webhooks/')) {
      setWebhookError('Webhook URL must start with https://discord.com/api/webhooks/');
      return;
    }
    setWebhookError('');
    const patch: Partial<NotificationPreferences> = { discord_webhook_url: url };
    setPrefs((prev) => ({ ...prev, ...patch }));
    savePrefs(patch, 'discord');
  }

  function handleDiscordToggle(value: boolean) {
    setPrefs((prev) => ({ ...prev, discord_enabled: value }));
    savePrefs({ discord_enabled: value }, 'discord');
  }

  function handleTimezoneChange(tz: string) {
    setPrefs((prev) => ({ ...prev, user_timezone: tz }));
    savePrefs({ user_timezone: tz }, 'timezone');
  }

  async function handleTestEmail() {
    setEmailTestState('loading');
    setEmailTestError('');
    try {
      const res = await fetch('/api/notifications/test-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'email' }),
      });
      const data = await res.json();
      if (data.ok) {
        setEmailTestState('success');
        setTimeout(() => setEmailTestState('idle'), 4000);
      } else {
        setEmailTestState('error');
        setEmailTestError(data.error ?? 'Failed');
        setTimeout(() => setEmailTestState('idle'), 5000);
      }
    } catch {
      setEmailTestState('error');
      setEmailTestError('Network error');
      setTimeout(() => setEmailTestState('idle'), 5000);
    }
  }

  async function handleTestDiscord() {
    const url = prefs.discord_webhook_url;
    if (!url) return;
    setDiscordTestState('loading');
    setDiscordTestError('');
    try {
      const res = await fetch('/api/notifications/test-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'discord', discord_webhook_url: url }),
      });
      const data = await res.json();
      if (data.ok) {
        setDiscordTestState('success');
        setTimeout(() => setDiscordTestState('idle'), 4000);
      } else {
        setDiscordTestState('error');
        setDiscordTestError(data.error ?? 'Failed');
        setTimeout(() => setDiscordTestState('idle'), 5000);
      }
    } catch {
      setDiscordTestState('error');
      setDiscordTestError('Network error');
      setTimeout(() => setDiscordTestState('idle'), 5000);
    }
  }

  const webhookIsValid =
    !!prefs.discord_webhook_url &&
    prefs.discord_webhook_url.startsWith('https://discord.com/api/webhooks/');

  if (loading) {
    return (
      <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
        <Loader2 size={24} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px' }}>

      {/* ── Notification Types ─────────────────────────────────────────── */}
      <SectionCard>
        <SectionHeader
          title="Notification Types"
          description="Choose which pipeline events trigger in-app notifications."
        />
        {NOTIFICATION_TYPES.map((type, idx) => {
          const meta = TYPE_META[type];
          const isLast = idx === NOTIFICATION_TYPES.length - 1;
          return (
            <FormRow
              key={type}
              label={meta.label}
              helper={meta.helper}
              noBorder={isLast}
              right={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <SavedIndicator visible={!!savedVisible[`type_${type}`]} />
                  <ToggleSwitch
                    testId={`notif-toggle-${type}`}
                    checked={prefs[type as keyof NotificationPreferences] as boolean}
                    onChange={(v) => handleTypeToggle(type, v)}
                  />
                </div>
              }
            />
          );
        })}
      </SectionCard>

      {/* ── Quiet Hours ───────────────────────────────────────────────── */}
      <SectionCard>
        <SectionHeader
          title="Quiet Hours"
          description="Suppress notifications during a time window each day."
        />
        <FormRow
          label="Enable quiet hours"
          helper="No notifications will be delivered during this window"
          noBorder={!prefs.quiet_hours_enabled}
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <SavedIndicator visible={!!savedVisible.quiet_hours} />
              <ToggleSwitch
                testId="quiet-hours-toggle"
                checked={prefs.quiet_hours_enabled}
                onChange={handleQuietHoursToggle}
              />
            </div>
          }
        />
        {prefs.quiet_hours_enabled && (
          <FormRow label="Time window" noBorder>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>From</label>
                <input
                  type="time"
                  value={prefs.quiet_hours_start}
                  onChange={(e) => handleQuietHoursTime('quiet_hours_start', e.target.value)}
                  style={{ ...inputStyle, width: '120px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>To</label>
                <input
                  type="time"
                  value={prefs.quiet_hours_end}
                  onChange={(e) => handleQuietHoursTime('quiet_hours_end', e.target.value)}
                  style={{ ...inputStyle, width: '120px' }}
                />
              </div>
            </div>
          </FormRow>
        )}
      </SectionCard>

      {/* ── Delivery Channels ─────────────────────────────────────────── */}
      <SectionCard>
        <SectionHeader
          title="Delivery Channels"
          description="Send notifications beyond the in-app bell to email or Discord."
        />

        {/* Email */}
        <FormRow
          label="Email notifications"
          helper="Receive notifications at your registered email"
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <SavedIndicator visible={!!savedVisible.email} />
              <ToggleSwitch
                testId="email-enabled-toggle"
                checked={prefs.email_enabled}
                onChange={handleEmailToggle}
              />
            </div>
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              data-testid="test-email-btn"
              onClick={handleTestEmail}
              disabled={emailTestState === 'loading'}
              style={{
                height: '44px',
                padding: '0 16px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: emailTestState === 'loading' ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 150ms ease-out',
                opacity: emailTestState === 'loading' ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (emailTestState !== 'loading') {
                  (e.currentTarget as HTMLElement).style.background = 'var(--surface-alt)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
              }}
            >
              {emailTestState === 'loading'
                ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                : <Mail size={16} />}
              Send test email
            </button>
            <TestResult state={emailTestState} errorMessage={emailTestError} />
          </div>
        </FormRow>

        <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />

        {/* Discord */}
        <FormRow
          label="Discord webhook"
          helper="Post notifications to a Discord channel"
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <SavedIndicator visible={!!savedVisible.discord} />
              <ToggleSwitch
                testId="discord-enabled-toggle"
                checked={prefs.discord_enabled}
                onChange={handleDiscordToggle}
                disabled={!webhookIsValid}
              />
            </div>
          }
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Webhook URL
            </label>
            <input
              type="text"
              data-testid="discord-webhook-input"
              value={webhookInput}
              placeholder="https://discord.com/api/webhooks/..."
              onChange={(e) => setWebhookInput(e.target.value)}
              onBlur={handleWebhookBlur}
              style={{
                ...monoInputStyle,
                borderColor: webhookError ? 'var(--error, #EF4444)' : undefined,
                boxShadow: webhookError ? '0 0 0 3px rgba(239,68,68,0.15)' : undefined,
              }}
            />
            {webhookError && (
              <p style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                color: 'var(--error, #EF4444)',
                margin: '6px 0 0',
              }}>
                <AlertCircle size={14} />
                {webhookError}
              </p>
            )}
            {!webhookError && !webhookIsValid && (
              <p style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                margin: '6px 0 0',
              }}>
                <Info size={14} />
                Enter a valid webhook URL to enable Discord notifications
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                data-testid="test-discord-btn"
                onClick={handleTestDiscord}
                disabled={!webhookIsValid || discordTestState === 'loading'}
                style={{
                  height: '44px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: !webhookIsValid || discordTestState === 'loading' ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 150ms ease-out',
                  opacity: !webhookIsValid || discordTestState === 'loading' ? 0.4 : 1,
                }}
                onMouseEnter={(e) => {
                  if (webhookIsValid && discordTestState !== 'loading') {
                    (e.currentTarget as HTMLElement).style.background = 'var(--surface-alt)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                }}
              >
                {discordTestState === 'loading'
                  ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Send size={16} />}
                Send test message
              </button>
              <TestResult state={discordTestState} errorMessage={discordTestError} />
            </div>
          </div>
        </FormRow>

        <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />

        {/* Timezone */}
        <FormRow
          label="Timezone"
          helper="Used for quiet hours calculation"
          noBorder
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, maxWidth: '280px', position: 'relative' }}>
              <select
                data-testid="timezone-select"
                value={prefs.user_timezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                style={{
                  ...inputStyle,
                  paddingRight: '36px',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                }}
              >
                {POPULAR_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
                <option disabled>──────────────</option>
                {allTimezones
                  .filter((tz) => !POPULAR_TIMEZONES.includes(tz))
                  .map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
              </select>
              <ChevronDown
                size={16}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
            </div>
            <SavedIndicator visible={!!savedVisible.timezone} />
          </div>
        </FormRow>
      </SectionCard>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
