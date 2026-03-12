import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { Octokit } from '@octokit/rest';

// GET /api/apps/[repoId]/issues
// Returns all dash_issues for the app's github_repo with optional filtering
export async function GET(
  request: NextRequest,
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

  const { searchParams } = request.nextUrl;
  const station = searchParams.get('station');
  const complexity = searchParams.get('complexity');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const sort = searchParams.get('sort') ?? 'date';
  const order = searchParams.get('order') ?? 'desc';

  // Validate
  const validSorts = ['date', 'cost', 'stage', 'complexity'];
  const validOrders = ['asc', 'desc'];
  if (!validSorts.includes(sort)) {
    return NextResponse.json({ error: 'Invalid sort parameter', field: 'sort' }, { status: 400 });
  }
  if (!validOrders.includes(order)) {
    return NextResponse.json({ error: 'Invalid order parameter', field: 'order' }, { status: 400 });
  }

  // Build query
  let query = supabase
    .from('dash_issues')
    .select('id, issue_number, repo, title, station, complexity, created_at, updated_at')
    .eq('repo', buildRepo.github_repo);

  if (station) query = query.eq('station', station);
  if (complexity) query = query.eq('complexity', complexity);
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);

  // Sort mapping
  const sortCol = sort === 'date' ? 'created_at' : sort === 'stage' ? 'station' : sort;
  if (sortCol !== 'cost') {
    query = query.order(sortCol, { ascending: order === 'asc' });
  } else {
    // cost sort: fetch all and sort by joined cost data
    query = query.order('created_at', { ascending: false });
  }

  const { data: issues, error: issuesError } = await query;
  if (issuesError) {
    return NextResponse.json({ error: issuesError.message }, { status: 500 });
  }

  // Fetch cost data for these issues
  const issueIds = (issues ?? []).map((i) => i.id);
  let costMap: Record<string, number> = {};

  if (issueIds.length > 0) {
    const { data: costs } = await supabase
      .from('dash_issue_cost_summary')
      .select('issue_id, total_cost_usd')
      .in('issue_id', issueIds);

    costMap = Object.fromEntries(
      (costs ?? []).map((c) => [String(c.issue_id), Number(c.total_cost_usd ?? 0)]),
    );
  }

  let result = (issues ?? []).map((issue) => ({
    id: String(issue.id),
    github_issue_url: `https://github.com/${issue.repo}/issues/${issue.issue_number}`,
    issue_number: issue.issue_number,
    title: issue.title,
    station: issue.station ?? null,
    complexity: issue.complexity ?? null,
    cost_usd: costMap[String(issue.id)] ?? 0,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  }));

  // Apply cost sort in memory
  if (sort === 'cost') {
    result.sort((a, b) =>
      order === 'asc' ? a.cost_usd - b.cost_usd : b.cost_usd - a.cost_usd,
    );
  }

  return NextResponse.json({ issues: result, total: result.length });
}

// POST /api/apps/[repoId]/issues
// Creates a GitHub issue and a dash_issues row with station: intake
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ repoId: string }> },
) {
  const { repoId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { type?: string; title?: string; body?: string; build_repo?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body', field: 'body' }, { status: 400 });
  }

  const { type, title, body: description, build_repo } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required', field: 'title' }, { status: 400 });
  }

  const validTypes = ['bug_report', 'feature_request', 'design_change', 'performance_fix'];
  if (type && !validTypes.includes(type)) {
    return NextResponse.json({ error: 'Invalid issue type', field: 'type' }, { status: 400 });
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

  const targetRepo = build_repo ?? buildRepo.github_repo;
  const [owner, repoName] = targetRepo.split('/');

  if (!owner || !repoName) {
    return NextResponse.json({ error: 'Invalid repository format', field: 'build_repo' }, { status: 400 });
  }

  // Build GitHub issue body
  const typeLabel = type
    ? `**Type:** ${type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}\n`
    : '';
  const issueBody = [
    `build_repo: ${targetRepo}`,
    '',
    typeLabel,
    description?.trim() ?? '',
  ]
    .filter((line) => line !== undefined)
    .join('\n');

  // Create GitHub issue
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
  }

  const kit = new Octokit({ auth: token });

  const labels = ['station:intake'];
  if (type) labels.push(`type:${type}`);

  let githubIssue: { html_url: string; number: number };
  try {
    const { data } = await kit.issues.create({
      owner,
      repo: repoName,
      title: title.trim(),
      body: issueBody,
      labels,
    });
    githubIssue = { html_url: data.html_url, number: data.number };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'GitHub API error';
    return NextResponse.json({ error: `Failed to create GitHub issue: ${msg}` }, { status: 500 });
  }

  // Sync to get the dash_issues row created
  const origin = request.nextUrl.origin;
  try {
    await fetch(`${origin}/api/sync`, { method: 'POST' });
  } catch {
    // Fire-and-forget, ignore errors
  }

  return NextResponse.json({
    submission_id: null,
    github_issue_url: githubIssue.html_url,
    issue_number: githubIssue.number,
  });
}
