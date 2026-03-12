export type NotificationType =
  | 'spec_ready'
  | 'build_complete'
  | 'qa_passed'
  | 'qa_failed'
  | 'deploy_complete'
  | 'agent_stalled'
  | 'pipeline_error';

export const NOTIFICATION_TYPES: NotificationType[] = [
  'spec_ready',
  'build_complete',
  'qa_passed',
  'qa_failed',
  'deploy_complete',
  'agent_stalled',
  'pipeline_error',
];

export interface FdNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  read: boolean;
  created_at: string;
}

export interface FdNotificationPreferences {
  id: string;
  user_id: string;
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
  updated_at: string;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  spec_ready: 'Spec ready',
  build_complete: 'Build complete',
  qa_passed: 'QA passed',
  qa_failed: 'QA failed',
  deploy_complete: 'Deploy complete',
  agent_stalled: 'Agent stalled',
  pipeline_error: 'Pipeline error',
};

export const NOTIFICATION_TYPE_DESCRIPTIONS: Record<NotificationType, string> = {
  spec_ready: 'Get notified when a spec is completed and ready for review',
  build_complete: 'Get notified when a build finishes (success or failure)',
  qa_passed: 'Get notified when QA passes and the issue is advancing',
  qa_failed: 'Get notified when QA fails and a bugfix is needed',
  deploy_complete: 'Get notified when a deployment goes live',
  agent_stalled: 'Get notified when an agent has been running for over 30 minutes',
  pipeline_error: 'Get notified when the pipeline crashes or encounters an error',
};

// Color mapping per notification type
export const NOTIFICATION_TYPE_COLORS: Record<
  NotificationType,
  { icon: string; bg: string }
> = {
  spec_ready: { icon: '#2563EB', bg: '#DBEAFE' },
  build_complete: { icon: '#2563EB', bg: '#DBEAFE' },
  qa_passed: { icon: '#16A34A', bg: '#DCFCE7' },
  qa_failed: { icon: '#DC2626', bg: '#FEE2E2' },
  deploy_complete: { icon: '#16A34A', bg: '#DCFCE7' },
  agent_stalled: { icon: '#CA8A04', bg: '#FEF9C3' },
  pipeline_error: { icon: '#DC2626', bg: '#FEE2E2' },
};

/** Check if current time falls within quiet hours */
export function isInQuietHours(
  quietHoursEnabled: boolean,
  quietHoursStart: string,
  quietHoursEnd: string
): boolean {
  if (!quietHoursEnabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = quietHoursStart.split(':').map(Number);
  const [endH, endM] = quietHoursEnd.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Handle overnight quiet hours (e.g. 22:00 – 08:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}
