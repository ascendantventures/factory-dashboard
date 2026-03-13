// tests/e2e/issue-85-templates-nav.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Issue #85 — Templates discoverability fixes', () => {

  test.beforeEach(async ({ page }) => {
    // Log in as admin user
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', process.env.TEST_ADMIN_EMAIL!);
    await page.fill('[data-testid="password"]', process.env.TEST_ADMIN_PASSWORD!);
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL('**/dashboard');
  });

  // REQ-85-001: Admin sidebar
  test('AC-001.1 + AC-001.2: Templates link appears in admin sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    const templatesLink = page.locator('nav a[href="/dashboard/templates"]').first();
    await expect(templatesLink).toBeVisible();
  });

  test('AC-001.3: Templates sidebar link navigates correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('nav a[href="/dashboard/templates"]');
    await expect(page).toHaveURL(/\/dashboard\/templates/);
  });

  // REQ-85-002: Mobile nav
  test('AC-002.1: Templates accessible from mobile bottom nav', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14 Pro
    await page.goto('/dashboard');
    // Either a direct link or a "More" menu entry
    const directLink = page.locator('[data-testid="mobile-nav"] a[href="/dashboard/templates"]');
    const moreButton = page.locator('[data-testid="mobile-nav-more"]');
    const hasDirectLink = await directLink.isVisible().catch(() => false);
    if (hasDirectLink) {
      await expect(directLink).toBeVisible();
    } else {
      await expect(moreButton).toBeVisible();
      await moreButton.click();
      await expect(page.locator('a[href="/dashboard/templates"]')).toBeVisible();
    }
  });

  // REQ-85-003: QuickCreate Step 2 repository dropdown
  test('AC-003.1 + AC-003.2: QuickCreate Step 2 shows dropdown not free-text input', async ({ page }) => {
    await page.goto('/dashboard');
    // Open QuickCreate
    await page.click('[data-testid="quick-create-trigger"]');
    // Advance to Step 2 (assumes Step 1 has a "Next" or similar action)
    await page.click('[data-testid="quick-create-next"]');
    // Assert dropdown exists, not a plain text input for owner/repo
    const dropdown = page.locator('[data-testid="repo-selector"]');
    const freeText = page.locator('input[placeholder*="owner/repo"]');
    await expect(dropdown).toBeVisible();
    await expect(freeText).not.toBeVisible();
  });

  test('AC-003.3: QuickCreate Step 2 shows validation error if no repo selected', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('[data-testid="quick-create-trigger"]');
    await page.click('[data-testid="quick-create-next"]');
    // Attempt to submit without selecting a repo
    await page.click('[data-testid="quick-create-submit"]');
    const error = page.locator('[data-testid="repo-selector-error"]');
    await expect(error).toBeVisible();
  });

});
