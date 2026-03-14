import { test, expect } from '@playwright/test'

test.describe('Webhooks page — authenticated user', () => {
  test.beforeEach(async ({ page }) => {
    // Log in with test credentials
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL!)
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard**')
  })

  test('renders webhooks page without server exception', async ({ page }) => {
    const response = await page.goto('/dashboard/settings/webhooks')
    expect(response?.status()).toBe(200)

    // Must NOT contain the Vercel error digest
    const content = await page.content()
    expect(content).not.toContain('Digest: 2416468996')
    expect(content).not.toContain('Application error: a server-side exception')
  })

  test('shows empty state or webhook list — not a crash', async ({ page }) => {
    await page.goto('/dashboard/settings/webhooks')

    // Either a list of webhooks or an empty state message must be visible
    const hasEmptyState = await page.getByText(/no webhooks/i).isVisible().catch(() => false)
    const hasWebhookCards = await page.locator('[data-testid="webhook-card"]').count()

    expect(hasEmptyState || hasWebhookCards > 0).toBe(true)
  })

  test('unauthenticated user is redirected to login', async ({ browser }) => {
    const ctx = await browser.newContext() // fresh context, no auth
    const page = await ctx.newPage()
    await page.goto('/dashboard/settings/webhooks')
    await expect(page).toHaveURL(/\/auth\/login/)
    await ctx.close()
  })
})
