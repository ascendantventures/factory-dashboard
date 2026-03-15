import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

function extractAttachmentUrls(text: string): string[] {
  const regex = /https?:\/\/[^\s\)\"]+\.(?:png|pdf)(?:\?[^\s\)\"]*)?/gi;
  return [...new Set((text.match(regex) ?? []))];
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');
  const eventType = request.headers.get('x-github-event') ?? 'unknown';
  const deliveryId = request.headers.get('x-github-delivery') ?? crypto.randomUUID();

  // If no webhook secret configured, stub mode — accept but log
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  if (webhookSecret && !verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const serviceClient = getServiceClient();

  // Upsert webhook event (idempotent via UNIQUE on github_delivery_id)
  const issue = (payload.issue ?? payload.pull_request ?? {}) as Record<string, unknown>;
  const issueNumber = typeof issue.number === 'number' ? issue.number : null;

  const { error: insertError } = await serviceClient
    .from('uat_webhook_events')
    .upsert({
      github_delivery_id: deliveryId,
      event_type: eventType,
      raw_payload: payload,
      github_issue_number: issueNumber,
      processed: false,
    }, { onConflict: 'github_delivery_id', ignoreDuplicates: true });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Extract attachment URLs from issue body + comment body
  const bodies: string[] = [];
  if (typeof issue.body === 'string') bodies.push(issue.body);
  const comment = payload.comment as Record<string, unknown> | undefined;
  if (comment && typeof comment.body === 'string') bodies.push(comment.body);

  const allText = bodies.join('\n');
  const urls = extractAttachmentUrls(allText);

  let attachmentsIngested = 0;

  for (const url of urls) {
    const fileExt = (url.split('?')[0].split('.').pop() ?? '').toLowerCase();
    const fileType = fileExt === 'png' ? 'png' : fileExt === 'pdf' ? 'pdf' : 'other';
    const fileName = url.split('/').pop()?.split('?')[0] ?? 'attachment';
    const attachmentId = `webhook-${deliveryId}-${attachmentsIngested}`;

    const { error: upsertError } = await serviceClient
      .from('uat_attachments')
      .upsert({
        attachment_id: attachmentId,
        github_issue_number: issueNumber ?? 0,
        file_url: url,
        file_name: fileName,
        file_type: fileType,
      }, { onConflict: 'attachment_id', ignoreDuplicates: false });

    if (!upsertError) attachmentsIngested++;
  }

  // Mark event processed
  await serviceClient
    .from('uat_webhook_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('github_delivery_id', deliveryId);

  return NextResponse.json({ ok: true, attachments_ingested: attachmentsIngested });
}
