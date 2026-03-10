import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const repo = searchParams.get('repo');

    let query = supabase
      .from('dash_agent_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (repo) query = query.eq('repo', repo);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ runs: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 });
  }
}

// POST: register a new agent run (service-role only)
export async function POST(request: NextRequest) {
  try {
    // Verify service role key via Authorization header
    const authHeader = request.headers.get('authorization');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!authHeader || !serviceKey || authHeader !== `Bearer ${serviceKey}`) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const admin = createSupabaseAdminClient();

    // Validate required fields
    const required = ['issue_id', 'repo', 'issue_number', 'station', 'started_at'];
    for (const field of required) {
      if (!(field in body)) {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    const { data, error } = await admin.from('dash_agent_runs').insert(body).select().single();
    if (error) throw error;

    return NextResponse.json({ run: data }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to register run' }, { status: 500 });
  }
}
