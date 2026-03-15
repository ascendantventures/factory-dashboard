/**
 * GET  /api/notifications/preferences — returns current preferences
 * PATCH /api/notifications/preferences — upserts preference fields
 *
 * Uses fd_notification_preferences table (Phase 2 schema).
 * Always uses upsert with onConflict: 'user_id' — never plain insert.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

const DEFAULT_PREFS = {
  spec_ready: true,
  build_complete: true,
  qa_passed: true,
  qa_failed: true,
  deploy_complete: true,
  agent_stalled: true,
  pipeline_error: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  email_enabled: false,
  discord_enabled: false,
  discord_webhook_url: null as string | null,
  user_timezone: 'UTC',
};

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

  const prefs = { ...DEFAULT_PREFS, ...(data ?? {}) };
  return NextResponse.json(prefs);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Load existing prefs for merge
  const { data: existing } = await supabase
    .from('fd_notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Merge: defaults → existing → patch body
  const merged = { ...DEFAULT_PREFS, ...(existing ?? {}), ...body };

  // Upsert — NEVER plain insert (table has UNIQUE constraint on user_id)
  const { error } = await supabase
    .from('fd_notification_preferences')
    .upsert({ ...merged, user_id: user.id }, { onConflict: 'user_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(merged);
}
