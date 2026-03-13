import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { decryptSecret } from '@/lib/webhook-dispatcher';

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get webhook (RLS ensures ownership)
  const { data: webhook } = await supabase
    .from('fd_webhooks')
    .select('id, url, secret_hash')
    .eq('id', id)
    .single();

  if (!webhook) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const payload = {
    event: 'test',
    timestamp: new Date().toISOString(),
    issue: { number: 0, title: 'Test Payload', repo: 'factory-dashboard' },
    details: { message: 'This is a test webhook delivery from Factory Dashboard.' },
  };

  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Factory-Dashboard/1.0',
  };

  if (webhook.secret_hash) {
    try {
      const rawSecret = await decryptSecret(webhook.secret_hash);
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(rawSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
      headers['X-Factory-Signature'] = 'sha256=' + Buffer.from(sig).toString('hex');
    } catch {
      // skip signature if decryption fails
    }
  }

  let statusCode: number | null = null;
  let responseBody = '';
  const sentAt = new Date().toISOString();

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10_000),
    });
    statusCode = response.status;
    responseBody = (await response.text()).slice(0, 1000);
  } catch {
    // timeout or network error
  }

  // Log delivery via admin (service role — no user insert policy)
  const admin = createSupabaseAdminClient();
  await admin.from('fd_webhook_deliveries').insert({
    webhook_id: id,
    event: 'test',
    payload,
    status_code: statusCode,
    response_body: responseBody || null,
    sent_at: sentAt,
  });

  return NextResponse.json({ status_code: statusCode, response_body: responseBody, sent_at: sentAt });
}
