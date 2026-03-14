import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export type AppSummary = {
  id: string;
  repo_full_name: string;
  display_name: string;
  live_url: string | null;
  github_url: string;
  status: 'active' | 'idle' | 'error';
  last_deployed_at: string | null;
  deploy_state: string | null;
  issue_counts: { total: number; open: number; done: number };
  tech_stack: string[];
};

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

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch all build repos
  const { data: buildRepos, error: reposError } = await supabase
    .from('dash_build_repos')
    .select('*')
    .order('display_name');

  if (reposError) {
    return NextResponse.json({ error: reposError.message }, { status: 500 });
  }

  // Fetch all issues
  const { data: allIssues, error: issuesError } = await supabase
    .from('dash_issues')
    .select('id, issue_number, repo, title, body, state, station, labels, updated_at');

  if (issuesError) {
    return NextResponse.json({ error: issuesError.message }, { status: 500 });
  }

  // Fetch all deployment cache rows (non-critical — gracefully skip if unavailable)
  type DeploymentCacheRow = {
    repo_full_name: string;
    vercel_deployment_id: string | null;
    deploy_url: string | null;
    deploy_state: string | null;
    deployed_at: string | null;
  };
  const deploymentMap = new Map<string, DeploymentCacheRow>();
  try {
    const adminClient = createSupabaseAdminClient();
    const { data: deployments } = await adminClient
      .from('dash_deployment_cache')
      .select('repo_full_name, vercel_deployment_id, deploy_url, deploy_state, deployed_at');
    if (deployments) {
      for (const d of deployments) {
        deploymentMap.set(d.repo_full_name, d as DeploymentCacheRow);
      }
    }
  } catch {
    // Deployment cache unavailable (e.g. SUPABASE_SERVICE_ROLE_KEY not set) — continue without
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const apps: AppSummary[] = (buildRepos ?? []).map((buildRepo) => {
    const githubRepo: string = buildRepo.github_repo;

    // Find related issues
    const relatedIssues = (allIssues ?? []).filter((issue) => {
      const bodyMatch =
        issue.body != null &&
        issue.body.toLowerCase().startsWith(`build_repo: ${githubRepo.toLowerCase()}`);
      const numberMatch = issue.issue_number === buildRepo.issue_number;
      return bodyMatch || numberMatch;
    });

    // Compute status
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

    // Compute issue counts
    const total = relatedIssues.length;
    const open = relatedIssues.filter(
      (issue) => issue.state === 'open' && issue.station !== 'done',
    ).length;
    const done = relatedIssues.filter((issue) => issue.station === 'done').length;

    // Parse tech stack
    const texts = relatedIssues.flatMap((issue) => [
      issue.title ?? '',
      issue.body ?? '',
    ]);
    texts.push(buildRepo.display_name ?? '');
    const tech_stack = parseTechStack(texts);

    // Deployment info
    const deployment = deploymentMap.get(githubRepo);

    return {
      id: buildRepo.id,
      repo_full_name: githubRepo,
      display_name: buildRepo.display_name,
      live_url: buildRepo.live_url ?? null,
      github_url: `https://github.com/${githubRepo}`,
      status,
      last_deployed_at: deployment?.deployed_at ?? null,
      deploy_state: deployment?.deploy_state ?? null,
      issue_counts: { total, open, done },
      tech_stack,
    };
  });

  return NextResponse.json({ apps });
}
