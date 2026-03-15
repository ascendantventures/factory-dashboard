import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('UAT Attachment Upload Feature', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('[type="submit"]');
    await page.waitForURL(/\/(dashboard|uat)/, { timeout: 10000 });
    await page.goto('/uat/attachments?issue=49');
    await page.waitForSelector('[data-testid="attachment-dropzone"]', { timeout: 10000 });
  });

  test('REQ-UAT-001: Upload a PNG file', async ({ page }) => {
    const fileInput = page.locator('[data-testid="attachment-file-input"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/mockup.png'));
    await page.locator('[data-testid="upload-btn"]').first().click();
    await expect(page.locator('[data-testid="attachment-list"]')).toContainText('mockup.png', { timeout: 15000 });
  });

  test('REQ-UAT-001: Reject unsupported file type', async ({ page }) => {
    const fileInput = page.locator('[data-testid="attachment-file-input"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/test.txt'));
    await expect(page.locator('[data-testid="error-msg"]')).toContainText('Unsupported file type', { timeout: 5000 });
  });

  test('REQ-UAT-002: List attachments for issue 49', async ({ page }) => {
    await page.goto('/uat/attachments?issue=49');
    await expect(page.locator('[data-testid="attachment-list"], [data-testid="empty-state"]')).toBeVisible({ timeout: 10000 });
  });

  test('REQ-UAT-003: Preview PNG attachment', async ({ page }) => {
    const firstItem = page.locator('[data-testid="attachment-item"]').first();
    const count = await firstItem.count();
    if (count > 0) {
      await firstItem.click();
      await expect(page.locator('[data-testid="preview-image"]')).toBeVisible({ timeout: 5000 });
    } else {
      // Upload first, then preview
      const fileInput = page.locator('[data-testid="attachment-file-input"]');
      await fileInput.setInputFiles(path.join(__dirname, 'fixtures/mockup.png'));
      await page.locator('[data-testid="upload-btn"]').first().click();
      await expect(page.locator('[data-testid="attachment-item"]').first()).toBeVisible({ timeout: 15000 });
      await page.locator('[data-testid="attachment-item"]').first().click();
      await expect(page.locator('[data-testid="preview-image"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('REQ-UAT-004: Delete own attachment', async ({ page }) => {
    // Ensure there's something to delete
    const fileInput = page.locator('[data-testid="attachment-file-input"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/mockup.png'));
    await page.locator('[data-testid="upload-btn"]').first().click();
    await expect(page.locator('[data-testid="attachment-item"]').first()).toBeVisible({ timeout: 15000 });

    const firstItem = page.locator('[data-testid="attachment-item"]').first();
    const fileName = await firstItem.locator('[data-testid="file-name"]').textContent();
    await firstItem.hover();
    await firstItem.locator('[data-testid="delete-btn"]').click();
    await page.locator('[data-testid="confirm-delete"]').click();
    if (fileName) {
      await expect(page.locator('[data-testid="attachment-list"]')).not.toContainText(fileName, { timeout: 10000 });
    }
  });

  test('REQ-UAT-005: Redirect unauthenticated users', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/uat/attachments');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
  });

});
