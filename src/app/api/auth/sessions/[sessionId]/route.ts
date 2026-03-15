import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

type AdminWithSessions = {
  listUserSessions: (userId: string) => Promise<{
    data: { sessions: Array<{ id: string }> } | null;
    error: unknown;
  }>;
  deleteUserSession: (sessionId: string) => Promise<{ error: { message: string } | null }>;
};

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const adminWithSessions = admin.auth.admin as unknown as AdminWithSessions;

  // Verify the session belongs to this user before revoking
  if (typeof adminWithSessions.listUserSessions === 'function') {
    const { data: sessionsData } = await adminWithSessions.listUserSessions(user.id)
      .catch(() => ({ data: null, error: null }));

    if (sessionsData) {
      const owned = sessionsData.sessions.some(s => s.id === sessionId);
      if (!owned) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
    }
  }

  // Delete the specific session
  if (typeof adminWithSessions.deleteUserSession === 'function') {
    const { error } = await adminWithSessions.deleteUserSession(sessionId)
      .catch(() => ({ error: { message: 'Failed to revoke session' } }));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // Fallback: sign out the user entirely if deleteUserSession not available
    return NextResponse.json({ error: 'Session revocation not available on this plan' }, { status: 501 });
  }

  return NextResponse.json({ success: true });
}
