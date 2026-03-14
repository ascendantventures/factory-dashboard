import { test, expect } from '@playwright/test';

test.describe('Pencil.dev .pen viewer', () => {
  test.beforeEach(async ({ page }) => {
    // Assumes a seeded design exists for repo 'test-repo', issue 1
    await page.goto('/dashboard/apps/test-repo/designs/1');
    await page.waitForLoadState('networkidle');
  });

  test('renders frame thumbnails', async ({ page }) => {
    const thumbnails = page.locator('[data-testid="pen-frame-thumbnail"]');
    await expect(thumbnails).toHaveCount(2);
  });

  test('opens frame detail on thumbnail click', async ({ page }) => {
    await page.locator('[data-testid="pen-frame-thumbnail"]').first().click();
    await expect(page.locator('[data-testid="pen-frame-detail"]')).toBeVisible();
  });

  test('closes detail view on Escape', async ({ page }) => {
    await page.locator('[data-testid="pen-frame-thumbnail"]').first().click();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="pen-frame-detail"]')).not.toBeVisible();
  });

  test('displays design tokens tab', async ({ page }) => {
    await page.locator('[data-testid="pen-tab-tokens"]').click();
    await expect(page.locator('[data-testid="pen-tokens-panel"]')).toBeVisible();
  });

  test('download button triggers file download', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-testid="pen-download-btn"]').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pen$/);
  });
});

test.describe('Design Gallery', () => {
  test('shows designs tab in app nav', async ({ page }) => {
    await page.goto('/dashboard/apps/test-repo');
    await expect(page.locator('[data-testid="nav-tab-designs"]')).toBeVisible();
  });

  test('lists issues with designs', async ({ page }) => {
    await page.goto('/dashboard/apps/test-repo/designs');
    await expect(page.locator('[data-testid="design-gallery-item"]')).toHaveCount(1);
  });

  test('empty state shown when no designs', async ({ page }) => {
    await page.goto('/dashboard/apps/empty-repo/designs');
    await expect(page.locator('[data-testid="design-gallery-empty"]')).toBeVisible();
  });

  test('upload zone appears after entering issue number from empty gallery', async ({ page }) => {
    // Navigate to a repo with no designs
    await page.goto('/dashboard/apps/empty-repo/designs');
    await page.waitForLoadState('networkidle');

    // Empty state should be visible
    await expect(page.locator('[data-testid="design-gallery-empty"]')).toBeVisible();

    // Click the upload button in the empty state
    await page.getByRole('button', { name: 'Upload .pen file' }).click();

    // Issue number picker should appear
    await expect(page.locator('[data-testid="upload-issue-input"]')).toBeVisible();

    // Enter an issue number and click Continue
    await page.locator('[data-testid="upload-issue-input"]').fill('42');
    await page.getByRole('button', { name: 'Continue' }).click();

    // The drag-drop upload zone should now be visible
    await expect(page.locator('[data-testid="pen-upload-input"]')).toBeAttached();
    await expect(page.getByText('Drop a .pen file here or click to upload')).toBeVisible();
  });

  test('upload zone appears on Enter key in issue input', async ({ page }) => {
    await page.goto('/dashboard/apps/empty-repo/designs');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Upload .pen file' }).click();
    await page.locator('[data-testid="upload-issue-input"]').fill('7');
    await page.locator('[data-testid="upload-issue-input"]').press('Enter');

    await expect(page.getByText('Drop a .pen file here or click to upload')).toBeVisible();
  });

  test('invalid issue number (0) does not advance to upload zone', async ({ page }) => {
    await page.goto('/dashboard/apps/empty-repo/designs');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Upload .pen file' }).click();
    await page.locator('[data-testid="upload-issue-input"]').fill('0');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Upload zone should NOT appear
    await expect(page.getByText('Drop a .pen file here or click to upload')).not.toBeVisible();
  });
});

test.describe('User Design Submission', () => {
  test('uploads .pen file and shows design reference tag', async ({ page }) => {
    await page.goto('/dashboard/apps/test-repo/issues/new');
    const fileInput = page.locator('[data-testid="pen-upload-input"]');
    await fileInput.setInputFiles('tests/fixtures/sample.pen');
    await expect(page.locator('[data-testid="design-reference-tag"]')).toBeVisible();
  });

  test('rejects non-.pen files', async ({ page }) => {
    await page.goto('/dashboard/apps/test-repo/issues/new');
    // Use a PNG to trigger error — create a minimal valid PNG in base64
    const fileInput = page.locator('[data-testid="pen-upload-input"]');
    // Create a temp file with wrong extension
    await fileInput.setInputFiles({
      name: 'image.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-png'),
    });
    await expect(page.locator('[data-testid="upload-error"]')).toContainText('.pen');
  });
});
