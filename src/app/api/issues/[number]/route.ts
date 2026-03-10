import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

interface RouteParams {
  params: Promise<{ number: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { number: issueNumberStr } = await params;
    const issueNumber = parseInt(issueNumberStr, 10);
    const repo = request.nextUrl.searchParams.get('repo');

    let query = supabase.from('dash_issues').select('*').eq('issue_number', issueNumber);
    if (repo) query = query.eq('repo', repo);
    const { data: issue, error } = await query.single();
    if (error || !issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const { data: transitions } = await supabase
      .from('dash_stage_transitions')
      .select('*')
      .eq('issue_id', issue.id)
      .order('transitioned_at', { ascending: true });

    const { data: runs } = await supabase
      .from('dash_agent_runs')
      .select('*')
      .eq('issue_id', issue.id)
      .order('started_at', { ascending: false });

    return NextResponse.json({ issue, transitions: transitions ?? [], runs: runs ?? [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch issue' }, { status: 500 });
  }
}
