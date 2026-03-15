/**
 * notification-delivery.ts
 * Email (Resend) and Discord webhook delivery helpers for the notification center.
 * All functions are non-fatal — callers catch errors and log them.
 */

import { Resend } from 'resend';

export interface NotificationPayload {
  type: string;
  title: string;
  body: string;
  link: string;
}

export interface NotificationPreferences {
  email_enabled: boolean;
  discord_enabled: boolean;
  discord_webhook_url: string | null;
  user_timezone: string;
  spec_ready: boolean;
  build_complete: boolean;
  qa_passed: boolean;
  qa_failed: boolean;
  deploy_complete: boolean;
  agent_stalled: boolean;
  pipeline_error: boolean;
}

/**
 * Returns true if the notification type is enabled in user preferences.
 */
export function isTypeEnabled(prefs: NotificationPreferences, type: string): boolean {
  const typeKey = type as keyof NotificationPreferences;
  if (typeKey in prefs && typeof prefs[typeKey] === 'boolean') {
    return prefs[typeKey] as boolean;
  }
  return true; // default to enabled for unknown types
}

/**
 * Send an email notification via Resend.
 * Throws on failure — caller must handle non-fatally.
 */
export async function sendEmailNotification(
  userEmail: string,
  notification: NotificationPayload,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Skip silently — RESEND_API_KEY not configured
    return;
  }

  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'notifications@factory.local';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: userEmail,
    subject: notification.title,
    text: `${notification.body}\n\n${appUrl}${notification.link}`,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

/**
 * Send a Discord webhook notification.
 * Validates the webhook URL starts with the official Discord domain.
 * Throws on failure — caller must handle non-fatally.
 */
export async function sendDiscordNotification(
  webhookUrl: string,
  notification: NotificationPayload,
): Promise<void> {
  if (!isValidDiscordWebhookUrl(webhookUrl)) {
    throw new Error('Invalid Discord webhook URL');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const content = `**${notification.title}**\n${notification.body}\n${appUrl}${notification.link}`;

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.status.toString());
    throw new Error(`Discord webhook returned ${res.status}: ${text}`);
  }
}

/**
 * Validates a Discord webhook URL.
 * Must start with https://discord.com/api/webhooks/
 */
export function isValidDiscordWebhookUrl(url: string): boolean {
  return typeof url === 'string' && url.startsWith('https://discord.com/api/webhooks/');
}
