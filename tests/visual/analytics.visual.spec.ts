/**
 * Visual Regression Tests - Analytics Page
 * Tests visual consistency of the analytics dashboard
 */

import { test, expect } from '@playwright/test';

test.describe('Analytics Dashboard Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to analytics page
    await page.goto('/analytics');

    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="analytics-dashboard"]', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Disable animations and hide dynamic content
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
        [data-timestamp], .last-updated, .live-indicator {
          visibility: hidden !important;
        }
        canvas {
          opacity: 0.5 !important;
        }
      `,
    });
  });

  test('@visual Analytics Dashboard - Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page).toHaveScreenshot('analytics-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('@visual Analytics Dashboard - Desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page).toHaveScreenshot('analytics-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('@visual MLB Standings Table', async ({ page }) => {
    const mlbCard = page.locator('[data-testid="mlb-standings"]');
    if (await mlbCard.isVisible()) {
      await expect(mlbCard).toHaveScreenshot('mlb-standings.png', {
        animations: 'disabled',
      });
    }
  });

  test('@visual NFL Standings Table', async ({ page }) => {
    const nflCard = page.locator('[data-testid="nfl-standings"]');
    if (await nflCard.isVisible()) {
      await expect(nflCard).toHaveScreenshot('nfl-standings.png', {
        animations: 'disabled',
      });
    }
  });

  test('@visual NBA Standings Table', async ({ page }) => {
    const nbaCard = page.locator('[data-testid="nba-standings"]');
    if (await nbaCard.isVisible()) {
      await expect(nbaCard).toHaveScreenshot('nba-standings.png', {
        animations: 'disabled',
      });
    }
  });

  test('@visual College Baseball Card', async ({ page }) => {
    const collegeCard = page.locator('[data-testid="college-baseball"]');
    if (await collegeCard.isVisible()) {
      await expect(collegeCard).toHaveScreenshot('college-baseball.png', {
        animations: 'disabled',
      });
    }
  });

  test('@visual Pythagorean Projections', async ({ page }) => {
    // Check if Pythagorean projections are displayed
    const pythagSection = page.locator('[data-testid="pythagorean-projections"]');
    if (await pythagSection.isVisible()) {
      await expect(pythagSection).toHaveScreenshot('pythagorean-projections.png', {
        animations: 'disabled',
      });
    }
  });

  test('@visual Loading State', async ({ page }) => {
    // Capture loading skeleton/spinner
    await page.goto('/analytics', { waitUntil: 'domcontentloaded' });

    const loadingIndicator = page.locator('.loading-spinner, .skeleton-loader');
    if (await loadingIndicator.isVisible({ timeout: 1000 })) {
      await expect(loadingIndicator).toHaveScreenshot('loading-state.png', {
        animations: 'disabled',
      });
    }
  });

  test('@visual Empty State', async ({ page }) => {
    // Test what happens when no data is available
    // This would need to be mocked in a real scenario
    const emptyState = page.locator('[data-testid="empty-state"]');
    if (await emptyState.isVisible()) {
      await expect(emptyState).toHaveScreenshot('empty-state.png', {
        animations: 'disabled',
      });
    }
  });

  test('@visual Table Responsiveness', async ({ page }) => {
    // Test table overflow handling on mobile
    await page.setViewportSize({ width: 375, height: 812 });

    const standingsTable = page.locator('table').first();
    if (await standingsTable.isVisible()) {
      await expect(standingsTable).toHaveScreenshot('table-mobile.png', {
        animations: 'disabled',
      });
    }
  });

  test('@visual Filter Controls', async ({ page }) => {
    const filters = page.locator('[data-testid="filters"]');
    if (await filters.isVisible()) {
      await expect(filters).toHaveScreenshot('filter-controls.png', {
        animations: 'disabled',
      });
    }
  });

  test('@visual Dark Mode Analytics', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('analytics-dark-mode.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
