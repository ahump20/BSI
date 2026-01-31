/**
 * Centralized navigation configuration
 * Single source of truth for all nav items across the site
 */

export interface NavItem {
  label: string;
  href: string;
  badge?: string;
  children?: NavItem[];
}

/**
 * Main navigation items — collapsed to 5 top-level items + dropdowns
 *
 * [Logo]  Scores  Portal  Sports▼  Tools▼  [Search] [Sign In]
 */
export const mainNavItems: NavItem[] = [
  { label: 'Scores', href: '/scores' },
  { label: 'Transfer Portal', href: '/transfer-portal', badge: 'LIVE' },
  {
    label: 'Sports',
    href: '#',
    children: [
      { label: 'College Baseball', href: '/college-baseball' },
      { label: 'MLB', href: '/mlb' },
      { label: 'NFL', href: '/nfl' },
      { label: 'NBA', href: '/nba' },
      { label: 'College Football', href: '/cfb' },
    ],
  },
  {
    label: 'Tools',
    href: '#',
    children: [
      { label: 'Win Probability', href: '/win-probability' },
      { label: 'Fanbase Explorer', href: '/fanbase' },
      { label: 'Games', href: '/games' },
      { label: 'Blaze Vision', href: '/blaze-vision' },
      { label: 'Developer API', href: '/developers' },
    ],
  },
  { label: 'Dashboard', href: '/dashboard' },
];

/**
 * Footer navigation items
 */
export const footerNavItems: NavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Methodology', href: '/methodology' },
  { label: 'Settings', href: '/settings' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

/**
 * College Football navigation items
 */
export const cfbNavItems: NavItem[] = [
  { label: 'CFB Home', href: '/cfb' },
  { label: 'Transfer Portal', href: '/cfb/transfer-portal' },
  { label: 'Rankings', href: '/cfb/rankings' },
  { label: 'Schedules', href: '/cfb/schedules' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Home', href: '/' },
];

/**
 * College Baseball navigation items
 */
export const collegeBaseballNavItems: NavItem[] = [
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'Transfer Portal', href: '/college-baseball/transfer-portal' },
  { label: 'Rankings', href: '/college-baseball/rankings' },
  { label: 'Schedules', href: '/college-baseball/schedules' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Home', href: '/' },
];

/**
 * Secondary navigation configurations for sport sections
 * Used with Navbar's secondaryNav prop for context-specific tabs
 */
export const secondaryNavConfig: Record<string, NavItem[]> = {
  fanbase: [
    { label: 'Explorer', href: '/fanbase' },
    { label: 'Compare', href: '/fanbase/compare' },
    { label: 'Triggers', href: '/fanbase/triggers' },
  ],
  'college-baseball': [
    { label: 'Scores', href: '/college-baseball/scores' },
    { label: 'Standings', href: '/college-baseball/standings' },
    { label: 'Rankings', href: '/college-baseball/rankings' },
    { label: 'Portal', href: '/college-baseball/transfer-portal' },
    { label: 'Teams', href: '/college-baseball/teams' },
    { label: 'Players', href: '/college-baseball/players' },
  ],
  mlb: [
    { label: 'Scores', href: '/mlb/scores' },
    { label: 'Standings', href: '/mlb/standings' },
    { label: 'Stats', href: '/mlb/stats' },
    { label: 'Teams', href: '/mlb/teams' },
    { label: 'Players', href: '/mlb/players' },
  ],
  nfl: [
    { label: 'Scores', href: '/nfl/scores' },
    { label: 'Standings', href: '/nfl/standings' },
    { label: 'Stats', href: '/nfl/stats' },
    { label: 'Teams', href: '/nfl/teams' },
    { label: 'Players', href: '/nfl/players' },
  ],
  nba: [
    { label: 'Scores', href: '/nba/scores' },
    { label: 'Standings', href: '/nba/standings' },
    { label: 'Stats', href: '/nba/stats' },
    { label: 'Teams', href: '/nba/teams' },
    { label: 'Players', href: '/nba/players' },
  ],
  cfb: [
    { label: 'Scores', href: '/cfb/scores' },
    { label: 'Rankings', href: '/cfb/rankings' },
    { label: 'Portal', href: '/cfb/transfer-portal' },
    { label: 'Schedules', href: '/cfb/schedules' },
    { label: 'Teams', href: '/cfb/teams' },
  ],
};

/**
 * Get secondary nav items for a given route
 */
export function getSecondaryNav(pathname: string): NavItem[] | undefined {
  const segments = pathname.split('/').filter(Boolean);
  const sportKey = segments[0];
  return secondaryNavConfig[sportKey];
}
