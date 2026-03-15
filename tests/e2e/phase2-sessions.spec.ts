import { test, expect } from '@playwright/test';

test.describe('Session Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings/profile');
    await expect(page.locator('h1')).toContainText('Profile Settings');
    // Wait for session list to load
    await page.waitForSelector('[data-testid="active-sessions"], [data-testid="session-card"]', { timeout: 10000 }).catch(() => {});
  });

  test('shows active sessions list', async ({ page }) => {
    // Session list may show loading first, then sessions
    const sessionSection = page.locator('[data-testid="active-sessions"]');
    await expect(sessionSection).toBeVisible({ timeout: 10000 });
    await expect(sessionSection.locator('[data-testid="session-card"]').first()).toBeVisible();
  });

  test('marks current session with badge', async ({ page }) => {
    const currentBadge = page.locator('[data-testid="session-card"][data-current="true"] [data-testid="current-badge"]');
    await expect(currentBadge).toContainText('This device', { timeout: 10000 });
  });

  test('current session has no individual revoke button', async ({ page }) => {
    const currentCard = page.locator('[data-testid="session-card"][data-current="true"]');
    await expect(currentCard).toBeVisible({ timeout: 10000 });
    await expect(currentCard.locator('[data-testid="revoke-session-btn"]')).not.toBeVisible();
  });

  test('revoke all other sessions shows confirmation and leaves only current', async ({ page }) => {
    const revokeAllBtn = page.locator('[data-testid="revoke-all-sessions-btn"]');

    // Only run if there are other sessions
    if (await revokeAllBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await revokeAllBtn.click();
      // Confirm dialog appears
      const confirmBtn = page.locator('[data-testid="confirm-revoke-all"]');
      await expect(confirmBtn).toBeVisible({ timeout: 3000 });
      await confirmBtn.click();
      // Only current session should remain
      await expect(page.locator('[data-testid="session-card"]')).toHaveCount(1, { timeout: 5000 });
      await expect(page.locator('[data-testid="session-card"][data-current="true"]')).toBeVisible();
    } else {
      // Single session — button should not appear
      await expect(revokeAllBtn).not.toBeVisible();
    }
  });
});
