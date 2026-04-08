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
  external?: boolean;
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
/* TOP BAR NAV — persona-based primary + sports dropdown + analytics dropdown  */
/* ========================================================================== */

export function getMainNavItems(date?: Date): {
  primary: MainNavItem[];
  leagues: LeagueNavItem[];
  secondary: MainNavItem[];
} {
  const now = date ?? new Date();

  const primary: MainNavItem[] = [
    { label: 'Scores', href: '/scores' },
    { label: 'College Baseball', href: '/college-baseball' },
    { label: 'Intel', href: '/intel' },
    { label: 'Ask BSI', href: '/ask' },
    { label: 'Pricing', href: '/pricing' },
  ];

  // Only show college baseball in the sports dropdown until other sport pages have live data
  const allSports = getActiveSports(now).map(({ sport, phase, label }) => ({
    label: SPORT_LABELS[sport],
    href: SPORT_PATHS[sport],
    sport,
    phase,
    phaseLabel: label,
  }));
  const leagues: LeagueNavItem[] = allSports.filter(
    (item) => item.href === '/college-baseball'
  );

  const secondary: MainNavItem[] = [
    { label: 'Baseball Agent', href: '/agent' },
    { label: 'Podcast', href: '/podcast' },
    { label: 'Editorial', href: '/college-baseball/editorial' },
    { label: 'Glossary', href: '/college-baseball/savant/glossary' },
    { label: 'Data Sources', href: '/data-sources' },
    { label: 'About', href: '/about' },
    { label: 'Status', href: '/status' },
    ...(isPresenceCoachEnabled() ? [{ label: 'Presence Coach', href: '/presence-coach' }] : []),
  ];

  return { primary, leagues, secondary };
}

/* ========================================================================== */
/* ANALYTICS NAV — power tools dropdown                                        */
/* ========================================================================== */

export function getAnalyticsNavItems(): MainNavItem[] {
  return [
    { label: 'Player Evaluation', href: '/evaluate' },
    { label: 'Savant', href: '/college-baseball/savant' },
    { label: 'Power Rankings', href: '/college-baseball/power-rankings' },
    { label: 'Weekly Pulse', href: '/college-baseball/weekly-pulse' },
    { label: 'Transfer Portal', href: '/college-baseball/transfer-portal' },
    { label: 'NIL Valuation', href: '/nil-valuation' },
    { label: 'Compare', href: '/college-baseball/compare' },
    { label: 'Watchlist', href: '/college-baseball/watchlist' },
  ];
}

/* ========================================================================== */
/* SIDEBAR NAV — persona-based groups                                          */
/* ========================================================================== */

export function getSidebarNav(): readonly NavGroup[] {
  return [
    {
      label: 'Live',
      items: [
        { href: '/scores', label: 'Scores', iconKey: 'activity' },
        { href: '/college-baseball', label: 'College Baseball', iconKey: 'baseball' },
        { href: '/college-baseball/rankings', label: 'Rankings', iconKey: 'star' },
      ],
    },
    {
      label: 'Analyze',
      items: [
        { href: '/college-baseball/savant', label: 'Savant', iconKey: 'target' },
        { href: '/college-baseball/savant/team-compare', label: 'Compare', iconKey: 'chart' },
        { href: '/nil-valuation', label: 'NIL Explorer', iconKey: 'dollar' },
      ],
    },
    {
      label: 'Context',
      items: [
        { href: '/college-baseball/standings', label: 'Standings', iconKey: 'list' },
        { href: '/college-baseball/power-rankings', label: 'Power Rankings', iconKey: 'list' },
        { href: '/college-baseball/savant/conference-index', label: 'Conferences', iconKey: 'globe' },
        { href: '/college-baseball/savant/park-factors', label: 'Park Factors', iconKey: 'chart' },
      ],
    },
    {
      label: 'Tools',
      items: [
        { href: '/college-baseball/savant/visuals', label: 'Visuals', iconKey: 'chart' },
        { href: '/college-baseball/weekly-pulse', label: 'Weekly Pulse', iconKey: 'activity' },
        { href: '/ask', label: 'Ask BSI', iconKey: 'brain' },
        { href: '/college-baseball/savant/glossary', label: 'Glossary', iconKey: 'book' },
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
    { href: '/college-baseball/savant', label: 'Savant', iconKey: 'chart' },
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
      label: 'Sports',
      items: [
        { label: 'College Baseball', href: '/college-baseball', iconKey: 'baseball' },
        { label: 'MLB', href: '/mlb', iconKey: 'baseball' },
        { label: 'NFL', href: '/nfl', iconKey: 'football' },
        { label: 'NBA', href: '/nba', iconKey: 'basketball' },
        { label: 'College Football', href: '/cfb', iconKey: 'football' },
      ],
    },
    {
      label: 'Analytics & Tools',
      items: [
        { label: 'BSI Savant', href: '/college-baseball/savant' },
        { label: 'Compare Teams', href: '/college-baseball/compare' },
        { label: 'Rankings', href: '/college-baseball/rankings' },
        { label: 'Standings', href: '/college-baseball/standings' },
        { label: 'Transfer Portal', href: '/college-baseball/transfer-portal' },
        { label: 'Ask BSI', href: '/ask' },
      ],
    },
    {
      label: 'Content',
      items: [
        { label: 'Editorial', href: '/college-baseball/editorial' },
        { label: 'Intelligence', href: '/intel' },
        { label: 'Podcast', href: '/podcast' },
        { label: 'Conferences', href: '/college-baseball/conferences' },
      ],
    },
    {
      label: 'More',
      items: [
        { label: 'Pricing', href: '/pricing' },
        { label: 'About', href: '/about' },
        { label: 'Status', href: '/status' },
      ],
    },
  ];
}
