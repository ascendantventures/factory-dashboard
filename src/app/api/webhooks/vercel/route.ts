import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { verifyVercelWebhook } from '@/lib/webhooks';

// Must receive raw body for HMAC verification
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type DeployState = 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';

const EVENT_TO_STATE: Record<string, DeployState> = {
  'deployment.created': 'BUILDING',
  'deployment.ready': 'READY',
  'deployment.error': 'ERROR',
  'deployment.canceled': 'CANCELED',
};

export async function POST(request: NextRequest) {
  const secret = process.env.VERCEL_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhook/vercel] VERCEL_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // Read raw body as buffer for HMAC verification
  const rawBodyBuffer = Buffer.from(await request.arrayBuffer());
  const signature = request.headers.get('x-vercel-signature') ?? '';

  if (!signature) {
    return NextResponse.json({ error: 'Missing x-vercel-signature header' }, { status: 401 });
  }

  if (!verifyVercelWebhook(rawBodyBuffer, signature, secret)) {
    console.warn('[webhook/vercel] Invalid signature received');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBodyBuffer.toString('utf8'));
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const eventType = body.type as string;
  const deployState = EVENT_TO_STATE[eventType];

  if (!deployState) {
    // Unknown event type — ack and ignore
    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  }

  // Extract deployment info from Vercel payload
  const payload = body.payload as Record<string, unknown> | undefined;
  const deployment = payload?.deployment as Record<string, unknown> | undefined;
  const project = payload?.project as Record<string, unknown> | undefined;

  // Vercel sends github repo info in the deployment meta
  const meta = deployment?.meta as Record<string, unknown> | undefined;
  const githubOrg = (meta?.githubOrg ?? meta?.githubCommitOrg) as string | undefined;
  const githubRepo = (meta?.githubRepo ?? meta?.githubCommitRepo) as string | undefined;

  if (!githubOrg || !githubRepo) {
    console.warn('[webhook/vercel] Could not determine repo from webhook payload');
    return NextResponse.json({ received: true, no_repo: true }, { status: 200 });
  }

  const repoFullName = `${githubOrg}/${githubRepo}`;
  const deployUrl = (deployment?.url as string | undefined)
    ? `https://${deployment?.url}`
    : (payload?.url as string | undefined)
    ? `https://${payload?.url}`
    : null;

  const deployedAt = deployState === 'READY'
    ? new Date().toISOString()
    : undefined;

  const adminClient = createSupabaseAdminClient();

  const upsertPayload: Record<string, unknown> = {
    repo_full_name: repoFullName,
    deploy_state: deployState,
    last_webhook_at: new Date().toISOString(),
    webhook_event: eventType,
    ...(deployUrl ? { deploy_url: deployUrl } : {}),
    ...(deployedAt ? { deployed_at: deployedAt } : {}),
    ...(deployment?.id ? { vercel_deployment_id: deployment.id as string } : {}),
  };

  const { error } = await adminClient
    .from('dash_deployment_cache')
    .upsert(upsertPayload, { onConflict: 'repo_full_name' });

  if (error) {
    console.error('[webhook/vercel] Supabase upsert failed:', error.message);
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
  }

  console.log(`[webhook/vercel] ${eventType} → ${repoFullName} → ${deployState}`);
  return NextResponse.json({ received: true, state: deployState }, { status: 200 });
}
