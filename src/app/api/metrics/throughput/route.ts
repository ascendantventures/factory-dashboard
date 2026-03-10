import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { subWeeks, startOfWeek, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weeks = parseInt(searchParams.get('weeks') ?? '12', 10);

    // Get issues closed (done) in the past N weeks
    const since = subWeeks(new Date(), weeks).toISOString();

    const { data: issues } = await supabase
      .from('dash_issues')
      .select('closed_at, updated_at')
      .eq('station', 'done')
      .or(`closed_at.gte.${since},updated_at.gte.${since}`);

    // Group by week
    const weekBuckets: Record<string, number> = {};
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i));
      const key = format(weekStart, 'MMM d');
      weekBuckets[key] = 0;
    }

    for (const issue of issues ?? []) {
      const dateStr = issue.closed_at ?? issue.updated_at;
      if (!dateStr) continue;
      const date = new Date(dateStr);
      const weekStart = startOfWeek(date);
      const key = format(weekStart, 'MMM d');
      if (key in weekBuckets) {
        weekBuckets[key]++;
      }
    }

    const data = Object.entries(weekBuckets).map(([period, count]) => ({ period, count }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch throughput' }, { status: 500 });
  }
}
