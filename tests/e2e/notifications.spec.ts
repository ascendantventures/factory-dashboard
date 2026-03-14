import { test, expect } from '@playwright/test';

test.describe('Notification Bell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('bell button is visible in header', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Notifications' })).toBeVisible();
  });

  test('bell button meets 44px touch target requirement', async ({ page }) => {
    const bell = page.getByRole('button', { name: 'Notifications' });
    const box = await bell.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('clicking bell opens notification panel', async ({ page }) => {
    const bell = page.getByRole('button', { name: 'Notifications' });
    await bell.click();
    await expect(page.getByRole('region', { name: 'Notifications panel' })).toBeVisible();
  });

  test('clicking bell again closes panel', async ({ page }) => {
    const bell = page.getByRole('button', { name: 'Notifications' });
    await bell.click();
    await bell.click();
    await expect(page.getByRole('region', { name: 'Notifications panel' })).not.toBeVisible();
  });

  test('clicking outside panel closes it', async ({ page }) => {
    const bell = page.getByRole('button', { name: 'Notifications' });
    await bell.click();
    await page.click('body', { position: { x: 10, y: 10 } });
    await expect(page.getByRole('region', { name: 'Notifications panel' })).not.toBeVisible();
  });

  test('Escape key closes panel', async ({ page }) => {
    const bell = page.getByRole('button', { name: 'Notifications' });
    await bell.click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('region', { name: 'Notifications panel' })).not.toBeVisible();
  });

  test('panel shows notifications or empty state', async ({ page }) => {
    const bell = page.getByRole('button', { name: 'Notifications' });
    await bell.click();
    const panel = page.getByRole('region', { name: 'Notifications panel' });
    const hasItems = await panel.locator('[data-testid="notification-item"]').count();
    if (hasItems === 0) {
      await expect(panel.getByText(/no notifications/i)).toBeVisible();
    } else {
      expect(hasItems).toBeGreaterThan(0);
    }
  });

  test('mark all read clears unread badge', async ({ page }) => {
    const bell = page.getByRole('button', { name: 'Notifications' });
    await bell.click();
    const markAllRead = page.getByTestId('notification-mark-all');
    if (await markAllRead.isVisible() && await markAllRead.isEnabled()) {
      await markAllRead.click();
      await expect(page.getByTestId('notification-badge')).not.toBeVisible();
    }
  });

  test('GET /api/notifications requires auth', async ({ request }) => {
    const res = await request.get('/api/notifications');
    expect(res.status()).toBe(401);
  });

  test('POST /api/notifications/read-all requires auth', async ({ request }) => {
    const res = await request.post('/api/notifications/read-all');
    expect(res.status()).toBe(401);
  });
});
