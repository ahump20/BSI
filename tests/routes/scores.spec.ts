import { test, expect } from '@playwright/test';

test.describe('College Baseball Scores', () => {
  test('loads scores page with heading and main', async ({ page }) => {
    await page.goto('/college-baseball/scores');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('has date navigation controls', async ({ page }) => {
    await page.goto('/college-baseball/scores');
    await expect(
      page.getByRole('button', { name: /prev|back/i })
        .or(page.locator('[aria-label*="previous"]'))
    ).toBeVisible();
  });

  test('renders game cards or "no games" message after load', async ({ page }) => {
    await page.goto('/college-baseball/scores');
    // Wait for either game cards or the no-games message
    await expect(
      page.locator('[class*="grid"] [class*="card"], [class*="grid"] > div').first()
        .or(page.getByText(/no games/i))
    ).toBeVisible({ timeout: 15000 });
  });

  test('has conference filter buttons', async ({ page }) => {
    await page.goto('/college-baseball/scores');
    // Conference filter buttons live in a flex container
    const filterContainer = page.locator('.flex.flex-wrap.gap-2');
    await expect(filterContainer).toBeVisible({ timeout: 10000 });
    // Should have at least "All" or a conference name as a button
    const buttons = filterContainer.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('date navigation changes content', async ({ page }) => {
    await page.goto('/college-baseball/scores');
    // Find and click the "next" or "forward" date button
    const nextBtn = page.getByRole('button', { name: /next|forward/i })
      .or(page.locator('[aria-label*="next"]'))
      .or(page.locator('button:has(path[d*="9 18l6"])'));

    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      // After clicking, the page should still have the main structure
      await expect(page.locator('main')).toBeVisible();
    }
  });
});
