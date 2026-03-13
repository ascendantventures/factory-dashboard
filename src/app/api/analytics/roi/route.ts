import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const to = searchParams.get('to') ?? new Date().toISOString();
  const repo = searchParams.get('repo') ?? null;

  const admin = createSupabaseAdminClient();

  // Get all completed runs in range
  let q = admin
    .from('dash_agent_runs')
    .select('issue_id, station, estimated_cost_usd, duration_seconds, run_status, started_at, completed_at')
    .gte('started_at', from)
    .lte('started_at', to)
    .eq('run_status', 'completed');
  if (repo) q = q.eq('repo', repo);
  const { data: runs } = await q;

  const allRuns = runs ?? [];

  // Group by issue_id to understand per-issue metrics
  const issueMap = new Map<number, {
    stations: string[];
    total_cost: number;
    total_duration: number;
    has_bugfix: boolean;
  }>();

  for (const r of allRuns) {
    const id = r.issue_id;
    if (!id) continue;
    if (!issueMap.has(id)) issueMap.set(id, { stations: [], total_cost: 0, total_duration: 0, has_bugfix: false });
    const entry = issueMap.get(id)!;
    entry.stations.push(r.station ?? '');
    entry.total_cost += r.estimated_cost_usd ?? 0;
    entry.total_duration += r.duration_seconds ?? 0;
    if (r.station === 'bugfix') entry.has_bugfix = true;
  }

  const issues = Array.from(issueMap.values());
  const issues_completed = issues.length;
  const issues_failed_qa = issues.filter(i => i.has_bugfix).length;
  const qa_first_try_rate = issues_completed > 0
    ? Number((((issues_completed - issues_failed_qa) / issues_completed) * 100).toFixed(1))
    : 0;

  // Average cost per issue
  const total_cost = issues.reduce((acc, i) => acc + i.total_cost, 0);
  const cost_per_issue = issues_completed > 0
    ? Number((total_cost / issues_completed).toFixed(4))
    : 0;

  // Average time-to-deploy: mean of total duration per issue in hours
  const avg_duration_seconds = issues_completed > 0
    ? issues.reduce((acc, i) => acc + i.total_duration, 0) / issues_completed
    : 0;
  const avg_time_to_deploy_hours = Number((avg_duration_seconds / 3600).toFixed(1));

  // Estimated manual hours (8h per issue baseline)
  const estimated_manual_hours = issues_completed * 8;
  const pipeline_hours = Number((issues.reduce((acc, i) => acc + i.total_duration, 0) / 3600).toFixed(1));

  return NextResponse.json({
    cost_per_issue,
    avg_time_to_deploy_hours,
    qa_first_try_rate,
    issues_completed,
    issues_failed_qa,
    estimated_manual_hours,
    pipeline_hours,
  });
}
