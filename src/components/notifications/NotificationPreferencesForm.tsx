'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import {
  NOTIFICATION_TYPES, NOTIFICATION_TYPE_LABELS, NOTIFICATION_TYPE_DESCRIPTIONS,
  NotificationType, FdNotificationPreferences,
} from '@/lib/notification-types';
import { savedIndicatorVariants } from '@/lib/motion';

function ToggleSwitch({
  checked,
  onChange,
  label,
  testId,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  testId?: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      data-testid={testId}
      onClick={() => onChange(!checked)}
      className="flex-shrink-0 relative focus:outline-none"
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: checked ? '#0D9488' : '#E7E5E4',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 150ms cubic-bezier(0.25, 1, 0.5, 1)',
        padding: 0,
        minWidth: '44px',
      }}
    >
      <span
        style={{
          display: 'block',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          transition: 'left 150ms cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      />
    </button>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  isLast?: boolean;
  testId?: string;
  typeTestId?: string;
}

function ToggleRow({ label, description, checked, onChange, isLast, testId, typeTestId }: ToggleRowProps) {
  return (
    <div
      data-testid={typeTestId ?? 'notif-type-toggle'}
      className="flex items-center justify-between"
      style={{
        padding: '16px 0',
        borderBottom: isLast ? 'none' : '1px solid #F0EFED',
        minHeight: '64px',
      }}
    >
      <div className="flex flex-col" style={{ gap: '2px' }}>
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#1C1917' }}>
          {label}
        </span>
        <span style={{ fontSize: '13px', color: '#A8A29E' }}>
          {description}
        </span>
      </div>
      <ToggleSwitch
        checked={checked}
        onChange={onChange}
        label={label}
        testId={testId}
      />
    </div>
  );
}

export function NotificationPreferencesForm() {
  const { preferences, loading, saved, updatePreferences } = useNotificationPreferences();

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: '60px', marginBottom: '8px', borderRadius: '8px',
              background: 'linear-gradient(90deg, #F5F5F4 0%, #FAFAF9 50%, #F5F5F4 100%)',
              backgroundSize: '200% 100%',
              animation: 'skeleton-pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    );
  }

  if (!preferences) return null;

  const handleTypeToggle = (type: NotificationType, value: boolean) => {
    updatePreferences({ [type]: value });
  };

  return (
    <div>
      {/* Notification Types Section */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E7E5E4',
          borderRadius: '12px',
          marginBottom: '24px',
        }}
      >
        {/* Section header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #F0EFED',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1C1917' }}>
            Notification Types
          </h3>
          <AnimatePresence>
            {saved && (
              <motion.span
                variants={savedIndicatorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="inline-flex items-center gap-1.5"
                style={{ color: '#16A34A', fontSize: '13px', fontWeight: 500 }}
              >
                <Check style={{ width: '14px', height: '14px' }} />
                Saved
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle rows */}
        <div style={{ padding: '8px 24px 24px' }}>
          {NOTIFICATION_TYPES.map((type, idx) => (
            <ToggleRow
              key={type}
              label={NOTIFICATION_TYPE_LABELS[type]}
              description={NOTIFICATION_TYPE_DESCRIPTIONS[type]}
              checked={preferences[type as keyof FdNotificationPreferences] as boolean}
              onChange={(val) => handleTypeToggle(type, val)}
              isLast={idx === NOTIFICATION_TYPES.length - 1}
              testId={`notif-toggle-${type}`}
              typeTestId="notif-type-toggle"
            />
          ))}
        </div>
      </div>

      {/* Quiet Hours Section */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E7E5E4',
          borderRadius: '12px',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0EFED' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1C1917' }}>
            Quiet Hours
          </h3>
        </div>

        <div style={{ padding: '8px 24px 24px' }}>
          <ToggleRow
            label="Enable quiet hours"
            description="Pause notifications during specified hours"
            checked={preferences.quiet_hours_enabled}
            onChange={(val) => updatePreferences({ quiet_hours_enabled: val })}
            isLast={!preferences.quiet_hours_enabled}
          />

          {preferences.quiet_hours_enabled && (
            <div style={{ marginTop: '16px' }}>
              <div className="flex gap-4 flex-wrap">
                <div>
                  <label
                    htmlFor="quiet-start"
                    style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#A8A29E', marginBottom: '6px' }}
                  >
                    Start time
                  </label>
                  <input
                    id="quiet-start"
                    type="time"
                    value={preferences.quiet_hours_start}
                    onChange={(e) => updatePreferences({ quiet_hours_start: e.target.value })}
                    style={{
                      height: '44px',
                      width: '120px',
                      background: '#FFFFFF',
                      border: '1px solid #E7E5E4',
                      borderRadius: '8px',
                      padding: '0 12px',
                      fontSize: '15px',
                      fontWeight: 500,
                      color: '#1C1917',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#0D9488';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13, 148, 136, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E7E5E4';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="quiet-end"
                    style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#A8A29E', marginBottom: '6px' }}
                  >
                    End time
                  </label>
                  <input
                    id="quiet-end"
                    type="time"
                    value={preferences.quiet_hours_end}
                    onChange={(e) => updatePreferences({ quiet_hours_end: e.target.value })}
                    style={{
                      height: '44px',
                      width: '120px',
                      background: '#FFFFFF',
                      border: '1px solid #E7E5E4',
                      borderRadius: '8px',
                      padding: '0 12px',
                      fontSize: '15px',
                      fontWeight: 500,
                      color: '#1C1917',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#0D9488';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13, 148, 136, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E7E5E4';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
