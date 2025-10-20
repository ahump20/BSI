import { test, expect } from '@playwright/test';

test.describe('Diamond Insights · NCAAB scoreboard', () => {
  test('renders live scoreboard with regression analytics', async ({ page }) => {
    await page.goto('/baseball/ncaab/games');

    await expect(page.getByRole('heading', { name: 'Live D1 Scoreboard' })).toBeVisible();

    const gameCard = page.getByTestId('scoreboard-game-401778104');
    await expect(gameCard).toBeVisible();
    await expect(gameCard).toContainText('LSU Tigers');
    await expect(gameCard).toContainText('Coastal Carolina Chanticleers');
    await expect(gameCard).toContainText('Data: MOCK');

    const analyticsAway = gameCard.locator('[data-testid="analytics-256"]');
    await expect(analyticsAway).toContainText('Win Expectancy');
    await expect(analyticsAway).toContainText('Playoff Chance');

    const analyticsHome = gameCard.locator('[data-testid="analytics-146"]');
    await expect(analyticsHome).toContainText('Luck Index');

    await expect(page.getByTestId('scoreboard-updated')).toContainText('Last sync');
    await expect(page.getByRole('button', { name: /refresh/i })).toBeEnabled();
  });
});
