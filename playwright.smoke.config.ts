import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke test config — used by gate:release and smoke:release.
 * Self-contained: starts `next dev` automatically unless BASE_URL is set.
 * Set BASE_URL to target a preview deploy or production for post-deploy audit.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],
  ...(!process.env.BASE_URL && {
    webServer: {
      command: 'npx next dev --webpack',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  }),
});
