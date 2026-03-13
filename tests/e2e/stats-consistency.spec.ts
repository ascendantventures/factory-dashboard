import { test, expect } from '@playwright/test';

test.describe('Stats count consistency', () => {
  test('header count matches stats bar count for a known app', async ({ page }) => {
    const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

    // Navigate to the apps list to find factory-dashboard app card
    await page.goto(`${base}/dashboard/apps`);

    // Get the stats bar count from AppCard
    const statsCount = await page
      .locator('[data-testid="app-issue-count-stats"]')
      .first()
      .textContent();

    // Click the card to navigate to detail page
    await page.locator('[data-testid="app-card"]').first().click();

    // Wait for detail page to load
    await page.waitForSelector('[data-testid="app-issue-count-header"]');

    // Get header count from detail page
    const headerCount = await page
      .locator('[data-testid="app-issue-count-header"]')
      .textContent();

    expect(parseInt(headerCount ?? '0', 10)).toBe(parseInt(statsCount ?? '0', 10));
  });

  test('app detail page shows issues from fixture data', async ({ page }) => {
    const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

    await page.goto(`${base}/dashboard/apps`);
    await page.locator('[data-testid="app-card"]').first().click();
    await page.waitForSelector('[data-testid="issue-list-item"]', { timeout: 10000 });

    const issueItems = page.locator('[data-testid="issue-list-item"]');
    expect(await issueItems.count()).toBeGreaterThan(0);
  });
});
