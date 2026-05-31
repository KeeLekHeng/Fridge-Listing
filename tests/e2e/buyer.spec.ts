import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

interface TestData {
  buyRent: { id: string; code: string; brand: string }
  rentOnly: { id: string; code: string; brand: string }
  buyOnly: { id: string; code: string; brand: string }
  reserved: { id: string; code: string; brand: string }
  unavailable: { id: string; code: string; brand: string }
}

const td = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '.test-data.json'), 'utf-8')
) as TestData

test('REQ-E2E-005: buyer views listing grid', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('a[href^="/listing/"]').first()).toBeVisible({ timeout: 10_000 })
})

test('REQ-E2E-006: buyer filters by rent', async ({ page }) => {
  await page.goto('/')
  // Default buy mode — buy-only listing should be visible
  await expect(page.getByText(td.buyOnly.brand)).toBeVisible({ timeout: 10_000 })
  // Switch to rent mode
  await page.getByRole('button', { name: 'Rent' }).click()
  // Rent-only listing appears (confirms grid has updated)
  await expect(page.getByText(td.rentOnly.brand)).toBeVisible({ timeout: 10_000 })
  // Buy-only listing no longer visible
  await expect(page.getByText(td.buyOnly.brand)).not.toBeVisible()
})

test('REQ-E2E-007: buyer opens listing detail', async ({ page }) => {
  await page.goto(`/listing/${td.buyRent.id}`)
  // Brand heading visible
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(td.buyRent.brand, { timeout: 10_000 })
  // Listing code visible in image placeholder label
  await expect(page.getByText(td.buyRent.code)).toBeVisible()
})

test('REQ-E2E-008: buyer adds to shortlist', async ({ page }) => {
  await page.goto(`/listing/${td.buyRent.id}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
  // Click the CTA bar "Add to shortlist" button (last matching)
  await page.getByRole('button', { name: 'Add to shortlist' }).last().click()
  // Button now reflects "Already in shortlist"
  await expect(page.getByText('Already in shortlist')).toBeVisible({ timeout: 5_000 })
})

test('REQ-E2E-009: buyer cannot add more than 5 to shortlist', async ({ page }) => {
  // Pre-fill shortlist with 5 entries
  await page.addInitScript(() => {
    localStorage.setItem('chillix:shortlist', JSON.stringify([
      'fake-id-1', 'fake-id-2', 'fake-id-3', 'fake-id-4', 'fake-id-5',
    ]))
  })
  await page.goto(`/listing/${td.buyRent.id}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
  // CTA bar shows disabled "Shortlist full (5/5)" button
  await expect(page.getByText('Shortlist full (5/5)')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add to shortlist' })).toBeDisabled()
})

test('REQ-E2E-010: buyer removes from shortlist', async ({ page }) => {
  // Pre-fill shortlist with the real available listing
  await page.addInitScript(({ id }: { id: string }) => {
    localStorage.setItem('chillix:shortlist', JSON.stringify([id]))
  }, { id: td.buyRent.id })
  await page.goto('/shortlist')
  // Listing renders after API fetch
  await expect(page.getByText(td.buyRent.brand)).toBeVisible({ timeout: 10_000 })
  // Remove the item
  await page.getByRole('button', { name: 'Remove from shortlist' }).click()
  // Empty state shows
  await expect(page.getByText('Your shortlist is empty')).toBeVisible({ timeout: 5_000 })
})

test('REQ-E2E-011: enquiry button opens delivery dialog with correct telegram links', async ({ page }) => {
  await page.goto(`/listing/${td.buyRent.id}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })

  // Click enquiry button — should open delivery dialog, not go directly to Telegram
  await page.getByRole('button', { name: /Buy|Enquire to buy/i }).first().click()

  // Dialog must appear with both options
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 })
  await expect(page.getByRole('dialog').getByText('Delivery')).toBeVisible()
  await expect(page.getByRole('dialog').getByText('Self-collect')).toBeVisible()

  // Delivery link must point to Telegram with delivery text in message
  const deliveryHref = await page.getByRole('dialog').getByRole('link', { name: /Delivery/i }).getAttribute('href')
  expect(deliveryHref).toContain('t.me/Lucas_Keee')
  expect(decodeURIComponent(deliveryHref!)).toContain('Delivery')

  // Self-collect link must point to Telegram with self-collect text in message
  const selfCollectHref = await page.getByRole('dialog').getByRole('link', { name: /Self-collect/i }).getAttribute('href')
  expect(selfCollectHref).toContain('t.me/Lucas_Keee')
  expect(decodeURIComponent(selfCollectHref!)).toContain('Self-collect')
})

test('REQ-E2E-012: reserved and unavailable listings are hidden from buyer grid', async ({ page }) => {
  await page.goto('/')
  // Wait for the grid to load
  await page.locator('a[href^="/listing/"]').first().waitFor({ timeout: 10_000 })
  // Reserved and unavailable listing codes must not appear anywhere as visible text
  await expect(page.getByText(td.reserved.code)).toHaveCount(0)
  await expect(page.getByText(td.unavailable.code)).toHaveCount(0)
})
