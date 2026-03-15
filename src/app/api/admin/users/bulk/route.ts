import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { getUserRole, writeAuditLog } from '@/lib/roles';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = await getUserRole(user.id);
  if (!['admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as {
    user_ids: string[];
    action: 'role_change' | 'deactivate' | 'reactivate' | 'delete';
    role?: string;
  };

  // Exclude own account from bulk operations
  const targets = body.user_ids.filter((id) => id !== user.id);

  const admin = createSupabaseAdminClient();
  const errors: string[] = [];
  let updated = 0;

  for (const targetId of targets) {
    try {
      if (body.action === 'role_change') {
        if (!body.role) continue;
        const { data: cur } = await admin
          .from('fd_user_roles')
          .select('role')
          .eq('user_id', targetId)
          .single();
        await admin.from('fd_user_roles').upsert(
          { user_id: targetId, role: body.role, updated_by: user.id },
          { onConflict: 'user_id' }
        );
        await writeAuditLog({
          actorId: user.id,
          targetUserId: targetId,
          action: 'role_change',
          details: { from: cur?.role ?? 'viewer', to: body.role, bulk: true },
        });
      } else if (body.action === 'deactivate') {
        await admin.from('fd_user_roles').upsert(
          { user_id: targetId, is_active: false, updated_by: user.id },
          { onConflict: 'user_id' }
        );
        await admin.auth.admin.updateUserById(targetId, { ban_duration: '87600h' });
        await writeAuditLog({
          actorId: user.id,
          targetUserId: targetId,
          action: 'deactivate',
          details: { bulk: true },
        });
      } else if (body.action === 'reactivate') {
        await admin.from('fd_user_roles').upsert(
          { user_id: targetId, is_active: true, updated_by: user.id },
          { onConflict: 'user_id' }
        );
        await admin.auth.admin.updateUserById(targetId, { ban_duration: 'none' });
        await writeAuditLog({
          actorId: user.id,
          targetUserId: targetId,
          action: 'reactivate',
          details: { bulk: true },
        });
      } else if (body.action === 'delete') {
        // Delete from auth.users (cascades to fd_user_roles via FK or will be cleaned up)
        const { error: delError } = await admin.auth.admin.deleteUser(targetId);
        if (delError) throw delError;
        // Clean up fd_user_roles row if FK doesn't cascade
        await admin.from('fd_user_roles').delete().eq('user_id', targetId);
        await writeAuditLog({
          actorId: user.id,
          targetUserId: targetId,
          action: 'delete',
          details: { bulk: true },
        });
      }
      updated++;
    } catch (err) {
      errors.push(`${targetId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return NextResponse.json({ updated, errors });
}
