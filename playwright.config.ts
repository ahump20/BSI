import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Accessibility and Visual Testing
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directories (both a11y and visual)
  testDir: './tests',
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/a11y-results.json' }],
    ['list']
  ],

  // Shared settings for all tests
  use: {
    // Base URL for testing
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Visual comparison settings
  expect: {
    toHaveScreenshot: {
      // Threshold for acceptable pixel difference (0-1)
      threshold: 0.2,

      // Maximum allowed pixel diff ratio
      maxDiffPixelRatio: 0.01,

      // Animation handling
      animations: 'disabled',

      // Scale for retina displays
      scale: 'css',
    },
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
