import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const direction = searchParams.get('direction');
  const event_type = searchParams.get('event_type');
  const status = searchParams.get('status');
  const issue_number = searchParams.get('issue_number');
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10));

  const admin = createSupabaseAdminClient();
  let query = admin
    .from('harness_events')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (direction) query = query.eq('direction', direction);
  if (event_type) query = query.eq('event_type', event_type);
  if (status) query = query.eq('status', status);
  if (issue_number) query = query.eq('issue_number', parseInt(issue_number, 10));

  const { data, error, count } = await query;

  if (error) {
    console.error('[GET /api/events] error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data ?? [], total: count ?? 0 });
}
