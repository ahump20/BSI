import { test, expect } from '@playwright/test';

const SCORE_ROUTES = ['/', '/scores', '/college-baseball/scores'];

for (const route of SCORE_ROUTES) {
  test(`score-related surface ${route} does not leak object placeholders`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
    await page.waitForTimeout(1200);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('[object Object]');
    expect(bodyText).not.toContain('undefined undefined');
  });
}
