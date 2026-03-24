import { test, expect } from '@playwright/test';

/**
 * Game Sub-Page Render Audit — Production
 *
 * Verifies that game sub-pages render client-side content after JS execution.
 * Each test navigates to a production game URL and asserts that client-rendered
 * content is visible — content that would NOT appear in a curl of the static
 * HTML skeleton.
 *
 * Run: npx playwright test tests/e2e/game-subpage-render-audit.spec.ts --project=chromium
 */

const BASE = 'https://blazesportsintel.com';

// Use games with known data
const MLB_GAME = '401833325'; // TB @ PHI, Final
const NBA_GAME = '401810893'; // LAL @ DET, Final
const NFL_GAME = '401772988'; // SEA @ NE, Final (Super Bowl)
const CFB_GAME = '401856766'; // UNC @ TCU, Scheduled
const CBB_GAME = '401848425'; // ASU @ UNLV

test.describe('MLB game sub-pages render client content', () => {
  test('box-score shows team abbreviations and tab navigation', async ({ page }) => {
    await page.goto(`${BASE}/mlb/game/${MLB_GAME}/box-score/`, { waitUntil: 'networkidle' });
    // Tab navigation is client-rendered by GameLayoutShell
    const tabs = page.locator('a').filter({ hasText: /Box Score|Play-by-Play|Recap|Team Stats|Summary/ });
    await expect(tabs.first()).toBeVisible({ timeout: 15000 });
    // Breadcrumb matchup label is client-rendered from API data
    await expect(page.locator('text=TB @ PHI')).toBeVisible({ timeout: 10000 });
  });

  test('play-by-play shows play descriptions or empty state', async ({ page }) => {
    await page.goto(`${BASE}/mlb/game/${MLB_GAME}/play-by-play/`, { waitUntil: 'networkidle' });
    // Either play descriptions render, or the "not available yet" empty state appears
    const content = page.locator('text=/Play-by-play|All Plays|play updates/i');
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });

  test('recap shows game result or pre-game state', async ({ page }) => {
    await page.goto(`${BASE}/mlb/game/${MLB_GAME}/recap/`, { waitUntil: 'networkidle' });
    // Recap heading or scoring summary — all client-rendered
    const content = page.locator('text=/defeat|Scoring Summary|recap will be available|Game In Progress/i');
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });

  test('team-stats shows comparison bars or empty state', async ({ page }) => {
    await page.goto(`${BASE}/mlb/game/${MLB_GAME}/team-stats/`, { waitUntil: 'networkidle' });
    const content = page.locator('text=/Team Comparison|Game Insights|hasn.t started yet/i');
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('NBA game sub-pages render client content', () => {
  test('box-score shows player names and stat headers', async ({ page }) => {
    await page.goto(`${BASE}/nba/game/${NBA_GAME}/box-score/`, { waitUntil: 'networkidle' });
    // Player stats table is client-rendered from ESPN boxscore data
    const content = page.locator('text=/Team Statistics|Player|Starters|Bench|not available/i');
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('NFL game sub-pages render client content', () => {
  test('play-by-play shows quarter groupings or empty state', async ({ page }) => {
    await page.goto(`${BASE}/nfl/game/${NFL_GAME}/play-by-play/`, { waitUntil: 'networkidle' });
    const content = page.locator('text=/Q1|1st Quarter|All Plays|not available/i');
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('CFB game sub-pages render client content', () => {
  test('box-score shows team info or pre-game state', async ({ page }) => {
    await page.goto(`${BASE}/cfb/game/${CFB_GAME}/box-score/`, { waitUntil: 'networkidle' });
    // CFB game is scheduled (future), so should show empty state or team names
    const content = page.locator('text=/not available|TCU|Box score|Team Statistics/i');
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('College Baseball game sub-pages render client content', () => {
  test('box-score shows batting/pitching tables or empty state', async ({ page }) => {
    await page.goto(`${BASE}/college-baseball/game/${CBB_GAME}/box-score/`, { waitUntil: 'networkidle' });
    const content = page.locator('text=/Batting|Pitching|not available|Box score/i');
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });
});
