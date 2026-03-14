import { test, expect } from '@playwright/test';

test.describe('Mobile Bottom Nav — Admin item', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('admin user sees bottom-nav-admin at 375px', async ({ page }) => {
    // Sign in as admin (uses ADMIN_EMAIL / ADMIN_PASSWORD from env)
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', process.env.ADMIN_EMAIL!);
    await page.fill('[data-testid="password-input"]', process.env.ADMIN_PASSWORD!);
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL('/dashboard');

    const adminNav = page.locator('[data-testid="bottom-nav-admin"]');
    await expect(adminNav).toBeVisible();
  });

  test('non-admin user does not see bottom-nav-admin at 375px', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', process.env.USER_EMAIL!);
    await page.fill('[data-testid="password-input"]', process.env.USER_PASSWORD!);
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL('/dashboard');

    const adminNav = page.locator('[data-testid="bottom-nav-admin"]');
    await expect(adminNav).not.toBeVisible();
  });
});
