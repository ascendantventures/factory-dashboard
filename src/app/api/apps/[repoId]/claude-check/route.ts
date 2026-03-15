import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// GET /api/apps/[repoId]/claude-check
// Checks whether the target repo has a CLAUDE.md file.
// Used by CreateIssueModal to show the auto-inject indicator.
// Never exposes GITHUB_TOKEN to the client.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repoId: string }> },
) {
  const { repoId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ exists: false }, { status: 401 });
  }

  const decoded = decodeURIComponent(repoId);
  const [owner, repo] = decoded.split('/');
  if (!owner || !repo) {
    return NextResponse.json({ exists: false });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ exists: false });
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/CLAUDE.md`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        // Short timeout — this is a prefetch for UI indicator only
        signal: AbortSignal.timeout(5000),
      },
    );

    if (res.status === 200) {
      return NextResponse.json({ exists: true });
    }
    // 404 = no CLAUDE.md; any other status = treat as absent
    return NextResponse.json({ exists: false });
  } catch {
    // Network error, timeout, etc. — fail silently
    return NextResponse.json({ exists: false });
  }
}
