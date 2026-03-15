import type { NotificationPreferences } from './notification-types';

interface NotificationPayload {
  type: string;
  title: string;
  body: string;
  link: string;
}

/**
 * Sends an email notification via Resend.
 * Throws on error — caller handles non-fatally.
 */
export async function sendEmailNotification(
  userEmail: string,
  notification: NotificationPayload
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  if (!apiKey) {
    // No key configured — skip silently
    return;
  }

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);

  const fullLink = `${appUrl}${notification.link}`;
  const text = `${notification.body}\n\n${fullLink}`;

  const { error } = await resend.emails.send({
    from: fromEmail ?? 'notifications@example.com',
    to: userEmail,
    subject: notification.title,
    text,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

/**
 * Sends a Discord webhook notification.
 * Throws on error — caller handles non-fatally.
 */
export async function sendDiscordNotification(
  webhookUrl: string,
  notification: NotificationPayload
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const fullLink = `${appUrl}${notification.link}`;

  const payload = {
    content: `**${notification.title}**\n${notification.body}\n${fullLink}`,
  };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Discord webhook error ${res.status}: ${text}`);
  }
}

/**
 * Validates a Discord webhook URL.
 */
export function isValidDiscordWebhookUrl(url: string): boolean {
  return url.startsWith('https://discord.com/api/webhooks/');
}

/**
 * Attempts delivery for all enabled channels.
 * Errors are caught and logged — never fatal to the caller.
 */
export async function deliverNotification(
  prefs: NotificationPreferences,
  userEmail: string,
  notification: NotificationPayload
): Promise<void> {
  const isTypeEnabled = prefs[notification.type as keyof NotificationPreferences] === true;
  if (!isTypeEnabled) return;

  if (prefs.email_enabled) {
    try {
      await sendEmailNotification(userEmail, notification);
    } catch (err) {
      console.error('[notification-delivery] Email delivery failed:', err);
    }
  }

  if (
    prefs.discord_enabled &&
    prefs.discord_webhook_url &&
    isValidDiscordWebhookUrl(prefs.discord_webhook_url)
  ) {
    try {
      await sendDiscordNotification(prefs.discord_webhook_url, notification);
    } catch (err) {
      console.error('[notification-delivery] Discord delivery failed:', err);
    }
  }
}
