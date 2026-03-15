import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// GET /api/apps/[repoId]/timeline
// Returns fadash_timeline_events for all issues belonging to this app.
// submission_id in fadash_timeline_events = dash_issues.id = GitHub issue number (bigint).
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

  const decoded = decodeURIComponent(repoId);

  const { searchParams } = request.nextUrl;
  const limitParam = searchParams.get('limit');
  const limit = Math.min(Number(limitParam ?? 100), 500);

  // Find all issues that reference this build repo
  const { data: issues, error: issuesError } = await supabase
    .from('dash_issues')
    .select('id, issue_number, title, repo')
    .ilike('body', `%build_repo: ${decoded}%`);

  if (issuesError) {
    return NextResponse.json({ error: issuesError.message }, { status: 500 });
  }

  const allIssues = issues ?? [];
  if (allIssues.length === 0) {
    return NextResponse.json({ events: [] });
  }

  const issueMap = Object.fromEntries(
    allIssues.map((i) => [String(i.id), { title: i.title, issue_number: i.issue_number, repo: i.repo }]),
  );
  const issueIds = allIssues.map((i) => i.id);

  const { data: events, error: eventsError } = await supabase
    .from('fadash_timeline_events')
    .select('id, submission_id, event_type, station, occurred_at, duration_seconds, metadata')
    .in('submission_id', issueIds)
    .order('occurred_at', { ascending: false })
    .limit(limit);

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
