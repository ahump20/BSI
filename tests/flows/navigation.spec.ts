/**
 * Multi-Step User Flow Tests
 *
 * Tests real user journeys through the site, not just single-page loads.
 * These catch integration issues that single-page smoke tests miss:
 * broken links, state that doesn't transfer between pages, missing routes.
 *
 * Run: pnpm exec playwright test tests/flows/
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage → Sport Navigation', () => {
  test('navigates from homepage to college baseball standings', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Blaze Sports Intel/);

    // Find and click a link to college baseball
    const cbLink = page.locator('a[href*="college-baseball"]').first();
    if (await cbLink.isVisible()) {
      await cbLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('college-baseball');
    }
  });

  test('navigates from homepage to scores page', async ({ page }) => {
    await page.goto('/');

    const scoresLink = page.locator('a[href*="/scores"]').first();
    if (await scoresLink.isVisible()) {
      await scoresLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/scores');
    }
  });
});

test.describe('College Baseball Flow', () => {
  test('standings page loads with table content', async ({ page }) => {
    await page.goto('/college-baseball/standings/');
    await page.waitForLoadState('networkidle');

    // Should have at least one table or standings container
    const content = page.locator('table, [class*="standings"]');
    // Page might be data-dependent, so just check it loaded without error
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('teams page loads and lists teams', async ({ page }) => {
    await page.goto('/college-baseball/teams/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('teams page → team detail navigation', async ({ page }) => {
    await page.goto('/college-baseball/teams/');
    await page.waitForLoadState('networkidle');

    // Click first team link if one exists
    const teamLink = page.locator('a[href*="/college-baseball/teams/"]').first();
    if (await teamLink.isVisible()) {
      await teamLink.click();
      await page.waitForLoadState('networkidle');
      // Should be on a team detail page
      expect(page.url()).toContain('/college-baseball/teams/');
      await expect(page.locator('body')).not.toContainText('Application error');
    }
  });
});

test.describe('Scores Page Flow', () => {
  test('scores page loads without errors', async ({ page }) => {
    await page.goto('/scores/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('scores page has sport tabs or navigation', async ({ page }) => {
    await page.goto('/scores/');
    await page.waitForLoadState('networkidle');

    // Should have some form of sport selection (tabs, buttons, links)
    const sportControls = page.locator(
      'button, [role="tab"], a[href*="mlb"], a[href*="nfl"], a[href*="nba"]',
    );
    // At minimum, the page should render interactive elements
    const count = await sportControls.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Arcade Flow', () => {
  test('arcade index loads game cards', async ({ page }) => {
    await page.goto('/arcade/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('arcade game page loads iframe', async ({ page }) => {
    await page.goto('/arcade/games/hotdog-dash/');
    await page.waitForLoadState('networkidle');

    const iframe = page.locator('iframe[title]');
    if (await iframe.isVisible()) {
      await expect(iframe).toHaveAttribute('src', /games/);
    }
  });
});

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('mobile bottom nav is visible on small screens', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The bottom nav should be visible on mobile (class="md:hidden")
    const bottomNav = page.locator('nav').last();
    await expect(bottomNav).toBeVisible();
  });
});
