import { test, expect } from '@playwright/test';

test.describe('College Baseball Team Detail', () => {
  test('renders team detail page', async ({ page }) => {
    const res = await page.goto('/college-baseball/teams/texas');
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator('main')).toBeVisible();
    // Should have a heading with team name or page title
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('handles unknown team gracefully', async ({ page }) => {
    const res = await page.goto('/college-baseball/teams/nonexistent-team-xyz');
    expect(res?.status()).toBeLessThan(500);
    // Should show error state or redirect, not crash
    await expect(page.locator('main').or(page.locator('body'))).toBeVisible();
  });
});
