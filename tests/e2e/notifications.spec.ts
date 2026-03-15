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

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2: Delivery Channels & Timezone-Aware Quiet Hours (Issue #109)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Notification Bell & Panel (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', process.env.PLAYWRIGHT_TEST_USER_EMAIL!);
    await page.fill('[data-testid="password-input"]', process.env.PLAYWRIGHT_TEST_USER_PASSWORD!);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('bell is visible in header', async ({ page }) => {
    await expect(page.locator('[data-testid="notification-bell"]')).toBeVisible();
  });

  test('clicking bell opens panel', async ({ page }) => {
    await page.click('[data-testid="notification-bell"]');
    await expect(page.locator('[data-testid="notification-panel"]')).toBeVisible();
  });

  test('clicking bell again closes panel', async ({ page }) => {
    await page.click('[data-testid="notification-bell"]');
    await page.click('[data-testid="notification-bell"]');
    await expect(page.locator('[data-testid="notification-panel"]')).not.toBeVisible();
  });

  test('badge hidden when unread count is 0', async ({ page }) => {
    await page.request.post('/api/notifications/read-all');
    await page.reload();
    const badge = page.locator('[data-testid="notification-badge"]');
    await expect(badge).not.toBeVisible();
  });

  test('mark all read clears badge', async ({ page }) => {
    await page.request.post('/api/notifications/create', {
      headers: { 'x-factory-secret': process.env.FACTORY_SECRET! },
      data: {
        user_id: process.env.PLAYWRIGHT_TEST_USER_ID!,
        type: 'spec_ready',
        title: 'Test spec ready',
        body: 'E2E test notification',
        link: '/dashboard',
      },
    });
    await page.reload();
    await page.click('[data-testid="notification-bell"]');
    await expect(page.locator('[data-testid="notification-badge"]')).toBeVisible();
    await page.click('[data-testid="notification-mark-all"]');
    await expect(page.locator('[data-testid="notification-badge"]')).not.toBeVisible();
  });
});

test.describe('Notification Preferences (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', process.env.PLAYWRIGHT_TEST_USER_EMAIL!);
    await page.fill('[data-testid="password-input"]', process.env.PLAYWRIGHT_TEST_USER_PASSWORD!);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
    await page.goto('/dashboard/settings/notifications');
  });

  test('preferences page loads with 7 type toggles', async ({ page }) => {
    const toggles = page.locator('[data-testid^="notif-toggle-"]');
    await expect(toggles).toHaveCount(7);
  });

  test('quiet hours toggle shows/hides time inputs', async ({ page }) => {
    const quietToggle = page.locator('[data-testid="quiet-hours-toggle"]');
    const isChecked = (await quietToggle.getAttribute('aria-checked')) === 'true';
    if (isChecked) {
      await quietToggle.click();
      await page.waitForTimeout(200);
    }
    await expect(page.locator('input[type="time"]')).not.toBeVisible();
    await quietToggle.click();
    await expect(page.locator('input[type="time"]').first()).toBeVisible();
  });

  test('delivery channels section is present', async ({ page }) => {
    await expect(page.locator('[data-testid="email-enabled-toggle"]')).toBeVisible();
    await expect(page.locator('[data-testid="discord-enabled-toggle"]')).toBeVisible();
    await expect(page.locator('[data-testid="discord-webhook-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="timezone-select"]')).toBeVisible();
  });

  test('discord toggle disabled when webhook URL is empty', async ({ page }) => {
    await page.fill('[data-testid="discord-webhook-input"]', '');
    await page.keyboard.press('Tab');
    const discordToggle = page.locator('[data-testid="discord-enabled-toggle"]');
    await expect(discordToggle).toBeDisabled();
  });

  test('timezone select defaults to UTC and saves on change', async ({ page }) => {
    const tzSelect = page.locator('[data-testid="timezone-select"]');
    await expect(tzSelect).toHaveValue('UTC');
    await tzSelect.selectOption('America/New_York');
    await page.waitForSelector('text=Saved');
    await page.reload();
    await page.goto('/dashboard/settings/notifications');
    await expect(page.locator('[data-testid="timezone-select"]')).toHaveValue('America/New_York');
    // Restore
    await page.locator('[data-testid="timezone-select"]').selectOption('UTC');
    await page.waitForSelector('text=Saved');
  });
});

test.describe('Internal Create API — auth checks', () => {
  test('returns 401 with missing factory secret', async ({ request }) => {
    const res = await request.post('/api/notifications/create', {
      data: { user_id: 'test', type: 'spec_ready', title: 'Test' },
    });
    expect(res.status()).toBe(401);
  });

  test('returns 401 with wrong factory secret', async ({ request }) => {
    const res = await request.post('/api/notifications/create', {
      headers: { 'x-factory-secret': 'wrong-secret' },
      data: { user_id: 'test', type: 'spec_ready', title: 'Test' },
    });
    expect(res.status()).toBe(401);
  });

  test('returns 400 with invalid notification type', async ({ request }) => {
    const res = await request.post('/api/notifications/create', {
      headers: { 'x-factory-secret': process.env.FACTORY_SECRET! },
      data: { user_id: 'test', type: 'invalid_type', title: 'Test' },
    });
    expect(res.status()).toBe(400);
  });
});
