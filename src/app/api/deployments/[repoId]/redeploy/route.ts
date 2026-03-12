import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { fetchDeployments, triggerRedeploy } from '@/lib/vercel-api';
import { invalidateCache } from '@/lib/vercel-cache';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ repoId: string }> }
) {
  const { repoId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get the latest production deployment to redeploy
  const deployments = await fetchDeployments(repoId);
  const latest = deployments.find((d) => d.target === 'production') ?? deployments[0];

  if (!latest) {
    return NextResponse.json({ error: 'No deployment found to redeploy' }, { status: 404 });
  }

  const result = await triggerRedeploy(latest.uid);

  // Bust the deployments cache
  await invalidateCache(`deployments:${repoId}`);

  return NextResponse.json(result);
}
