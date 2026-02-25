import { test, expect } from '@playwright/test';

/**
 * College Baseball Standings — Playwright smoke tests
 *
 * Uses page.route() to intercept the standings API, providing controlled
 * mock responses so tests verify the UI contract independent of live API
 * availability.
 */

const MOCK_STANDINGS = [
  {
    rank: 1,
    team: { id: 'texas', name: 'Texas Longhorns', shortName: 'Texas', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/126.png' },
    conferenceRecord: { wins: 12, losses: 3, pct: 0 },
    overallRecord: { wins: 35, losses: 10 },
    winPct: 0.778,
    streak: 'W5',
    pointDifferential: 62,
  },
  {
    rank: 2,
    team: { id: 'texas-am', name: 'Texas A&M Aggies', shortName: 'Texas A&M', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/123.png' },
    conferenceRecord: { wins: 10, losses: 5, pct: 0 },
    overallRecord: { wins: 30, losses: 12 },
    winPct: 0.714,
    streak: 'L1',
    pointDifferential: 38,
  },
  {
    rank: 3,
    team: { id: 'florida', name: 'Florida Gators', shortName: 'Florida', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/57.png' },
    conferenceRecord: { wins: 9, losses: 6, pct: 0 },
    overallRecord: { wins: 28, losses: 15 },
    winPct: 0.651,
    streak: 'W2',
    pointDifferential: 21,
  },
];

function standingsResponse(data: unknown[], conference = 'SEC') {
  return {
    success: true,
    data,
    conference,
    timestamp: '2026-02-24T12:00:00.000Z',
    meta: { dataSource: 'espn-v2', lastUpdated: '2026-02-24T12:00:00.000Z', sport: 'college-baseball' },
  };
}

test.describe('College Baseball Standings', () => {
  test('conference buttons render', async ({ page }) => {
    await page.route('**/api/college-baseball/standings*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(standingsResponse([])) })
    );

    await page.goto('/college-baseball/standings');
    await page.waitForLoadState('networkidle');

    // Primary conference buttons
    for (const name of ['SEC', 'ACC', 'Big 12', 'Big Ten', 'Sun Belt', 'AAC']) {
      await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
    }

    // "+18 More" toggle
    await expect(page.getByRole('button', { name: /\+18 More/ })).toBeVisible();
  });

  test('conference switching loads data', async ({ page }) => {
    await page.route('**/api/college-baseball/standings*', (route) => {
      const url = new URL(route.request().url());
      const conf = url.searchParams.get('conference') || 'SEC';
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(standingsResponse(conf === 'ACC' ? MOCK_STANDINGS : [], conf)),
      });
    });

    await page.goto('/college-baseball/standings');
    await page.waitForLoadState('networkidle');

    // Click ACC button
    await page.getByRole('button', { name: 'ACC', exact: true }).click();
    await page.waitForLoadState('networkidle');

    // Conference header shows full name
    await expect(page.getByText('Atlantic Coast Conference')).toBeVisible();
  });

  test('Independent reachable via +18 More', async ({ page }) => {
    await page.route('**/api/college-baseball/standings*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(standingsResponse([], 'Independent')) })
    );

    await page.goto('/college-baseball/standings');
    await page.waitForLoadState('networkidle');

    // Expand more conferences
    await page.getByRole('button', { name: /\+18 More/ }).click();

    // Click Independent button
    await page.getByRole('button', { name: 'Ind.', exact: true }).click();
    await page.waitForLoadState('networkidle');

    // Header shows "Independent"
    await expect(page.getByText('Independent')).toBeVisible();
  });

  test('standings table has team rows when data exists', async ({ page }) => {
    await page.route('**/api/college-baseball/standings*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(standingsResponse(MOCK_STANDINGS)) })
    );

    await page.goto('/college-baseball/standings');
    await page.waitForLoadState('networkidle');

    // Table should be visible
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Team names present
    await expect(page.getByText('Texas Longhorns')).toBeVisible();
    await expect(page.getByText('Texas A&M Aggies')).toBeVisible();
    await expect(page.getByText('Florida Gators')).toBeVisible();

    // Overall records present
    await expect(page.getByText('35-10')).toBeVisible();
    await expect(page.getByText('30-12')).toBeVisible();

    // Team logos render as <img> elements
    const logos = table.locator('img');
    await expect(logos).toHaveCount(3);
  });

  test('empty state shows pre-season message', async ({ page }) => {
    await page.route('**/api/college-baseball/standings*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(standingsResponse([])) })
    );

    await page.goto('/college-baseball/standings');
    await page.waitForLoadState('networkidle');

    // Empty state message
    await expect(page.getByText(/Conference play may not have started yet/)).toBeVisible();
  });

  test('data attribution footer visible', async ({ page }) => {
    await page.route('**/api/college-baseball/standings*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(standingsResponse(MOCK_STANDINGS)) })
    );

    await page.goto('/college-baseball/standings');
    await page.waitForLoadState('networkidle');

    // Data source attribution
    await expect(page.getByText(/Data sourced from ESPN/)).toBeVisible();

    // Last updated timestamp
    await expect(page.getByText(/Last updated/)).toBeVisible();
  });
});
