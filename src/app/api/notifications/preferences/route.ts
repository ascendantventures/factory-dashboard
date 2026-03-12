import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(_req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Upsert defaults first (PATTERN 2 — never plain insert)
  const { data: preferences, error } = await supabase
    .from('fd_notification_preferences')
    .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true })
    .select()
    .single();

  if (error) {
    // Fallback: just select if upsert fails
    const { data: existing, error: selectError } = await supabase
      .from('fd_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (selectError) return NextResponse.json({ error: selectError.message }, { status: 500 });
    return NextResponse.json({ preferences: existing });
  }

  return NextResponse.json({ preferences });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  // Remove fields that must not be overwritten by client
  const { id: _id, user_id: _uid, updated_at: _ua, ...updates } = body;

  const { data: preferences, error } = await supabase
    .from('fd_notification_preferences')
    .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ preferences });
}
