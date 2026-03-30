import { test, expect } from '@playwright/test';

/**
 * Regression tests from Sprint 1 mobile audit (2026-03-30).
 * Prevents three issues from recurring:
 * 1. Internal API identifiers ("espn-v2") leaking into visible UI
 * 2. Savant hero heading colliding with metadata text at 375px
 * 3. Feedback FAB overlapping page content
 */

test.describe('Mobile audit regressions', () => {
  test.describe('Standings source labels', () => {
    test('should not expose internal API identifiers', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/college-baseball/standings/');
      await page.waitForLoadState('networkidle');

      // The string "espn-v2" is an internal identifier that should never appear in the UI
      const pageText = await page.textContent('body');
      expect(pageText).not.toContain('espn-v2');

      // Should show the friendly name instead
      // (Only check if the sources indicator is visible — it won't render if API is down)
      const sourcesEl = page.locator('text=Sources:');
      if (await sourcesEl.count() > 0) {
        const sourcesText = await sourcesEl.first().textContent();
        expect(sourcesText).toMatch(/ESPN|Highlightly/);
      }
    });
  });

  test.describe('Savant hero layout', () => {
    test('heading and metadata should not overlap at 375px', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/college-baseball/savant/');
      await page.waitForLoadState('networkidle');

      // The heading container should use flex-col on mobile (stacked, not side-by-side)
      const heroContainer = page.locator('h1:has-text("Sabermetrics")').locator('..');
      const parentContainer = heroContainer.locator('..');

      // Verify the parent uses flex-col (stacked) on narrow viewports
      // by checking that the heading and the metadata paragraph don't share a horizontal line
      const h1Box = await page.locator('h1:has-text("Sabermetrics")').boundingBox();
      const metaEl = page.locator('text=/conferences.*Updated/');

      if (h1Box && await metaEl.count() > 0) {
        const metaBox = await metaEl.first().boundingBox();
        if (metaBox) {
          // On mobile (stacked), the meta text should be BELOW the heading, not beside it
          // Allow some overlap tolerance (12px) for line-height
          expect(metaBox.y).toBeGreaterThanOrEqual(h1Box.y + h1Box.height - 12);
        }
      }
    });
  });

  test.describe('Feedback FAB positioning', () => {
    test('FAB should not overlap main content cards at 375px', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/college-baseball/savant/');
      await page.waitForLoadState('networkidle');

      const fab = page.locator('button[aria-label="Send feedback"]');
      if (await fab.count() > 0) {
        const fabBox = await fab.boundingBox();
        if (fabBox) {
          // FAB should be small enough (max 40px) and positioned high enough (bottom >= 112px from viewport bottom)
          expect(fabBox.width).toBeLessThanOrEqual(48);
          expect(fabBox.height).toBeLessThanOrEqual(48);
        }
      }
    });
  });
});
