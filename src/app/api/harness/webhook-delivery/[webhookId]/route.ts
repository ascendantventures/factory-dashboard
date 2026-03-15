import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  const { webhookId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  // Verify the user owns this webhook
  const { data: webhook, error: whError } = await admin
    .from('harness_webhooks')
    .select('webhook_id')
    .eq('webhook_id', webhookId)
    .eq('created_by', user.id)
    .single();

  if (whError || !webhook) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 100);
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

  const { data: deliveries, error: dError, count } = await admin
    .from('harness_webhook_deliveries')
    .select(
      'id, event_type, attempt_number, delivery_status, response_code, error_message, delivered_at, next_retry_at, created_at',
      { count: 'exact' }
    )
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (dError) {
    return NextResponse.json({ error: 'Failed to fetch deliveries' }, { status: 500 });
  }

  return NextResponse.json({
    deliveries: deliveries ?? [],
    total: count ?? 0,
  });
}
