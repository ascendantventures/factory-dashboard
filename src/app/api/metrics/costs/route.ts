import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('dash_user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();

    // Parse optional query params
    const repo = request.nextUrl.searchParams.get('repo');
    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');
    const station = request.nextUrl.searchParams.get('station');

    // Get all agent runs with cost data
    let runsQuery = admin
      .from('dash_agent_runs')
      .select('id, issue_id, repo, issue_number, station, model, estimated_cost_usd, duration_seconds, started_at');

    if (repo) runsQuery = runsQuery.eq('repo', repo);
    if (from) runsQuery = runsQuery.gte('started_at', from);
    if (to) runsQuery = runsQuery.lte('started_at', to);
    if (station) runsQuery = runsQuery.eq('station', station);

    const { data: runs, error: runsError } = await runsQuery;
    if (runsError) throw runsError;

    // Get issue titles for matching issue_numbers
    const issueNumbers = [...new Set((runs ?? []).map((r) => r.issue_number))];
    let issueMap: Record<string, { title: string; repo: string }> = {};

    if (issueNumbers.length > 0) {
      const { data: issuesData } = await admin
        .from('dash_issues')
        .select('issue_number, repo, title')
        .in('issue_number', issueNumbers);

      for (const issue of issuesData ?? []) {
        issueMap[`${issue.repo}::${issue.issue_number}`] = {
          title: issue.title,
          repo: issue.repo,
        };
      }
    }

    // Group by issue
    const issueGroups: Record<string, {
      issue_number: number;
      title: string;
      repo: string;
      total_cost_usd: number;
      runs: Array<{ station: string; model: string; cost_usd: number | null; duration_seconds: number | null }>;
    }> = {};

    for (const run of runs ?? []) {
      const key = `${run.repo}::${run.issue_number}`;
      if (!issueGroups[key]) {
        const meta = issueMap[key];
        issueGroups[key] = {
          issue_number: run.issue_number,
          title: meta?.title ?? `Issue #${run.issue_number}`,
          repo: run.repo,
          total_cost_usd: 0,
          runs: [],
        };
      }
      issueGroups[key].runs.push({
        station: run.station ?? 'unknown',
        model: run.model ?? 'unknown',
        cost_usd: run.estimated_cost_usd,
        duration_seconds: run.duration_seconds,
      });
      issueGroups[key].total_cost_usd += run.estimated_cost_usd ?? 0;
    }

    const issues = Object.values(issueGroups).sort((a, b) => b.total_cost_usd - a.total_cost_usd);

    // Summaries
    let totalUsd = 0;
    const byStation: Record<string, number> = {};
    const byModel: Record<string, number> = {};

    for (const run of runs ?? []) {
      if (run.estimated_cost_usd !== null) {
        totalUsd += run.estimated_cost_usd;
        const s = run.station ?? 'unknown';
        byStation[s] = (byStation[s] ?? 0) + run.estimated_cost_usd;
        const m = run.model ?? 'unknown';
        byModel[m] = (byModel[m] ?? 0) + run.estimated_cost_usd;
      }
    }

    return NextResponse.json({
      issues,
      summary: { total_usd: totalUsd, by_station: byStation, by_model: byModel },
      has_data: (runs ?? []).some((r) => r.estimated_cost_usd !== null),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch cost data' }, { status: 500 });
  }
}
