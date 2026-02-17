import { test, expect } from '@playwright/test';

test.describe('College Baseball Daily Bundle', () => {
  test('loads daily page with heading and main', async ({ page }) => {
    await page.goto('/college-baseball/daily/2026-02-14');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('displays "Data Sources & Queries" section', async ({ page }) => {
    await page.goto('/college-baseball/daily/2026-02-14');
    // Wait for content to load (either data sources or error message)
    await expect(
      page.getByText(/Data Sources/i)
        .or(page.getByText(/No bundle available/i))
    ).toBeVisible({ timeout: 15000 });
  });

  test('no NaN or undefined text rendered', async ({ page }) => {
    await page.goto('/college-baseball/daily/2026-02-14');
    // Wait for page to settle
    await page.waitForTimeout(3000);
    const body = await page.locator('body').textContent();
    expect(body).not.toContain('NaN');
    expect(body).not.toContain('undefined');
  });

  test('renders game cards or empty state', async ({ page }) => {
    await page.goto('/college-baseball/daily/2026-02-14');
    // Either game cards or a message should appear
    await expect(
      page.locator('[class*="grid"] > div').first()
        .or(page.getByText(/No games scheduled/i))
        .or(page.getByText(/No bundle available/i))
    ).toBeVisible({ timeout: 15000 });
  });

  test('breadcrumb navigation is present', async ({ page }) => {
    await page.goto('/college-baseball/daily/2026-02-14');
    await expect(page.getByText('College Baseball')).toBeVisible();
    await expect(page.getByText('Daily Report')).toBeVisible();
  });
});
