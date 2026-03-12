import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { fetchIssueCommentsFull, postIssueComment } from '@/lib/github';

interface RouteParams {
  params: Promise<{ number: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { number: issueNumberStr } = await params;
    const issueNumber = parseInt(issueNumberStr, 10);

    if (isNaN(issueNumber)) {
      return NextResponse.json({ error: 'Invalid issue number' }, { status: 400 });
    }

    const repoFull = process.env.GITHUB_BUILD_REPO ?? '';
    if (!repoFull) {
      return NextResponse.json({ error: 'GITHUB_BUILD_REPO not configured' }, { status: 500 });
    }

    const [owner, repo] = repoFull.split('/');

    try {
      const comments = await fetchIssueCommentsFull(owner, repo, issueNumber);
      return NextResponse.json({ comments });
    } catch (err: unknown) {
      // Handle GitHub rate limit
      if (
        err &&
        typeof err === 'object' &&
        'status' in err &&
        (err as { status: number }).status === 403
      ) {
        const headers: Record<string, string> = {};
        if (
          'response' in err &&
          err.response &&
          typeof err.response === 'object' &&
          'headers' in (err.response as object)
        ) {
          const responseHeaders = (err.response as { headers: Record<string, string> }).headers;
          const retryAfter = responseHeaders['retry-after'] ?? responseHeaders['x-ratelimit-reset'];
          if (retryAfter) {
            headers['Retry-After'] = retryAfter;
          }
        }
        return NextResponse.json({ error: 'GitHub rate limit exceeded' }, { status: 429, headers });
      }
      throw err;
    }
  } catch (err) {
    console.error('[GET /api/issues/[number]/comments]', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { number: issueNumberStr } = await params;
    const issueNumber = parseInt(issueNumberStr, 10);

    if (isNaN(issueNumber)) {
      return NextResponse.json({ error: 'Invalid issue number' }, { status: 400 });
    }

    const body = await request.json();
    const commentBody: unknown = body?.body;

    if (!commentBody || typeof commentBody !== 'string' || commentBody.trim().length === 0) {
      return NextResponse.json({ error: 'body is required' }, { status: 400 });
    }

    if (commentBody.length > 65536) {
      return NextResponse.json(
        { error: 'body exceeds maximum length of 65536 characters' },
        { status: 400 }
      );
    }

    const repoFull = process.env.GITHUB_BUILD_REPO ?? '';
    if (!repoFull) {
      return NextResponse.json({ error: 'GITHUB_BUILD_REPO not configured' }, { status: 500 });
    }

    const [owner, repo] = repoFull.split('/');

    try {
      const comment = await postIssueComment(owner, repo, issueNumber, commentBody.trim());
      return NextResponse.json({ comment }, { status: 201 });
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'status' in err &&
        (err as { status: number }).status === 403
      ) {
        return NextResponse.json({ error: 'GitHub rate limit exceeded' }, { status: 429 });
      }
      throw err;
    }
  } catch (err) {
    console.error('[POST /api/issues/[number]/comments]', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
