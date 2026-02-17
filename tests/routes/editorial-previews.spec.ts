import { test, expect } from '@playwright/test';

/**
 * Editorial Team Preview Pages — Route & Content Tests
 *
 * Tests all 47 team preview editorial pages across SEC, Big 12, and Big Ten.
 * Uses raw HTTP requests against the static build for speed and reliability.
 */

const SEC_TEAMS = [
  { slug: 'alabama', name: 'Alabama' },
  { slug: 'arkansas', name: 'Arkansas' },
  { slug: 'auburn', name: 'Auburn' },
  { slug: 'florida', name: 'Florida' },
  { slug: 'georgia', name: 'Georgia' },
  { slug: 'kentucky', name: 'Kentucky' },
  { slug: 'lsu', name: 'LSU' },
  { slug: 'mississippi-state', name: 'Mississippi State' },
  { slug: 'missouri', name: 'Missouri' },
  { slug: 'oklahoma', name: 'Oklahoma' },
  { slug: 'ole-miss', name: 'Ole Miss' },
  { slug: 'south-carolina', name: 'South Carolina' },
  { slug: 'tennessee', name: 'Tennessee' },
  { slug: 'texas', name: 'Texas' },
  { slug: 'texas-am', name: 'Texas A&amp;M' },
  { slug: 'vanderbilt', name: 'Vanderbilt' },
];

const BIG12_TEAMS = [
  { slug: 'arizona', name: 'Arizona' },
  { slug: 'arizona-state', name: 'Arizona State' },
  { slug: 'baylor', name: 'Baylor' },
  { slug: 'byu', name: 'BYU' },
  { slug: 'cincinnati', name: 'Cincinnati' },
  { slug: 'houston', name: 'Houston' },
  { slug: 'kansas', name: 'Kansas' },
  { slug: 'kansas-state', name: 'Kansas State' },
  { slug: 'oklahoma-state', name: 'Oklahoma State' },
  { slug: 'tcu', name: 'TCU' },
  { slug: 'texas-tech', name: 'Texas Tech' },
  { slug: 'ucf', name: 'UCF' },
  { slug: 'utah', name: 'Utah' },
  { slug: 'west-virginia', name: 'West Virginia' },
];

const BIG_TEN_TEAMS = [
  { slug: 'illinois', name: 'Illinois' },
  { slug: 'indiana', name: 'Indiana' },
  { slug: 'iowa', name: 'Iowa' },
  { slug: 'maryland', name: 'Maryland' },
  { slug: 'michigan', name: 'Michigan' },
  { slug: 'michigan-state', name: 'Michigan State' },
  { slug: 'minnesota', name: 'Minnesota' },
  { slug: 'nebraska', name: 'Nebraska' },
  { slug: 'northwestern', name: 'Northwestern' },
  { slug: 'ohio-state', name: 'Ohio State' },
  { slug: 'oregon', name: 'Oregon' },
  { slug: 'penn-state', name: 'Penn State' },
  { slug: 'purdue', name: 'Purdue' },
  { slug: 'rutgers', name: 'Rutgers' },
  { slug: 'ucla', name: 'UCLA' },
  { slug: 'usc', name: 'USC' },
  { slug: 'washington', name: 'Washington' },
];

const ALL_TEAMS = [
  ...SEC_TEAMS.map((t) => ({ ...t, conference: 'SEC' })),
  ...BIG12_TEAMS.map((t) => ({ ...t, conference: 'Big 12' })),
  ...BIG_TEN_TEAMS.map((t) => ({ ...t, conference: 'Big Ten' })),
];

test.describe('Editorial Preview Pages — Route Availability', () => {
  for (const team of ALL_TEAMS) {
    test(`${team.conference}: ${team.name} returns 200`, async ({ page }) => {
      const response = await page.request.get(
        `/college-baseball/editorial/${team.slug}-2026`
      );
      expect(response.status()).toBe(200);
    });
  }
});

test.describe('Editorial Preview Pages — Content Structure', () => {
  for (const team of ALL_TEAMS) {
    test(`${team.conference}: ${team.name} has required sections`, async ({
      page,
    }) => {
      const response = await page.request.get(
        `/college-baseball/editorial/${team.slug}-2026`
      );
      const html = await response.text();

      // Team name appears in the page
      expect(html).toContain(team.name);

      // Key sections present
      expect(html).toContain('The Program');
      expect(html).toContain('2025 Season Results');
      expect(html).toContain('2026 Roster Breakdown');
      expect(html).toContain('Pitching Staff Analysis');
      expect(html).toContain('Lineup Analysis');
      expect(html).toContain('2026 Schedule Highlights');
      expect(html).toContain('Scouting Verdict');
      expect(html).toContain('BSI Projection');

      // Scouting grade categories
      expect(html).toContain('Lineup Depth');
      expect(html).toContain('Rotation');
      expect(html).toContain('Bullpen');
      expect(html).toContain('Defense');
      expect(html).toContain('Coaching');

      // Data attribution
      expect(html).toContain('ESPN / SportsDataIO / D1Baseball');
    });
  }
});

test.describe('Editorial Preview Pages — No Console Errors', () => {
  // Spot check one team per conference
  const spotChecks = [
    { slug: 'texas', name: 'Texas', conference: 'SEC' },
    { slug: 'tcu', name: 'TCU', conference: 'Big 12' },
    { slug: 'ucla', name: 'UCLA', conference: 'Big Ten' },
  ];

  for (const team of spotChecks) {
    test(`${team.conference}: ${team.name} has no console errors`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !msg.text().includes('404')) errors.push(msg.text());
      });

      await page.goto(
        `/college-baseball/editorial/${team.slug}-2026`
      );
      await page.waitForLoadState('networkidle');

      expect(errors).toHaveLength(0);
    });
  }
});

test.describe('Editorial Preview Pages — Projection Tiers', () => {
  const tierChecks = [
    { slug: 'texas', tier: 'Omaha Favorite' },
    { slug: 'tcu', tier: 'Contender' },
    { slug: 'kansas', tier: 'Dark Horse' },
    { slug: 'baylor', tier: 'Bubble' },
    { slug: 'texas-tech', tier: 'Rebuilding' },
    { slug: 'ucla', tier: 'Omaha Favorite' },
    { slug: 'oregon', tier: 'Contender' },
    { slug: 'iowa', tier: 'Dark Horse' },
    { slug: 'ohio-state', tier: 'Rebuilding' },
  ];

  for (const check of tierChecks) {
    test(`${check.slug} has projection tier: ${check.tier}`, async ({
      page,
    }) => {
      const response = await page.request.get(
        `/college-baseball/editorial/${check.slug}-2026`
      );
      const html = await response.text();
      expect(html).toContain(check.tier);
    });
  }
});
