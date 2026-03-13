// tests/e2e/ump-enhancements.spec.ts
import { test, expect } from '@playwright/test';

test.describe('REQ-UMP-001: Email + addressing in invite modal', () => {
  test('accepts RFC-compliant plus-addressed email', async ({ page }) => {
    await page.goto('/dashboard/admin/users');
    await page.getByRole('button', { name: /invite/i }).click();
    await page.getByLabel(/email/i).fill('test+regression@example.com');
    // Trigger validation
    await page.getByLabel(/email/i).blur();
    await expect(page.getByText(/invalid/i)).not.toBeVisible();
  });

  test('rejects malformed email', async ({ page }) => {
    await page.goto('/dashboard/admin/users');
    await page.getByRole('button', { name: /invite/i }).click();
    await page.getByLabel(/email/i).fill('notanemail');
    await page.getByLabel(/email/i).blur();
    await expect(page.getByText(/invalid/i)).toBeVisible();
  });
});

test.describe('REQ-UMP-002: Profile save success toast', () => {
  test('shows success toast after saving profile', async ({ page }) => {
    await page.goto('/dashboard/settings/profile');
    // Make a trivial change
    const nameInput = page.getByLabel(/name/i).first();
    await nameInput.fill('Updated Name');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.locator('[data-testid="toast-success"], [role="status"]').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('REQ-UMP-004: Invite button loading state', () => {
  test('disables button during submission', async ({ page }) => {
    await page.goto('/dashboard/admin/users');
    await page.getByRole('button', { name: /invite/i }).click();
    await page.getByLabel(/email/i).fill('valid@example.com');
    const sendBtn = page.getByRole('button', { name: /send invite/i });
    await sendBtn.click();
    // Button should be disabled immediately after click
    await expect(sendBtn).toBeDisabled();
  });
});

test.describe('REQ-UMP-005: Admin mobile bottom nav', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('admin sees admin nav entry on mobile', async ({ page }) => {
    // Assumes admin session is set up via storageState or login fixture
    await page.goto('/');
    await expect(page.locator('[data-testid="bottom-nav-admin"], nav').filter({ hasText: /admin|more/i })).toBeVisible();
  });
});

test.describe('REQ-UMP-006: Responsive users table', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('users table is horizontally scrollable at 375px', async ({ page }) => {
    await page.goto('/dashboard/admin/users');
    const tableWrapper = page.locator('.table-scroll-container');
    const overflowX = await tableWrapper.evaluate(el => getComputedStyle(el).overflowX);
    expect(['auto', 'scroll']).toContain(overflowX);
  });
});
