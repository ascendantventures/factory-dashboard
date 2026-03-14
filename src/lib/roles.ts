import { createSupabaseAdminClient } from './supabase-server';

export type UserRole = 'admin' | 'operator' | 'viewer';

/**
 * Get a user's role from fd_user_roles via service-role client.
 * Returns 'viewer' as the default if no row exists.
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('fd_user_roles')
    .select('role, is_active')
    .eq('user_id', userId)
    .single();

  if (!data || data.is_active === false) return 'viewer';
  return (data.role as UserRole) ?? 'viewer';
}

/**
 * Write an audit log entry via service-role client.
 */
export async function writeAuditLog({
  actorId,
  targetUserId,
  action,
  details,
}: {
  actorId: string;
  targetUserId?: string;
  action: string;
  details?: Record<string, unknown>;
}) {
  const admin = createSupabaseAdminClient();
  await admin.from('fd_audit_log').insert({
    actor_id: actorId,
    target_user_id: targetUserId ?? null,
    action,
    details: details ?? null,
  });
}
