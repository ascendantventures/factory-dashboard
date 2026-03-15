import { toZonedTime } from 'date-fns-tz';

export const VALID_NOTIFICATION_TYPES = [
  'spec_ready',
  'build_complete',
  'qa_passed',
  'qa_failed',
  'deploy_complete',
  'agent_stalled',
  'pipeline_error',
] as const;

export type NotificationType = typeof VALID_NOTIFICATION_TYPES[number];

export interface NotificationPreferences {
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

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  spec_ready: true,
  build_complete: true,
  qa_passed: true,
  qa_failed: true,
  deploy_complete: true,
  agent_stalled: false,
  pipeline_error: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  email_enabled: false,
  discord_enabled: false,
  discord_webhook_url: null,
  user_timezone: 'UTC',
};

/**
 * Returns true if the current time falls within quiet hours,
 * evaluated in the user's timezone (not UTC).
 */
export function isInQuietHours(prefs: NotificationPreferences): boolean {
  if (!prefs.quiet_hours_enabled) return false;
  const tz = prefs.user_timezone || 'UTC';
  const nowInTz = toZonedTime(new Date(), tz);
  const [startH, startM] = prefs.quiet_hours_start.split(':').map(Number);
  const [endH, endM] = prefs.quiet_hours_end.split(':').map(Number);
  const nowMins = nowInTz.getHours() * 60 + nowInTz.getMinutes();
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;
  if (startMins < endMins) {
    return nowMins >= startMins && nowMins < endMins;
  }
  // crosses midnight
  return nowMins >= startMins || nowMins < endMins;
}

/**
 * Returns true if the given notification type is enabled in preferences.
 */
export function isTypeEnabled(
  prefs: NotificationPreferences,
  type: NotificationType
): boolean {
  return prefs[type] === true;
}
