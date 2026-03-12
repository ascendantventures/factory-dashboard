import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { Octokit } from '@octokit/rest';

const GITHUB_REPO = process.env.GITHUB_REPO || 'ascendantventures/harness-beta-test';
const [OWNER, REPO] = GITHUB_REPO.split('/');

const STATION_ORDER = ['intake', 'spec', 'design', 'build', 'qa', 'done'] as const;
type StationOrderType = typeof STATION_ORDER[number];

function getOctokit() {
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

async function getCurrentStationLabel(
  octokit: Octokit,
  issueNumber: number
): Promise<{ station: StationOrderType | null; allLabels: string[] }> {
  const { data: issue } = await octokit.issues.get({
    owner: OWNER,
    repo: REPO,
    issue_number: issueNumber,
  });

  const allLabels = issue.labels
    .map((l) => (typeof l === 'string' ? l : l.name))
    .filter((n): n is string => !!n);

  const stationLabel = allLabels.find((l) => l.startsWith('station:'));
  const station = stationLabel ? (stationLabel.replace('station:', '') as StationOrderType) : null;

  return { station, allLabels };
}

async function setLabels(octokit: Octokit, issueNumber: number, labels: string[]) {
  await octokit.issues.setLabels({
    owner: OWNER,
    repo: REPO,
    issue_number: issueNumber,
    labels,
  });
}

async function addComment(octokit: Octokit, issueNumber: number, body: string) {
  await octokit.issues.createComment({
    owner: OWNER,
    repo: REPO,
    issue_number: issueNumber,
    body,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const issueNumber = parseInt(resolvedParams.number, 10);
    if (isNaN(issueNumber)) {
      return NextResponse.json({ error: 'Invalid issue number' }, { status: 400 });
    }

    const body = await req.json() as {
      action: 'skip' | 'block' | 'retry' | 'advance' | 'revert';
      reason?: string;
    };

    const { action, reason } = body;

    if (!['skip', 'block', 'retry', 'advance', 'revert'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const octokit = getOctokit();
    const { station, allLabels } = await getCurrentStationLabel(octokit, issueNumber);
    const nonStationLabels = allLabels.filter((l) => !l.startsWith('station:'));

    const operatorEmail = user.email || 'unknown';
    let labelApplied = '';
    let actionName = '';

    switch (action) {
      case 'skip': {
        const newLabels = [...nonStationLabels, 'station:skip'];
        await setLabels(octokit, issueNumber, newLabels);
        labelApplied = 'station:skip';
        actionName = 'skip_issue';
        break;
      }

      case 'block': {
        const newLabels = [...nonStationLabels, 'station:blocked'];
        await setLabels(octokit, issueNumber, newLabels);
        if (reason) {
          await addComment(
            octokit,
            issueNumber,
            `**Blocked by ${operatorEmail}**\n\nReason: ${reason}`
          );
        }
        labelApplied = 'station:blocked';
        actionName = 'block_issue';
        break;
      }

      case 'retry': {
        if (!station) {
          return NextResponse.json(
            { error: 'Issue has no current station label' },
            { status: 400 }
          );
        }
        // Remove and re-add the current station label
        const withoutStation = allLabels.filter((l) => !l.startsWith('station:'));
        await setLabels(octokit, issueNumber, withoutStation);
        await new Promise((r) => setTimeout(r, 500));
        await setLabels(octokit, issueNumber, [...withoutStation, `station:${station}`]);
        labelApplied = `station:${station}`;
        actionName = 'retry_issue';
        break;
      }

      case 'advance': {
        if (!station) {
          return NextResponse.json(
            { error: 'Issue has no current station label' },
            { status: 400 }
          );
        }
        const currentIdx = STATION_ORDER.indexOf(station as StationOrderType);
        if (currentIdx === -1 || currentIdx >= STATION_ORDER.length - 1) {
          return NextResponse.json(
            { error: 'Cannot advance past the last station' },
            { status: 400 }
          );
        }
        const nextStation = STATION_ORDER[currentIdx + 1];
        const newLabels = [...nonStationLabels, `station:${nextStation}`];
        await setLabels(octokit, issueNumber, newLabels);
        labelApplied = `station:${nextStation}`;
        actionName = 'advance_issue';
        break;
      }

      case 'revert': {
        if (!station) {
          return NextResponse.json(
            { error: 'Issue has no current station label' },
            { status: 400 }
          );
        }
        const currentIdx = STATION_ORDER.indexOf(station as StationOrderType);
        if (currentIdx <= 0) {
          return NextResponse.json(
            { error: 'Cannot revert past the first station' },
            { status: 400 }
          );
        }
        const prevStation = STATION_ORDER[currentIdx - 1];
        const newLabels = [...nonStationLabels, `station:${prevStation}`];
        await setLabels(octokit, issueNumber, newLabels);
        labelApplied = `station:${prevStation}`;
        actionName = 'revert_issue';
        break;
      }
    }

    // Log to audit
    const admin = createSupabaseAdminClient();
    await admin.from('pipeline_audit_log').insert({
      action_name: actionName,
      issue_number: issueNumber,
      operator_email: operatorEmail,
      metadata: { label_applied: labelApplied, reason: reason || null },
    });

    return NextResponse.json({ ok: true, label_applied: labelApplied });
  } catch (err) {
    console.error('[issues/action] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
