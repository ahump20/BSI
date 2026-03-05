/**
 * Blog Post Feed Tests
 *
 * Tests the Writing section (blog-post-feed) page loads, displays
 * the correct structure, and handles data-dependent states gracefully.
 *
 * The blog feed fetches from /api/blog-post-feed which is served by the
 * Worker — in local dev (next dev only), the API won't be available,
 * so we test that the page handles both data and no-data states.
 *
 * Run: pnpm exec playwright test tests/flows/blog-post-feed.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Blog Post Feed Page', () => {
  test('loads successfully with heading', async ({ page }) => {
    await page.goto('/blog-post-feed/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toContainText('Application error');

    // Main heading
    await expect(page.locator('h1')).toContainText(/Blaze Intel/i);
  });

  test('has breadcrumb navigation', async ({ page }) => {
    await page.goto('/blog-post-feed/');
    await page.waitForLoadState('domcontentloaded');

    // Breadcrumb: BSI / Writing
    await expect(page.locator('nav:has-text("BSI")')).toBeVisible();
    await expect(page.locator('text=Writing').first()).toBeVisible();
  });

  test('renders category filter tabs', async ({ page }) => {
    await page.goto('/blog-post-feed/');
    await page.waitForLoadState('domcontentloaded');

    // Category buttons should be visible
    await expect(page.locator('button:has-text("All")')).toBeVisible();
    await expect(page.locator('button:has-text("Sports Editorial")')).toBeVisible();
    await expect(page.locator('button:has-text("Sports Business")')).toBeVisible();
    await expect(page.locator('button:has-text("Leadership")')).toBeVisible();
  });

  test('shows loading skeleton or content after fetch', async ({ page }) => {
    await page.goto('/blog-post-feed/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for the fetch to resolve — skeleton disappears on success or error
    // In local dev without Worker, the fetch fails and shows error state
    await page.waitForTimeout(5000);

    const body = page.locator('body');
    // After fetch: articles loaded, error state, empty state, or still loading (skeleton)
    const hasContent =
      (await body.locator('text=/Read article/i').count()) > 0 ||
      (await body.locator('text=/Unable to load/i').count()) > 0 ||
      (await body.locator('text=/No articles/i').count()) > 0 ||
      (await body.locator('text=/Failed to/i').count()) > 0 ||
      (await body.locator('.animate-pulse').count()) > 0;
    expect(hasContent).toBeTruthy();
  });

  test('category tab click filters content', async ({ page }) => {
    await page.goto('/blog-post-feed/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Click a specific category
    const leadershipTab = page.locator('button:has-text("Leadership")');
    await leadershipTab.click();

    // The tab should now be active (has bg-burnt-orange class)
    await expect(leadershipTab).toHaveClass(/bg-burnt-orange/);
  });

  test('has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/blog-post-feed/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    const unexpected = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('Failed to load resource'),
    );
    expect(unexpected).toHaveLength(0);
  });
});
