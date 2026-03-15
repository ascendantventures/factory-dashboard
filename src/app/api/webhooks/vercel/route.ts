import { NextRequest, NextResponse } from 'next/server';
import { verifyVercelWebhook } from '@/lib/webhooks';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

// Disable body parser — must receive raw body for HMAC verification
export const config = { api: { bodyParser: false } };
export const runtime = 'nodejs';

type DeployState = 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';

const EVENT_STATE_MAP: Record<string, DeployState> = {
  'deployment.created': 'BUILDING',
  'deployment.ready': 'READY',
  'deployment.error': 'ERROR',
  'deployment.canceled': 'CANCELED',
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.VERCEL_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhook/vercel] VERCEL_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const signature = request.headers.get('x-vercel-signature') ?? '';
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  const rawBody = Buffer.from(await request.arrayBuffer());

  const isValid = verifyVercelWebhook(rawBody, signature, secret);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: {
    type?: string;
    payload?: {
      deployment?: {
        id?: string;
        url?: string;
        readyState?: string;
      };
      project?: {
        id?: string;
      };
      links?: {
        deployment?: string;
      };
      deploymentId?: string;
    };
  };

  try {
    body = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const eventType = body.type ?? '';
  const deployState = EVENT_STATE_MAP[eventType];

  if (!deployState) {
    // Unknown event — acknowledge but do nothing
    return NextResponse.json({ ok: true, event: eventType, action: 'ignored' });
  }

  const deploymentId =
    body.payload?.deployment?.id ??
    body.payload?.deploymentId ??
    null;

  const deployUrl = body.payload?.deployment?.url
    ? `https://${body.payload.deployment.url}`
    : body.payload?.links?.deployment ?? null;

  const supabase = createSupabaseAdminClient();

  const updateData: Record<string, unknown> = {
    deploy_state: deployState,
    last_webhook_at: new Date().toISOString(),
    webhook_event: eventType,
  };

  if (deploymentId) {
    updateData.vercel_deployment_id = deploymentId;
  }
  if (deployUrl) {
    updateData.deploy_url = deployUrl;
  }
  if (deployState === 'READY') {
    updateData.deployed_at = new Date().toISOString();
  }

  // Update all rows matching the deployment ID, or fall back to all rows
  // (Vercel doesn't always send repo identifiers in the webhook payload)
  let query = supabase
    .from('dash_deployment_cache')
    .update(updateData);

  if (deploymentId) {
    query = query.eq('vercel_deployment_id', deploymentId);
  } else {
    // No deployment ID — log and return
    console.warn('[webhook/vercel] No deployment ID in payload — cannot correlate');
    return NextResponse.json({ ok: true, event: eventType, action: 'no-deployment-id' });
  }

  const { error } = await query;
  if (error) {
    console.error('[webhook/vercel] Supabase update failed:', error.message);
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
  }

  console.log(`[webhook/vercel] Processed ${eventType} → ${deployState} (deploymentId: ${deploymentId})`);
  return NextResponse.json({ ok: true, event: eventType, state: deployState });
}
