import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import * as fs from 'fs';
import * as path from 'path';

interface LockEntry {
  issue: number;
  station: string;
  locked_at: string;
}

interface BackoffEntry {
  issue: number;
  until: string;
  crash_count: number;
}

interface LoopStatus {
  running: boolean;
  pid: number | null;
  uptime_seconds: number | null;
  last_tick_at: string | null;
}

interface Counts {
  processed_today: number;
  processed_week: number;
  processed_total: number;
  active_agents: number;
  errors_today: number;
}

function readPidFile(): { pid: number | null; startedAt: number | null } {
  try {
    const pidFile = process.env.HARNESS_PID_FILE || '/tmp/harness.pid';
    if (fs.existsSync(pidFile)) {
      const content = fs.readFileSync(pidFile, 'utf8').trim();
      const lines = content.split('\n');
      const pid = parseInt(lines[0], 10);
      const startedAt = lines[1] ? parseInt(lines[1], 10) : null;
      if (!isNaN(pid)) {
        // Check if process is actually running
        try {
          process.kill(pid, 0);
          return { pid, startedAt };
        } catch {
          return { pid: null, startedAt: null };
        }
      }
    }
  } catch {
    // ignore
  }
  return { pid: null, startedAt: null };
}

function readLastTickFile(): string | null {
  try {
    const tickFile = process.env.HARNESS_LAST_TICK_FILE || '/tmp/harness-last-tick';
    if (fs.existsSync(tickFile)) {
      return fs.readFileSync(tickFile, 'utf8').trim();
    }
  } catch {
    // ignore
  }
  return null;
}

function readLockFiles(): LockEntry[] {
  try {
    const lockPattern = process.env.HARNESS_LOCK_DIR || '/tmp';
    const files = fs.readdirSync(lockPattern).filter((f) => f.match(/^harness-\d+\.lock$/));
    return files.map((f) => {
      const issueNum = parseInt(f.replace('harness-', '').replace('.lock', ''), 10);
      const stat = fs.statSync(path.join(lockPattern, f));
      let station = 'unknown';
      try {
        const content = fs.readFileSync(path.join(lockPattern, f), 'utf8').trim();
        if (content) station = content;
      } catch {
        // ignore
      }
      return {
        issue: issueNum,
        station,
        locked_at: stat.birthtime.toISOString(),
      };
    });
  } catch {
    return [];
  }
}

function readBackoffFiles(): BackoffEntry[] {
  try {
    const backoffDir = process.env.HARNESS_BACKOFF_DIR || '/tmp';
    const files = fs.readdirSync(backoffDir).filter((f) => f.match(/^backoff-\d+\.json$/));
    return files.map((f) => {
      try {
        const content = fs.readFileSync(path.join(backoffDir, f), 'utf8');
        const data = JSON.parse(content);
        const issueNum = parseInt(f.replace('backoff-', '').replace('.json', ''), 10);
        return {
          issue: issueNum,
          until: data.until || new Date(Date.now() + 1800000).toISOString(),
          crash_count: data.crash_count || data.crashCount || 1,
        };
      } catch {
        const issueNum = parseInt(f.replace('backoff-', '').replace('.json', ''), 10);
        return {
          issue: issueNum,
          until: new Date(Date.now() + 1800000).toISOString(),
          crash_count: 1,
        };
      }
    });
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read loop status from filesystem
    const { pid, startedAt } = readPidFile();
    const running = pid !== null;
    const lastTickAt = readLastTickFile();

    let uptimeSeconds: number | null = null;
    if (running && startedAt) {
      uptimeSeconds = Math.floor((Date.now() - startedAt) / 1000);
    }

    const loopStatus: LoopStatus = {
      running,
      pid,
      uptime_seconds: uptimeSeconds,
      last_tick_at: lastTickAt,
    };

    // Read counts from audit log
    const admin = createSupabaseAdminClient();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: processedToday },
      { count: processedWeek },
      { count: processedTotal },
      { count: errorsToday },
    ] = await Promise.all([
      admin
        .from('pipeline_audit_log')
        .select('*', { count: 'exact', head: true })
        .in('action_name', ['advance_issue', 'retry_issue'])
        .gte('created_at', todayStart),
      admin
        .from('pipeline_audit_log')
        .select('*', { count: 'exact', head: true })
        .in('action_name', ['advance_issue', 'retry_issue'])
        .gte('created_at', weekStart),
      admin
        .from('pipeline_audit_log')
        .select('*', { count: 'exact', head: true })
        .in('action_name', ['advance_issue', 'retry_issue']),
      admin
        .from('pipeline_audit_log')
        .select('*', { count: 'exact', head: true })
        .eq('action_name', 'error')
        .gte('created_at', todayStart),
    ]);

    // Active agents: count lock files
    const locks = readLockFiles();
    const backoffs = readBackoffFiles();

    const counts: Counts = {
      processed_today: processedToday || 0,
      processed_week: processedWeek || 0,
      processed_total: processedTotal || 0,
      active_agents: locks.length,
      errors_today: errorsToday || 0,
    };

    return NextResponse.json({
      loop: loopStatus,
      counts,
      locks,
      backoffs,
    });
  } catch (err) {
    console.error('[pipeline/status] error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
