import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { ROUTE_MANIFEST } from '@/lib/route-manifest';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Verify authenticated session
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ routes: ROUTE_MANIFEST });
}
