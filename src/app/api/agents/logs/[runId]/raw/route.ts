import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

const STORAGE_BUCKET = 'dash-agent-logs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  // Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch run record to validate
  const { data: run, error: runError } = await supabase
    .from('dash_agent_runs')
    .select('id, log_file_path')
    .eq('id', runId)
    .single();

  if (runError || !run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }

  const admin = createSupabaseAdminClient();
  const logKey = `${runId}.log`;

  // Try Supabase Storage
  const { data, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .download(logKey);

  if (!error && data) {
    const text = await data.text();
    return new Response(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${runId}.log"`,
      },
    });
  }

  // Fallback: local filesystem (dev only)
  if (process.env.NODE_ENV === 'development') {
    try {
      const fs = await import('fs/promises');
      const text = await fs.readFile(`/tmp/factory-agent-logs/${runId}.log`, 'utf-8');
      return new Response(text, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${runId}.log"`,
        },
      });
    } catch {
      // Not found
    }
  }

  return NextResponse.json({ error: 'Log file not found' }, { status: 404 });
}
