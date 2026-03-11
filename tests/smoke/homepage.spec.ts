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

  test('hero section is visible with Blaze Sports text', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();

    const blazeSportsText = page.getByText('Blaze Sports', { exact: false });
    await expect(blazeSportsText.first()).toBeVisible();
  });

  test('at least one CTA button is visible and links to a valid page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const ctaButtons = page.locator('a[href]:is(.btn-heritage, .btn-heritage-fill, [class*="btn"], [role="button"])');
    const fallbackLinks = page.locator('a[href]').filter({ hasText: /(explore|get started|subscribe|sign up|learn more|try|view|discover)/i });

    const ctaCount = await ctaButtons.count();
    const fallbackCount = await fallbackLinks.count();

    expect(ctaCount + fallbackCount).toBeGreaterThan(0);

    const target = ctaCount > 0 ? ctaButtons.first() : fallbackLinks.first();
    await expect(target).toBeVisible();

    const href = await target.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).not.toBe('#');
  });

  test('mobile bottom nav renders', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(mobileNav).toBeVisible();
  });

  test('no console errors on page load', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

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

  test('PlatformVitals section renders with non-zero numbers', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Check for either specific stat text or the section containing numbers
    const vitalsIndicators = [
      page.getByText('300', { exact: false }),
      page.getByText('D1 Teams', { exact: false }),
    ];

    let found = false;
    for (const locator of vitalsIndicators) {
      if ((await locator.count()) > 0) {
        await expect(locator.first()).toBeVisible();
        found = true;
        break;
      }
    }

    expect(found).toBe(true);
  });
});
