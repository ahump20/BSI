import { test, expect } from '@playwright/test';

/**
 * Route smoke tests — hit every non-parameterized page and verify:
 * 1. HTTP 200
 * 2. No hydration errors in console
 * 3. Page has a <title>
 *
 * Parameterized routes (e.g., /game/[gameId]) are excluded because
 * they require valid IDs and are covered by integration tests.
 */

/** All static routes to test, grouped by domain */
const ROUTES: { path: string; label: string }[] = [
  // Core
  { path: '/', label: 'Homepage' },
  { path: '/about', label: 'About' },
  { path: '/about/methodology', label: 'Methodology' },
  { path: '/about/partnerships', label: 'Partnerships' },
  { path: '/contact', label: 'Contact' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/privacy', label: 'Privacy' },
  { path: '/terms', label: 'Terms' },
  { path: '/scores', label: 'Scores Hub' },
  { path: '/search', label: 'Search' },
  { path: '/glossary', label: 'Glossary' },
  { path: '/data-sources', label: 'Data Sources' },
  { path: '/coverage', label: 'Coverage' },

  // College Baseball — flagship
  { path: '/college-baseball', label: 'College Baseball Hub' },
  { path: '/college-baseball/scores', label: 'CBB Scores' },
  { path: '/college-baseball/standings', label: 'CBB Standings' },
  { path: '/college-baseball/rankings', label: 'CBB Rankings' },
  { path: '/college-baseball/teams', label: 'CBB Teams' },
  { path: '/college-baseball/players', label: 'CBB Players' },
  { path: '/college-baseball/games', label: 'CBB Games' },
  { path: '/college-baseball/news', label: 'CBB News' },
  { path: '/college-baseball/transfer-portal', label: 'Transfer Portal' },
  { path: '/college-baseball/conferences', label: 'Conferences' },
  { path: '/college-baseball/compare', label: 'Compare' },
  { path: '/college-baseball/trends', label: 'Trends' },
  { path: '/college-baseball/analytics', label: 'Analytics' },

  // Savant
  { path: '/college-baseball/savant', label: 'Savant' },
  { path: '/college-baseball/savant/conference-index', label: 'Conference Index' },
  { path: '/college-baseball/savant/park-factors', label: 'Park Factors' },

  // Editorial
  { path: '/college-baseball/editorial', label: 'Editorial Hub' },

  // Preseason
  { path: '/college-baseball/preseason', label: 'Preseason' },
  { path: '/college-baseball/preseason/power-25', label: 'Power 25' },
  { path: '/college-baseball/preseason/sec-preview', label: 'SEC Preview' },

  // Tournament
  { path: '/college-baseball/tournament', label: 'Tournament' },
  { path: '/college-baseball/tournament/bubble', label: 'Tournament Bubble' },
  { path: '/college-baseball/tournament/cws', label: 'CWS' },
  { path: '/college-baseball/tournament/regionals', label: 'Regionals' },

  // Pro sports hubs
  { path: '/mlb', label: 'MLB Hub' },
  { path: '/mlb/scores', label: 'MLB Scores' },
  { path: '/mlb/standings', label: 'MLB Standings' },
  { path: '/mlb/teams', label: 'MLB Teams' },
  { path: '/mlb/players', label: 'MLB Players' },
  { path: '/mlb/games', label: 'MLB Games' },
  { path: '/mlb/news', label: 'MLB News' },
  { path: '/mlb/stats', label: 'MLB Stats' },
  { path: '/mlb/abs', label: 'MLB ABS' },
  { path: '/mlb/editorial', label: 'MLB Editorial' },
  { path: '/mlb/spring-training', label: 'Spring Training' },

  { path: '/nfl', label: 'NFL Hub' },
  { path: '/nfl/scores', label: 'NFL Scores' },
  { path: '/nfl/standings', label: 'NFL Standings' },
  { path: '/nfl/teams', label: 'NFL Teams' },
  { path: '/nfl/players', label: 'NFL Players' },
  { path: '/nfl/games', label: 'NFL Games' },
  { path: '/nfl/news', label: 'NFL News' },

  { path: '/nba', label: 'NBA Hub' },
  { path: '/nba/scores', label: 'NBA Scores' },
  { path: '/nba/standings', label: 'NBA Standings' },
  { path: '/nba/teams', label: 'NBA Teams' },
  { path: '/nba/players', label: 'NBA Players' },
  { path: '/nba/games', label: 'NBA Games' },
  { path: '/nba/news', label: 'NBA News' },

  { path: '/cfb', label: 'CFB Hub' },
  { path: '/cfb/scores', label: 'CFB Scores' },
  { path: '/cfb/standings', label: 'CFB Standings' },
  { path: '/cfb/teams', label: 'CFB Teams' },
  { path: '/cfb/articles', label: 'CFB Articles' },

  // Intel
  { path: '/intel', label: 'Intel Hub' },
  { path: '/intel/game-briefs', label: 'Game Briefs' },
  { path: '/intel/team-dossiers', label: 'Team Dossiers' },
  { path: '/intel/weekly-brief', label: 'Weekly Brief' },

  // Models
  { path: '/models', label: 'Models Hub' },
  { path: '/models/havf', label: 'HAVF' },
  { path: '/models/monte-carlo', label: 'Monte Carlo' },
  { path: '/models/win-probability', label: 'Win Probability' },
  { path: '/models/data-quality', label: 'Data Quality' },

  // Analytics
  { path: '/analytics', label: 'Analytics Hub' },
  { path: '/analytics/mmi', label: 'MMI' },

  // NIL
  { path: '/nil-valuation', label: 'NIL Valuation' },
  { path: '/nil-valuation/methodology', label: 'NIL Methodology' },

  // Arcade
  { path: '/arcade', label: 'Arcade' },
  { path: '/arcade/games', label: 'Arcade Games' },

  // Blog
  { path: '/blog-post-feed', label: 'Blog Feed' },

  // Auth
  { path: '/auth/login', label: 'Login' },
  { path: '/auth/signup', label: 'Signup' },

  // Dashboard
  { path: '/dashboard', label: 'Dashboard' },
];

for (const route of ROUTES) {
  test(`${route.label} (${route.path}) loads without errors`, async ({ page }) => {
    const consoleErrors: string[] = [];

    // Capture console errors (hydration errors show up here)
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore known non-critical errors
        if (
          text.includes('Failed to load resource') || // API 404s in test env
          text.includes('net::ERR_') || // Network errors in test env
          text.includes('favicon') // Missing favicon
        ) {
          return;
        }
        consoleErrors.push(text);
      }
    });

    const response = await page.goto(route.path, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    // 1. HTTP 200
    expect(response?.status(), `${route.path} should return 200`).toBe(200);

    // 2. Page has a <title>
    const title = await page.title();
    expect(title.length, `${route.path} should have a non-empty title`).toBeGreaterThan(0);

    // 3. No hydration errors
    const hydrationErrors = consoleErrors.filter(
      (e) =>
        e.includes('Hydration') ||
        e.includes('hydration') ||
        e.includes('server-rendered HTML') ||
        e.includes('content does not match') ||
        e.includes('did not match')
    );
    expect(
      hydrationErrors,
      `${route.path} should have no hydration errors:\n${hydrationErrors.join('\n')}`
    ).toHaveLength(0);
  });
}
