import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://127.0.0.1:3000';
const scoreboardFixture = path.join(__dirname, 'tests/fixtures/scoreboard/ncaab.json');

export default defineConfig({
  testDir: './tests/visual',
  timeout: 120 * 1000,
  expect: {
    timeout: 15 * 1000
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'pnpm run dev --hostname 127.0.0.1 --port 3000',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120 * 1000,
    env: {
      BSI_SCOREBOARD_FIXTURE_PATH: scoreboardFixture
    }
  }
});
