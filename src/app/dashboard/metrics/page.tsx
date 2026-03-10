import { createSupabaseServerClient } from '@/lib/supabase-server';
import { ThroughputChart } from '@/components/metrics/ThroughputChart';
import { DurationChart } from '@/components/metrics/DurationChart';
import { STATIONS, STATION_LABELS, STATION_COLORS, Station } from '@/lib/constants';
import { subWeeks, startOfWeek, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function MetricsPage() {
  const supabase = await createSupabaseServerClient();

  // Summary stats
  const { data: allIssues } = await supabase
    .from('dash_issues')
    .select('station, created_at, closed_at, updated_at');

  const total = allIssues?.length ?? 0;
  const done = allIssues?.filter((i) => i.station === 'done').length ?? 0;
  const active = allIssues?.filter((i) => i.station && i.station !== 'done').length ?? 0;
  const intake = allIssues?.filter((i) => i.station === 'intake' || !i.station).length ?? 0;

  // Throughput data (last 12 weeks)
  const weeks = 12;
  const since = subWeeks(new Date(), weeks).toISOString();
  const { data: doneIssues } = await supabase
    .from('dash_issues')
    .select('closed_at, updated_at')
    .eq('station', 'done')
    .or(`closed_at.gte.${since},updated_at.gte.${since}`);

  const weekBuckets: Record<string, number> = {};
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(new Date(), i));
    const key = format(weekStart, 'MMM d');
    weekBuckets[key] = 0;
  }
  for (const issue of doneIssues ?? []) {
    const dateStr = issue.closed_at ?? issue.updated_at;
    if (!dateStr) continue;
    const date = new Date(dateStr);
    const weekStart = startOfWeek(date);
    const key = format(weekStart, 'MMM d');
    if (key in weekBuckets) weekBuckets[key]++;
  }
  const throughputData = Object.entries(weekBuckets).map(([period, count]) => ({ period, count }));

  // Duration data
  const { data: transitions } = await supabase
    .from('dash_stage_transitions')
    .select('to_station, duration_seconds')
    .not('duration_seconds', 'is', null);

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
  const durationData = STATIONS.map((station: Station) => ({
    station: station.charAt(0).toUpperCase() + station.slice(1),
    avg_hours: totals[station].count > 0
      ? parseFloat((totals[station].sum / totals[station].count / 3600).toFixed(2))
      : 0,
  }));

  const statCards = [
    { label: 'Total Issues', value: total, color: 'var(--text-primary)' },
    { label: 'In Progress', value: active, color: 'var(--warning)' },
    { label: 'Completed', value: done, color: 'var(--success)' },
    { label: 'Intake', value: intake, color: 'var(--text-muted)' },
  ];

  // Station distribution
  const stationCounts: Record<string, number> = {};
  for (const station of STATIONS) {
    stationCounts[station] = allIssues?.filter((i) => i.station === station).length ?? 0;
  }

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto">
      <h1
        className="text-2xl font-bold mb-6"
        style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
      >
        Metrics
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border p-5"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
              {card.label}
            </p>
            <p
              className="text-3xl font-bold font-mono"
              style={{ color: card.color }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Throughput */}
        <div
          className="rounded-xl border p-6"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h2
            className="text-base font-semibold mb-1"
            style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
          >
            Throughput
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            Issues completed per week
          </p>
          <ThroughputChart data={throughputData} />
        </div>

        {/* Stage durations */}
        <div
          className="rounded-xl border p-6"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h2
            className="text-base font-semibold mb-1"
            style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
          >
            Avg Stage Duration
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            Average hours spent per stage
          </p>
          <DurationChart data={durationData} />
        </div>
      </div>

      {/* Station distribution */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div
          className="px-6 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
          >
            Current Distribution
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {STATIONS.map((station) => {
              const count = stationCounts[station] ?? 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              const color = STATION_COLORS[station as Station];
              return (
                <div key={station} className="flex items-center gap-4">
                  <span
                    className="text-sm w-16 text-right"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {STATION_LABELS[station as Station]}
                  </span>
                  <div
                    className="flex-1 rounded-full overflow-hidden"
                    style={{ background: 'var(--surface-alt)', height: '8px' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <span
                    className="text-sm font-mono w-8 text-right"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
