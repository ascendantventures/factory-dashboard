/**
 * Vercel REST API v6 client — server-only
 * VERCEL_API_TOKEN and VERCEL_TEAM_ID are never exposed to the client.
 */

const VERCEL_API_BASE = 'https://api.vercel.com';

function getHeaders() {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) throw new Error('VERCEL_API_TOKEN is not set');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function teamQuery() {
  const teamId = process.env.VERCEL_TEAM_ID;
  return teamId ? `?teamId=${teamId}` : '';
}

function teamQueryParam(prefix = '?') {
  const teamId = process.env.VERCEL_TEAM_ID;
  return teamId ? `${prefix}teamId=${teamId}` : '';
}

export interface VercelDeployment {
  uid: string;
  url: string;
  state: 'READY' | 'BUILDING' | 'ERROR' | 'CANCELED' | 'QUEUED' | string;
  createdAt: number;
  buildingAt?: number;
  ready?: number;
  buildDurationMs?: number;
  meta?: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
    githubCommitAuthorName?: string;
    githubRepo?: string;
  };
  target?: string | null; // 'production' | 'staging' | null
}

export interface VercelDeploymentDetail extends VercelDeployment {
  outputSizeBytes?: number;
  logs?: Array<{ text: string; timestamp: number }>;
  previewUrl?: string;
}

export interface VercelDomain {
  name: string;
  verified: boolean;
  production?: boolean;
}

export interface VercelEnvVar {
  key: string;
  target: string[];
  present: boolean;
}

/** List recent deployments (last 10) for a project/repo */
export async function fetchDeployments(repoId: string): Promise<VercelDeployment[]> {
  const teamId = process.env.VERCEL_TEAM_ID;
  const qs = new URLSearchParams({ app: repoId, limit: '10' });
  if (teamId) qs.set('teamId', teamId);

  const res = await fetch(`${VERCEL_API_BASE}/v6/deployments?${qs}`, {
    headers: getHeaders(),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vercel API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const deployments: VercelDeployment[] = (data.deployments ?? []).map((d: Record<string, unknown>) => {
    const createdAt = typeof d.createdAt === 'number' ? d.createdAt : 0;
    const ready = typeof d.ready === 'number' ? d.ready : undefined;
    const buildDurationMs = ready && createdAt ? ready - createdAt : undefined;
    return {
      uid: d.uid as string,
      url: d.url as string,
      state: d.state as string,
      createdAt,
      buildDurationMs,
      meta: d.meta as VercelDeployment['meta'],
      target: d.target as string | null,
    };
  });

  return deployments;
}

/** Get deployment detail with build logs */
export async function fetchDeploymentDetail(deployId: string): Promise<VercelDeploymentDetail> {
  const teamId = process.env.VERCEL_TEAM_ID;
  const qs = teamId ? `?teamId=${teamId}` : '';

  // Get deployment info
  const res = await fetch(`${VERCEL_API_BASE}/v13/deployments/${deployId}${qs}`, {
    headers: getHeaders(),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vercel API error ${res.status}: ${text}`);
  }

  const d = await res.json();

  // Get build logs
  let logs: Array<{ text: string; timestamp: number }> = [];
  try {
    const logsRes = await fetch(
      `${VERCEL_API_BASE}/v2/deployments/${deployId}/events${qs}`,
      { headers: getHeaders(), next: { revalidate: 0 } }
    );
    if (logsRes.ok) {
      const logsText = await logsRes.text();
      // Events are newline-delimited JSON
      logs = logsText
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          try {
            const event = JSON.parse(line);
            return {
              text: event.payload?.text ?? event.text ?? '',
              timestamp: event.created ?? event.payload?.date ?? Date.now(),
            };
          } catch {
            return null;
          }
        })
        .filter((l): l is { text: string; timestamp: number } => l !== null && Boolean(l.text));
    }
  } catch {
    // logs are best-effort
  }

  const createdAt = typeof d.createdAt === 'number' ? d.createdAt : 0;
  const ready = typeof d.ready === 'number' ? d.ready : undefined;

  return {
    uid: d.uid as string,
    url: d.url as string,
    state: d.readyState ?? d.state,
    createdAt,
    buildDurationMs: ready && createdAt ? ready - createdAt : undefined,
    outputSizeBytes: d.outputFileSize ?? undefined,
    meta: d.meta,
    target: d.target ?? null,
    previewUrl: d.target !== 'production' ? `https://${d.url}` : undefined,
    logs,
  };
}

/** Trigger a redeploy of a deployment */
export async function triggerRedeploy(
  deployId: string
): Promise<{ deploymentId: string; url: string; state: string }> {
  const teamId = process.env.VERCEL_TEAM_ID;
  const qs = teamId ? `?teamId=${teamId}` : '';

  const res = await fetch(`${VERCEL_API_BASE}/v13/deployments?${qs}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ deploymentId: deployId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Redeploy failed ${res.status}: ${text}`);
  }

  const d = await res.json();
  return {
    deploymentId: d.id ?? d.uid,
    url: d.url,
    state: d.readyState ?? d.state ?? 'BUILDING',
  };
}

/** List domains for a Vercel project */
export async function fetchDomains(repoId: string): Promise<VercelDomain[]> {
  const teamId = process.env.VERCEL_TEAM_ID;
  const qs = teamId ? `?teamId=${teamId}` : '';

  const res = await fetch(
    `${VERCEL_API_BASE}/v9/projects/${repoId}/domains${qs}`,
    { headers: getHeaders(), next: { revalidate: 0 } }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vercel domains API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return (data.domains ?? []).map((d: Record<string, unknown>) => ({
    name: d.name as string,
    verified: Boolean(d.verified),
    production: (d.target as string) === 'production' || Boolean(d.gitBranch === null),
  }));
}

/** List env var names (values never returned) */
export async function fetchEnvVars(repoId: string): Promise<VercelEnvVar[]> {
  const teamId = process.env.VERCEL_TEAM_ID;
  const qs = teamId ? `?teamId=${teamId}` : '';

  const res = await fetch(
    `${VERCEL_API_BASE}/v9/projects/${repoId}/env${qs}`,
    { headers: getHeaders(), next: { revalidate: 0 } }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vercel env API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return (data.envs ?? []).map((e: Record<string, unknown>) => ({
    key: e.key as string,
    target: Array.isArray(e.target) ? (e.target as string[]) : [String(e.target)],
    present: true,
  }));
}
