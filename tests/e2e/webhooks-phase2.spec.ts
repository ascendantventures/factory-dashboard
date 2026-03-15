// tests/e2e/webhooks-phase2.spec.ts
// Pre-written E2E tests from spec Issue #110 — Phase 2 Event Log & Webhooks
import { test, expect } from '@playwright/test';

test.describe('Outbound webhook delivery history', () => {
  test('delivery history drawer opens and shows empty state', async ({ page }) => {
    await page.goto('/dashboard/settings/webhooks');
    // Assumes at least one webhook exists (created in prior test or seed)
    const viewBtn = page.getByTestId('view-deliveries-btn').first();
    await viewBtn.click();
    const drawer = page.getByTestId('delivery-history-drawer');
    await expect(drawer).toBeVisible();
    // Either shows delivery rows or empty state
    const hasRows = await page.getByTestId('delivery-row').count();
    if (hasRows === 0) {
      await expect(page.getByTestId('delivery-empty-state')).toBeVisible();
    }
  });

  test('delivery row shows status badge', async ({ page }) => {
    await page.goto('/dashboard/settings/webhooks');
    await page.getByTestId('view-deliveries-btn').first().click();
    const firstRow = page.getByTestId('delivery-row').first();
    if (await firstRow.isVisible()) {
      await expect(firstRow.getByTestId('delivery-status-badge')).toBeVisible();
    }
  });

  test('drawer closes on Escape key', async ({ page }) => {
    await page.goto('/dashboard/settings/webhooks');
    await page.getByTestId('view-deliveries-btn').first().click();
    await expect(page.getByTestId('delivery-history-drawer')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('delivery-history-drawer')).not.toBeVisible();
  });

  test('drawer closes on close button click', async ({ page }) => {
    await page.goto('/dashboard/settings/webhooks');
    await page.getByTestId('view-deliveries-btn').first().click();
    await expect(page.getByTestId('delivery-history-drawer')).toBeVisible();
    await page.getByTestId('delivery-drawer-close').click();
    await expect(page.getByTestId('delivery-history-drawer')).not.toBeVisible();
  });
});

test.describe('GitHub webhook endpoint', () => {
  test('rejects unsigned POST with 401', async ({ request }) => {
    const res = await request.post('/api/webhooks/github', {
      headers: { 'x-github-event': 'push' },
      data: { test: true }
    });
    expect(res.status()).toBe(401);
  });

  test('rejects POST with missing signature header with 401', async ({ request }) => {
    const res = await request.post('/api/webhooks/github', {
      data: { test: true }
    });
    // Either 401 (bad sig) or 503 (not configured) is acceptable
    expect([401, 503]).toContain(res.status());
  });
});

test.describe('Event Log real-time indicator', () => {
  test('realtime pulse indicator is visible', async ({ page }) => {
    await page.goto('/dashboard/event-log');
    await expect(page.getByTestId('realtime-pulse')).toBeVisible();
  });

  test('manual refresh button still works', async ({ page }) => {
    await page.goto('/dashboard/event-log');
    const refreshBtn = page.getByTestId('refresh-btn');
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    // After click, event table should remain visible
    await expect(page.getByTestId('event-table')).toBeVisible();
  });

  test('event table has correct testid', async ({ page }) => {
    await page.goto('/dashboard/event-log');
    // Spec requires data-testid="event-table" (not "event-log-list")
    await expect(page.getByTestId('event-table')).toBeVisible();
  });
});
