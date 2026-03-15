import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { Octokit } from '@octokit/rest';

// ─── CLAUDE.md fetch helper ────────────────────────────────────────────────────
// Fetches CLAUDE.md content from the target repo server-side.
// Returns the file content as a string, or null if not found / error.
// GITHUB_TOKEN is never exposed to the client.
async function fetchClaudeMd(owner: string, repo: string, token: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/CLAUDE.md`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (res.status !== 200) return null;

    const data = await res.json() as { content?: string; encoding?: string };
    if (!data.content || data.encoding !== 'base64') return null;

    // Decode base64 content (GitHub returns base64 with newlines)
    const decoded = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');
    return decoded;
  } catch {
    // Timeout, network error, etc. — fail silently
    return null;
  }
}

// ─── Wrap body with CLAUDE.md context block ────────────────────────────────────
function injectClaudeMd(body: string, claudeContent: string): string {
  const details = [
    '<details>',
    '<summary>📋 Project Context (CLAUDE.md)</summary>',
    '',
    claudeContent,
    '',
    '</details>',
    '',
    '---',
    '',
    body,
  ].join('\n');
  return details;
}

// ─── GET /api/apps/[repoId]/issues ────────────────────────────────────────────
// Returns issues for this app (filtered by build_repo reference in body).
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
  const station = searchParams.get('station');
  const limitParam = searchParams.get('limit');
  const limit = Math.min(Number(limitParam ?? 100), 500);

  let query = supabase
    .from('dash_issues')
    .select('id, issue_number, repo, title, station, updated_at')
    .ilike('body', `%build_repo: ${decoded}%`)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (station) query = query.eq('station', station);

  const { data: issues, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ issues: issues ?? [], total: (issues ?? []).length });
}

// ─── POST /api/apps/[repoId]/issues ───────────────────────────────────────────
// Creates a GitHub issue for this app with optional CLAUDE.md context injection.
// Phase 2: auto-fetches CLAUDE.md from the target repo and prepends as <details> block.
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

  let requestBody: {
    type?: string;
    title?: string;
    description?: string;
    // Legacy fields from NewIssueModal / QuickCreateModal
    body?: string;
    complexityHint?: string;
    issueType?: string;
  };
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { type, title, description, body: legacyBody, complexityHint, issueType } = requestBody;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required', field: 'title' }, { status: 400 });
  }

  const decoded = decodeURIComponent(repoId);
  const [owner, repo] = decoded.split('/');
  if (!owner || !repo) {
    return NextResponse.json({ error: 'Invalid repository format' }, { status: 400 });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
  }

  // Phase 2: fetch CLAUDE.md server-side (best-effort, fail silently)
  const claudeContent = await fetchClaudeMd(owner, repo, token);

  // Build issue body — support legacy (body) and new (description + type) formats
  let rawBody: string;
  if (legacyBody) {
    // Legacy format: body already includes build_repo: line from the modal
    rawBody = legacyBody.trim();
  } else {
    // New format: description + type — route constructs body with build_repo:
    const typeLabel = type ? `**Type:** ${type}\n` : '';
    const userContent = [typeLabel, description?.trim() ?? ''].filter(Boolean).join('\n');
    rawBody = [`build_repo: ${decoded}`, '', userContent].join('\n');
  }

  // Inject CLAUDE.md context if found (prepend as collapsible block per AC-002.1)
  const issueBody = claudeContent ? injectClaudeMd(rawBody, claudeContent) : rawBody;

  // Create GitHub issue
  const kit = new Octokit({ auth: token });
  const labels = ['station:intake'];
  if (complexityHint) labels.push(`complexity:${complexityHint}`);
  if (issueType) labels.push(`type:${issueType}`);
  if (type && !issueType) {
    // Map display type to label slug
    const typeSlug = type.toLowerCase().replace(/\s+/g, '-');
    labels.push(`type:${typeSlug}`);
  }

  let githubIssue: { html_url: string; number: number };
  try {
    const { data } = await kit.issues.create({
      owner,
      repo,
      title: title.trim(),
      body: issueBody,
      labels,
    });
    githubIssue = { html_url: data.html_url, number: data.number };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'GitHub API error';
    return NextResponse.json({ error: `Failed to create GitHub issue: ${msg}` }, { status: 500 });
  }

  // Fire-and-forget sync
  try {
    const origin = request.nextUrl.origin;
    fetch(`${origin}/api/sync`, { method: 'POST' }).catch(() => {});
  } catch {
    // Ignore
  }

  return NextResponse.json({
    issueNumber: githubIssue.number,
    issueUrl: githubIssue.html_url,
    // Legacy fields for backward compat with existing NewIssueModal / QuickCreateModal
    url: githubIssue.html_url,
    number: githubIssue.number,
  });
}
