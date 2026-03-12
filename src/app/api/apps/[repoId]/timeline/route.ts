import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// GET /api/apps/[repoId]/timeline
// Returns fadash_timeline_events for all submissions in this app
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
  const submissionId = searchParams.get('submission_id');
  const limitParam = searchParams.get('limit');
  const limit = Math.min(Number(limitParam ?? 100), 500);

  // Get all issue IDs for this repo
  const { data: issues, error: issuesError } = await supabase
    .from('dash_issues')
    .select('id, issue_number, title, repo')
    .eq('repo', buildRepo.github_repo);

  if (issuesError) {
    return NextResponse.json({ error: issuesError.message }, { status: 500 });
  }

  const allIssues = issues ?? [];
  if (allIssues.length === 0) {
    return NextResponse.json({ events: [] });
  }

  // Build issue title lookup
  const issueMap = Object.fromEntries(
    allIssues.map((i) => [String(i.id), { title: i.title, issue_number: i.issue_number, repo: i.repo }]),
  );

  const issueIds = allIssues.map((i) => i.id);

  // Query timeline events
  let query = supabase
    .from('fadash_timeline_events')
    .select('id, submission_id, event_type, station, occurred_at, duration_seconds, metadata')
    .in('submission_id', issueIds)
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (submissionId) {
    query = query.eq('submission_id', submissionId);
  }

  const { data: events, error: eventsError } = await query;
  if (eventsError) {
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  const result = (events ?? []).map((event) => {
    const issue = issueMap[String(event.submission_id)];
    return {
      id: event.id,
      submission_id: String(event.submission_id),
      issue_title: issue?.title ?? null,
      issue_number: issue?.issue_number ?? null,
      event_type: event.event_type,
      station: event.station ?? null,
      occurred_at: event.occurred_at,
      duration_seconds: event.duration_seconds ?? null,
      metadata: event.metadata ?? {},
    };
  });

  return NextResponse.json({ events: result });
}
