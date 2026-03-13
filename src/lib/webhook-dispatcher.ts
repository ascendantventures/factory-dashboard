import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import type { PipelineEvent } from '@/lib/webhook-events';

export type { PipelineEvent };

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
 * dispatchEvent — fire-and-forget; call from any server action or route handler.
 * Fires all enabled webhooks subscribed to `event`.
 */
export async function dispatchEvent(
  event: PipelineEvent,
  details?: Record<string, unknown>,
  issueContext?: { number: number; title: string; repo: string }
): Promise<void> {
  const admin = createSupabaseAdminClient();

  // Find enabled webhooks subscribed to this event
  const { data: webhooks, error } = await admin
    .from('fd_webhooks')
    .select('id, url, secret_hash, events, enabled')
    .eq('enabled', true);

  if (error || !webhooks?.length) return;

  const subscribed = webhooks.filter((wh) => {
    const events = Array.isArray(wh.events) ? wh.events : [];
    return events.includes(event);
  });

  if (!subscribed.length) return;

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    ...(issueContext && { issue: issueContext }),
    ...(details && { details }),
  };

  await Promise.allSettled(
    subscribed.map((wh) => deliverWebhook(admin, wh, payload))
  );
}

async function deliverWebhook(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  wh: { id: string; url: string; secret_hash: string | null },
  payload: WebhookPayload
): Promise<void> {
  const body = JSON.stringify(payload);
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

  await admin.from('fd_webhook_deliveries').insert({
    webhook_id: wh.id,
    event: payload.event,
    payload,
    status_code: statusCode,
    response_body: responseBody,
    sent_at: new Date().toISOString(),
  });
}
