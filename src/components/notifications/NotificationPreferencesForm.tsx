'use client';

/**
 * NotificationPreferencesForm
 * Phase 2 — Delivery Channels, Timezone, and Quiet Hours UI
 *
 * Per DESIGN.md: dark-mode-first, zinc surfaces, indigo accent, Lucide icons only.
 * data-testid attributes match spec for E2E testing.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell, Mail, MessageCircle, Globe, Check, X, Loader2,
  AlertCircle, Info, Send,
} from 'lucide-react';

// ── IANA timezone list (abbreviated for bundle size; covers all major zones) ──
const IANA_TIMEZONES = [
  'UTC',
  'Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', 'Africa/Algiers',
  'Africa/Cairo', 'Africa/Casablanca', 'Africa/Johannesburg', 'Africa/Lagos',
  'Africa/Nairobi', 'Africa/Tripoli', 'Africa/Tunis',
  'America/Anchorage', 'America/Argentina/Buenos_Aires', 'America/Bogota',
  'America/Caracas', 'America/Chicago', 'America/Denver', 'America/Detroit',
  'America/Halifax', 'America/Lima', 'America/Los_Angeles', 'America/Mexico_City',
  'America/New_York', 'America/Phoenix', 'America/Santiago', 'America/Sao_Paulo',
  'America/St_Johns', 'America/Toronto', 'America/Vancouver',
  'Asia/Almaty', 'Asia/Bangkok', 'Asia/Colombo', 'Asia/Dhaka', 'Asia/Dubai',
  'Asia/Hong_Kong', 'Asia/Jakarta', 'Asia/Jerusalem', 'Asia/Kabul', 'Asia/Karachi',
  'Asia/Kathmandu', 'Asia/Kolkata', 'Asia/Kuala_Lumpur', 'Asia/Kuwait',
  'Asia/Manila', 'Asia/Muscat', 'Asia/Riyadh', 'Asia/Seoul', 'Asia/Shanghai',
  'Asia/Singapore', 'Asia/Taipei', 'Asia/Tehran', 'Asia/Tokyo', 'Asia/Ulaanbaatar',
  'Asia/Yangon', 'Asia/Yekaterinburg',
  'Atlantic/Azores', 'Atlantic/Reykjavik',
  'Australia/Adelaide', 'Australia/Brisbane', 'Australia/Darwin',
  'Australia/Melbourne', 'Australia/Perth', 'Australia/Sydney',
  'Europe/Amsterdam', 'Europe/Athens', 'Europe/Berlin', 'Europe/Brussels',
  'Europe/Bucharest', 'Europe/Budapest', 'Europe/Copenhagen', 'Europe/Dublin',
  'Europe/Helsinki', 'Europe/Istanbul', 'Europe/Kiev', 'Europe/Lisbon',
  'Europe/London', 'Europe/Luxembourg', 'Europe/Madrid', 'Europe/Minsk',
  'Europe/Moscow', 'Europe/Oslo', 'Europe/Paris', 'Europe/Prague', 'Europe/Rome',
  'Europe/Sofia', 'Europe/Stockholm', 'Europe/Vienna', 'Europe/Warsaw',
  'Europe/Zurich',
  'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Honolulu', 'Pacific/Noumea',
  'Pacific/Port_Moresby', 'Pacific/Tahiti',
];

interface Prefs {
  spec_ready: boolean;
  build_complete: boolean;
  qa_passed: boolean;
  qa_failed: boolean;
  deploy_complete: boolean;
  agent_stalled: boolean;
  pipeline_error: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  email_enabled: boolean;
  discord_enabled: boolean;
  discord_webhook_url: string | null;
  user_timezone: string;
}

const TYPE_LABELS: Record<string, string> = {
  spec_ready: 'Spec ready',
  build_complete: 'Build complete',
  qa_passed: 'QA passed',
  qa_failed: 'QA failed',
  deploy_complete: 'Deploy complete',
  agent_stalled: 'Agent stalled',
  pipeline_error: 'Pipeline error',
};

type TestResult = 'success' | 'error' | null;

interface NotificationPreferencesFormProps {
  initialPrefs: Prefs;
}

// ── Shared Toggle ────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  testId?: string;
  label?: string;
}

function Toggle({ checked, onChange, disabled = false, testId, label }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      data-testid={testId}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: 'relative',
        width: '36px',
        height: '20px',
        borderRadius: '9999px',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 0,
        flexShrink: 0,
        background: checked
          ? (disabled ? '#4338CA' : '#6366F1')
          : (disabled ? '#3F3F46' : '#27272A'),
        transition: 'background-color 150ms ease-out',
        outline: 'none',
        opacity: disabled ? 0.5 : 1,
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.4)';
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '18px' : '2px',
          width: '16px',
          height: '16px',
          borderRadius: '9999px',
          background: '#FAFAFA',
          transition: 'left 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </button>
  );
}

// ── Saved indicator ─────────────────────────────────────────────────────────

function SavedIndicator({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.span
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#22C55E',
          }}
        >
          <Check style={{ width: '12px', height: '12px' }} />
          Saved
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// ── Test delivery button result ─────────────────────────────────────────────

function TestResultIndicator({ result, error }: { result: TestResult; error?: string }) {
  return (
    <AnimatePresence>
      {result && (
        <motion.span
          key={result}
          variants={{
            hidden: { opacity: 0, x: -8 },
            visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] } },
            exit: { opacity: 0, transition: { duration: 0.2, delay: 2.5 } },
          }}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: 500,
            color: result === 'success' ? '#22C55E' : '#EF4444',
          }}
        >
          {result === 'success' ? (
            <>
              <Check style={{ width: '12px', height: '12px' }} />
              Sent
            </>
          ) : (
            <>
              <X style={{ width: '12px', height: '12px' }} />
              {error ?? 'Failed'}
            </>
          )}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// ── Section header ─────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#71717A',
        marginBottom: '8px',
      }}
    >
      {children}
    </div>
  );
}

// ── Row ────────────────────────────────────────────────────────────────────

function Row({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        minHeight: '44px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function NotificationPreferencesForm({ initialPrefs }: NotificationPreferencesFormProps) {
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [emailTestResult, setEmailTestResult] = useState<TestResult>(null);
  const [emailTestError, setEmailTestError] = useState<string | undefined>();
  const [discordTestResult, setDiscordTestResult] = useState<TestResult>(null);
  const [discordTestError, setDiscordTestError] = useState<string | undefined>();
  const [emailTesting, setEmailTesting] = useState(false);
  const [discordTesting, setDiscordTesting] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showSaved(key: string) {
    setSavedKey(key);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSavedKey(null), 2500);
  }

  const patch = useCallback(async (fields: Partial<Prefs>, savedKeyName?: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error('Failed to save');
      setPrefs(prev => ({ ...prev, ...fields }));
      if (savedKeyName) showSaved(savedKeyName);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  function handleTypeToggle(type: keyof Prefs) {
    const newVal = !prefs[type];
    setPrefs(prev => ({ ...prev, [type]: newVal }));
    patch({ [type]: newVal }, type);
  }

  function handleQuietHoursToggle(val: boolean) {
    setPrefs(prev => ({ ...prev, quiet_hours_enabled: val }));
    patch({ quiet_hours_enabled: val }, 'quiet_hours');
  }

  function handleTimeChange(field: 'quiet_hours_start' | 'quiet_hours_end', val: string) {
    setPrefs(prev => ({ ...prev, [field]: val }));
  }

  function handleTimeBlur(field: 'quiet_hours_start' | 'quiet_hours_end') {
    patch({ [field]: prefs[field] }, 'quiet_hours');
  }

  function handleEmailToggle(val: boolean) {
    setPrefs(prev => ({ ...prev, email_enabled: val }));
    patch({ email_enabled: val }, 'email');
  }

  function handleDiscordToggle(val: boolean) {
    if (!isValidDiscordUrl(prefs.discord_webhook_url)) return;
    setPrefs(prev => ({ ...prev, discord_enabled: val }));
    patch({ discord_enabled: val }, 'discord');
  }

  function handleWebhookChange(val: string) {
    setPrefs(prev => ({ ...prev, discord_webhook_url: val }));
    setWebhookError(null);
    // If URL is cleared, also disable discord
    if (!val && prefs.discord_enabled) {
      setPrefs(prev => ({ ...prev, discord_enabled: false }));
    }
  }

  function handleWebhookBlur() {
    const url = prefs.discord_webhook_url ?? '';
    if (url && !isValidDiscordUrl(url)) {
      setWebhookError('Must start with https://discord.com/api/webhooks/');
    } else {
      setWebhookError(null);
      patch({
        discord_webhook_url: url || null,
        discord_enabled: prefs.discord_enabled && isValidDiscordUrl(url),
      }, 'discord_webhook');
    }
  }

  function handleTimezoneChange(val: string) {
    setPrefs(prev => ({ ...prev, user_timezone: val }));
    patch({ user_timezone: val }, 'timezone');
  }

  async function handleEmailTest() {
    setEmailTesting(true);
    setEmailTestResult(null);
    try {
      const res = await fetch('/api/notifications/test-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'email' }),
      });
      const data = await res.json();
      if (data.ok) {
        setEmailTestResult('success');
      } else {
        setEmailTestResult('error');
        setEmailTestError(data.error ?? 'Delivery failed');
      }
    } catch {
      setEmailTestResult('error');
      setEmailTestError('Network error');
    } finally {
      setEmailTesting(false);
    }
  }

  async function handleDiscordTest() {
    setDiscordTesting(true);
    setDiscordTestResult(null);
    try {
      const res = await fetch('/api/notifications/test-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'discord',
          discord_webhook_url: prefs.discord_webhook_url,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setDiscordTestResult('success');
      } else {
        setDiscordTestResult('error');
        setDiscordTestError(data.error ?? 'Delivery failed');
      }
    } catch {
      setDiscordTestResult('error');
      setDiscordTestError('Network error');
    } finally {
      setDiscordTesting(false);
    }
  }

  const isValidDiscordUrl = (url: string | null) =>
    typeof url === 'string' && url.startsWith('https://discord.com/api/webhooks/');

  const discordToggleEnabled = isValidDiscordUrl(prefs.discord_webhook_url);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    background: '#18181B',
    border: webhookError ? '1px solid #EF4444' : '1px solid #3F3F46',
    borderRadius: '8px',
    color: '#FAFAFA',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 150ms ease-out, box-shadow 150ms ease-out',
    minHeight: '44px',
  };

  const timeInputStyle: React.CSSProperties = {
    padding: '6px 10px',
    background: '#18181B',
    border: '1px solid #3F3F46',
    borderRadius: '6px',
    color: '#FAFAFA',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    colorScheme: 'dark',
    minHeight: '36px',
  };

  const cardStyle: React.CSSProperties = {
    background: '#18181B',
    border: '1px solid #27272A',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '12px',
  };

  const testBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'transparent',
    border: '1px solid #3F3F46',
    borderRadius: '6px',
    color: '#A1A1AA',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    minHeight: '32px',
    transition: 'border-color 150ms, color 150ms',
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      {saving && (
        <span style={{ fontSize: '12px', color: '#71717A', display: 'block', marginBottom: '8px' }}>
          Saving...
        </span>
      )}

      {/* ── Per-type toggles ─────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader>Notification Types</SectionHeader>
        {Object.keys(TYPE_LABELS).map((type) => (
          <Row key={type}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell style={{ width: '14px', height: '14px', color: '#52525B' }} />
              <span style={{ fontSize: '14px', color: '#FAFAFA' }}>
                {TYPE_LABELS[type]}
              </span>
              {savedKey === type && <SavedIndicator visible />}
            </div>
            <Toggle
              checked={prefs[type as keyof Prefs] as boolean}
              onChange={() => handleTypeToggle(type as keyof Prefs)}
              testId={`notif-toggle-${type}`}
              label={`Toggle ${TYPE_LABELS[type]}`}
            />
          </Row>
        ))}
      </div>

      {/* ── Quiet hours ───────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader>Quiet Hours</SectionHeader>
        <Row>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#FAFAFA' }}>Enable quiet hours</span>
            {savedKey === 'quiet_hours' && <SavedIndicator visible />}
          </div>
          <Toggle
            checked={prefs.quiet_hours_enabled}
            onChange={handleQuietHoursToggle}
            testId="quiet-hours-toggle"
            label="Enable quiet hours"
          />
        </Row>
        <AnimatePresence>
          {prefs.quiet_hours_enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <label style={{ fontSize: '13px', color: '#A1A1AA' }}>
                  From
                  <input
                    type="time"
                    value={prefs.quiet_hours_start}
                    onChange={(e) => handleTimeChange('quiet_hours_start', e.target.value)}
                    onBlur={() => handleTimeBlur('quiet_hours_start')}
                    style={{ ...timeInputStyle, marginLeft: '8px' }}
                  />
                </label>
                <label style={{ fontSize: '13px', color: '#A1A1AA' }}>
                  To
                  <input
                    type="time"
                    value={prefs.quiet_hours_end}
                    onChange={(e) => handleTimeChange('quiet_hours_end', e.target.value)}
                    onBlur={() => handleTimeBlur('quiet_hours_end')}
                    style={{ ...timeInputStyle, marginLeft: '8px' }}
                  />
                </label>
              </div>
              <p style={{ fontSize: '12px', color: '#52525B', marginTop: '8px' }}>
                Notifications during these hours will be suppressed.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Delivery Channels ────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader>Delivery Channels</SectionHeader>

        {/* Email */}
        <Row style={{ marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail style={{ width: '16px', height: '16px', color: '#71717A' }} />
            <div>
              <div style={{ fontSize: '14px', color: '#FAFAFA', fontWeight: 500 }}>
                Email notifications
              </div>
              <div style={{ fontSize: '12px', color: '#71717A' }}>
                Sends to your registered email address
              </div>
            </div>
            {savedKey === 'email' && <SavedIndicator visible />}
          </div>
          <Toggle
            checked={prefs.email_enabled}
            onChange={handleEmailToggle}
            testId="email-enabled-toggle"
            label="Enable email notifications"
          />
        </Row>
        <AnimatePresence>
          {prefs.email_enabled && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              style={{
                paddingLeft: '24px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <button
                onClick={handleEmailTest}
                disabled={emailTesting}
                style={{
                  ...testBtnStyle,
                  cursor: emailTesting ? 'not-allowed' : 'pointer',
                  opacity: emailTesting ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!emailTesting) {
                    (e.currentTarget as HTMLElement).style.borderColor = '#6366F1';
                    (e.currentTarget as HTMLElement).style.color = '#6366F1';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#3F3F46';
                  (e.currentTarget as HTMLElement).style.color = '#A1A1AA';
                }}
              >
                {emailTesting ? (
                  <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Mail style={{ width: '14px', height: '14px' }} />
                )}
                Send test email
              </button>
              <TestResultIndicator result={emailTestResult} error={emailTestError} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Discord */}
        <Row style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageCircle style={{ width: '16px', height: '16px', color: '#71717A' }} />
            <div>
              <div style={{ fontSize: '14px', color: '#FAFAFA', fontWeight: 500 }}>
                Discord webhook
              </div>
              <div style={{ fontSize: '12px', color: '#71717A' }}>
                Post notifications to a Discord channel
              </div>
            </div>
            {savedKey === 'discord' && <SavedIndicator visible />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {!discordToggleEnabled && (
              <span title="Enter a valid webhook URL to enable">
                <Info
                  style={{ width: '14px', height: '14px', color: '#52525B' }}
                />
              </span>
            )}
            <Toggle
              checked={prefs.discord_enabled}
              onChange={handleDiscordToggle}
              disabled={!discordToggleEnabled}
              testId="discord-enabled-toggle"
              label="Enable Discord notifications"
            />
          </div>
        </Row>

        <div style={{ marginBottom: '12px' }}>
          <input
            type="url"
            data-testid="discord-webhook-input"
            value={prefs.discord_webhook_url ?? ''}
            onChange={(e) => handleWebhookChange(e.target.value)}
            onBlur={handleWebhookBlur}
            placeholder="https://discord.com/api/webhooks/..."
            style={{
              ...inputStyle,
              border: webhookError ? '1px solid #EF4444' : '1px solid #3F3F46',
            }}
            onFocus={(e) => {
              if (!webhookError) {
                (e.currentTarget as HTMLElement).style.borderColor = '#6366F1';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)';
              }
            }}
            onBlurCapture={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = webhookError ? '#EF4444' : '#3F3F46';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          />
          {webhookError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '4px',
                fontSize: '12px',
                color: '#EF4444',
              }}
            >
              <AlertCircle style={{ width: '12px', height: '12px' }} />
              {webhookError}
            </div>
          )}
          {savedKey === 'discord_webhook' && (
            <div style={{ marginTop: '4px' }}>
              <SavedIndicator visible />
            </div>
          )}
        </div>

        {discordToggleEnabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <button
              onClick={handleDiscordTest}
              disabled={discordTesting}
              style={{
                ...testBtnStyle,
                cursor: discordTesting ? 'not-allowed' : 'pointer',
                opacity: discordTesting ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!discordTesting) {
                  (e.currentTarget as HTMLElement).style.borderColor = '#6366F1';
                  (e.currentTarget as HTMLElement).style.color = '#6366F1';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#3F3F46';
                (e.currentTarget as HTMLElement).style.color = '#A1A1AA';
              }}
            >
              {discordTesting ? (
                <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send style={{ width: '14px', height: '14px' }} />
              )}
              Send test message
            </button>
            <TestResultIndicator result={discordTestResult} error={discordTestError} />
          </div>
        )}
      </div>

      {/* ── Timezone ─────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionHeader>Timezone</SectionHeader>
        <Row>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe style={{ width: '16px', height: '16px', color: '#71717A' }} />
            <div>
              <div style={{ fontSize: '14px', color: '#FAFAFA', fontWeight: 500 }}>
                Your timezone
              </div>
              <div style={{ fontSize: '12px', color: '#71717A' }}>
                Used for quiet hours evaluation
              </div>
            </div>
            {savedKey === 'timezone' && <SavedIndicator visible />}
          </div>
        </Row>
        <div style={{ marginTop: '8px' }}>
          <select
            data-testid="timezone-select"
            value={prefs.user_timezone}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#18181B',
              border: '1px solid #3F3F46',
              borderRadius: '8px',
              color: '#FAFAFA',
              fontSize: '13px',
              fontFamily: 'inherit',
              outline: 'none',
              minHeight: '44px',
              cursor: 'pointer',
              colorScheme: 'dark',
              transition: 'border-color 150ms ease-out',
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#6366F1';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)';
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#3F3F46';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            {IANA_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
