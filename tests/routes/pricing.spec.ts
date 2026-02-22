/**
 * Pricing Page Tests
 *
 * Validates the pricing page renders tiers correctly, displays canonical
 * pricing ($12/month Pro, $199/month Enterprise), and CTA buttons exist.
 *
 * Run: pnpm exec playwright test tests/routes/pricing.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Pricing Page', () => {
  test('loads successfully with heading', async ({ page }) => {
    await page.goto('/pricing/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('h1')).toContainText(/Choose Your/i);
  });

  test('renders Pro and Enterprise tier cards', async ({ page }) => {
    await page.goto('/pricing/');
    await page.waitForLoadState('domcontentloaded');

    // Both tier names should be visible
    await expect(page.locator('text=Pro').first()).toBeVisible();
    await expect(page.locator('text=Enterprise').first()).toBeVisible();
  });

  test('displays correct pricing — $12 Pro, $199 Enterprise', async ({ page }) => {
    await page.goto('/pricing/');
    await page.waitForLoadState('domcontentloaded');

    // Pro tier price
    await expect(page.locator('text=$12').first()).toBeVisible();
    // Enterprise tier price
    await expect(page.locator('text=$199').first()).toBeVisible();
  });

  test('has CTA buttons for both tiers', async ({ page }) => {
    await page.goto('/pricing/');
    await page.waitForLoadState('domcontentloaded');

    // Pro CTA: "Start Free Trial"
    await expect(page.locator('button:has-text("Start Free Trial")')).toBeVisible();
    // Enterprise CTA: "Get Started"
    await expect(page.locator('button:has-text("Get Started")')).toBeVisible();
  });

  test('has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/pricing/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const unexpected = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('Failed to load resource'),
    );
    expect(unexpected).toHaveLength(0);
  });
});
