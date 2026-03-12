import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { fetchEnvVars } from '@/lib/vercel-api';
import { getCached, setCached } from '@/lib/vercel-cache';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ repoId: string }> }
) {
  const { repoId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cacheKey = `env:${repoId}`;
  const cached = await getCached<{ vars: unknown[] }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const vars = await fetchEnvVars(repoId);
  const result = { vars };
  await setCached(cacheKey, result, 10);

  return NextResponse.json(result);
}
