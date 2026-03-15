import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const BACKOFF_SECONDS = [0, 60, 300, 1800]; // Attempt 1, 2, 3, 4
const MAX_ATTEMPTS = 4;
const BATCH_SIZE = 20;

interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  attempt_number: number;
  delivery_status: string;
}

interface HarnessWebhook {
  webhook_id: string;
  url: string;
  secret: string | null;
  enabled: boolean;
}

function signPayload(body: string, secret: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export async function POST(request: NextRequest) {
  // Validate internal call via service role key header
  const authHeader = request.headers.get('x-factory-secret') ?? request.headers.get('authorization');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const factorySecret = process.env.FACTORY_SECRET;

  const isAuthorized =
    (serviceKey && authHeader === `Bearer ${serviceKey}`) ||
    (factorySecret && authHeader === factorySecret) ||
    (factorySecret && request.headers.get('x-factory-secret') === factorySecret);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  // Fetch pending/retrying deliveries due for processing
  const { data: deliveries, error: fetchError } = await admin
    .from('harness_webhook_deliveries')
    .select('id, webhook_id, event_id, event_type, payload, attempt_number, delivery_status')
    .in('delivery_status', ['pending', 'retrying'])
    .or('next_retry_at.is.null,next_retry_at.lte.' + new Date().toISOString())
    .order('next_retry_at', { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE);

  if (fetchError) {
    console.error('[webhook-delivery/process] fetch error:', fetchError);
    return NextResponse.json({ error: 'Failed to fetch deliveries' }, { status: 500 });
  }

  if (!deliveries || deliveries.length === 0) {
    return NextResponse.json({ processed: 0, succeeded: 0, failed: 0 });
  }

  let succeeded = 0;
  let failed = 0;

  for (const delivery of deliveries as WebhookDelivery[]) {
    // Fetch webhook config
    const { data: webhook, error: whError } = await admin
      .from('harness_webhooks')
      .select('webhook_id, url, secret, enabled')
      .eq('webhook_id', delivery.webhook_id)
      .single();

    if (whError || !webhook) {
      await admin
        .from('harness_webhook_deliveries')
        .update({
          delivery_status: 'failed',
          error_message: 'Webhook not found',
          updated_at: new Date().toISOString(),
        })
        .eq('id', delivery.id);
      failed++;
      continue;
    }

    const wh = webhook as HarnessWebhook;

    if (!wh.enabled) {
      await admin
        .from('harness_webhook_deliveries')
        .update({
          delivery_status: 'failed',
          error_message: 'Webhook disabled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', delivery.id);
      failed++;
      continue;
    }

    // Build payload body
    const payloadBody = JSON.stringify({
      id: delivery.id,
      event_type: delivery.event_type,
      payload: delivery.payload,
      created_at: new Date().toISOString(),
      webhook_id: delivery.webhook_id,
    });

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Harness-Factory/1.0',
      'X-Harness-Delivery': delivery.id,
      'X-Harness-Event': delivery.event_type,
    };

    if (wh.secret) {
      headers['x-harness-signature-256'] = signPayload(payloadBody, wh.secret);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch(wh.url, {
        method: 'POST',
        headers,
        body: payloadBody,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (res.ok || (res.status >= 200 && res.status < 300)) {
        await admin
          .from('harness_webhook_deliveries')
          .update({
            delivery_status: 'success',
            response_code: res.status,
            delivered_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', delivery.id);
        succeeded++;
      } else {
        // Non-2xx response
        const nextAttempt = delivery.attempt_number + 1;
        if (delivery.attempt_number >= MAX_ATTEMPTS) {
          await admin
            .from('harness_webhook_deliveries')
            .update({
              delivery_status: 'failed',
              response_code: res.status,
              error_message: `HTTP ${res.status}`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', delivery.id);
          failed++;
        } else {
          const backoffSec = BACKOFF_SECONDS[nextAttempt - 1] ?? 1800;
          const nextRetry = new Date(Date.now() + backoffSec * 1000).toISOString();
          await admin
            .from('harness_webhook_deliveries')
            .update({
              delivery_status: 'retrying',
              attempt_number: nextAttempt,
              response_code: res.status,
              error_message: `HTTP ${res.status}`,
              next_retry_at: nextRetry,
              updated_at: new Date().toISOString(),
            })
            .eq('id', delivery.id);
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const nextAttempt = delivery.attempt_number + 1;
      if (delivery.attempt_number >= MAX_ATTEMPTS) {
        await admin
          .from('harness_webhook_deliveries')
          .update({
            delivery_status: 'failed',
            error_message: errMsg,
            updated_at: new Date().toISOString(),
          })
          .eq('id', delivery.id);
        failed++;
      } else {
        const backoffSec = BACKOFF_SECONDS[nextAttempt - 1] ?? 1800;
        const nextRetry = new Date(Date.now() + backoffSec * 1000).toISOString();
        await admin
          .from('harness_webhook_deliveries')
          .update({
            delivery_status: 'retrying',
            attempt_number: nextAttempt,
            error_message: errMsg,
            next_retry_at: nextRetry,
            updated_at: new Date().toISOString(),
          })
          .eq('id', delivery.id);
      }
    }
  }

  return NextResponse.json({
    processed: deliveries.length,
    succeeded,
    failed,
  });
}
