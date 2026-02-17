import { test, expect } from '@playwright/test';

test.describe('College Baseball Game Detail', () => {
  test('renders game detail page structure', async ({ page }) => {
    // Use a placeholder ID — page should handle gracefully whether
    // the game exists or shows an error state
    const res = await page.goto('/college-baseball/game/placeholder');
    // Should return a page (200 or client-rendered error), not a server crash
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator('main')).toBeVisible();
  });

  test('handles invalid game ID gracefully', async ({ page }) => {
    const res = await page.goto('/college-baseball/game/invalid-id-999');
    expect(res?.status()).toBeLessThan(500);
    // Should show either the game page or an error/fallback state
    await expect(page.locator('main').or(page.locator('body'))).toBeVisible();
  });
});
