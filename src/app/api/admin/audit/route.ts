import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { getUserRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = await getUserRole(user.id);
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const { searchParams } = new URL(req.url);

  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
  const from = page * limit;
  const to = from + limit - 1;

  const userId = searchParams.get('user_id');
  const category = searchParams.get('category');
  const action = searchParams.get('action');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const emailSearch = searchParams.get('email');

  let query = admin
    .from('audit_log_entries')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (userId) query = query.eq('user_id', userId);
  if (category) query = query.eq('category', category);
  if (action) query = query.ilike('action', `%${action}%`);
  if (emailSearch) query = query.ilike('actor_email', `%${emailSearch}%`);
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59Z');

  const { data: entries, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    entries: entries ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}
