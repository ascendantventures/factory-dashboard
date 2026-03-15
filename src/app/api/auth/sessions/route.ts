import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { logAction, getClientIp } from '@/lib/audit';

type SupabaseSession = {
  id: string;
  created_at: string;
  user_agent?: string;
  ip?: string;
};

type AdminWithSessions = {
  listUserSessions: (userId: string) => Promise<{
    data: { sessions: SupabaseSession[] } | null;
    error: unknown;
  }>;
};

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get current session to identify "this device"
  const { data: { session: currentSession } } = await supabase.auth.getSession();

  const admin = createSupabaseAdminClient();
  const adminWithSessions = admin.auth.admin as unknown as AdminWithSessions;

  let sessions: Array<{
    id: string;
    created_at: string;
    user_agent: string;
    ip: string;
    is_current: boolean;
  }> = [];

  if (typeof adminWithSessions.listUserSessions === 'function') {
    const { data: sessionsData } = await adminWithSessions.listUserSessions(user.id)
      .catch(() => ({ data: null, error: null }));

    if (sessionsData?.sessions) {
      const currentTokenSuffix = currentSession?.access_token?.slice(-16) ?? '';
      sessions = sessionsData.sessions.map((s) => ({
        id: s.id,
        created_at: s.created_at,
        user_agent: s.user_agent ?? '',
        ip: s.ip ?? '',
        // Best-effort current session detection
        is_current: currentTokenSuffix.length > 0
          ? s.id.endsWith(currentTokenSuffix.slice(-8))
          : sessions.length === 0, // mark first as current if no token available
      }));
      // Ensure at least one session is marked current (the first if none matched)
      if (sessions.length > 0 && !sessions.some(s => s.is_current)) {
        sessions[0] = { ...sessions[0], is_current: true };
      }
    }
  }

  // Fallback: return a synthetic current session entry
  if (sessions.length === 0) {
    sessions = [{
      id: currentSession?.user?.id ?? user.id,
      created_at: new Date().toISOString(),
      user_agent: req.headers.get('user-agent') ?? '',
      ip: getClientIp(req.headers) ?? '',
      is_current: true,
    }];
  }

  return NextResponse.json({ sessions });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminClient();

  // Revoke all sessions except the current one
  const { error } = await admin.auth.admin.signOut(user.id, 'others');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit log
  await logAction({
    userId: user.id,
    actorEmail: user.email ?? '',
    action: 'sessions_revoked_all',
    category: 'auth',
    targetType: 'session',
    targetId: user.id,
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ sessions_revoked: 'all_others' });
}
