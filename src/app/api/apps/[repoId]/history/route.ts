import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

interface StationTransition {
  from_station: string | null;
  station: string;
  transitioned_at: string;
  actor: string;
}

interface IssueWithHistory {
  issue_number: number;
  title: string;
  transitions: StationTransition[];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ repoId: string }> },
): Promise<NextResponse> {
  const { repoId } = await params;

  // Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Look up the build repo
  const { data: buildRepo, error: repoError } = await supabase
    .from('dash_build_repos')
    .select('id, repo_full_name, issue_number, github_repo')
    .eq('id', repoId)
    .single();

  if (repoError || !buildRepo) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  }

  const repoFullName: string = buildRepo.repo_full_name ?? buildRepo.github_repo ?? buildRepo.id;

  // Find all issues associated with this build repo
  const { data: allIssues } = await supabase
    .from('dash_issues')
    .select('issue_number, title, body, repo');

  const relatedIssues = (allIssues ?? []).filter((issue) => {
    const bodyMatch =
      issue.body != null &&
      issue.body.toLowerCase().startsWith(`build_repo: ${(buildRepo.github_repo ?? '').toLowerCase()}`);
    const numberMatch = issue.issue_number === buildRepo.issue_number;
    return bodyMatch || numberMatch;
  });

  const issueNumbers = relatedIssues.map((i) => i.issue_number);

  if (issueNumbers.length === 0) {
    return NextResponse.json({
      repo_full_name: repoFullName,
      issues: [],
    });
  }

  // Fetch station history for all related issues
  const { data: historyRows, error: historyError } = await supabase
    .from('dash_station_history')
    .select('issue_number, station, from_station, transitioned_at, actor')
    .in('issue_number', issueNumbers)
    .order('transitioned_at', { ascending: true });

  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 });
  }

  // Group transitions by issue
  const transitionsByIssue = new Map<number, StationTransition[]>();
  for (const row of historyRows ?? []) {
    const existing = transitionsByIssue.get(row.issue_number) ?? [];
    existing.push({
      from_station: row.from_station,
      station: row.station,
      transitioned_at: row.transitioned_at,
      actor: row.actor,
    });
    transitionsByIssue.set(row.issue_number, existing);
  }

  const issues: IssueWithHistory[] = relatedIssues.map((issue) => ({
    issue_number: issue.issue_number,
    title: issue.title ?? `Issue #${issue.issue_number}`,
    transitions: transitionsByIssue.get(issue.issue_number) ?? [],
  }));

  return NextResponse.json({
    repo_full_name: repoFullName,
    issues,
  });
}
