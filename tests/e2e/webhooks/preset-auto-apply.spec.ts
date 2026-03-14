import { test, expect } from '@playwright/test';

test.describe('Webhook new page — preset auto-apply', () => {
  test.beforeEach(async ({ page }) => {
    // Assumes test user is authenticated
    await page.goto('/dashboard/settings/webhooks/new');
  });

  test('AC-001.1: Discord preset auto-applies from query param', async ({ page }) => {
    await page.goto('/dashboard/settings/webhooks/new?preset=discord');
    const discordTile = page.locator('[data-preset="discord"]');
    await expect(discordTile).toHaveAttribute('aria-selected', 'true');
  });

  test('AC-001.2: Slack preset auto-applies from query param', async ({ page }) => {
    await page.goto('/dashboard/settings/webhooks/new?preset=slack');
    const slackTile = page.locator('[data-preset="slack"]');
    await expect(slackTile).toHaveAttribute('aria-selected', 'true');
  });

  test('AC-001.3: No preset selected when no query param', async ({ page }) => {
    await page.goto('/dashboard/settings/webhooks/new');
    const selectedTiles = page.locator('[aria-selected="true"]');
    await expect(selectedTiles).toHaveCount(0);
  });
});
