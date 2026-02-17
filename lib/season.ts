/**
 * Season Detection — determines which sports are currently active.
 *
 * Hardcoded date ranges (no API dependency). Used by navigation, live scores,
 * sport hub cards, and bottom nav to show season-aware content.
 *
 * All dates use month/day boundaries — year-agnostic so they roll over
 * automatically. NFL postseason spans year boundary (Jan).
 */

export type SportKey = 'mlb' | 'nfl' | 'nba' | 'ncaa' | 'cfb';
export type SeasonPhase = 'preseason' | 'regular' | 'postseason' | 'offseason';

export interface SportSeason {
  sport: SportKey;
  phase: SeasonPhase;
  label?: string; // e.g., "Spring Training", "March Madness"
}

// ---------------------------------------------------------------------------
// Date range helpers
// ---------------------------------------------------------------------------

/** Month is 1-indexed (Jan=1). Inclusive on both ends. */
interface DateRange {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

function inRange(date: Date, range: DateRange): boolean {
  const m = date.getMonth() + 1; // 1-indexed
  const d = date.getDate();
  const current = m * 100 + d;
  const start = range.startMonth * 100 + range.startDay;
  const end = range.endMonth * 100 + range.endDay;

  // Handle ranges that span year boundary (e.g., NFL postseason Dec-Feb)
  if (start > end) {
    return current >= start || current <= end;
  }
  return current >= start && current <= end;
}

// ---------------------------------------------------------------------------
// Season definitions
// ---------------------------------------------------------------------------

interface SeasonDef {
  phase: SeasonPhase;
  range: DateRange;
  label?: string;
}

const SEASON_RULES: Record<SportKey, SeasonDef[]> = {
  mlb: [
    { phase: 'preseason', range: { startMonth: 2, startDay: 15, endMonth: 3, endDay: 25 }, label: 'Spring Training' },
    { phase: 'regular', range: { startMonth: 3, startDay: 26, endMonth: 9, endDay: 30 } },
    { phase: 'postseason', range: { startMonth: 10, startDay: 1, endMonth: 11, endDay: 5 } },
  ],
  nfl: [
    { phase: 'preseason', range: { startMonth: 8, startDay: 1, endMonth: 9, endDay: 5 } },
    { phase: 'regular', range: { startMonth: 9, startDay: 6, endMonth: 1, endDay: 10 } },
    { phase: 'postseason', range: { startMonth: 1, startDay: 11, endMonth: 2, endDay: 15 }, label: 'Playoffs' },
  ],
  nba: [
    { phase: 'regular', range: { startMonth: 10, startDay: 20, endMonth: 4, endDay: 15 } },
    { phase: 'postseason', range: { startMonth: 4, startDay: 16, endMonth: 6, endDay: 20 }, label: 'Playoffs' },
  ],
  ncaa: [
    { phase: 'regular', range: { startMonth: 2, startDay: 14, endMonth: 6, endDay: 1 } },
    { phase: 'postseason', range: { startMonth: 6, startDay: 2, endMonth: 6, endDay: 30 }, label: 'CWS' },
  ],
  cfb: [
    { phase: 'regular', range: { startMonth: 8, startDay: 25, endMonth: 12, endDay: 10 } },
    { phase: 'postseason', range: { startMonth: 12, startDay: 11, endMonth: 1, endDay: 15 }, label: 'Bowl Season' },
  ],
};

// When a sport returns to action (month name for off-season messaging)
const RETURN_MONTHS: Record<SportKey, string> = {
  mlb: 'February',
  nfl: 'August',
  nba: 'October',
  ncaa: 'February',
  cfb: 'August',
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Get the current season phase for a sport. Returns 'offseason' if no range matches. */
export function getSeasonPhase(sport: SportKey, date: Date = new Date()): SportSeason {
  const rules = SEASON_RULES[sport];
  for (const rule of rules) {
    if (inRange(date, rule.range)) {
      return { sport, phase: rule.phase, label: rule.label };
    }
  }
  return { sport, phase: 'offseason' };
}

/** Get all sports with their current season status, sorted by activity. */
export function getActiveSports(date: Date = new Date()): SportSeason[] {
  const all: SportSeason[] = (Object.keys(SEASON_RULES) as SportKey[]).map(
    (sport) => getSeasonPhase(sport, date),
  );

  // Sort: live phases first (regular > postseason > preseason > offseason)
  const phaseOrder: Record<SeasonPhase, number> = {
    regular: 0,
    postseason: 1,
    preseason: 2,
    offseason: 3,
  };

  return all.sort((a, b) => phaseOrder[a.phase] - phaseOrder[b.phase]);
}

/** Check if a sport is currently in-season (any phase except offseason). */
export function isInSeason(sport: SportKey, date: Date = new Date()): boolean {
  return getSeasonPhase(sport, date).phase !== 'offseason';
}

/** Get the month name when an off-season sport returns. */
export function getReturnMonth(sport: SportKey): string {
  return RETURN_MONTHS[sport];
}

/** Human-readable label for a sport. */
export const SPORT_LABELS: Record<SportKey, string> = {
  mlb: 'MLB',
  nfl: 'NFL',
  nba: 'NBA',
  ncaa: 'College Baseball',
  cfb: 'CFB',
};

/** Sport hub page paths. */
export const SPORT_PATHS: Record<SportKey, string> = {
  mlb: '/mlb',
  nfl: '/nfl',
  nba: '/nba',
  ncaa: '/college-baseball',
  cfb: '/cfb',
};
