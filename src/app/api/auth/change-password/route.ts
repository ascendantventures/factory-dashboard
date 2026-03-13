import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { writeAuditLog } from '@/lib/roles';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { current_password: string; new_password: string };
  const { current_password, new_password } = body;

  if (!current_password || !new_password) {
    return NextResponse.json({ error: 'current_password and new_password are required' }, { status: 400 });
  }
  if (new_password.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
  }

  // Verify current password by signing in again
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: current_password,
  });
  if (signInError) {
    return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 });
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: new_password });
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  await writeAuditLog({ actorId: user.id, targetUserId: user.id, action: 'password_change', details: {} });

  return NextResponse.json({ success: true });
}
