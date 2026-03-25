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
    await expect(page.locator('[data-home-hero]')).toBeVisible();
  });

  test('hero section carries the new thesis and proof ribbon', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('[data-home-hero]')).toBeVisible();
    await expect(page.locator('[data-home-proof-ribbon]')).toBeVisible();
    await expect(page.getByRole('heading', { name: /The Real Game Lives Between The Coasts/i })).toBeVisible();
  });

  test('primary homepage CTA is visible and wired', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const target = page.getByRole('link', { name: /^Open Scores$/i });
    await expect(target).toBeVisible();
    await expect(target).toHaveAttribute('href', '/scores');
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

  test('flagship section renders on the homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-home-flagship]')).toBeVisible();
    await expect(page.getByRole('link', { name: /Open BSI Savant/i })).toBeVisible();
  });

  test('footer renders with 6 link columns', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Footer grid has 6 columns: Start Here, Sports, Tools, Ecosystem, Company, Legal
    const columnHeaders = footer.locator('h4');
    const count = await columnHeaders.count();
    expect(count).toBe(6);
  });

  test('Ask BSI input is visible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('[data-home-platform]')).toBeVisible();
    await expect(page.locator('[data-home-ask="embedded"]')).toBeVisible();
    await expect(page.getByPlaceholder('Ask about any sport, stat, team, or feature...')).toBeVisible();
  });

  test('freshness section renders with editorial and intel surfaces', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-home-freshness]')).toBeVisible();
    await expect(page.getByText(/Trending Intel/i)).toBeVisible();
    await expect(page.locator('[data-home-cta]')).toBeVisible();
  });
});
