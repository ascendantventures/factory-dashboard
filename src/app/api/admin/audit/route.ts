import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { getUserRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = await getUserRole(user.id);
  if (!['admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: entries, error, count } = await admin
    .from('fd_audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch user details for actor and target
  const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 500 });
  const usersMap: Record<string, { email: string; display_name: string }> = {};
  for (const u of usersData?.users ?? []) {
    usersMap[u.id] = {
      email: u.email ?? '',
      display_name: (u.user_metadata?.full_name as string | undefined) ?? u.email?.split('@')[0] ?? '',
    };
  }

  const enriched = (entries ?? []).map((e) => ({
    ...e,
    actor: e.actor_id ? usersMap[e.actor_id] ?? null : null,
    target: e.target_user_id ? usersMap[e.target_user_id] ?? null : null,
  }));

  return NextResponse.json({ entries: enriched, total: count ?? 0, page });
}
