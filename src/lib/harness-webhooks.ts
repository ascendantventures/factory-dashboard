/**
 * harness-webhooks.ts
 * Fire-and-forget webhook delivery — creates harness_webhook_deliveries rows
 * for all matching enabled webhooks. Actual HTTP delivery is handled by the
 * /api/harness/webhook-delivery/process route called on each factory loop tick.
 */

import { createSupabaseAdminClient } from '@/lib/supabase-server';

interface HarnessWebhook {
  webhook_id: string;
  url: string;
  secret: string | null;
  enabled: boolean;
  events: string[];
}

/**
 * Write delivery records for all enabled webhooks that subscribe to `eventType`.
 * Runs fire-and-forget — never throws, never blocks the caller.
 */
export function deliverWebhooksAsync(params: {
  eventType: string;
  payload: Record<string, unknown>;
  eventId?: string;
}): void {
  void _deliver(params).catch((err) => {
    console.error('[deliverWebhooksAsync] unexpected error:', err);
  });
}

async function _deliver(params: {
  eventType: string;
  payload: Record<string, unknown>;
  eventId?: string;
}): Promise<void> {
  const { eventType, payload, eventId } = params;
  const admin = createSupabaseAdminClient();

  // Fetch all enabled webhooks that listen to this event type
  const { data: webhooks, error } = await admin
    .from('harness_webhooks')
    .select('webhook_id, url, secret, enabled, events')
    .eq('enabled', true);

  if (error || !webhooks || webhooks.length === 0) return;

  const matching = (webhooks as HarnessWebhook[]).filter(
    (wh) => wh.events.includes(eventType) || wh.events.includes('*')
  );

  if (matching.length === 0) return;

  const rows = matching.map((wh) => ({
    webhook_id: wh.webhook_id,
    event_id: eventId ?? null,
    event_type: eventType,
    payload,
    attempt_number: 1,
    delivery_status: 'pending' as const,
    next_retry_at: null,
  }));

  const { error: insertError } = await admin
    .from('harness_webhook_deliveries')
    .insert(rows);

  if (insertError) {
    console.error('[deliverWebhooksAsync] insert error:', insertError);
  }
}

/**
 * Write a single event to harness_events and queue webhook deliveries.
 * Fire-and-forget — never throws, never blocks.
 */
export function writeEventAsync(params: {
  direction: 'incoming' | 'outgoing' | 'internal';
  eventType: string;
  status?: 'success' | 'failure' | 'pending';
  issueNumber?: number | null;
  submissionId?: string | null;
  payload?: Record<string, unknown>;
  errorMessage?: string | null;
  durationMs?: number | null;
  metadata?: Record<string, unknown> | null;
}): void {
  void _writeEvent(params).catch((err) => {
    console.error('[writeEventAsync] unexpected error:', err);
  });
}

async function _writeEvent(params: {
  direction: 'incoming' | 'outgoing' | 'internal';
  eventType: string;
  status?: 'success' | 'failure' | 'pending';
  issueNumber?: number | null;
  submissionId?: string | null;
  payload?: Record<string, unknown>;
  errorMessage?: string | null;
  durationMs?: number | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const admin = createSupabaseAdminClient();

  const { data: event, error } = await admin
    .from('harness_events')
    .insert({
      direction: params.direction,
      event_type: params.eventType,
      status: params.status ?? 'success',
      issue_number: params.issueNumber ?? null,
      submission_id: params.submissionId ?? null,
      payload: params.payload ?? null,
      error_message: params.errorMessage ?? null,
      duration_ms: params.durationMs ?? null,
      metadata: params.metadata ?? null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[writeEventAsync] insert error:', error);
    return;
  }

  // Queue outbound webhook deliveries for this event
  if (event?.id) {
    deliverWebhooksAsync({
      eventType: params.eventType,
      payload: params.payload ?? {},
      eventId: event.id,
    });
  }
}
