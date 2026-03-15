/**
 * notifications.spec.ts — Phase 1 + Phase 2 E2E tests
 * Covers: bell, panel, mark read, preferences, delivery channels, timezone
 *
 * Auth: uses PLAYWRIGHT_TEST_USER_EMAIL + PLAYWRIGHT_TEST_USER_PASSWORD env vars.
 */
import { test, expect } from '@playwright/test';

// ── Phase 1: Notification Bell & Panel ────────────────────────────────────

test.describe('Notification Bell & Panel', () => {
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

// ── Phase 2: Internal Create API — auth checks ───────────────────────────

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
    const factorySecret = process.env.FACTORY_SECRET ?? 'test-secret';
    const res = await request.post('/api/notifications/create', {
      headers: { 'x-factory-secret': factorySecret },
      data: { user_id: 'test', type: 'invalid_type', title: 'Test' },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 with missing user_id', async ({ request }) => {
    const factorySecret = process.env.FACTORY_SECRET ?? 'test-secret';
    const res = await request.post('/api/notifications/create', {
      headers: { 'x-factory-secret': factorySecret },
      data: { type: 'spec_ready', title: 'Test' },
    });
    expect(res.status()).toBe(400);
  });
});

// ── Phase 2: Test Delivery API — auth checks ─────────────────────────────

test.describe('Test Delivery API — auth checks', () => {
  test('returns 401 without session', async ({ request }) => {
    const res = await request.post('/api/notifications/test-delivery', {
      data: { channel: 'email' },
    });
    expect(res.status()).toBe(401);
  });
});

// ── Phase 2: Preferences API — auth checks ───────────────────────────────

test.describe('Preferences API — auth checks', () => {
  test('GET /api/notifications/preferences requires auth', async ({ request }) => {
    const res = await request.get('/api/notifications/preferences');
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/notifications/preferences requires auth', async ({ request }) => {
    const res = await request.patch('/api/notifications/preferences', {
      data: { email_enabled: true },
    });
    expect(res.status()).toBe(401);
  });
});

// ── Phase 2: Preferences Page (auth required) ────────────────────────────

test.describe('Notification Preferences Page (auth required)', () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.PLAYWRIGHT_TEST_USER_EMAIL;
    const password = process.env.PLAYWRIGHT_TEST_USER_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
    await page.goto('/dashboard/settings/notifications');
  });

  test('preferences page loads with Notifications heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
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

  test('discord toggle enabled when valid webhook URL is present', async ({ page }) => {
    await page.fill(
      '[data-testid="discord-webhook-input"]',
      'https://discord.com/api/webhooks/123456/test-token',
    );
    await page.keyboard.press('Tab');
    const discordToggle = page.locator('[data-testid="discord-enabled-toggle"]');
    await expect(discordToggle).not.toBeDisabled();
  });

  test('invalid webhook URL shows inline error on blur', async ({ page }) => {
    await page.fill('[data-testid="discord-webhook-input"]', 'https://evil.com/hook');
    await page.keyboard.press('Tab');
    await expect(page.getByText(/Must start with/)).toBeVisible();
  });

  test('timezone select renders with a value', async ({ page }) => {
    const tzSelect = page.locator('[data-testid="timezone-select"]');
    await expect(tzSelect).toBeVisible();
    const value = await tzSelect.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('timezone select saves on change and shows Saved indicator', async ({ page }) => {
    const tzSelect = page.locator('[data-testid="timezone-select"]');
    await tzSelect.selectOption('America/Los_Angeles');
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 3000 });
  });

  test('quiet hours toggle shows time inputs when enabled', async ({ page }) => {
    const quietToggle = page.locator('[data-testid="quiet-hours-toggle"]');
    const isChecked = await quietToggle.getAttribute('aria-checked') === 'true';
    if (!isChecked) {
      await quietToggle.click();
    }
    await expect(page.locator('input[type="time"]').first()).toBeVisible();
  });

  test('quiet hours toggle hides time inputs when disabled', async ({ page }) => {
    const quietToggle = page.locator('[data-testid="quiet-hours-toggle"]');
    const isChecked = await quietToggle.getAttribute('aria-checked') === 'true';
    if (isChecked) {
      await quietToggle.click();
    }
    await expect(page.locator('input[type="time"]')).not.toBeVisible();
  });

  test('webhook input and timezone select meet 44px height requirement', async ({ page }) => {
    const webhookInput = page.locator('[data-testid="discord-webhook-input"]');
    const webhookBox = await webhookInput.boundingBox();
    expect(webhookBox?.height).toBeGreaterThanOrEqual(44);

    const tzSelect = page.locator('[data-testid="timezone-select"]');
    const tzBox = await tzSelect.boundingBox();
    expect(tzBox?.height).toBeGreaterThanOrEqual(44);
  });
});
