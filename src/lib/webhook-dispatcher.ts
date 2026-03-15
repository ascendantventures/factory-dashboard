import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import type { PipelineEvent } from '@/lib/webhook-events';

export type { PipelineEvent };

export type FormatType = 'standard' | 'slack' | 'discord';

export interface WebhookPayload {
  event: PipelineEvent | 'test';
  timestamp: string;
  issue?: { number: number; title: string; repo: string };
  details?: Record<string, unknown>;
}

// Encrypt / decrypt secret using AES-GCM via Web Crypto (Node 18+)
const ENCRYPTION_KEY_ENV = process.env.WEBHOOK_SECRET_ENCRYPTION_KEY ?? '';

async function getEncryptionKey(): Promise<CryptoKey> {
  const raw = Buffer.from(ENCRYPTION_KEY_ENV.padEnd(32, '0').slice(0, 32), 'utf-8');
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  return Buffer.from(combined).toString('base64');
}

export async function decryptSecret(encrypted: string): Promise<string> {
  const key = await getEncryptionKey();
  const combined = Buffer.from(encrypted, 'base64');
  const iv = combined.subarray(0, 12);
  const ciphertext = combined.subarray(12);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

async function computeHmac(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return 'sha256=' + Buffer.from(sig).toString('hex');
}

/**
 * Build the Discord embed color for an event.
 */
function getDiscordColor(event: string): number {
  if (/^build\./.test(event) && event !== 'build.failed') return 5763719;   // green
  if (['qa.failed', 'build.failed', 'pipeline.error'].includes(event)) return 15548997; // red
  if (['qa.passed', 'deploy.completed'].includes(event)) return 3092790;    // blue
  return 10070709; // grey
}

/**
 * Format the outgoing POST body based on the webhook's format_type.
 * Exported for use by the retry endpoint.
 */
export function formatPayload(payload: WebhookPayload, formatType: FormatType): string {
  const { event, timestamp, issue, details } = payload;

  if (formatType === 'slack') {
    const issueText = issue
      ? `*${event}* — #${issue.number} ${issue.title}\n_${issue.repo}_`
      : `*${event}*`;
    return JSON.stringify({
      blocks: [
        { type: 'section', text: { type: 'mrkdwn', text: issueText } },
        { type: 'context', elements: [{ type: 'mrkdwn', text: timestamp }] },
      ],
    });
  }

  if (formatType === 'discord') {
    return JSON.stringify({
      embeds: [
        {
          title: event,
          description: issue ? `#${issue.number} — ${issue.title}` : undefined,
          color: getDiscordColor(event),
          fields: issue ? [{ name: 'Repo', value: issue.repo, inline: true }] : [],
          timestamp,
        },
      ],
    });
  }

  // standard (default — existing WebhookPayload shape)
  return JSON.stringify({
    event,
    timestamp,
    ...(issue && { issue }),
    ...(details && { details }),
  });
}

/**
 * deliverToUrl — send a payload to a webhook URL and record the result.
 * Used for both initial dispatches and retries.
 */
export async function deliverToUrl(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  wh: { id: string; url: string; secret_hash: string | null; format_type?: string | null },
  payload: WebhookPayload
): Promise<{ status_code: number | null; response_body: string | null; delivery_id: string }> {
  const formatType: FormatType = (wh.format_type as FormatType) ?? 'standard';
  const body = formatPayload(payload, formatType);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Factory-Dashboard/1.0',
  };

  if (wh.secret_hash) {
    try {
      const rawSecret = await decryptSecret(wh.secret_hash);
      headers['X-Factory-Signature'] = await computeHmac(rawSecret, body);
    } catch {
      // If decryption fails, skip signature
    }
  }

  let statusCode: number | null = null;
  let responseBody: string | null = null;

  try {
    const response = await fetch(wh.url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10_000),
    });
    statusCode = response.status;
    responseBody = (await response.text()).slice(0, 1000);
  } catch {
    // timeout or network error — statusCode stays null
  }

  const { data: delivery } = await admin.from('fd_webhook_deliveries').insert({
    webhook_id: wh.id,
    event: payload.event,
    payload,
    status_code: statusCode,
    response_body: responseBody,
    sent_at: new Date().toISOString(),
  }).select('id').single();

  return {
    status_code: statusCode,
    response_body: responseBody,
    delivery_id: delivery?.id ?? '',
  };
}

/**
 * dispatchEvent — fires all enabled webhooks subscribed to `event`.
 * Returns { fired, skipped } counts.
 */
export async function dispatchEvent(
  event: PipelineEvent,
  details?: Record<string, unknown>,
  issueContext?: { number: number; title: string; repo: string }
): Promise<{ fired: number; skipped: number }> {
  const admin = createSupabaseAdminClient();

  const { data: webhooks, error } = await admin
    .from('fd_webhooks')
    .select('id, url, secret_hash, events, enabled, format_type')
    .eq('enabled', true);

  if (error || !webhooks?.length) return { fired: 0, skipped: 0 };

  const subscribed = webhooks.filter((wh) => {
    const events = Array.isArray(wh.events) ? wh.events : [];
    return events.includes(event);
  });

  const skipped = webhooks.length - subscribed.length;
  if (!subscribed.length) return { fired: 0, skipped };

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    ...(issueContext && { issue: issueContext }),
    ...(details && { details }),
  };

  const results = await Promise.allSettled(
    subscribed.map((wh) => deliverToUrl(admin, wh, payload))
  );

  const fired = results.filter((r) => r.status === 'fulfilled').length;
  return { fired, skipped };
}
