import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

interface RouteParams {
  params: Promise<{ number: string }>;
}

/**
 * GET /api/issues/[number]/attachment-context
 *
 * Returns a formatted markdown string ready to inject into agent system prompts.
 * Pipeline orchestrator calls this before dispatching SPEC, DESIGN, or BUILD agents.
 *
 * Response: { context: string }
 *   - Empty string if no attachments
 *   - Formatted "## Attached Files" block if attachments exist
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { number: issueNumberStr } = await params;
    const issueNumber = parseInt(issueNumberStr, 10);
    if (isNaN(issueNumber)) {
      return NextResponse.json({ error: 'Invalid issue number' }, { status: 400 });
    }

    const { data: attachments, error } = await supabase
      .from('fd_issue_attachments')
      .select('id, filename, file_type, url')
      .eq('issue_number', issueNumber)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!attachments || attachments.length === 0) {
      return NextResponse.json({ context: '' });
    }

    // Build formatted context string for agent system prompts
    const lines: string[] = [
      `## Attached Files`,
      `The following files were attached by the client for issue #${issueNumber}:`,
      '',
    ];

    attachments.forEach((att, idx) => {
      const ext = att.filename.split('.').pop()?.toLowerCase();
      const isPen = att.file_type === 'application/x-pencil' || ext === 'pen';
      const isPdf = att.file_type === 'application/pdf' || ext === 'pdf';
      const isImage = att.file_type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext ?? '');

      let label = '';
      if (isPen) {
        label = '[Pencil.dev design file — read JSON from URL for screen/component definitions]';
      } else if (isPdf) {
        label = '[PDF document — download URL for viewing]';
      } else if (isImage) {
        label = '[Image: use as design reference]';
      } else {
        label = '[File attachment]';
      }

      lines.push(`${idx + 1}. ${att.filename} (${att.file_type}) — ${att.url}`);
      lines.push(`   ${label}`);
    });

    return NextResponse.json({ context: lines.join('\n') });
  } catch (err) {
    console.error('attachment-context error:', err);
    return NextResponse.json({ error: 'Failed to build attachment context' }, { status: 500 });
  }
}
