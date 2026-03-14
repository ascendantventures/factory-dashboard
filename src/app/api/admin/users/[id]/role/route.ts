import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { getUserRole, writeAuditLog } from '@/lib/roles';

// PATCH /api/admin/users/[id]/role — change a single user's role with audit log
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const actorRole = await getUserRole(user.id);
  if (!['admin'].includes(actorRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as { role: string };
  if (!body.role) return NextResponse.json({ error: 'role is required' }, { status: 400 });

  // Guard: cannot demote own admin role
  if (targetId === user.id && body.role !== 'admin') {
    return NextResponse.json({ error: 'Cannot demote your own admin role' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { data: current } = await admin
    .from('fd_user_roles')
    .select('role')
    .eq('user_id', targetId)
    .single();

  const { data: updated, error } = await admin
    .from('fd_user_roles')
    .upsert(
      { user_id: targetId, role: body.role, updated_by: user.id },
      { onConflict: 'user_id' }
    )
    .select('user_id, role')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    actorId: user.id,
    targetUserId: targetId,
    action: 'role_change',
    details: { from: current?.role ?? 'viewer', to: body.role },
  });

  return NextResponse.json({ id: targetId, role: updated?.role ?? body.role });
}
