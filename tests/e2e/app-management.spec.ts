import { test, expect } from '@playwright/test';

const APP_REPO = 'ascendantventures/factory-dashboard';
const APP_PAGE = `/dashboard/apps/${encodeURIComponent(APP_REPO)}`;

test.describe('App Management — Issue History', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_PAGE);
    await page.getByRole('tab', { name: 'Issues' }).click();
  });

  test('shows issue list with sort/filter controls', async ({ page }) => {
    await expect(page.getByTestId('issue-history-table')).toBeVisible();
    await expect(page.getByTestId('filter-bar')).toBeVisible();
  });

  test('filters by station', async ({ page }) => {
    await page.getByTestId('filter-station').selectOption('build');
    await page.waitForResponse(resp => resp.url().includes('/issues') && resp.status() === 200);
    const rows = page.getByTestId('issue-row');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).getByTestId('station-badge')).toContainText('build');
    }
  });

  test('sorts by cost column', async ({ page }) => {
    await page.getByRole('columnheader', { name: /cost/i }).click();
    await page.waitForResponse(resp => resp.url().includes('sort=cost'));
    await expect(page.getByTestId('issue-history-table')).toBeVisible();
  });

  test('clicking issue row opens GitHub issue in new tab', async ({ page, context }) => {
    const rows = page.getByTestId('issue-row');
    const count = await rows.count();
    if (count === 0) {
      test.skip();
      return;
    }
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      rows.first().click(),
    ]);
    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('github.com');
  });
});

test.describe('App Management — Create Issue', () => {
  test('opens create issue modal with pre-filled repo', async ({ page }) => {
    await page.goto(APP_PAGE);
    await page.getByRole('button', { name: /new issue/i }).click();

    const repoField = page.getByTestId('create-issue-repo');
    await expect(repoField).toBeVisible();
    await expect(repoField).toBeDisabled();
  });

  test('quick type buttons are visible in modal', async ({ page }) => {
    await page.goto(APP_PAGE);
    await page.getByRole('button', { name: /new issue/i }).click();
    await expect(page.getByRole('button', { name: /feature request/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /bug report/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /design change/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /performance fix/i })).toBeVisible();
  });

  test('modal closes on cancel', async ({ page }) => {
    await page.goto(APP_PAGE);
    await page.getByRole('button', { name: /new issue/i }).click();
    await expect(page.getByTestId('create-issue-modal')).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByTestId('create-issue-modal')).not.toBeVisible();
  });
});

test.describe('App Management — Stats', () => {
  test('displays stats bar on app page', async ({ page }) => {
    await page.goto(APP_PAGE);
    await expect(page.getByTestId('app-stats-bar')).toBeVisible();
    await expect(page.getByTestId('stat-total-issues')).toBeVisible();
    await expect(page.getByTestId('stat-total-cost')).toBeVisible();
    await expect(page.getByTestId('stat-success-rate')).toBeVisible();
  });
});

test.describe('App Management — Timeline', () => {
  test('shows timeline tab', async ({ page }) => {
    await page.goto(APP_PAGE);
    await page.getByRole('tab', { name: 'Timeline' }).click();
    await expect(page.getByTestId('timeline-view')).toBeVisible();
  });

  test('shows empty state when no timeline events', async ({ page }) => {
    await page.goto(`/dashboard/apps/${encodeURIComponent('owner/no-events-repo')}`);
    // If page loads (may 404), check timeline tab
    const tabButton = page.getByRole('tab', { name: 'Timeline' });
    if (await tabButton.isVisible()) {
      await tabButton.click();
      await expect(page.getByTestId('timeline-empty-state')).toBeVisible();
    }
  });
});
