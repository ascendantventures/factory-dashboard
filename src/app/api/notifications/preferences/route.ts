import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

const DEFAULT_PREFS = {
  stage_changes: true,
  failures: true,
  spec_ready: true,
  build_complete: true,
  qa_passed: true,
  qa_failed: true,
  deploy_complete: true,
  agent_stalled: false,
  pipeline_error: true,
};

export async function GET(_request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('dash_dashboard_config')
    .select('notification_prefs')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const prefs = { ...DEFAULT_PREFS, ...(data?.notification_prefs ?? {}) };
  return NextResponse.json(prefs);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Get existing prefs first
  const { data: existing } = await supabase
    .from('dash_dashboard_config')
    .select('notification_prefs')
    .eq('user_id', user.id)
    .single();

  const merged = { ...DEFAULT_PREFS, ...(existing?.notification_prefs ?? {}), ...body };

  const { error } = await supabase
    .from('dash_dashboard_config')
    .upsert({ user_id: user.id, notification_prefs: merged }, { onConflict: 'user_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(merged);
}
