import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import type { AppSummary } from '../route';

const TECH_KEYWORDS: string[] = [
  'Next.js',
  'Supabase',
  'Vercel',
  'React',
  'TypeScript',
  'Tailwind',
  'PostgreSQL',
  'Node.js',
];

function parseTechStack(texts: string[]): string[] {
  const combined = texts.join(' ');
  const found: string[] = [];
  for (const keyword of TECH_KEYWORDS) {
    if (combined.toLowerCase().includes(keyword.toLowerCase())) {
      found.push(keyword);
    }
    if (found.length >= 4) break;
  }
  return found;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repoId: string }> },
) {
  const { repoId } = await params;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch build repo by id
  const { data: buildRepo, error: repoError } = await supabase
    .from('dash_build_repos')
    .select('*')
    .eq('id', repoId)
    .single();

  if (repoError || !buildRepo) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  }

  const githubRepo: string = buildRepo.github_repo;

  // Fetch all issues and filter related ones
  const { data: allIssues, error: issuesError } = await supabase
    .from('dash_issues')
    .select('id, issue_number, repo, title, body, state, station, labels, updated_at');

  if (issuesError) {
    return NextResponse.json({ error: issuesError.message }, { status: 500 });
  }

  const relatedIssues = (allIssues ?? []).filter((issue) => {
    const bodyMatch =
      issue.body != null &&
      issue.body.toLowerCase().startsWith(`build_repo: ${githubRepo.toLowerCase()}`);
    const numberMatch = issue.issue_number === buildRepo.issue_number;
    return bodyMatch || numberMatch;
  });

  // Fetch transitions for related issue ids
  const issueIds = relatedIssues.map((i) => i.id);

  const { data: transitions } = await supabase
    .from('dash_stage_transitions')
    .select('issue_number, from_station, to_station, transitioned_at')
    .in('issue_id', issueIds.length > 0 ? issueIds : [-1]);

  // Fetch deployment cache for this repo
  const adminClient = createSupabaseAdminClient();
  const { data: deploymentRows } = await adminClient
    .from('dash_deployment_cache')
    .select('vercel_deployment_id, deploy_url, deploy_state, deployed_at')
    .eq('repo_full_name', githubRepo);

  const latestDeployment = deploymentRows?.[0] ?? null;

  // Compute AppSummary
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const hasBug = relatedIssues.some(
    (issue) =>
      issue.state === 'open' &&
      Array.isArray(issue.labels) &&
      issue.labels.includes('type:bug'),
  );

  const hasRecentActivity = relatedIssues.some(
    (issue) => issue.updated_at != null && issue.updated_at > sevenDaysAgo,
  );

  let status: AppSummary['status'];
  if (hasBug) {
    status = 'error';
  } else if (hasRecentActivity) {
    status = 'active';
  } else {
    status = 'idle';
  }

  const total = relatedIssues.length;
  const open = relatedIssues.filter(
    (issue) => issue.state === 'open' && issue.station !== 'done',
  ).length;
  const done = relatedIssues.filter((issue) => issue.station === 'done').length;

  const texts = relatedIssues.flatMap((issue) => [
    issue.title ?? '',
    issue.body ?? '',
  ]);
  texts.push(buildRepo.display_name ?? '');
  const tech_stack = parseTechStack(texts);

  const app: AppSummary = {
    id: buildRepo.id,
    repo_full_name: githubRepo,
    display_name: buildRepo.display_name,
    live_url: buildRepo.live_url ?? null,
    github_url: `https://github.com/${githubRepo}`,
    status,
    last_deployed_at: latestDeployment?.deployed_at ?? null,
    deploy_state: latestDeployment?.deploy_state ?? null,
    issue_counts: { total, open, done },
    tech_stack,
  };

  const issues = relatedIssues.map((issue) => ({
    id: Number(issue.id),
    issue_number: issue.issue_number,
    title: issue.title,
    station: issue.station ?? null,
    labels: Array.isArray(issue.labels) ? issue.labels : [],
    updated_at: issue.updated_at,
  }));

  const transitionsList = (transitions ?? []).map((t) => ({
    issue_number: t.issue_number,
    from_station: t.from_station ?? null,
    to_station: t.to_station,
    transitioned_at: t.transitioned_at,
  }));

  const deployments = (deploymentRows ?? []).map((d) => ({
    vercel_deployment_id: d.vercel_deployment_id ?? null,
    deploy_url: d.deploy_url ?? null,
    deploy_state: d.deploy_state ?? null,
    deployed_at: d.deployed_at ?? null,
  }));

  return NextResponse.json({ app, issues, transitions: transitionsList, deployments });
}
