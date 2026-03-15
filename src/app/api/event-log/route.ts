import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify authenticated session
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const perPage = Math.min(200, Math.max(1, parseInt(searchParams.get('per_page') ?? '50', 10)));
  const direction = searchParams.get('direction');
  const eventType = searchParams.get('event_type');
  const status = searchParams.get('status');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const admin = createSupabaseAdminClient();
  const offset = (page - 1) * perPage;

  // Query harness_events table (not fdash_event_log which is always empty)
  let query = admin
    .from('harness_events')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  if (direction === 'in' || direction === 'out') {
    query = query.eq('direction', direction);
  }
  if (eventType) {
    query = query.eq('event_type', eventType);
  }
  if (status === 'received' || status === 'delivered' || status === 'failed') {
    query = query.eq('status', status);
  }
  if (from) {
    query = query.gte('created_at', from);
  }
  if (to) {
    query = query.lte('created_at', to);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Event log query error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }

  // Truncate payload preview in list view (500 chars)
  const truncated = (data ?? []).map((row) => ({
    ...row,
    payload: truncatePayload(row.payload, 500),
  }));

  return NextResponse.json({
    data: truncated,
    pagination: {
      page,
      per_page: perPage,
      total: count ?? 0,
    },
  });
}

function truncatePayload(payload: unknown, maxChars: number): unknown {
  const str = JSON.stringify(payload);
  if (str.length <= maxChars) return payload;
  return { _truncated: true, preview: str.slice(0, maxChars) + '...' };
}
