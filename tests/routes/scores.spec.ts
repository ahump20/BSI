import { test, expect } from '@playwright/test';

test.describe('College Baseball Scores', () => {
  test('loads scores page', async ({ page }) => {
    await page.goto('/college-baseball/scores');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('has date navigation', async ({ page }) => {
    await page.goto('/college-baseball/scores');
    await expect(page.getByRole('button', { name: /prev|back/i }).or(page.locator('[aria-label*="previous"]'))).toBeVisible();
  });
});
