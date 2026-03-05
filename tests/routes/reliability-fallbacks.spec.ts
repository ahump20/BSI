import { test, expect } from '@playwright/test';

test.describe('Reliability fallback coverage', () => {
  test('dashboard renders fallback MLB standings when standings payload is empty', async ({ page }) => {
    await page.route('**/api/mlb/standings*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          standings: [],
          teams: [],
          meta: { lastUpdated: '2026-02-17T00:00:00.000Z' },
        }),
      });
    });

    await page.route('**/api/mlb/scores*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, games: [] }),
      });
    });

    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: /COMMAND CENTER/i })).toBeVisible();
    await expect(page.getByText('LAD').first()).toBeVisible();
    await expect(page.getByText('Showing last known standings snapshot.')).toBeVisible();
    await expect(page.locator('text=Loading chart...')).toHaveCount(0);
  });

  test('mlb page renders AL/NL fallback division tables when API returns no standings', async ({ page }) => {
    await page.route('**/api/mlb/standings*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, standings: [], teams: [] }),
      });
    });

    await page.goto('/mlb');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('AL East')).toBeVisible();
    await expect(page.getByText('NL West')).toBeVisible();
    await expect(page.getByText('New York Yankees')).toBeVisible();
    await expect(page.getByText(/last known standings snapshot/i).first()).toBeVisible();
  });

  test('dolphins page handles grouped standings payload shape', async ({ page }) => {
    await page.route('**/api/nfl/standings*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          standings: [
            {
              label: 'AFC East',
              teams: [
                {
                  teamName: 'Miami Dolphins',
                  abbreviation: 'MIA',
                  wins: 12,
                  losses: 5,
                  ties: 0,
                  pointsFor: 510,
                  pointsAgainst: 402,
                  streak: 'W3',
                },
              ],
            },
          ],
        }),
      });
    });

    await page.goto('/nfl/teams/dolphins');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('12-5')).toBeVisible();
    await expect(page.getByText('510')).toBeVisible();
    await expect(page.getByText('W3')).toBeVisible();
  });

  test('dolphins page falls back to last known values when standings payload is empty', async ({ page }) => {
    await page.route('**/api/nfl/standings*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, standings: [], teams: [] }),
      });
    });

    await page.goto('/nfl/teams/dolphins');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('11-6')).toBeVisible();
    await expect(page.getByText('496')).toBeVisible();
    await expect(page.getByText('W2')).toBeVisible();
  });
});
