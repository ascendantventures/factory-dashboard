/**
 * deployment-readiness.spec.ts
 * Verifies the preview deployment is live (not a Vercel build placeholder).
 *
 * Run with:  PREVIEW_URL=https://... npx playwright test deployment-readiness
 * Issue:     #130
 */
import { test, expect } from '@playwright/test';

const PREVIEW_URL = process.env.PREVIEW_URL ?? '';

test.describe('Deployment Readiness', () => {
  test('preview URL serves the real app, not a Vercel build placeholder', async ({ page }) => {
    test.skip(!PREVIEW_URL, 'PREVIEW_URL env var not set — skipping');

    const response = await page.goto(PREVIEW_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    expect(response?.status()).toBe(200);

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).not.toContain('deployment is building');
    expect(bodyText?.toLowerCase()).not.toContain('this deployment is in progress');

    // Confirm the factory dashboard root element is present
    await expect(page.locator('[data-testid="factory-dashboard"]')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('agent-browser does not crash on the preview URL', async ({ page }) => {
    test.skip(!PREVIEW_URL, 'PREVIEW_URL env var not set — skipping');

    let crashed = false;
    page.on('crash', () => {
      crashed = true;
    });

    await page.goto(PREVIEW_URL, { waitUntil: 'networkidle', timeout: 30_000 });
    expect(crashed).toBe(false);
  });

  test('waitForDeployment returns ready:true on the live preview URL', async () => {
    test.skip(!PREVIEW_URL, 'PREVIEW_URL env var not set — skipping');

    // Dynamic import — runs server-side utility in Node context under Playwright
    const { waitForDeployment } = await import('../../src/lib/deployment-readiness');

    const result = await waitForDeployment(PREVIEW_URL, {
      maxRetries: 3,
      intervalMs: 5_000,
      timeoutMs: 30_000,
    });

    expect(result.ready).toBe(true);
    expect(result.finalStatus).toBe(200);
    expect(result.timedOut).toBe(false);
  });
});
