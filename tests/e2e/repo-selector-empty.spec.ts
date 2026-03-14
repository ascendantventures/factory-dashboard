import { test, expect } from '@playwright/test';

test('RepositorySelector empty state shows correct copy', async ({ page }) => {
  // Mock empty repos response
  await page.route('/api/build-repos', async route => {
    await route.fulfill({ json: { repos: [] } });
  });

  await page.goto('/auth/login');
  await page.fill('[data-testid="email-input"]', process.env.USER_EMAIL!);
  await page.fill('[data-testid="password-input"]', process.env.USER_PASSWORD!);
  await page.click('[data-testid="login-submit"]');
  await page.waitForURL('/dashboard');

  // Open QuickCreate modal
  await page.click('[data-testid="quick-create-button"]');

  // Proceed to step 2 (fill title + description first)
  await page.fill('[data-testid="issue-title"]', 'Test issue');
  await page.click('[data-testid="next-step"]');

  // Verify corrected empty-state copy
  await expect(page.getByText('Add a repository in Settings first')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Add a repository in Settings first' }))
    .toHaveAttribute('href', '/dashboard/settings');
});
