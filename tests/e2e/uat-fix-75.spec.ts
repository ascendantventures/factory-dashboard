// tests/e2e/uat-fix-75.spec.ts
// UAT Fix #75 — GITHUB_BUILD_REPO env var missing from preview deployment
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PREVIEW_URL ?? 'http://localhost:3000';

test.describe('[UAT Fix #75] GitHub env var fix', () => {
  test('REQ-GHFIX-004: comments endpoint returns 200', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/issues/30/comments`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.comments)).toBe(true);
  });

  test('REQ-GHFIX-006: apps endpoint returns 200', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/apps`);
    expect(res.status()).toBe(200);
  });

  test('REQ-GHFIX-004+005: comments section and reply editor render', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/issues/30`);
    // Comments section should not be in error state
    await expect(page.locator('[data-testid="comments-error"]')).not.toBeVisible({ timeout: 10000 });
    // At least one comment should appear OR empty state
    await expect(
      page.locator('[data-testid="comment-list"], [data-testid="no-comments"]')
    ).toBeVisible({ timeout: 10000 });
    // Reply editor visible
    await expect(page.locator('[data-testid="reply-editor"]')).toBeVisible();
  });

  test('REQ-GHFIX-006: apps page renders app cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/apps`);
    await expect(page.locator('[data-testid="apps-error"]')).not.toBeVisible({ timeout: 10000 });
    await expect(
      page.locator('[data-testid="app-card"], [data-testid="no-apps"]')
    ).toBeVisible({ timeout: 10000 });
  });
});
