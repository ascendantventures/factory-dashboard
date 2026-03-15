import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

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

// Stale threshold: heartbeat older than 3 minutes = harness not running
const HEARTBEAT_STALE_MS = 3 * 60 * 1000;

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    // Read harness status from Supabase heartbeat table (replaces /tmp filesystem reads)
    const { data: heartbeat } = await admin
      .from('harness_heartbeat')
      .select('*')
      .eq('id', 'main')
      .single();

    let running = false;
    let pid: number | null = null;
    let uptimeSeconds: number | null = null;
    let lastTickAt: string | null = null;
    let locks: LockEntry[] = [];

    if (heartbeat) {
      const lastSeen = new Date(heartbeat.last_seen).getTime();
      const isStale = Date.now() - lastSeen > HEARTBEAT_STALE_MS;
      running = !isStale && heartbeat.status === 'running';
      pid = heartbeat.pid ?? null;
      lastTickAt = heartbeat.last_seen;

      // Parse lock_snapshot for active agents
      if (heartbeat.lock_snapshot && typeof heartbeat.lock_snapshot === 'object') {
        const snapshot = heartbeat.lock_snapshot as Record<string, { ts: number; pid: number; station?: string }>;
        locks = Object.entries(snapshot).map(([key, v]) => {
          const issueMatch = key.match(/(\d+)/);
          return {
            issue: issueMatch ? parseInt(issueMatch[1], 10) : 0,
            station: v.station ?? key.replace(/-build|-bugfix|-spec|-design|-qa|-uat/, '').replace(/\d+-/, '') ?? 'unknown',
            locked_at: new Date(v.ts).toISOString(),
          };
        });
      }
    }

    // Read counts from audit log (already Supabase-backed)
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

    const loopStatus: LoopStatus = {
      running,
      pid,
      uptime_seconds: uptimeSeconds,
      last_tick_at: lastTickAt,
    };

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
      backoffs: [], // backoffs now tracked via audit_log; legacy field kept for UI compat
    });
  } catch (err) {
    console.error('[pipeline/status] error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
