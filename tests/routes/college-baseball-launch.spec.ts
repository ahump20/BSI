import { test, expect, type Page } from '@playwright/test';

function installFixedDate(page: Page) {
  return page.addInitScript(() => {
    const fixedNow = new Date('2026-02-12T12:00:00.000Z').valueOf();
    const OriginalDate = Date;

    class MockDate extends OriginalDate {
      constructor(...args: ConstructorParameters<typeof Date>) {
        if (args.length === 0) {
          super(fixedNow);
          return;
        }
        super(...args);
      }

      static now() {
        return fixedNow;
      }
    }

    // @ts-expect-error test-only Date shim
    window.Date = MockDate;
  });
}

function buildSchedulePayload(date: string, includeGame: boolean) {
  const game = {
    id: `${date}-game-1`,
    date: `${date}T19:00:00Z`,
    status: {
      type: 'STATUS_SCHEDULED',
      state: 'pre',
      detail: 'Scheduled',
      period: 1,
    },
    homeTeam: {
      id: '24',
      name: `Texas ${date}`,
      abbreviation: 'TEX',
      record: '0-0',
    },
    awayTeam: {
      id: '21',
      name: 'Florida',
      abbreviation: 'UF',
      record: '0-0',
    },
    homeScore: 0,
    awayScore: 0,
    venue: {
      fullName: 'UFCU Disch-Falk Field',
    },
  };

  return {
    data: includeGame ? [game] : [],
    totalCount: includeGame ? 1 : 0,
    meta: {
      dataSource: 'NCAA/ESPN',
      lastUpdated: '2026-02-12T12:00:00.000Z',
      timezone: 'America/Chicago',
    },
  };
}

test.describe('College Baseball opening weekend launch', () => {
  test('main page schedule tab renders controls and auto-advances to first game day', async ({ page }) => {
    await installFixedDate(page);

    await page.route('**/api/college-baseball/schedule?*', async (route) => {
      const url = new URL(route.request().url());
      const date = url.searchParams.get('date') || '';
      const includeGame = date === '2026-02-14';

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'x-data-source': 'NCAA/ESPN',
          'x-last-updated': '2026-02-12T12:00:00.000Z',
        },
        body: JSON.stringify(buildSchedulePayload(date, includeGame)),
      });
    });

    await page.goto('/college-baseball');
    await page.getByRole('button', { name: 'Schedule' }).click();

    await expect(page.getByRole('button', { name: 'Previous day' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next day' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'All P4' })).toBeVisible();

    await expect(page.locator('text=Texas 2026-02-14')).toBeVisible();
    await expect(page.locator('text=No P4 games scheduled for this date.')).toHaveCount(0);
  });

  test('scores page prev/next navigation shifts relative to selected date', async ({ page }) => {
    await installFixedDate(page);

    await page.route('**/api/college-baseball/schedule?*', async (route) => {
      const url = new URL(route.request().url());
      const date = url.searchParams.get('date') || '2026-02-12';

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'x-data-source': 'NCAA/ESPN',
          'x-last-updated': '2026-02-12T12:00:00.000Z',
        },
        body: JSON.stringify(buildSchedulePayload(date, true)),
      });
    });

    await page.goto('/college-baseball/scores');

    await expect(page.locator('text=Texas 2026-02-12')).toBeVisible();

    await page.getByRole('button', { name: 'Next day' }).click();
    await expect(page.locator('text=Texas 2026-02-13')).toBeVisible();

    await page.getByRole('button', { name: 'Previous day' }).click();
    await expect(page.locator('text=Texas 2026-02-12')).toBeVisible();
  });

  test('editorial pages resolve', async ({ page }) => {
    await page.goto('/college-baseball/editorial');
    await expect(page.locator('h1')).toContainText('Editorial Desk');

    await page.goto('/college-baseball/editorial/week-1-preview');
    await expect(page.locator('h1')).toContainText('Opening Weekend Preview');
  });
});
