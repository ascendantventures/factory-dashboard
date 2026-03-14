import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { getUserRole } from '@/lib/roles';
import { isTestAccount } from '@/lib/users';

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
  const search = searchParams.get('search') ?? '';
  const roleFilter = searchParams.get('role') ?? '';
  const statusFilter = searchParams.get('status') ?? '';
  const filter = searchParams.get('filter') ?? 'all'; // 'all' | 'real' | 'test'
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);

  // Fetch all auth users
  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
    page,
    perPage: 500, // fetch a lot, we filter client-side for now
  });
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });

  // Fetch all role rows
  const { data: roles } = await admin.from('fd_user_roles').select('*');
  const rolesMap: Record<string, { role: string; is_active: boolean }> = {};
  for (const r of roles ?? []) {
    rolesMap[r.user_id] = { role: r.role, is_active: r.is_active };
  }

  let users = (usersData?.users ?? []).map((u) => {
    const email = u.email ?? '';
    return {
      id: u.id,
      email,
      display_name: (u.user_metadata?.full_name as string | undefined) ?? email.split('@')[0] ?? '',
      role: rolesMap[u.id]?.role ?? 'viewer',
      is_active: rolesMap[u.id]?.is_active ?? true,
      last_sign_in_at: u.last_sign_in_at ?? null,
      created_at: u.created_at,
      isTestAccount: isTestAccount(email),
    };
  });

  // Apply filters
  if (search) {
    const q = search.toLowerCase();
    users = users.filter(
      (u) => u.email.toLowerCase().includes(q) || u.display_name.toLowerCase().includes(q)
    );
  }
  if (roleFilter && roleFilter !== 'all') {
    users = users.filter((u) => u.role === roleFilter);
  }
  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'active') users = users.filter((u) => u.is_active);
    if (statusFilter === 'deactivated') users = users.filter((u) => !u.is_active);
  }

  // Test account filter (All / Real / Test)
  if (filter === 'test') users = users.filter((u) => u.isTestAccount);
  if (filter === 'real') users = users.filter((u) => !u.isTestAccount);

  // Compute counts before pagination for tab badges
  const allUsers = (usersData?.users ?? []);
  const testCount = allUsers.filter(u => isTestAccount(u.email ?? '')).length;
  const realCount = allUsers.length - testCount;

  const total = users.length;
  const offset = (page - 1) * pageSize;
  const paginated = users.slice(offset, offset + pageSize);
  const totalPages = Math.ceil(total / pageSize);

  return NextResponse.json({
    users: paginated,
    total,
    page,
    pageSize,
    totalPages,
    counts: { all: allUsers.length, test: testCount, real: realCount },
  });
}
