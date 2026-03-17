import { test, expect } from '@playwright/test';

const BASE_URL =
  process.env.BASE_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  'https://blazesportsintel.com';

test.describe('Scores hub overview aggregation', () => {
  test('renders featured content from /api/scores/overview without fan-out to legacy score endpoints', async ({
    page,
  }) => {
    const requestedPaths: string[] = [];

    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.origin === BASE_URL) {
        requestedPaths.push(`${url.pathname}${url.search}`);
      }
    });

    await page.route('**/api/scores/overview*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            'college-baseball': {
              data: [
                {
                  id: 'cb-1',
                  status: 'live',
                  situation: 'Top 7th',
                  awayTeam: { name: 'LSU Tigers', shortName: 'LSU', score: 2 },
                  homeTeam: { name: 'Texas Longhorns', shortName: 'TEX', score: 5 },
                },
              ],
            },
            mlb: {
              games: [
                {
                  gamePk: 1001,
                  teams: {
                    away: { name: 'Chicago Cubs', abbreviation: 'CHC', score: 3 },
                    home: { name: 'St. Louis Cardinals', abbreviation: 'STL', score: 4 },
                  },
                  status: { isLive: true, detailedState: 'Top 8th', type: { completed: false } },
                },
              ],
            },
            nfl: {
              games: [
                {
                  id: 'nfl-1',
                  teams: [
                    {
                      homeAway: 'away',
                      score: '17',
                      team: { displayName: 'Dallas Cowboys', abbreviation: 'DAL' },
                    },
                    {
                      homeAway: 'home',
                      score: '21',
                      team: { displayName: 'Houston Texans', abbreviation: 'HOU' },
                    },
                  ],
                  status: {
                    type: {
                      state: 'in',
                      detail: 'Q3 10:00',
                      shortDetail: 'Q3 10:00',
                      completed: false,
                    },
                    period: 3,
                  },
                },
              ],
            },
            nba: {
              games: [
                {
                  id: 'nba-1',
                  teams: [
                    {
                      homeAway: 'away',
                      score: '102',
                      team: { displayName: 'Phoenix Suns', abbreviation: 'PHX' },
                    },
                    {
                      homeAway: 'home',
                      score: '105',
                      team: { displayName: 'San Antonio Spurs', abbreviation: 'SAS' },
                    },
                  ],
                  status: {
                    type: { state: 'post', detail: 'Final', shortDetail: 'Final', completed: true },
                    period: 4,
                  },
                },
              ],
            },
            cfb: {
              games: [
                {
                  id: 'cfb-1',
                  teams: [
                    {
                      homeAway: 'away',
                      score: '14',
                      team: { displayName: 'Texas A&M Aggies', abbreviation: 'TAMU' },
                    },
                    {
                      homeAway: 'home',
                      score: '10',
                      team: { displayName: 'Texas Longhorns', abbreviation: 'TEX' },
                    },
                  ],
                  status: {
                    type: {
                      state: 'pre',
                      detail: '7:00 PM',
                      shortDetail: '7:00 PM',
                      completed: false,
                    },
                    period: 0,
                  },
                },
              ],
            },
          },
          errors: {},
          meta: {
            source: 'bsi-scores-overview',
            fetched_at: '2026-04-02T13:00:00.000Z',
            timezone: 'America/Chicago',
            sports: {
              'college-baseball': {
                endpoint: '/api/college-baseball/schedule',
                fetched_at: '2026-04-02T13:00:00.000Z',
                source: 'ncaa',
                timezone: 'America/Chicago',
              },
              mlb: {
                endpoint: '/api/mlb/scores',
                fetched_at: '2026-04-02T13:00:00.000Z',
                source: 'espn',
                timezone: 'America/Chicago',
              },
              nfl: {
                endpoint: '/api/nfl/scores',
                fetched_at: '2026-04-02T13:00:00.000Z',
                source: 'espn',
                timezone: 'America/Chicago',
              },
              nba: {
                endpoint: '/api/nba/scoreboard',
                fetched_at: '2026-04-02T13:00:00.000Z',
                source: 'espn',
                timezone: 'America/Chicago',
              },
              cfb: {
                endpoint: '/api/cfb/scores',
                fetched_at: '2026-04-02T13:00:00.000Z',
                source: 'espn',
                timezone: 'America/Chicago',
              },
            },
          },
        }),
      });
    });

    for (const legacyRoute of [
      '**/api/mlb/scores*',
      '**/api/college-baseball/schedule*',
      '**/api/nfl/scores*',
      '**/api/nba/scoreboard*',
      '**/api/cfb/scores*',
    ]) {
      await page.route(legacyRoute, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ legacy: true }),
        });
      });
    }

    await page.goto(`${BASE_URL}/scores/?sport=all`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /Live Scores/i })).toBeVisible();
    await expect(page.getByText('Loading...')).toHaveCount(0, { timeout: 15000 });
    await expect(page.getByText('Texas Longhorns').first()).toBeVisible();
    await expect(page.getByText('St. Louis Cardinals').first()).toBeVisible();
    await expect(page.getByText(/3 games live now/i)).toBeVisible();

    expect(requestedPaths.some((path) => path.startsWith('/api/scores/overview'))).toBe(true);
    expect(requestedPaths.some((path) => path.startsWith('/api/mlb/scores'))).toBe(false);
    expect(requestedPaths.some((path) => path.startsWith('/api/college-baseball/schedule'))).toBe(
      false,
    );
    expect(requestedPaths.some((path) => path.startsWith('/api/nfl/scores'))).toBe(false);
    expect(requestedPaths.some((path) => path.startsWith('/api/nba/scoreboard'))).toBe(false);
    expect(requestedPaths.some((path) => path.startsWith('/api/cfb/scores'))).toBe(false);
  });
});
