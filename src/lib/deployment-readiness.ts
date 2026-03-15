/**
 * deployment-readiness.ts
 * Polls a preview deployment URL until the real application is served
 * (not Vercel's "Deployment is building" placeholder page).
 *
 * Used by: QA agent pre-flight gate
 * Issue:   #130
 */

export interface DeploymentReadyResult {
  ready: boolean;
  finalStatus: number;
  timedOut: boolean;
  attempts: number;
  lastBody: string;
}

export interface WaitForDeploymentOptions {
  maxRetries?: number;
  intervalMs?: number;
  timeoutMs?: number;
}

const BUILDING_SIGNALS = [
  'deployment is building',
  'this deployment is in progress',
  'vercel.app is currently building',
];

function isPlaceholderPage(body: string): boolean {
  const lower = body.toLowerCase();
  return BUILDING_SIGNALS.some(signal => lower.includes(signal));
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitForDeployment(
  url: string,
  opts: WaitForDeploymentOptions = {}
): Promise<DeploymentReadyResult> {
  const maxRetries = opts.maxRetries ?? 10;
  const intervalMs = opts.intervalMs ?? 15_000;
  const timeoutMs = opts.timeoutMs ?? 150_000;

  const deadline = Date.now() + timeoutMs;
  let attempts = 0;
  let finalStatus = 0;
  let lastBody = '';

  while (attempts < maxRetries) {
    if (Date.now() >= deadline) {
      return { ready: false, finalStatus, timedOut: true, attempts, lastBody: '' };
    }

    attempts++;

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'factory-qa-probe/1.0' },
        signal: AbortSignal.timeout(10_000),
      });

      finalStatus = res.status;
      lastBody = await res.text();

      if (res.status === 200 && !isPlaceholderPage(lastBody)) {
        return { ready: true, finalStatus: 200, timedOut: false, attempts, lastBody };
      }
    } catch {
      // Network error or abort — treat as not ready, retry
    }

    if (attempts < maxRetries && Date.now() < deadline) {
      await sleep(intervalMs);
    }
  }

  return { ready: false, finalStatus, timedOut: false, attempts, lastBody };
}

export function buildTimeoutComment(attempts: number, totalWaitSecs: number): string {
  return (
    `Preview deployment is still building after ${attempts} retries over ~${totalWaitSecs}s.\n` +
    `Re-trigger the Vercel build for the PR and re-queue QA once the preview URL serves the real application.`
  );
}
