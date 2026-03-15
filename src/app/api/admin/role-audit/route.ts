import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { getUserRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = await getUserRole(user.id);
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '25')));
  const userId = searchParams.get('user_id');
  const offset = (page - 1) * perPage;

  const adminClient = createSupabaseAdminClient();

  let query = adminClient
    .from('users_page_role_audit')
    .select('*', { count: 'exact' })
    .order('changed_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  if (userId) {
    query = query.eq('target_user_id', userId);
  }

  const { data: rows, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolve emails via admin API
  const userIds = new Set<string>();
  (rows ?? []).forEach(r => { userIds.add(r.target_user_id); userIds.add(r.changed_by_id); });

  const emailMap: Record<string, string> = {};
  for (const uid of userIds) {
    try {
      const { data: { user } } = await adminClient.auth.admin.getUserById(uid);
      if (user) emailMap[uid] = user.email ?? uid;
    } catch { emailMap[uid] = uid; }
  }

  const data = (rows ?? []).map(r => ({
    id: r.id,
    changed_at: r.changed_at,
    target_email: emailMap[r.target_user_id] ?? r.target_user_id,
    changed_by_email: emailMap[r.changed_by_id] ?? r.changed_by_id,
    old_role: r.old_role,
    new_role: r.new_role,
    notes: r.notes,
  }));

  return NextResponse.json({ data, total: count ?? 0, page, per_page: perPage });
}
