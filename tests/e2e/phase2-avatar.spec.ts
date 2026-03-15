import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Avatar Upload', () => {
  test.beforeEach(async ({ page }) => {
    // Assumes test user is already logged in via storageState
    await page.goto('/dashboard/settings/profile');
    // Wait for the profile page to load
    await expect(page.locator('h1')).toContainText('Profile Settings');
  });

  test('uploads a valid JPEG avatar', async ({ page }) => {
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/avatar-valid.jpg'));
    await expect(page.locator('[data-testid="avatar-preview"] img')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="avatar-preview"] img')).toHaveAttribute('src', /supabase|fd-avatars/);
  });

  test('rejects file larger than 2 MB', async ({ page }) => {
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/avatar-large.jpg'));
    await expect(page.locator('[data-testid="avatar-error"]')).toContainText('under 2 MB');
    await expect(page.locator('[data-testid="avatar-preview"] img')).not.toBeVisible();
  });

  test('rejects non-image file type', async ({ page }) => {
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/document.pdf'));
    await expect(page.locator('[data-testid="avatar-error"]')).toContainText('JPEG, PNG, or WebP');
  });

  test('removes avatar and shows initials fallback', async ({ page }) => {
    // First check if avatar exists, if not skip this part
    const removeBtn = page.locator('[data-testid="remove-avatar-btn"]');
    const avatarImg = page.locator('[data-testid="avatar-preview"] img');

    if (await avatarImg.isVisible()) {
      await removeBtn.click();
      await page.locator('[data-testid="confirm-remove-avatar"]').click();
      await expect(page.locator('[data-testid="avatar-initials"]')).toBeVisible({ timeout: 5000 });
      await expect(avatarImg).not.toBeVisible();
    } else {
      // Upload first, then remove
      const fileInput = page.locator('input[type="file"][accept*="image"]');
      await fileInput.setInputFiles(path.join(__dirname, '../fixtures/avatar-valid.jpg'));
      await expect(avatarImg).toBeVisible({ timeout: 10000 });

      await removeBtn.click();
      await page.locator('[data-testid="confirm-remove-avatar"]').click();
      await expect(page.locator('[data-testid="avatar-initials"]')).toBeVisible({ timeout: 5000 });
      await expect(avatarImg).not.toBeVisible();
    }
  });
});
