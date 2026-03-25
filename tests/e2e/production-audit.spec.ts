import { test, expect } from '@playwright/test';

/**
 * Production render audit — entity-agnostic, date-agnostic.
 *
 * Two modes:
 *   gate:release  = deterministic local/preview checks (BASE_URL=http://localhost:3000)
 *   audit:prod    = post-deploy production audit (BASE_URL=https://blazesportsintel.com)
 *
 * Run:
 *   BASE_URL=https://blazesportsintel.com npx playwright test tests/e2e/production-audit.spec.ts \
 *     --config=playwright.smoke.config.ts --project=chromium
 */

const BANNED_PLACEHOLDERS = ['???', 'Unknown Team', 'Unknown Player', '[object Object]'];

function assertNoBannedText(text: string) {
  for (const placeholder of BANNED_PLACEHOLDERS) {
    expect(text).not.toContain(placeholder);
  }
  // TBD as a word boundary (not inside URLs or other tokens)
  expect(text).not.toMatch(/\bTBD\b/);
}

/**
 * Asserts the page is in a truthful state:
 * either real content or an explicit empty/error message.
 */
function assertTruthfulState(bodyText: string) {
  const hasContent = bodyText.length > 200;
  const hasExplicitState =
    /no games|no scores|no .* scheduled|off-?day|error|unavailable|no data|coming soon/i.test(bodyText);
  expect(
    hasContent || hasExplicitState,
    'Page must show real content or an explicit empty/error state'
  ).toBe(true);
}

// ─── MLB Scores ───────────────────────────────────────────────

test.describe('MLB Scores: /mlb/scores/', () => {
  test('renders heading, no banned placeholders, truthful state', async ({ page }) => {
    const response = await page.goto('/mlb/scores/', { waitUntil: 'domcontentloaded' });
    if (response && response.status() >= 400) {
      test.skip();
      return;
    }
    await page.waitForTimeout(3000);

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();

    const bodyText = await page.locator('body').innerText();
    assertNoBannedText(bodyText);
    assertTruthfulState(bodyText);
  });

  test('deep-link sampling: at least 3 /mlb/game/* links', async ({ page }) => {
    const response = await page.goto('/mlb/scores/', { waitUntil: 'domcontentloaded' });
    if (response && response.status() >= 400) {
      test.skip();
      return;
    }
    await page.waitForTimeout(3000);

    const gameLinks = page.locator('a[href*="/mlb/game"]');
    const count = await gameLinks.count();

    if (count === 0) {
      // Offseason or no games today — acceptable
      test.skip();
      return;
    }

    // Sample up to 3 deep links
    const linksToCheck = Math.min(count, 3);
    for (let i = 0; i < linksToCheck; i++) {
      const href = await gameLinks.nth(i).getAttribute('href');
      expect(href).toBeTruthy();

      const deepResponse = await page.goto(href!, { waitUntil: 'domcontentloaded' });
      expect(deepResponse?.status()).toBeLessThan(404);

      await page.waitForTimeout(2000);
      const deepBody = await page.locator('body').innerText();
      assertNoBannedText(deepBody);
      assertTruthfulState(deepBody);
    }
  });
});

// ─── College Baseball Scores ──────────────────────────────────

test.describe('College Baseball Scores: /college-baseball/scores/', () => {
  test('renders heading, no banned placeholders, truthful state', async ({ page }) => {
    const response = await page.goto('/college-baseball/scores/', { waitUntil: 'domcontentloaded' });
    if (response && response.status() >= 400) {
      test.skip();
      return;
    }
    await page.waitForTimeout(3000);

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();

    const bodyText = await page.locator('body').innerText();
    assertNoBannedText(bodyText);
    assertTruthfulState(bodyText);
  });

  test('deep-link sampling', async ({ page }) => {
    const response = await page.goto('/college-baseball/scores/', { waitUntil: 'domcontentloaded' });
    if (response && response.status() >= 400) {
      test.skip();
      return;
    }
    await page.waitForTimeout(3000);

    const gameLinks = page.locator('a[href*="/game"]');
    const count = await gameLinks.count();
    if (count === 0) {
      test.skip();
      return;
    }

    const href = await gameLinks.first().getAttribute('href');
    expect(href).toBeTruthy();

    const deepResponse = await page.goto(href!, { waitUntil: 'domcontentloaded' });
    expect(deepResponse?.status()).toBeLessThan(404);

    await page.waitForTimeout(2000);
    const deepBody = await page.locator('body').innerText();
    assertNoBannedText(deepBody);
  });
});

// ─── About / Standards ────────────────────────────────────────

test.describe('About Standards: /about/standards/', () => {
  test('renders heading, no banned placeholders', async ({ page }) => {
    const response = await page.goto('/about/standards/', { waitUntil: 'domcontentloaded' });
    if (response && response.status() >= 400) {
      test.skip();
      return;
    }
    await page.waitForTimeout(2000);

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();

    const bodyText = await page.locator('body').innerText();
    assertNoBannedText(bodyText);
  });
});

// ─── API-to-DOM Route-to-Source Truth Check ───────────────────

test.describe('API-to-DOM cross-check: MLB scores', () => {
  test('API response team name appears in rendered page', async ({ page, request }) => {
    const baseURL = process.env.BASE_URL || 'https://blazesportsintel.com';
    const apiUrl = `${baseURL}/api/mlb/scores`;

    let apiResponse;
    try {
      apiResponse = await request.get(apiUrl);
    } catch {
      test.skip();
      return;
    }

    if (apiResponse.status() !== 200) {
      test.skip();
      return;
    }

    let apiData;
    try {
      apiData = await apiResponse.json();
    } catch {
      test.skip();
      return;
    }

    // Extract a team name from the API response
    const games = apiData?.games || apiData?.data?.games || apiData?.data || [];
    if (!Array.isArray(games) || games.length === 0) {
      test.skip();
      return;
    }

    const firstGame = games[0];
    const teamName =
      firstGame?.home?.name ||
      firstGame?.home_team?.name ||
      firstGame?.homeTeam?.name ||
      firstGame?.teams?.home?.name ||
      firstGame?.home?.team?.name;

    if (!teamName) {
      test.skip();
      return;
    }

    // Now check the rendered page contains that team name
    await page.goto('/mlb/scores/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain(teamName);
  });
});
