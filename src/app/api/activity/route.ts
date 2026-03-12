import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export type ActivityEventType =
  | 'agent_spawned'
  | 'stage_completed'
  | 'build_deployed'
  | 'qa_result'
  | 'bug_filed'
  | 'cost_logged';

export interface ActivityEvent {
  id: string;
  event_type: ActivityEventType;
  source: 'transition' | 'run' | 'issue';
  source_id: string;
  occurred_at: string;
  issue_number: number | null;
  issue_title: string | null;
  repo: string;
  from_station: string | null;
  to_station: string | null;
  duration_seconds: number | null;
  station: string | null;
  run_status: string | null;
  model: string | null;
  estimated_cost_usd: number | null;
  live_url: string | null;
  log_summary: string | null;
}

function mapTransitionToEvent(row: Record<string, unknown>, issueTitle: string | null): ActivityEvent {
  const metadata = row.metadata as Record<string, unknown> | null;
  const liveUrl = metadata?.live_url as string | null ?? null;
  const toStation = row.to_station as string | null;

  let eventType: ActivityEventType = 'stage_completed';
  if (toStation === 'done' && liveUrl) {
    eventType = 'build_deployed';
  }

  return {
    id: `transition:${row.id}`,
    event_type: eventType,
    source: 'transition',
    source_id: String(row.id),
    occurred_at: row.transitioned_at as string,
    issue_number: row.issue_number as number | null,
    issue_title: issueTitle,
    repo: row.repo as string,
    from_station: row.from_station as string | null,
    to_station: toStation,
    duration_seconds: row.duration_seconds as number | null,
    station: null,
    run_status: null,
    model: null,
    estimated_cost_usd: null,
    live_url: liveUrl,
    log_summary: null,
  };
}

function mapRunToEvent(row: Record<string, unknown>, issueTitle: string | null): ActivityEvent {
  const runStatus = row.run_status as string | null;
  const station = row.station as string | null;
  const estimatedCost = row.estimated_cost_usd as number | null;

  let eventType: ActivityEventType = 'agent_spawned';
  if (runStatus === 'running') {
    eventType = 'agent_spawned';
  } else if (station === 'qa' && (runStatus === 'completed' || runStatus === 'failed')) {
    eventType = 'qa_result';
  } else if (estimatedCost !== null && runStatus === 'completed') {
    eventType = 'cost_logged';
  }

  return {
    id: `run:${row.id}`,
    event_type: eventType,
    source: 'run',
    source_id: String(row.id),
    occurred_at: (row.started_at as string),
    issue_number: row.issue_number as number | null,
    issue_title: issueTitle,
    repo: row.repo as string,
    from_station: null,
    to_station: null,
    duration_seconds: row.duration_seconds as number | null,
    station: station,
    run_status: runStatus,
    model: row.model as string | null,
    estimated_cost_usd: estimatedCost,
    live_url: null,
    log_summary: row.log_summary as string | null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = Math.min(Number(limitParam) || 50, 200);
    const before = request.nextUrl.searchParams.get('before');

    const admin = createSupabaseAdminClient();

    // Two parallel queries
    let transitionsQuery = admin
      .from('dash_stage_transitions')
      .select('id, issue_id, issue_number, repo, from_station, to_station, transitioned_at, duration_seconds, metadata')
      .order('transitioned_at', { ascending: false })
      .limit(limit);

    let runsQuery = admin
      .from('dash_agent_runs')
      .select('id, issue_id, issue_number, repo, station, model, started_at, run_status, duration_seconds, estimated_cost_usd, log_summary')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (before) {
      transitionsQuery = transitionsQuery.lt('transitioned_at', before);
      runsQuery = runsQuery.lt('started_at', before);
    }

    const [transitionsRes, runsRes] = await Promise.all([transitionsQuery, runsQuery]);

    const transitions = transitionsRes.data ?? [];
    const runs = runsRes.data ?? [];

    // Collect issue_numbers to resolve titles
    const issueNumbers = [
      ...new Set([
        ...transitions.map((t) => t.issue_number),
        ...runs.map((r) => r.issue_number),
      ].filter(Boolean)),
    ] as number[];

    // Build issue title map
    const issueTitleMap = new Map<number, string>();
    if (issueNumbers.length > 0) {
      const { data: issuesData } = await admin
        .from('dash_issues')
        .select('issue_number, title')
        .in('issue_number', issueNumbers);

      for (const issue of issuesData ?? []) {
        issueTitleMap.set(issue.issue_number, issue.title);
      }
    }

    // Map to ActivityEvent
    const transitionEvents: ActivityEvent[] = transitions.map((t) =>
      mapTransitionToEvent(t as Record<string, unknown>, issueTitleMap.get(t.issue_number) ?? null)
    );

    const runEvents: ActivityEvent[] = runs.map((r) =>
      mapRunToEvent(r as Record<string, unknown>, issueTitleMap.get(r.issue_number) ?? null)
    );

    // Merge + sort by occurred_at DESC, slice to limit
    const allEvents = [...transitionEvents, ...runEvents]
      .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
      .slice(0, limit);

    return NextResponse.json({ events: allEvents });
  } catch (err) {
    console.error('Activity feed error:', err);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
