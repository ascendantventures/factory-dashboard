import { test, expect } from '@playwright/test';

test.describe('Pipeline heartbeat UX — issue #117', () => {
  test('shows Never connected when lastSeen is null', async ({ page }) => {
    await page.route('/api/harness-status', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          loop: { running: false, pid: null, uptime_seconds: null, last_tick_at: null },
          counts: {},
          locks: [],
          backoffs: [],
          lastSeen: null,
        }),
      })
    );
    await page.goto('/pipeline');
    await expect(page.getByText('Never connected')).toBeVisible();
  });

  test('shows stale timestamp in red when heartbeat is old', async ({ page }) => {
    const staleTime = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 min ago
    await page.route('/api/harness-status', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          loop: { running: false, pid: null, uptime_seconds: null, last_tick_at: null },
          counts: {},
          locks: [],
          backoffs: [],
          lastSeen: staleTime,
        }),
      })
    );
    await page.goto('/pipeline');
    const heartbeatCell = page.locator(`[title="${staleTime}"]`);
    await expect(heartbeatCell).toHaveCSS('color', 'rgb(239, 68, 68)');
  });

  test('activity feed empty state shows explanation', async ({ page }) => {
    await page.goto('/dashboard/activity');
    const emptyState = page.getByTestId('activity-empty');
    if (await emptyState.isVisible()) {
      await expect(
        page.getByText('Events appear when agents complete stages')
      ).toBeVisible();
    }
  });
});
