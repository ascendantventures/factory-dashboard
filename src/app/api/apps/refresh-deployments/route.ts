import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export async function POST() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: roleRow } = await supabase
    .from('dash_user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (roleRow?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check Vercel token
  const vercelToken = process.env.VERCEL_TOKEN;
  if (!vercelToken) {
    return NextResponse.json({ refreshed: 0, skipped: 0, reason: 'VERCEL_TOKEN not set' });
  }

  // Fetch all build repos
  const adminClient = createSupabaseAdminClient();
  const { data: buildRepos, error: reposError } = await adminClient
    .from('dash_build_repos')
    .select('id, github_repo');

  if (reposError || !buildRepos) {
    return NextResponse.json({ error: 'Failed to fetch build repos' }, { status: 500 });
  }

  let refreshed = 0;
  let skipped = 0;

  for (const buildRepo of buildRepos) {
    const githubRepo: string = buildRepo.github_repo;
    const repoName = githubRepo.split('/')[1];

    if (!repoName) {
      skipped++;
      continue;
    }

    try {
      const vercelRes = await fetch(
        `https://api.vercel.com/v6/deployments?app=${repoName}&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${vercelToken}`,
          },
        },
      );

      if (!vercelRes.ok) {
        skipped++;
        continue;
      }

      const vercelData = await vercelRes.json();
      const deployment = vercelData?.deployments?.[0];

      if (!deployment) {
        skipped++;
        continue;
      }

      const { error: upsertError } = await adminClient
        .from('dash_deployment_cache')
        .upsert(
          {
            repo_full_name: githubRepo,
            vercel_deployment_id: deployment.uid,
            deploy_url: `https://${deployment.url}`,
            deploy_state: deployment.readyState,
            deployed_at: new Date(deployment.createdAt).toISOString(),
            raw_payload: deployment,
          },
          { onConflict: 'repo_full_name' },
        );

      if (upsertError) {
        skipped++;
        continue;
      }

      refreshed++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ refreshed, skipped });
}
