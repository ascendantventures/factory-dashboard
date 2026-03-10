import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { STATIONS, Station } from '@/lib/constants';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: transitions } = await supabase
      .from('dash_stage_transitions')
      .select('to_station, duration_seconds')
      .not('duration_seconds', 'is', null);

    // Average duration per station (in hours)
    const totals: Record<string, { sum: number; count: number }> = {};
    for (const station of STATIONS) {
      totals[station] = { sum: 0, count: 0 };
    }

    for (const t of transitions ?? []) {
      if (!t.to_station || !t.duration_seconds) continue;
      if (t.to_station in totals) {
        totals[t.to_station].sum += t.duration_seconds;
        totals[t.to_station].count++;
      }
    }

    const data = STATIONS.map((station: Station) => ({
      station: station.charAt(0).toUpperCase() + station.slice(1),
      avg_hours: totals[station].count > 0
        ? parseFloat((totals[station].sum / totals[station].count / 3600).toFixed(2))
        : 0,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch durations' }, { status: 500 });
  }
}
