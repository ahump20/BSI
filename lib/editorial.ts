// ── Shared editorial types & helpers ──────────────────────────────────
// Single source of truth for editorial data structures, tag derivation,
// and display formatting. Used by editorial/page.tsx and any component
// that consumes /api/college-baseball/editorial/list.

// ── Types ────────────────────────────────────────────────────────────

export interface Editorial {
  id: number;
  date: string;
  title: string;
  preview: string;
  teams: string[];
  wordCount: number;
  createdAt: string;
}

export interface EditorialListResponse {
  editorials: Editorial[];
  meta?: { source?: string; fetched_at?: string; timezone?: string };
  message?: string;
}

// ── Tag derivation ───────────────────────────────────────────────────
// D1 articles carry team names; these sets map them to conference tags
// for the filter bar on the editorial index page.

export type EditorialTag =
  | 'All'
  | 'SEC'
  | 'Big 12'
  | 'Big Ten'
  | 'Weekly'
  | 'National'
  | 'Team Preview'
  | 'Conference';

export const EDITORIAL_FILTER_TAGS: EditorialTag[] = [
  'All', 'SEC', 'Big 12', 'Big Ten', 'Weekly', 'National', 'Team Preview', 'Conference',
];

const SEC_TEAM_NAMES = new Set([
  'Texas', 'Texas A&M', 'LSU', 'Florida', 'Tennessee', 'Arkansas',
  'Vanderbilt', 'Oklahoma', 'Georgia', 'Kentucky', 'South Carolina',
  'Ole Miss', 'Alabama', 'Auburn', 'Mississippi State', 'Missouri',
]);

const BIG12_TEAM_NAMES = new Set([
  'TCU', 'Kansas', 'Oklahoma State', 'Arizona', 'Arizona State',
  'Baylor', 'Houston', 'UCF', 'West Virginia', 'Texas Tech',
  'Cincinnati', 'BYU', 'Kansas State', 'Utah',
]);

const BIGTEN_TEAM_NAMES = new Set([
  'UCLA', 'Oregon', 'USC', 'Michigan', 'Iowa', 'Indiana',
  'Penn State', 'Nebraska', 'Illinois', 'Michigan State',
  'Rutgers', 'Washington', 'Purdue', 'Ohio State', 'Maryland',
  'Minnesota', 'Northwestern',
]);

/** Derive conference tags from an article's teams array. */
export function deriveArticleTags(teams: string[]): EditorialTag[] {
  const tags: EditorialTag[] = [];
  for (const team of teams) {
    if (SEC_TEAM_NAMES.has(team) && !tags.includes('SEC')) tags.push('SEC');
    if (BIG12_TEAM_NAMES.has(team) && !tags.includes('Big 12')) tags.push('Big 12');
    if (BIGTEN_TEAM_NAMES.has(team) && !tags.includes('Big Ten')) tags.push('Big Ten');
  }
  if (tags.length === 0) tags.push('National');
  return tags;
}

/** Check if an article matches a given filter tag. */
export function articleMatchesTag(article: Editorial, tag: EditorialTag): boolean {
  if (tag === 'All') return true;
  return deriveArticleTags(article.teams).includes(tag);
}

// ── Display helpers ──────────────────────────────────────────────────

/** Estimated read time from word count (250 wpm). */
export function readTime(words: number): string {
  return `${Math.max(1, Math.ceil(words / 250))} min`;
}

/** Format a YYYY-MM-DD date string for display. */
export function formatEditorialDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Short date format (e.g., "Feb 16"). */
export function formatShortDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** Build the href for an editorial article. */
export function getEditorialHref(article: Editorial): string {
  return `/college-baseball/editorial/daily/${article.date}`;
}
