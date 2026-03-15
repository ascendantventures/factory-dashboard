import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ repoId: string }> }
) {
  const { repoId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch build repo
  const { data: buildRepo, error: repoError } = await supabase
    .from('dash_build_repos')
    .select('id, repo_full_name, github_repo, issue_number')
    .eq('id', repoId)
    .single();

  if (repoError || !buildRepo) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  }

  const repoFullName: string = buildRepo.repo_full_name ?? buildRepo.github_repo;
  const githubRepo: string = buildRepo.github_repo;

  // Fetch related issues
  const { data: allIssues } = await supabase
    .from('dash_issues')
    .select('id, issue_number, title, station');

  const relatedIssues = (allIssues ?? []).filter((issue) => {
    const numberMatch = issue.issue_number === buildRepo.issue_number;
    return numberMatch;
  });

  const issueNumbers = relatedIssues.map((i) => i.issue_number).filter(Boolean);

  // Fetch station history for these issue numbers
  const { data: historyRows, error: historyError } = await supabase
    .from('dash_station_history')
    .select('issue_number, station, from_station, transitioned_at, actor')
    .in('issue_number', issueNumbers.length > 0 ? issueNumbers : [-1])
    .order('transitioned_at', { ascending: true });

  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 });
  }

  // Group transitions by issue number
  const transitionsByIssue: Record<number, typeof historyRows> = {};
  for (const row of historyRows ?? []) {
    if (!transitionsByIssue[row.issue_number]) {
      transitionsByIssue[row.issue_number] = [];
    }
    transitionsByIssue[row.issue_number]!.push(row);
  }

  const issues = relatedIssues.map((issue) => ({
    issue_number: issue.issue_number,
    title: issue.title,
    transitions: (transitionsByIssue[issue.issue_number] ?? []).map((t) => ({
      from_station: t.from_station ?? null,
      station: t.station,
      transitioned_at: t.transitioned_at,
      actor: t.actor,
    })),
  }));

  return NextResponse.json({
    repo_full_name: repoFullName,
    issues,
  });
}
