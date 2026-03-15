/**
 * notification-types.ts
 * Shared notification type definitions and quiet hours logic.
 */

import { toZonedTime } from 'date-fns-tz';

export const NOTIFICATION_TYPES = [
  'spec_ready',
  'build_complete',
  'qa_passed',
  'qa_failed',
  'deploy_complete',
  'agent_stalled',
  'pipeline_error',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export function isValidNotificationType(type: string): type is NotificationType {
  return NOTIFICATION_TYPES.includes(type as NotificationType);
}

export interface QuietHoursPrefs {
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // "HH:MM"
  quiet_hours_end: string;   // "HH:MM"
  user_timezone?: string | null;
}

/**
 * Returns true if the current moment falls within the user's configured quiet hours,
 * evaluated in the user's local timezone (not UTC).
 *
 * Supports overnight ranges (e.g. 22:00–08:00 crosses midnight).
 * Falls back to UTC if user_timezone is null/undefined/'UTC'.
 */
export function isInQuietHours(prefs: QuietHoursPrefs): boolean {
  if (!prefs.quiet_hours_enabled) return false;

  const tz = prefs.user_timezone || 'UTC';
  const nowInTz = toZonedTime(new Date(), tz);

  const [startH, startM] = prefs.quiet_hours_start.split(':').map(Number);
  const [endH, endM] = prefs.quiet_hours_end.split(':').map(Number);

  const nowMins = nowInTz.getHours() * 60 + nowInTz.getMinutes();
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;

  if (startMins < endMins) {
    // Same-day range (e.g. 09:00–17:00)
    return nowMins >= startMins && nowMins < endMins;
  }
  // Overnight range (e.g. 22:00–08:00)
  return nowMins >= startMins || nowMins < endMins;
}
