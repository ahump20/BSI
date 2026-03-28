import { test, expect } from '@playwright/test';

test.describe('Homepage smoke tests', () => {
  const consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
  });

  test('homepage returns 200 and renders', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
  });

  test('homepage shows BSI brand identity', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Brand name visible
    await expect(page.getByText('Blaze Sports Intel')).toBeVisible({ timeout: 10000 });
    // Tagline present in the page
    await expect(page.getByText(/Born to Blaze the Path Beaten Less/i)).toBeVisible({ timeout: 10000 });
  });

  test('homepage has navigation links to key sections', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Scores link present
    await expect(page.getByRole('link', { name: /scores/i }).first()).toBeVisible({ timeout: 10000 });
    // Savant link present
    await expect(page.getByRole('link', { name: /savant/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('mobile bottom nav renders', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(mobileNav).toBeVisible();
  });

  test('no console errors on page load', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Allow common benign errors (e.g. analytics, third-party scripts)
    const realErrors = consoleErrors.filter(
      (msg) =>
        !msg.includes('PostHog') &&
        !msg.includes('amplitude') &&
        !msg.includes('Failed to load resource') &&
        !msg.includes('favicon')
    );

    expect(realErrors).toHaveLength(0);
  });

  test('leaderboard data loads on homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Homepage dashboard shows live leaderboard data — at least one player name should appear
    const playerLinks = page.locator('a[href*="/college-baseball/savant/player/"]');
    await expect(playerLinks.first()).toBeAttached({ timeout: 15000 });
  });
});
