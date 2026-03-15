import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { DEFAULT_PREFERENCES, type NotificationPreferences } from '@/lib/notification-types';

export async function GET(_request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('fd_notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const prefs: NotificationPreferences = { ...DEFAULT_PREFERENCES, ...(data ?? {}) };
  return NextResponse.json(prefs);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Partial<NotificationPreferences>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Get existing prefs
  const { data: existing } = await supabase
    .from('fd_notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const merged: NotificationPreferences = {
    ...DEFAULT_PREFERENCES,
    ...(existing ?? {}),
    ...body,
  };

  const { error } = await supabase
    .from('fd_notification_preferences')
    .upsert(
      { ...merged, user_id: user.id, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(merged);
}
