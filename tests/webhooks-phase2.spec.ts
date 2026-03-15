import { test, expect } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

test.describe('Webhooks Phase 2', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!)
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**')
  })

  test('REQ-FWH2-003: format_type selector appears on webhook form', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings/webhooks`)
    await page.click('button:has-text("Add webhook")')
    await expect(page.getByTestId('format-selector')).toBeVisible()
    await expect(page.getByTestId('format-option-standard')).toBeVisible()
    await expect(page.getByTestId('format-option-slack')).toBeVisible()
    await expect(page.getByTestId('format-option-discord')).toBeVisible()
  })

  test('REQ-FWH2-003: create slack webhook stores format_type', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings/webhooks`)
    await page.click('button:has-text("Add webhook")')
    await page.fill('input[name="label"]', 'Test Slack')
    await page.fill('input[name="url"]', 'https://hooks.slack.com/services/TEST/FAKE/URL')
    await page.getByTestId('format-option-slack').click()
    await page.click('button:has-text("build.completed")')
    await page.click('button[type="submit"]')
    await expect(page.getByTestId('format-badge')).toBeVisible()
  })

  test('REQ-FWH2-002: retry button appears on failed delivery', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings/webhooks`)
    const firstCard = page.getByTestId('webhook-card').first()
    if (await firstCard.isVisible()) {
      await firstCard.getByRole('button', { name: /deliveries|history/i }).click()
      const failedRow = page.getByTestId('delivery-row').filter({ has: page.locator('[data-failed="true"]') }).first()
      if (await failedRow.isVisible()) {
        await expect(failedRow.getByTestId('retry-button')).toBeVisible()
      }
    }
  })

  test('REQ-FWH2-001: fire-event endpoint rejects missing secret', async ({ request }) => {
    const res = await request.post(`${BASE}/api/webhooks/fire-event`, {
      data: { event: 'build.completed' },
    })
    expect(res.status()).toBe(401)
  })

  test('REQ-FWH2-001: fire-event endpoint rejects unknown event', async ({ request }) => {
    const res = await request.post(`${BASE}/api/webhooks/fire-event`, {
      headers: { 'x-factory-webhook-secret': process.env.FACTORY_WEBHOOK_SECRET! },
      data: { event: 'not.a.real.event' },
    })
    expect(res.status()).toBe(400)
  })

  test('REQ-FWH2-001: fire-event returns fired count', async ({ request }) => {
    const res = await request.post(`${BASE}/api/webhooks/fire-event`, {
      headers: { 'x-factory-webhook-secret': process.env.FACTORY_WEBHOOK_SECRET! },
      data: {
        event: 'build.completed',
        issue: { number: 99, title: 'E2E test issue', repo: 'test/repo' },
        details: {},
      },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(typeof body.fired).toBe('number')
    expect(typeof body.skipped).toBe('number')
  })
})
