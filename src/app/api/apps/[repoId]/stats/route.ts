import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

// GET /api/apps/[repoId]/stats
// Returns aggregated pipeline stats for an app
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ repoId: string }> },
) {
  const { repoId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Look up build repo
  const { data: buildRepo, error: repoError } = await supabase
    .from('dash_build_repos')
    .select('id, github_repo')
    .eq('id', repoId)
    .single();

  if (repoError || !buildRepo) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  }

  // Fetch all issues for this repo
  const { data: issues, error: issuesError } = await supabase
    .from('dash_issues')
    .select('id, station, created_at')
    .eq('repo', buildRepo.github_repo);

  if (issuesError) {
    return NextResponse.json({ error: issuesError.message }, { status: 500 });
  }

  const allIssues = issues ?? [];
  const totalIssues = allIssues.length;

  if (totalIssues === 0) {
    return NextResponse.json({
      total_issues: 0,
      total_cost_usd: 0,
      avg_cost_usd: 0,
      success_rate: null,
      active_issues: 0,
      last_deployed_at: null,
    });
  }

  const issueIds = allIssues.map((i) => i.id);

  // Fetch cost data
  const { data: costs } = await supabase
    .from('dash_issue_cost_summary')
    .select('issue_id, total_cost_usd')
    .in('issue_id', issueIds);

  const totalCostUsd = (costs ?? []).reduce(
    (sum, c) => sum + Number(c.total_cost_usd ?? 0),
    0,
  );
  const avgCostUsd = totalIssues > 0 ? totalCostUsd / totalIssues : 0;

  // Success rate: issues at station 'done' / total completed (done + failed)
  const doneCount = allIssues.filter((i) => i.station === 'done').length;
  const failedCount = allIssues.filter((i) => i.station === 'failed').length;
  const completedCount = doneCount + failedCount;
  const successRate = completedCount > 0 ? doneCount / completedCount : null;

  // Active issues: not done, not failed
  const activeIssues = allIssues.filter(
    (i) => i.station !== 'done' && i.station !== 'failed',
  ).length;

  // Last deployed: check deployment cache
  const adminClient = createSupabaseAdminClient();
  const { data: deployments } = await adminClient
    .from('dash_deployment_cache')
    .select('deployed_at')
    .eq('repo_full_name', buildRepo.github_repo)
    .order('deployed_at', { ascending: false })
    .limit(1);

  const lastDeployedAt = deployments?.[0]?.deployed_at ?? null;

  return NextResponse.json({
    total_issues: totalIssues,
    total_cost_usd: Math.round(totalCostUsd * 100) / 100,
    avg_cost_usd: Math.round(avgCostUsd * 100) / 100,
    success_rate: successRate !== null ? Math.round(successRate * 100) / 100 : null,
    active_issues: activeIssues,
    last_deployed_at: lastDeployedAt,
  });
}
