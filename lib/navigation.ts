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
      label: 'Watch',
      items: [
        { href: '/', label: 'Dashboard', iconKey: 'grid' },
        { href: '/scores', label: 'Live Scores', iconKey: 'activity' },
        { href: '/ask', label: 'Ask BSI', iconKey: 'brain' },
        { href: '/intel', label: 'Intelligence', iconKey: 'brain' },
        { href: '/agent', label: 'Agent', iconKey: 'brain' },
      ],
    },
    {
      label: 'College Baseball',
      items: [
        { href: '/college-baseball', label: 'Hub', iconKey: 'baseball' },
        { href: '/college-baseball/power-rankings', label: 'Power Rankings', iconKey: 'star' },
        { href: '/college-baseball/rankings', label: 'Rankings', iconKey: 'list' },
        { href: '/college-baseball/standings', label: 'Standings', iconKey: 'list' },
        { href: '/college-baseball/savant', label: 'Savant', iconKey: 'target' },
        { href: '/college-baseball/savant/glossary', label: 'Glossary', iconKey: 'book' },
        { href: '/college-baseball/savant/visuals', label: 'Visuals', iconKey: 'chart' },
        { href: '/college-baseball/savant/conference-index', label: 'Conf. Index', iconKey: 'globe' },
        { href: '/college-baseball/savant/park-factors', label: 'Park Factors', iconKey: 'chart' },
        { href: '/college-baseball/savant/team-compare', label: 'Compare Teams', iconKey: 'chart' },
        { href: '/college-baseball/savant/conference-comparison', label: 'Compare Conf.', iconKey: 'globe' },
        { href: '/college-baseball/savant/methodology', label: 'Methodology', iconKey: 'book' },
        { href: '/college-baseball/conferences', label: 'Conferences', iconKey: 'globe' },
        { href: '/college-baseball/compare', label: 'Compare', iconKey: 'chart' },
        { href: '/college-baseball/teams', label: 'Teams', iconKey: 'baseball' },
        { href: '/college-baseball/texas-intelligence', label: 'Texas Intel', iconKey: 'brain' },
        { href: '/college-baseball/texas-intelligence/roster', label: 'Texas Roster', iconKey: 'list' },
        { href: '/college-baseball/texas-intelligence/pitching', label: 'Texas Pitching', iconKey: 'target' },
        { href: '/college-baseball/texas-intelligence/schedule', label: 'Texas Schedule', iconKey: 'activity' },
        { href: '/college-baseball/texas-intelligence/draft', label: 'Texas Draft Board', iconKey: 'star' },
        { href: '/college-baseball/texas-intelligence/trends', label: 'Texas Trends', iconKey: 'chart' },
        { href: '/college-baseball/texas-history', label: 'Texas History', iconKey: 'book' },
      ],
    },
    // Pro Sports section hidden until sport pages have live data
    {
      label: 'Analyze',
      items: [
        { href: '/swing', label: 'Swing Intel', iconKey: 'target' },
        // Labs tools hidden until labs.blazesportsintel.com is functional
        { href: '/nil-valuation', label: 'NIL Valuation', iconKey: 'dollar' },
        { href: '/college-baseball/transfer-portal', label: 'Transfer Portal', iconKey: 'activity' },
        { href: '/college-baseball/watchlist', label: 'Watchlist', iconKey: 'star' },
        { href: '/research', label: 'Research', iconKey: 'book' },
        { href: '/pricing', label: 'Pricing', iconKey: 'tag' },
      ],
    },
    {
      label: 'More',
      items: [
        { href: '/podcast', label: 'Podcast', iconKey: 'activity' },
        { href: '/college-baseball/editorial', label: 'Editorial', iconKey: 'pen' },
        // Arcade, Labs, BlazeCraft hidden until functional
        { href: '/college-baseball/savant/glossary', label: 'Glossary', iconKey: 'book' },
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
    { href: '/college-baseball', label: 'Baseball', iconKey: 'baseball' },
    { href: '/college-baseball/savant', label: 'Analytics', iconKey: 'chart' },
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
        { label: 'Ask BSI', href: '/ask' },
        { label: 'College Baseball', href: '/college-baseball' },
        { label: 'Intelligence', href: '/intel' },
        { label: 'Pricing', href: '/pricing' },
      ],
    },
    {
      label: 'Analytics & Tools',
      items: [
        { label: 'Savant', href: '/college-baseball/savant' },
        { label: 'Power Rankings', href: '/college-baseball/power-rankings' },
        { label: 'Weekly Pulse', href: '/college-baseball/weekly-pulse' },
        { label: 'Transfer Portal', href: '/college-baseball/transfer-portal' },
        { label: 'NIL Valuation', href: '/nil-valuation' },
        { label: 'Compare', href: '/college-baseball/compare' },
        { label: 'Watchlist', href: '/college-baseball/watchlist' },
      ],
    },
    {
      label: 'College Baseball',
      items: [
        { label: 'Rankings', href: '/college-baseball/rankings' },
        { label: 'Conferences', href: '/college-baseball/conferences' },
        { label: 'Swing Intel', href: '/swing' },
      ],
    },
    {
      label: 'More',
      items: [
        { label: 'Podcast', href: '/podcast' },
        { label: 'Editorial', href: '/college-baseball/editorial' },
        { label: 'Glossary', href: '/college-baseball/savant/glossary' },
        { label: 'About', href: '/about' },
        { label: 'Status', href: '/status' },
      ],
    },
  ];
}
