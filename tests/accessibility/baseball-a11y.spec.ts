import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const IMPACT_THRESHOLD = new Set(['critical', 'serious'])
const SCOREBOARD_ENDPOINT =
  'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard'

const scoreboardFixture = {
  events: [
    {
      id: 'axe-fixture-1',
      competitions: [
        {
          competitors: [
            {
              homeAway: 'away',
              score: '2',
              team: { displayName: 'Texas State' },
            },
            {
              homeAway: 'home',
              score: '1',
              team: { displayName: 'Rice' },
            },
          ],
          status: {
            type: {
              completed: true,
              detail: 'Final',
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

test.describe('Accessibility • College Baseball Live', () => {
  test('base scoreboard page has no serious accessibility violations', async ({ page }) => {
    await page.goto('/')
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze()

    const seriousViolations = violations.filter((violation) =>
      violation.impact ? IMPACT_THRESHOLD.has(violation.impact) : false
    )

    expect(seriousViolations).toEqual([])
  })
})
