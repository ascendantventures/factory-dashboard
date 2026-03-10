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
      .select('*')
      .eq('run_status', 'running')
      .order('started_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ runs: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch active runs' }, { status: 500 });
  }
}
