import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

type ControlAction = 'start_loop' | 'stop_loop' | 'force_tick' | 'clear_locks' | 'clear_backoff';

const PID_FILE = process.env.HARNESS_PID_FILE || '/tmp/harness.pid';
const LOCK_DIR = process.env.HARNESS_LOCK_DIR || '/tmp';
const BACKOFF_DIR = process.env.HARNESS_BACKOFF_DIR || '/tmp';
const FORCE_TICK_FILE = process.env.HARNESS_FORCE_TICK_FILE || '/tmp/harness-force-tick';
const HARNESS_CMD = process.env.HARNESS_START_CMD || 'node /app/loop.js';
const HARNESS_CWD = process.env.HARNESS_CWD || '/app';

async function logAction(
  action: string,
  issueNumber: number | null,
  operatorEmail: string,
  metadata?: Record<string, unknown>
) {
  try {
    const admin = createSupabaseAdminClient();
    await admin.from('pipeline_audit_log').insert({
      action_name: action,
      issue_number: issueNumber,
      operator_email: operatorEmail,
      metadata: metadata || null,
    });
  } catch (err) {
    console.error('[pipeline/control] failed to log action:', err);
  }
}

function readPid(): number | null {
  try {
    if (fs.existsSync(PID_FILE)) {
      const content = fs.readFileSync(PID_FILE, 'utf8').trim();
      const pid = parseInt(content.split('\n')[0], 10);
      if (!isNaN(pid)) return pid;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const operatorEmail = user.email || 'unknown';
    const body = await req.json() as { action: ControlAction };
    const { action } = body;

    if (!['start_loop', 'stop_loop', 'force_tick', 'clear_locks', 'clear_backoff'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    let message = '';

    switch (action) {
      case 'start_loop': {
        const existingPid = readPid();
        if (existingPid) {
          try {
            process.kill(existingPid, 0);
            return NextResponse.json({ ok: false, message: 'Loop is already running' }, { status: 409 });
          } catch {
            // Process not running, continue
          }
        }
        // Start the harness process
        try {
          const child = require('child_process').spawn(
            HARNESS_CMD.split(' ')[0],
            HARNESS_CMD.split(' ').slice(1),
            {
              cwd: fs.existsSync(HARNESS_CWD) ? HARNESS_CWD : undefined,
              detached: true,
              stdio: 'ignore',
              env: { ...process.env },
            }
          );
          child.unref();
          const startedAt = Date.now();
          fs.writeFileSync(PID_FILE, `${child.pid}\n${startedAt}`);
          message = `Loop started with PID ${child.pid}`;
        } catch (err) {
          console.error('[pipeline/control] start_loop error:', err);
          message = `Failed to start loop: ${err instanceof Error ? err.message : 'unknown error'}`;
          return NextResponse.json({ ok: false, message }, { status: 500 });
        }
        break;
      }

      case 'stop_loop': {
        const pid = readPid();
        if (!pid) {
          return NextResponse.json({ ok: false, message: 'Loop is not running' }, { status: 409 });
        }
        try {
          process.kill(pid, 'SIGTERM');
          // Give it 5s then SIGKILL
          setTimeout(() => {
            try {
              process.kill(pid, 0);
              process.kill(pid, 'SIGKILL');
            } catch {
              // Already stopped
            }
          }, 5000);
          fs.unlinkSync(PID_FILE);
          message = `Loop stopped (PID ${pid})`;
        } catch (err) {
          console.error('[pipeline/control] stop_loop error:', err);
          // PID file might be stale
          try { fs.unlinkSync(PID_FILE); } catch { /* ignore */ }
          message = `Stop signal sent (process may have already exited)`;
        }
        break;
      }

      case 'force_tick': {
        fs.writeFileSync(FORCE_TICK_FILE, new Date().toISOString());
        message = 'Force tick triggered';
        break;
      }

      case 'clear_locks': {
        try {
          const files = fs.readdirSync(LOCK_DIR).filter((f) => f.match(/^harness-\d+\.lock$/));
          for (const f of files) {
            fs.unlinkSync(path.join(LOCK_DIR, f));
          }
          message = `Cleared ${files.length} lock file(s)`;
        } catch (err) {
          message = `Error clearing locks: ${err instanceof Error ? err.message : 'unknown'}`;
        }
        break;
      }

      case 'clear_backoff': {
        try {
          const files = fs.readdirSync(BACKOFF_DIR).filter((f) => f.match(/^backoff-\d+\.json$/));
          for (const f of files) {
            fs.unlinkSync(path.join(BACKOFF_DIR, f));
          }
          message = `Cleared ${files.length} backoff file(s)`;
        } catch (err) {
          message = `Error clearing backoffs: ${err instanceof Error ? err.message : 'unknown'}`;
        }
        break;
      }
    }

    await logAction(action, null, operatorEmail, { message });

    return NextResponse.json({ ok: true, message });
  } catch (err) {
    console.error('[pipeline/control] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
