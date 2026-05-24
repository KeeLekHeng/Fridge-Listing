import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'

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

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? ''
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? ''
const FIXTURE_IMAGE = path.resolve(__dirname, 'fixtures/test-image.jpg')

async function loginAdmin(page: Page) {
  await page.goto('/manage/login')
  await page.getByPlaceholder('Username').fill(ADMIN_USERNAME)
  await page.getByPlaceholder('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/manage$/, { timeout: 10_000 })
}

test('REQ-E2E-013: admin can log in with valid credentials', async ({ page }) => {
  await page.goto('/manage/login')
  await page.getByPlaceholder('Username').fill(ADMIN_USERNAME)
  await page.getByPlaceholder('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/manage$/, { timeout: 10_000 })
  await expect(page.locator('table')).toBeVisible()
})

test('REQ-E2E-014: unauthenticated access to /manage redirects to login', async ({ page }) => {
  await page.goto('/manage')
  await expect(page).toHaveURL(/\/manage\/login/, { timeout: 10_000 })
})

test('REQ-E2E-015: admin can create a listing', async ({ page }) => {
  await loginAdmin(page)
  await page.getByRole('link', { name: '+ Create listing' }).click()
  await expect(page).toHaveURL(/\/manage\/listings\/new/, { timeout: 5_000 })
  await page.getByPlaceholder('e.g. Panasonic').fill('TestBrand-E2E')
  await page.getByPlaceholder('e.g. Like new').fill('Good')
  await page.getByPlaceholder('e.g. Eusoff Hall').fill('Test Location')
  await page.getByRole('button', { name: 'Create listing' }).click()
  await expect(page).toHaveURL(/\/manage$/, { timeout: 10_000 })
  await expect(page.getByText('TestBrand-E2E').first()).toBeVisible()
})

test('REQ-E2E-016: admin can edit a listing price and change reflects in dashboard', async ({ page }) => {
  await loginAdmin(page)
  await page.goto(`/manage/listings/${td.buyRent.id}/edit`)
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible({ timeout: 5_000 })
  // Use native value setter to reliably trigger React's onChange on a controlled number input
  await page.locator('input[placeholder="e.g. 200"]').evaluate((input: HTMLInputElement) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '188')
    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
  })
  await expect(page.getByPlaceholder('e.g. 200')).toHaveValue('188')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page).toHaveURL(/\/manage$/, { timeout: 10_000 })
  await expect(page.getByText('$188')).toBeVisible({ timeout: 10_000 })
})

test('REQ-E2E-017: admin can upload a real image for a listing', async ({ page }) => {
  await loginAdmin(page)
  await page.goto(`/manage/listings/${td.buyRent.id}/edit`)
  await expect(page.getByRole('button', { name: '+ Add photo' })).toBeVisible({ timeout: 5_000 })
  await page.locator('input[type="file"]').setInputFiles(FIXTURE_IMAGE)
  // Upload completes when the image count text updates from 0/3 to 1/3
  await expect(page.getByText('1/3 images')).toBeVisible({ timeout: 30_000 })
})

test('REQ-E2E-018: admin can change listing status from dashboard', async ({ page }) => {
  await loginAdmin(page)
  const row = page.locator('tr', { has: page.getByText(td.buyRent.code) })
  await row.waitFor({ timeout: 10_000 })
  await row.locator('[aria-label="Change status"]').selectOption('reserved')
  await expect(row.locator('span', { hasText: 'Reserved' })).toBeVisible({ timeout: 5_000 })
})

test('REQ-E2E-019: status change is recorded in action history', async ({ page }) => {
  await loginAdmin(page)
  const row = page.locator('tr', { has: page.getByText(td.buyRent.code) })
  await row.waitFor({ timeout: 10_000 })
  await row.locator('[aria-label="Change status"]').selectOption('rented')
  await expect(row.locator('span', { hasText: 'Rented' })).toBeVisible({ timeout: 5_000 })
  await row.getByRole('link', { name: 'History' }).click()
  await expect(page).toHaveURL(/\/manage\/listings\/.+\/history/, { timeout: 5_000 })
  await expect(page.getByText('Status changed').first()).toBeVisible({ timeout: 10_000 })
})

test('REQ-E2E-020: admin logout clears session and /manage redirects to login', async ({ page }) => {
  await loginAdmin(page)
  await page.getByRole('button', { name: 'Logout' }).click()
  await expect(page).toHaveURL(/\/manage\/login/, { timeout: 5_000 })
  // Confirm the cookie is cleared: /manage must redirect again without prompting login
  await page.goto('/manage')
  await expect(page).toHaveURL(/\/manage\/login/, { timeout: 5_000 })
})
