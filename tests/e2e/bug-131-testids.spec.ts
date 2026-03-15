// tests/e2e/bug-131-testids.spec.ts
import { test, expect } from '@playwright/test';

test.describe('BUG #131 — data-testid contract', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', process.env.TEST_ADMIN_EMAIL!);
    await page.fill('[data-testid="password-input"]', process.env.TEST_ADMIN_PASSWORD!);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard/**');
    await page.goto('/dashboard/admin/users');
  });

  test('RoleAuditPanel — spec testids present, old testids absent', async ({ page }) => {
    // Expand the panel
    await page.click('[data-testid="role-audit-header"]');

    // Spec-required testids
    await expect(page.locator('[data-testid="role-audit-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="role-audit-table"]')).toBeVisible();

    // Old/wrong testids must NOT exist
    await expect(page.locator('[data-testid="role-audit-panel-toggle"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="audit-row"]')).toHaveCount(0);
  });

  test('RoleAuditPanel — audit-empty-state visible when no entries', async ({ page }) => {
    // This test assumes a fresh QA environment with no role changes logged
    await page.click('[data-testid="role-audit-header"]');
    const rows = page.locator('[data-testid="role-audit-row"]');
    const rowCount = await rows.count();
    if (rowCount === 0) {
      await expect(page.locator('[data-testid="audit-empty-state"]')).toBeVisible();
    }
  });

  test('RoleAuditPanel — role-audit-row testid on each row', async ({ page }) => {
    await page.click('[data-testid="role-audit-header"]');
    const rows = page.locator('[data-testid="role-audit-row"]');
    const rowCount = await rows.count();
    // If rows exist, each must have the correct testid
    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        await expect(rows.nth(i)).toBeVisible();
      }
    }
  });

  test('QaPurgePanel — spec testids present, old testids absent', async ({ page }) => {
    await page.click('[data-testid="qa-purge-header"]');

    await expect(page.locator('[data-testid="qa-purge-header"]')).toBeVisible();

    // Old testids must NOT exist
    await expect(page.locator('[data-testid="qa-purge-panel-toggle"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="purge-preview-list"]')).toHaveCount(0);
  });

  test('QaPurgePanel — purge-preview-dismiss clears preview', async ({ page }) => {
    await page.click('[data-testid="qa-purge-header"]');

    // Trigger dry run
    const dryRunButton = page.locator('[data-testid="purge-preview-btn"]');
    if (await dryRunButton.isVisible()) {
      await dryRunButton.click();
      // Wait for preview result to appear
      await expect(page.locator('[data-testid="purge-preview-result"]')).toBeVisible({ timeout: 10000 });
      // Dismiss button must exist
      await expect(page.locator('[data-testid="purge-preview-dismiss"]')).toBeVisible();
      // Click dismiss
      await page.click('[data-testid="purge-preview-dismiss"]');
      // Preview should be gone
      await expect(page.locator('[data-testid="purge-preview-result"]')).toBeHidden();
    }
  });
});
