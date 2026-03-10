import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');
    const station = searchParams.get('station');
    const complexity = searchParams.get('complexity');

    let query = supabase.from('dash_issues').select('*').order('updated_at', { ascending: false });

    if (repo) query = query.eq('repo', repo);
    if (station) query = query.eq('station', station);
    if (complexity) query = query.eq('complexity', complexity);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ issues: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }
}
