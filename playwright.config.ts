import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const HOST = '127.0.0.1'

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://${HOST}:${PORT}`,
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },
  webServer: {
    command: `npm run dev -- --host ${HOST} --port ${PORT}`,
    url: `http://${HOST}:${PORT}`,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
})
