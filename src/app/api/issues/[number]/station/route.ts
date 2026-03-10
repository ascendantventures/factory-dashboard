import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { updateIssueLabel } from '@/lib/github';
import { Station, STATIONS } from '@/lib/constants';

interface RouteParams {
  params: Promise<{ number: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { number: issueNumberStr } = await params;
    const issueNumber = parseInt(issueNumberStr, 10);
    const repo = request.nextUrl.searchParams.get('repo');
    const body = await request.json();
    const newStation: Station = body.station;

    if (!STATIONS.includes(newStation)) {
      return NextResponse.json({ error: 'Invalid station' }, { status: 400 });
    }

    let query = supabase.from('dash_issues').select('*').eq('issue_number', issueNumber);
    if (repo) query = query.eq('repo', repo);
    const { data: issue, error: fetchError } = await query.single();

    if (fetchError || !issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const admin = createSupabaseAdminClient();

    // Update in DB
    await admin
      .from('dash_issues')
      .update({ station: newStation, updated_at: new Date().toISOString() })
      .eq('id', issue.id);

    // Record transition
    await admin.from('dash_stage_transitions').insert({
      issue_id: issue.id,
      repo: issue.repo,
      issue_number: issue.issue_number,
      from_station: issue.station,
      to_station: newStation,
      transitioned_at: new Date().toISOString(),
    });

    // Update GitHub label
    if (process.env.GITHUB_TOKEN) {
      try {
        const [owner, repoName] = issue.repo.split('/');
        await updateIssueLabel(owner, repoName, issueNumber, issue.station, newStation);
      } catch (ghErr) {
        console.error('GitHub label update failed:', ghErr);
        // Don't fail the request – DB is updated
      }
    }

    return NextResponse.json({ success: true, station: newStation });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update station' }, { status: 500 });
  }
}
