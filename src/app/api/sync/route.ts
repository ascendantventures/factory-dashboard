import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { fetchRepoIssues, extractStation, extractComplexity, extractIssueType } from '@/lib/github';

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tracked repos for this user
    const { data: config } = await supabase
      .from('dash_dashboard_config')
      .select('tracked_repos')
      .eq('user_id', user.id)
      .single();

    const repos: string[] = config?.tracked_repos ?? [];

    if (repos.length === 0) {
      return NextResponse.json({ message: 'No repos configured', synced: 0 });
    }

    const admin = createSupabaseAdminClient();
    let totalSynced = 0;

    for (const repoPath of repos) {
      const [owner, repo] = repoPath.split('/');
      if (!owner || !repo) continue;

      try {
        const issues = await fetchRepoIssues(owner, repo);

        for (const ghIssue of issues) {
          const station = extractStation(ghIssue.labels);
          const complexity = extractComplexity(ghIssue.labels);
          const issueType = extractIssueType(ghIssue.labels);
          const labelNames = ghIssue.labels
            .map((l) => l.name)
            .filter((n): n is string => !!n);

          const record = {
            id: ghIssue.number,
            issue_number: ghIssue.number,
            repo: repoPath,
            title: ghIssue.title,
            body: ghIssue.body,
            state: ghIssue.state,
            station,
            complexity,
            issue_type: issueType,
            author: ghIssue.user?.login ?? null,
            assignee: ghIssue.assignee?.login ?? null,
            labels: labelNames,
            created_at: ghIssue.created_at,
            updated_at: ghIssue.updated_at,
            closed_at: ghIssue.closed_at,
            synced_at: new Date().toISOString(),
          };

          const { data: existing } = await admin
            .from('dash_issues')
            .select('id, station')
            .eq('issue_number', ghIssue.number)
            .eq('repo', repoPath)
            .single();

          if (existing) {
            // Check if station changed
            if (existing.station !== station) {
              await admin.from('dash_stage_transitions').insert({
                issue_id: existing.id,
                repo: repoPath,
                issue_number: ghIssue.number,
                from_station: existing.station,
                to_station: station,
                transitioned_at: new Date().toISOString(),
              });
            }
            await admin
              .from('dash_issues')
              .update(record)
              .eq('id', existing.id);
          } else {
            await admin.from('dash_issues').insert(record);
          }

          totalSynced++;
        }
      } catch (err) {
        console.error(`Failed to sync ${repoPath}:`, err);
      }
    }

    // Update sync timestamp in config
    await supabase
      .from('dash_dashboard_config')
      .update({ updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    return NextResponse.json({ message: 'Sync complete', synced: totalSynced });
  } catch (err) {
    console.error('Sync error:', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
