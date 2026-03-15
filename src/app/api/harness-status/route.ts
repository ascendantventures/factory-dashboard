import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    // 1. Fetch heartbeat (singleton row)
    const { data: hb } = await admin
      .from('harness_heartbeat')
      .select('pid, active_agents, lock_snapshot, status, last_seen')
      .eq('id', 'main')
      .single();

    const now = Date.now();
    const lastSeen = hb?.last_seen ? new Date(hb.last_seen).getTime() : 0;
    const isRunning = hb != null && now - lastSeen < STALE_THRESHOLD_MS;

    // 2. Count processed issues from project_token_usage
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [todayRes, weekRes, allTimeRes] = await Promise.all([
      admin
        .from('project_token_usage')
        .select('submission_id')
        .gte('created_at', startOfToday.toISOString()),
      admin
        .from('project_token_usage')
        .select('submission_id')
        .gte('created_at', startOfWeek.toISOString()),
      admin.from('project_token_usage').select('submission_id'),
    ]);

    // De-duplicate by submission_id for accurate "issues processed" count
    const countUnique = (rows: Array<{ submission_id: string }> | null) =>
      new Set(rows?.map((r) => r.submission_id) ?? []).size;

    // 3. Derive lock entries from snapshot for the existing LocksList component
    const lockSnapshot = (isRunning ? (hb?.lock_snapshot as Record<string, unknown>) : {}) ?? {};
    const locks = Object.values(lockSnapshot).map((entry) => {
      const e = entry as Record<string, unknown>;
      return {
        issue: (e.issue as number) ?? 0,
        station: (e.station as string) ?? 'unknown',
        locked_at: e.ts ? new Date(e.ts as number).toISOString() : new Date().toISOString(),
      };
    });

    return NextResponse.json({
      status: isRunning ? 'running' : 'stopped',
      pid: isRunning ? (hb?.pid ?? null) : null,
      activeAgents: isRunning ? (hb?.active_agents ?? 0) : 0,
      lockSnapshot,
      lastSeen: hb?.last_seen ?? null,
      processedToday: countUnique(todayRes.data as any),
      processedThisWeek: countUnique(weekRes.data as any),
      processedAllTime: countUnique(allTimeRes.data as any),
      // Also expose in shape compatible with existing page components
      loop: {
        running: isRunning,
        pid: isRunning ? (hb?.pid ?? null) : null,
        uptime_seconds: null,
        last_tick_at: hb?.last_seen ?? null,
      },
      counts: {
        processed_today: countUnique(todayRes.data as any),
        processed_week: countUnique(weekRes.data as any),
        processed_total: countUnique(allTimeRes.data as any),
        active_agents: isRunning ? (hb?.active_agents ?? 0) : 0,
        errors_today: 0,
      },
      locks,
      backoffs: [],
    });
  } catch (err) {
    console.error('[harness-status] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
