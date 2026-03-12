import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { getUserRole, writeAuditLog } from '@/lib/roles';

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

  const body = await req.json() as { role?: string; is_active?: boolean };
  const admin = createSupabaseAdminClient();

  // Fetch current state
  const { data: current } = await admin
    .from('fd_user_roles')
    .select('role, is_active')
    .eq('user_id', targetId)
    .single();

  // Guard: admin cannot self-demote
  if (body.role && targetId === user.id && body.role !== 'admin') {
    return NextResponse.json({ error: 'Cannot demote your own admin role' }, { status: 400 });
  }

  // Guard: admin cannot deactivate self
  if (body.is_active === false && targetId === user.id) {
    return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_by: user.id };
  if (body.role !== undefined) update.role = body.role;
  if (body.is_active !== undefined) update.is_active = body.is_active;

  const { data: updated, error } = await admin
    .from('fd_user_roles')
    .upsert({ user_id: targetId, ...update }, { onConflict: 'user_id' })
    .select('user_id, role, is_active')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Supabase ban/unban
  if (body.is_active === false) {
    await admin.auth.admin.updateUserById(targetId, { ban_duration: '87600h' }); // 10 years = effectively banned
    await writeAuditLog({ actorId: user.id, targetUserId: targetId, action: 'deactivate', details: {} });
  } else if (body.is_active === true) {
    await admin.auth.admin.updateUserById(targetId, { ban_duration: 'none' });
    await writeAuditLog({ actorId: user.id, targetUserId: targetId, action: 'reactivate', details: {} });
  }

  if (body.role !== undefined && body.role !== current?.role) {
    await writeAuditLog({
      actorId: user.id,
      targetUserId: targetId,
      action: 'role_change',
      details: { from: current?.role ?? 'viewer', to: body.role },
    });
  }

  return NextResponse.json(updated);
}
