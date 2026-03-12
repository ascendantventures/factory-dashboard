import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('dash_agent_runs')
      .select('id, issue_id, repo, issue_number, station, model, started_at, estimated_cost_usd, log_file_path, pid, run_status')
      .eq('run_status', 'running')
      .order('started_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ runs: data ?? [] });
  } catch (err) {
    console.error('[api/agents/active]', err);
    return NextResponse.json({ error: 'Failed to fetch active runs' }, { status: 500 });
  }
}
