import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { deliverWebhook } from '@/lib/webhook-dispatcher';
import type { WebhookPayload } from '@/lib/webhook-dispatcher';

type Params = { params: Promise<{ id: string; deliveryId: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  const { id: webhookId, deliveryId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify the user owns the webhook (RLS-enforced select)
  const { data: webhook } = await supabase
    .from('fd_webhooks')
    .select('id, url, secret_hash, format_type')
    .eq('id', webhookId)
    .single();
  if (!webhook) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Fetch the original delivery (also ownership-guarded via webhook ownership above)
  const admin = createSupabaseAdminClient();
  const { data: delivery } = await admin
    .from('fd_webhook_deliveries')
    .select('id, event, payload, webhook_id')
    .eq('id', deliveryId)
    .eq('webhook_id', webhookId)
    .single();
  if (!delivery) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Re-fire using the original payload but current webhook config
  const originalPayload = delivery.payload as WebhookPayload;

  // Track new delivery outcome by temporarily overriding admin insert
  let newDeliveryId: string | null = null;
  let newStatusCode: number | null = null;
  let newResponseBody: string | null = null;
  let newSentAt: string | null = null;

  // We'll deliver and then read back the newest row inserted for this webhook
  await deliverWebhook(admin, webhook, originalPayload);

  // Fetch the row we just inserted (newest by sent_at for this webhook)
  const { data: newDelivery } = await admin
    .from('fd_webhook_deliveries')
    .select('id, status_code, response_body, sent_at')
    .eq('webhook_id', webhookId)
    .order('sent_at', { ascending: false })
    .limit(1)
    .single();

  if (newDelivery) {
    newDeliveryId = newDelivery.id;
    newStatusCode = newDelivery.status_code;
    newResponseBody = newDelivery.response_body;
    newSentAt = newDelivery.sent_at;
  }

  return NextResponse.json({
    status_code: newStatusCode,
    response_body: newResponseBody,
    sent_at: newSentAt,
    new_delivery_id: newDeliveryId,
  });
}
