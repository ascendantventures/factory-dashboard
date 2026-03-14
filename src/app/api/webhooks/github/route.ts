import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { STATIONS, type Station } from '@/lib/constants';

export const dynamic = 'force-dynamic';

async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');
    if (expectedBuf.length !== signatureBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const signature = request.headers.get('x-hub-signature-256') ?? '';
  const eventType = request.headers.get('x-github-event') ?? '';
  const deliveryId = request.headers.get('x-github-delivery') ?? '';

  const body = await request.text();

  // Verify HMAC signature
  if (!signature || !(await verifySignature(body, signature, secret))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Extract repo and issue_number
  const repo = (payload.repository as Record<string, unknown> | null)?.full_name as string ?? '';
  const issueNumber = (payload.issue as Record<string, unknown> | null)?.number as number | null ?? null;

  // Idempotency check: skip if already processed this delivery
  if (deliveryId) {
    const { data: existing } = await admin
      .from('dash_webhook_events')
      .select('id')
      .eq('github_delivery_id', deliveryId)
      .single();

    if (existing) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
  }

  // Log the event
  const { data: loggedEvent, error: logError } = await admin
    .from('dash_webhook_events')
    .insert({
      github_delivery_id: deliveryId || `no-delivery-${Date.now()}`,
      event_type: eventType,
      repo,
      issue_number: issueNumber,
      payload,
    })
    .select()
    .single();

  if (logError) {
    console.error('Failed to log webhook event:', logError);
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
  }

  let processError: string | null = null;

  try {
    if (eventType === 'issues') {
      const issue = payload.issue as Record<string, unknown>;
      const action = payload.action as string;
      const issueId = issue?.id as number | null;

      if (issue && issueId && repo && issueNumber !== null) {
        const now = new Date().toISOString();

        // Handle issues.opened — upsert into dash_issues
        if (action === 'opened') {
          await admin.from('dash_issues').upsert({
            id: issueId,
            issue_number: issueNumber,
            repo,
            title: (issue.title as string) ?? '',
            body: (issue.body as string) ?? null,
            state: 'open',
            station: null,
            labels: (issue.labels as unknown[]) ?? [],
            author: (issue as Record<string, Record<string, unknown>>).user?.login ?? null,
            created_at: issue.created_at as string,
            updated_at: issue.updated_at as string,
            synced_at: now,
          }, { onConflict: 'id' });
        }

        // Handle issues.closed — update state and closed_at
        if (action === 'closed') {
          await admin.from('dash_issues').upsert({
            id: issueId,
            issue_number: issueNumber,
            repo,
            title: (issue.title as string) ?? '',
            body: (issue.body as string) ?? null,
            state: 'closed',
            station: null,
            labels: (issue.labels as unknown[]) ?? [],
            author: (issue as Record<string, Record<string, unknown>>).user?.login ?? null,
            created_at: issue.created_at as string,
            updated_at: issue.updated_at as string,
            closed_at: (issue.closed_at as string) ?? now,
            synced_at: now,
          }, { onConflict: 'id' });
        }

        // Handle issues.labeled / issues.unlabeled with station:* labels
        if (action === 'labeled' || action === 'unlabeled') {
          const label = (payload.label as Record<string, unknown> | null)?.name as string ?? '';

          if (label.startsWith('station:')) {
            const newStation = label.replace('station:', '') as Station;

            if (STATIONS.includes(newStation)) {
              const targetStation = action === 'labeled' ? newStation : null;

              // Upsert the issue record first — always, regardless of whether it exists
              const { data: upsertedIssue } = await admin
                .from('dash_issues')
                .upsert({
                  id: issueId,
                  issue_number: issueNumber,
                  repo,
                  title: (issue.title as string) ?? '',
                  body: (issue.body as string) ?? null,
                  state: (issue.state as string) ?? 'open',
                  station: targetStation,
                  labels: (issue.labels as unknown[]) ?? [],
                  author: (issue as Record<string, Record<string, unknown>>).user?.login ?? null,
                  created_at: issue.created_at as string,
                  updated_at: issue.updated_at as string,
                  synced_at: now,
                }, { onConflict: 'id' })
                .select('id, station')
                .single();

              // Always insert transition — even for newly upserted issues
              if (upsertedIssue) {
                await admin.from('dash_stage_transitions').insert({
                  issue_id: upsertedIssue.id,
                  repo,
                  issue_number: issueNumber,
                  from_station: null,
                  to_station: targetStation,
                  transitioned_at: now,
                });
              }
            }
          }
        }
      }
    }
  } catch (err) {
    processError = String(err);
    console.error('Webhook processing error:', err);
  }

  // Update processed_at
  await admin
    .from('dash_webhook_events')
    .update({
      processed_at: new Date().toISOString(),
      error: processError,
    })
    .eq('id', loggedEvent.id);

  // Fire-and-forget: log to fdash_event_log (non-blocking)
  void admin
    .from('fdash_event_log')
    .upsert(
      {
        direction: 'in',
        event_type: eventType || 'unknown',
        source: 'github',
        payload: payload as Record<string, unknown>,
        status: 'received',
      },
      { onConflict: 'id' }
    )
    .then(({ error }) => {
      if (error) console.error('fdash_event_log insert error:', error);
    });

  return NextResponse.json({ ok: true });
}
