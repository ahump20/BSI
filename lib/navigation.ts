import { isPresenceCoachEnabled } from './feature-flags';
import {
  getActiveSports,
  SPORT_LABELS,
  SPORT_PATHS,
  type SportKey,
  type SeasonPhase,
} from './season';

/* ========================================================================== */
/* SHARED TYPES                                                                */
/* ========================================================================== */

export interface MainNavItem {
  label: string;
  href: string;
}

export interface LeagueNavItem extends MainNavItem {
  sport?: SportKey;
  phase: SeasonPhase;
  phaseLabel?: string;
  featured?: boolean;
}

/** Sidebar / bottom nav item — icon is rendered by the consumer */
export interface NavEntry {
  readonly label: string;
  readonly href: string;
  readonly iconKey: NavIconKey;
  readonly external?: boolean;
}

export interface NavGroup {
  readonly label: string;
  readonly items: readonly NavEntry[];
}

/**
 * Exhaustive icon keys — each consumer maps these to its own icon components.
 * Keeps navigation data free of React imports so it can run server-side.
 */
export type NavIconKey =
  | 'grid'
  | 'activity'
  | 'baseball'
  | 'football'
  | 'basketball'
  | 'chart'
  | 'list'
  | 'target'
  | 'book'
  | 'tag'
  | 'globe'
  | 'pen'
  | 'info'
  | 'flask'
  | 'dollar'
  | 'star'
  | 'brain'
  | 'home'
  | 'more';

/* ========================================================================== */
/* TOP BAR NAV (existing — unchanged API)                                      */
/* ========================================================================== */

export function getMainNavItems(date?: Date): {
  primary: MainNavItem[];
  leagues: LeagueNavItem[];
  secondary: MainNavItem[];
} {
  const now = date ?? new Date();

  const primary: MainNavItem[] = [
    { label: 'Live', href: '/scores' },
    { label: 'Intel', href: '/intel' },
    { label: 'Models', href: '/models' },
    { label: 'Pricing', href: '/pricing' },
  ];

  const wbcStart = new Date('2026-03-05T00:00:00-06:00');
  const wbcEnd = new Date('2026-03-18T23:59:59-05:00');
  const wbcActive = now >= wbcStart && now <= wbcEnd;
  const wbcEntry: LeagueNavItem = {
    label: 'WBC 2026',
    href: '/wbc',
    phase: wbcActive ? 'regular' : 'offseason',
    phaseLabel: wbcActive ? 'Live' : 'Mar 5–17',
    featured: true,
  };

  const leagues: LeagueNavItem[] = [
    wbcEntry,
    ...getActiveSports(now).map(({ sport, phase, label }) => ({
      label: SPORT_LABELS[sport],
      href: SPORT_PATHS[sport],
      sport,
      phase,
      phaseLabel: label,
    })),
  ];

  const secondary: MainNavItem[] = [
    { label: 'Savant', href: '/college-baseball/savant' },
    { label: 'Portal', href: '/college-baseball/transfer-portal' },
    { label: 'HAV-F', href: '/models/havf' },
    { label: 'MMI', href: '/analytics/mmi' },
    { label: 'Vision AI', href: '/vision-ai' },
    { label: 'Search', href: '/search' },
    { label: 'Writing', href: '/blog-post-feed' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Glossary', href: '/glossary' },
    { label: 'Data Sources', href: '/models/data-quality' },
    { label: 'Arcade', href: '/arcade' },
    { label: 'About', href: '/about' },
    ...(isPresenceCoachEnabled() ? [{ label: 'Presence Coach', href: '/presence-coach' }] : []),
  ];

  return { primary, leagues, secondary };
}

/* ========================================================================== */
/* SIDEBAR NAV — 4 clean groups, no duplicates                                 */
/* ========================================================================== */

/** WBC nav link visible only during tournament window */
function isWBCActive(): boolean {
  const now = new Date();
  return now >= new Date('2026-03-05T00:00:00-06:00') && now <= new Date('2026-03-18T23:59:59-05:00');
}

export function getSidebarNav(): readonly NavGroup[] {
  const wbcItems: NavEntry[] = isWBCActive()
    ? [{ href: '/wbc', label: 'WBC 2026', iconKey: 'globe' }]
    : [];

  return [
    {
      label: 'Overview',
      items: [
        { href: '/', label: 'Dashboard', iconKey: 'grid' },
        { href: '/scores', label: 'Live Scores', iconKey: 'activity' },
        { href: '/intel', label: 'Intelligence', iconKey: 'brain' },
        ...wbcItems,
      ],
    },
    {
      label: 'Sports',
      items: [
        { href: '/college-baseball', label: 'College Baseball', iconKey: 'baseball' },
        { href: '/college-baseball/rankings', label: 'Rankings', iconKey: 'list' },
        { href: '/college-baseball/savant', label: 'Savant / Advanced Stats', iconKey: 'target' },
        { href: '/college-baseball/conferences', label: 'Conferences', iconKey: 'globe' },
        { href: '/college-baseball/compare', label: 'Compare', iconKey: 'chart' },
        { href: '/mlb', label: 'MLB', iconKey: 'baseball' },
        { href: '/mlb/the-show-26/diamond-dynasty', label: 'Diamond Dynasty', iconKey: 'target' },
        { href: '/nfl', label: 'NFL', iconKey: 'football' },
        { href: '/nba', label: 'NBA', iconKey: 'basketball' },
        { href: '/cfb', label: 'College Football', iconKey: 'football' },
      ],
    },
    {
      label: 'Tools & Models',
      items: [
        { href: '/nil-valuation', label: 'NIL Valuation', iconKey: 'dollar' },
        { href: '/college-baseball/transfer-portal', label: 'Transfer Portal', iconKey: 'activity' },
        { href: '/college-baseball/watchlist', label: 'Watchlist', iconKey: 'star' },
        { href: '/analytics/mmi', label: 'MMI Analytics', iconKey: 'chart' },
        { href: '/models', label: 'Models', iconKey: 'chart' },
        { href: '/research', label: 'Research', iconKey: 'book' },
        { href: '/pricing', label: 'Pricing', iconKey: 'tag' },
      ],
    },
    {
      label: 'More',
      items: [
        { href: '/college-baseball/editorial', label: 'Editorial', iconKey: 'pen' },
        { href: '/glossary', label: 'Glossary', iconKey: 'book' },
        { href: '/arcade', label: 'Arcade', iconKey: 'activity' },
        { href: 'https://labs.blazesportsintel.com', label: 'Labs', iconKey: 'flask', external: true },
        { href: 'https://blazecraft.app', label: 'BlazeCraft', iconKey: 'grid', external: true },
        { href: '/about', label: 'About', iconKey: 'info' },
        { href: '/status', label: 'Status', iconKey: 'globe' },
      ],
    },
  ];
}

/* ========================================================================== */
/* BOTTOM NAV — mobile, 4 tabs + More                                          */
/* ========================================================================== */

export interface BottomNavEntry {
  readonly label: string;
  readonly href: string;
  readonly iconKey: NavIconKey;
}

export function getBottomNav(): readonly BottomNavEntry[] {
  return [
    { href: '/', label: 'Home', iconKey: 'home' },
    { href: '/scores', label: 'Scores', iconKey: 'activity' },
    { href: '/college-baseball', label: 'CBB', iconKey: 'baseball' },
    { href: '/intel', label: 'Intel', iconKey: 'brain' },
  ];
}

/* ========================================================================== */
/* MORE PANEL — mobile slide-up                                                */
/* ========================================================================== */

export interface MorePanelSection {
  readonly label: string;
  readonly items: readonly MainNavItem[];
}

export function getMorePanelNav(): readonly MorePanelSection[] {
  return [
    {
      label: 'Where to Start',
      items: [
        { label: 'Live Scores', href: '/scores' },
        { label: 'College Baseball', href: '/college-baseball' },
        { label: 'Intelligence', href: '/intel' },
      ],
    },
    {
      label: 'Tools',
      items: [
        { label: 'Savant', href: '/college-baseball/savant' },
        { label: 'Transfer Portal', href: '/college-baseball/transfer-portal' },
        { label: 'NIL Valuation', href: '/nil-valuation' },
        { label: 'Models', href: '/models' },
        { label: 'Analytics', href: '/analytics' },
      ],
    },
    {
      label: 'Sports',
      items: [
        { label: 'MLB', href: '/mlb' },
        { label: 'NFL', href: '/nfl' },
        { label: 'NBA', href: '/nba' },
        { label: 'College Football', href: '/cfb' },
        { label: 'Rankings', href: '/college-baseball/rankings' },
        { label: 'Conferences', href: '/college-baseball/conferences' },
        { label: 'Compare', href: '/college-baseball/compare' },
      ],
    },
    {
      label: 'More',
      items: [
        { label: 'Editorial', href: '/college-baseball/editorial' },
        { label: 'Arcade', href: '/arcade' },
        { label: 'About', href: '/about' },
        { label: 'Settings', href: '/settings' },
        { label: 'Status', href: '/status' },
      ],
    },
  ];
}
