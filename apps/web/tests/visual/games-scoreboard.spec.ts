import { test, expect } from '@playwright/test';

const stubResponse = {
  data: [
    {
      id: 'game-1',
      slug: 'lsu-at-ole-miss',
      status: 'LIVE',
      scheduledAt: new Date().toISOString(),
      completedAt: null,
      updatedAt: new Date().toISOString(),
      homeScore: 2,
      awayScore: 3,
      inning: 5,
      inningHalf: 'Top',
      homeTeam: {
        id: 'ole-miss',
        name: 'Ole Miss Rebels',
        slug: 'ole-miss',
        school: 'University of Mississippi',
        abbreviation: 'MISS',
        logoUrl: null,
        conference: {
          id: 'sec',
          name: 'SEC',
          slug: 'sec',
        },
      },
      awayTeam: {
        id: 'lsu',
        name: 'LSU Tigers',
        slug: 'lsu',
        school: 'Louisiana State University',
        abbreviation: 'LSU',
        logoUrl: null,
        conference: {
          id: 'sec',
          name: 'SEC',
          slug: 'sec',
        },
      },
      venue: {
        name: 'Swayze Field',
        city: 'Oxford',
        state: 'MS',
      },
      tournament: null,
      conferenceGame: true,
      diamondPro: {
        runDifferential: -1,
        leverageIndex: 2.1,
        homeWinProbability: 0.45,
        awayWinProbability: 0.55,
        highLeverage: true,
      },
    },
  ],
  pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
  permissions: { diamondPro: true, diamondProFeatureFlag: true },
  meta: { generatedAt: new Date().toISOString(), query: { date: '2025-04-05' } },
};

test.describe('NCAAB Games Scoreboard', () => {
  test('renders live scoreboard cards with Diamond Pro snapshot', async ({ page }) => {
    await page.route('**/api/v1/games**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(stubResponse),
      });
    });

    await page.goto('/baseball/ncaab/games');

    await expect(page.getByRole('heading', { name: "Today's Slate" })).toBeVisible();
    const scoreboardList = page.locator('[role="list"]').filter({ hasText: 'Diamond Pro Snapshot' });
    await expect(scoreboardList).toBeVisible();
    const firstCard = scoreboardList.getByRole('listitem').first();
    await expect(firstCard.getByText('Conference')).toBeVisible();
    await expect(firstCard.getByText('Diamond Pro Snapshot')).toBeVisible();
    await expect(firstCard.getByText('Run Differential')).toBeVisible();
    await expect(firstCard.getByText('Leverage Index')).toBeVisible();
    await expect(page.getByText('Last updated')).toBeVisible();
  });
});
