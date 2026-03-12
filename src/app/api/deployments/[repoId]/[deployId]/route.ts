import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { fetchDeploymentDetail } from '@/lib/vercel-api';
import { getCached, setCached } from '@/lib/vercel-cache';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ repoId: string; deployId: string }> }
) {
  const { repoId, deployId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cacheKey = `deployment:${repoId}:${deployId}`;

  const cached = await getCached<unknown>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const detail = await fetchDeploymentDetail(deployId);
  await setCached(cacheKey, detail, 5);

  return NextResponse.json(detail);
}
