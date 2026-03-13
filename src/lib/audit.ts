import 'server-only';
import { createSupabaseAdminClient } from './supabase-server';

export type AuditCategory =
  | 'user_management'
  | 'pipeline'
  | 'issues'
  | 'settings'
  | 'auth';

export type AuditAction =
  // user_management
  | 'invite_user'
  | 'change_role'
  | 'deactivate_user'
  | 'change_password'
  // pipeline
  | 'start_loop'
  | 'stop_loop'
  | 'clear_locks'
  | 'force_tick'
  | 'change_config'
  // issues
  | 'create_issue'
  | 'approve_spec'
  | 'skip_issue'
  | 'block_issue'
  | 'advance_stage'
  | 'revert_stage'
  // settings
  | 'create_template'
  | 'update_template'
  | 'delete_template'
  | 'change_notification_prefs'
  | 'update_repo_config'
  // auth
  | 'login'
  | 'logout'
  | 'failed_login';

export interface AuditLogParams {
  userId?: string;
  actorEmail: string;
  action: AuditAction | string;
  category: AuditCategory;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Write an audit log entry via service role client.
 * Failures are logged to console but do NOT surface errors to callers.
 */
export async function logAction(params: AuditLogParams): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from('audit_log_entries').insert({
      user_id: params.userId ?? null,
      actor_email: params.actorEmail,
      action: params.action,
      category: params.category,
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
      details: params.details ?? null,
      ip_address: params.ipAddress ?? null,
    });
    if (error) {
      console.error('[audit] Failed to write audit log entry:', error.message);
    }
  } catch (err) {
    console.error('[audit] Unexpected error writing audit log:', err);
  }
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(headers: Headers): string | undefined {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    undefined
  );
}
