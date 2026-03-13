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

  const body = await req.json();
  const { email, role: inviteRole } = body as { email: string; role: string };
  if (!email || !inviteRole) {
    return NextResponse.json({ error: 'email and role are required' }, { status: 400 });
  }
  if (!['admin', 'operator', 'viewer'].includes(inviteRole)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Check if user already exists
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existing = existingUsers?.users.find((u) => u.email === email);
  if (existing) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 });
  }

  // Invite user
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: email.split('@')[0] },
  });
  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 500 });

  const newUserId = inviteData.user.id;

  // Upsert role
  const { error: roleError } = await admin.from('fd_user_roles').upsert(
    {
      user_id: newUserId,
      role: inviteRole,
      is_active: true,
      updated_by: user.id,
    },
    { onConflict: 'user_id' }
  );
  if (roleError) return NextResponse.json({ error: roleError.message }, { status: 500 });

  // Audit log
  await writeAuditLog({
    actorId: user.id,
    targetUserId: newUserId,
    action: 'invite',
    details: { email, role: inviteRole },
  });

  return NextResponse.json({ user_id: newUserId });
}
