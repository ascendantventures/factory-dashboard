import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { fetchDeployments } from '@/lib/vercel-api';
import { getCached, setCached } from '@/lib/vercel-cache';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ repoId: string }> }
) {
  const { repoId } = await params;

  // Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cacheKey = `deployments:${repoId}`;

  // Try cache first (2 min TTL)
  const cached = await getCached<{ deployments: unknown[]; cachedAt: string }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Fetch from Vercel API
  const deployments = await fetchDeployments(repoId);
  const result = {
    deployments,
    cachedAt: new Date().toISOString(),
  };

  await setCached(cacheKey, result, 2);

  return NextResponse.json(result);
}
