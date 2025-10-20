import { test, expect } from '@playwright/test'

const SCOREBOARD_ENDPOINT =
  'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard'

const scoreboardFixture = {
  events: [
    {
      id: 'fixture-1',
      competitions: [
        {
          competitors: [
            {
              homeAway: 'away',
              score: '4',
              team: { displayName: 'Southern Miss' },
            },
            {
              homeAway: 'home',
              score: '6',
              team: { displayName: 'LSU' },
            },
          ],
          status: {
            type: {
              completed: false,
              detail: 'Top 7th',
            },
          },
        },
      ],
    },
  ],
}

test.beforeEach(async ({ page }) => {
  await page.route(SCOREBOARD_ENDPOINT, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(scoreboardFixture),
    })
  })
})

test.describe('College Baseball Live smoke suite', () => {
  test('loads live scoreboard without fatal errors', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: /college baseball live/i })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: /live scores/i })).toBeVisible()
  })

  test('sport switcher toggles menu', async ({ page }) => {
    await page.goto('/')
    const switcherButton = page.getByRole('button', { name: /switch sport/i })
    await switcherButton.click()
    await expect(page.getByRole('menu', { name: /select sport/i })).toBeVisible()
    await switcherButton.click()
    await expect(page.getByRole('menu', { name: /select sport/i })).toBeHidden()
  })
})
