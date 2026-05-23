import { defineConfig, devices } from '@playwright/test'
import fs from 'fs'
import path from 'path'

// Load .env into process.env if not already set (needed by global-setup Prisma)
try {
  const content = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const raw = trimmed.slice(eqIdx + 1).trim()
    if (key && !process.env[key]) {
      process.env[key] = raw.replace(/^["']|["']$/g, '')
    }
  }
} catch { /* no .env file — rely on existing env vars */ }

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm --filter @fridge/api dev',
      url: 'http://localhost:3001/health',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter @fridge/web dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
  projects: [
    {
      name: 'buyer',
      testMatch: '**/buyer.spec.ts',
      use: { ...devices['Mobile Chrome'] },
    },
    {
      name: 'admin',
      testMatch: '**/admin.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
