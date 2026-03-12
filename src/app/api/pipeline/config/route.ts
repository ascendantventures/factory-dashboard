import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();
    const { data: stations, error } = await admin
      .from('pipeline_station_config')
      .select('*')
      .order('station_name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stations: stations || [] });
  } catch (err) {
    console.error('[pipeline/config GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as {
      station_name: string;
      model_id?: string;
      concurrency?: number;
      timeout_seconds?: number;
      is_enabled?: boolean;
    };

    if (!body.station_name) {
      return NextResponse.json({ error: 'station_name is required' }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: updated, error } = await admin
      .from('pipeline_station_config')
      .upsert(
        {
          station_name: body.station_name,
          ...(body.model_id !== undefined && { model_id: body.model_id }),
          ...(body.concurrency !== undefined && { concurrency: body.concurrency }),
          ...(body.timeout_seconds !== undefined && { timeout_seconds: body.timeout_seconds }),
          ...(body.is_enabled !== undefined && { is_enabled: body.is_enabled }),
          updated_by: user.email,
        },
        { onConflict: 'station_name' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log to audit
    await admin.from('pipeline_audit_log').insert({
      action_name: 'config_update',
      issue_number: null,
      operator_email: user.email,
      metadata: { station_name: body.station_name, changes: body },
    });

    return NextResponse.json({ ok: true, station: updated });
  } catch (err) {
    console.error('[pipeline/config PATCH] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
