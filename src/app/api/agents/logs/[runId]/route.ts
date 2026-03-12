import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STORAGE_BUCKET = 'dash-agent-logs';
const POLL_INTERVAL_MS = 1500;
const HEARTBEAT_INTERVAL_MS = 10000;

async function fetchLogBytes(runId: string, offset: number): Promise<{ bytes: Uint8Array; totalSize: number } | null> {
  try {
    const admin = createSupabaseAdminClient();
    const logKey = `${runId}.log`;

    // Try Supabase Storage first
    const { data, error } = await admin.storage
      .from(STORAGE_BUCKET)
      .download(logKey);

    if (!error && data) {
      const buffer = await data.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const slice = bytes.slice(offset);
      return { bytes: slice, totalSize: bytes.length };
    }

    // Fallback: local filesystem (dev only)
    if (process.env.NODE_ENV === 'development') {
      const fs = await import('fs/promises');
      const filePath = `/tmp/factory-agent-logs/${runId}.log`;
      try {
        const fileData = await fs.readFile(filePath);
        const bytes = new Uint8Array(fileData.buffer);
        const slice = bytes.slice(offset);
        return { bytes: slice, totalSize: bytes.length };
      } catch {
        // File not found
      }
    }

    return null;
  } catch (err) {
    console.error('[logs/stream] fetchLogBytes error:', err);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  // Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch run record
  const { data: run, error: runError } = await supabase
    .from('dash_agent_runs')
    .select('id, run_status, log_file_path, started_at, station, model, pid, estimated_cost_usd, exit_code')
    .eq('id', runId)
    .single();

  if (runError || !run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }

  const offsetParam = request.nextUrl.searchParams.get('offset');
  let offset = offsetParam ? parseInt(offsetParam, 10) : 0;
  if (isNaN(offset) || offset < 0) offset = 0;

  // SSE response
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      function sendHeartbeat() {
        controller.enqueue(encoder.encode(`event: heartbeat\ndata: {}\n\n`));
      }

      const isActive = run.run_status === 'running';

      if (!isActive) {
        // Completed run: serve full log in one pass
        const result = await fetchLogBytes(runId, offset);
        if (result && result.bytes.length > 0) {
          const text = new TextDecoder().decode(result.bytes);
          const lines = text.split('\n').filter(l => l.length > 0);
          send('log_chunk', { lines, offset: result.totalSize });
        }
        send('agent_done', {
          exit_code: run.exit_code ?? 0,
          run_status: run.run_status,
          estimated_cost_usd: run.estimated_cost_usd,
        });
        controller.close();
        return;
      }

      // Active run: poll loop
      let currentOffset = offset;
      let heartbeatTimer = Date.now();
      let running = true;

      const checkAborted = () => {
        try {
          request.signal.addEventListener('abort', () => {
            running = false;
            try { controller.close(); } catch {}
          });
        } catch {}
      };
      checkAborted();

      while (running) {
        // Re-check run status
        const { data: freshRun } = await supabase
          .from('dash_agent_runs')
          .select('run_status, exit_code, estimated_cost_usd')
          .eq('id', runId)
          .single();

        const isStillRunning = freshRun?.run_status === 'running';

        // Fetch new bytes
        const result = await fetchLogBytes(runId, currentOffset);
        if (result && result.bytes.length > 0) {
          const text = new TextDecoder().decode(result.bytes);
          const lines = text.split('\n').filter(l => l.length > 0);
          currentOffset = result.totalSize;
          send('log_chunk', { lines, offset: currentOffset });
        }

        if (!isStillRunning) {
          // Agent completed
          send('agent_done', {
            exit_code: freshRun?.exit_code ?? 0,
            run_status: freshRun?.run_status ?? 'completed',
            estimated_cost_usd: freshRun?.estimated_cost_usd,
          });
          running = false;
          break;
        }

        // Heartbeat
        if (Date.now() - heartbeatTimer >= HEARTBEAT_INTERVAL_MS) {
          sendHeartbeat();
          heartbeatTimer = Date.now();
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      try { controller.close(); } catch {}
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
