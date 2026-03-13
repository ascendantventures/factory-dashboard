import { test, expect } from '@playwright/test';

test.describe('Sign-out redirect', () => {
  test('redirects to same origin after sign-out, not a preview URL', async ({ page }) => {
    await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000');

    // If already on login, sign in first
    if (page.url().includes('/auth/login')) {
      const email = process.env.TEST_USER_EMAIL;
      const password = process.env.TEST_USER_PASSWORD;
      if (email && password) {
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard');
      }
    }

    // Sign out using the button
    await page.click('[data-testid="sign-out-button"]');

    // Wait for redirect to settle
    await page.waitForURL(/auth\/login/, { timeout: 10000 });

    const url = new URL(page.url());
    // Must NOT be a build-work preview URL
    expect(url.hostname).not.toMatch(/build-work-.+\.vercel\.app/);
  });
});
