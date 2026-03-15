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
    return NextResponse.json({ error: 'GitHub webhook not configured' }, { status: 503 });
  }

  const signature = request.headers.get('x-hub-signature-256') ?? '';
  const eventType = request.headers.get('x-github-event') ?? '';
  const deliveryId = request.headers.get('x-github-delivery') ?? '';

  const body = await request.text();

  // Verify HMAC signature using timingSafeEqual
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

  // Extract fields
  const repoFullName = (payload.repository as Record<string, unknown> | null)?.full_name as string ?? '';
  const issueNumber = (payload.issue as Record<string, unknown> | null)?.number as number | null ?? null;
  const senderLogin = (payload.sender as Record<string, unknown> | null)?.login as string ?? '';

  // Write to harness_events (Phase 2 — primary event store for incoming GitHub events)
  void admin
    .from('harness_events')
    .insert({
      direction: 'incoming',
      event_type: 'github_webhook',
      status: 'success',
      issue_number: issueNumber,
      payload,
      metadata: {
        github_event: eventType,
        delivery_id: deliveryId,
        repo_full_name: repoFullName,
        sender_login: senderLogin,
      },
    })
    .then(({ error }) => {
      if (error) console.error('[github webhook] harness_events insert error:', error);
    });

  // Legacy: also log to dash_webhook_events for backward compatibility
  void admin
    .from('dash_webhook_events')
    .insert({
      github_delivery_id: deliveryId || `no-delivery-${Date.now()}`,
      event_type: eventType,
      repo: repoFullName,
      issue_number: issueNumber,
      payload,
    })
    .then(({ error }) => {
      if (error) console.warn('[github webhook] dash_webhook_events insert skipped:', error?.message);
    });

  // Process station transitions from GitHub label events
  try {
    if (eventType === 'issues' && (payload.action === 'labeled' || payload.action === 'unlabeled')) {
      const label = (payload.label as Record<string, unknown> | null)?.name as string ?? '';

      if (label.startsWith('station:')) {
        const newStation = label.replace('station:', '') as Station;

        if (STATIONS.includes(newStation) && repoFullName && issueNumber !== null) {
          const { data: existingIssue } = await admin
            .from('dash_issues')
            .select('id, station')
            .eq('repo', repoFullName)
            .eq('issue_number', issueNumber)
            .single();

          if (existingIssue) {
            const oldStation = existingIssue.station;
            const targetStation = payload.action === 'labeled' ? newStation : null;

            await admin
              .from('dash_issues')
              .update({ station: targetStation, updated_at: new Date().toISOString() })
              .eq('id', existingIssue.id);

            await admin.from('dash_stage_transitions').insert({
              issue_id: existingIssue.id,
              repo: repoFullName,
              issue_number: issueNumber,
              from_station: oldStation,
              to_station: targetStation,
              transitioned_at: new Date().toISOString(),
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('[github webhook] label processing error (non-fatal):', err);
  }

  return NextResponse.json({ received: true });
}
