/**
 * Centralized navigation configuration
 * Single source of truth for all nav items across the site
 */

export interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

/**
 * Main navigation items used in Navbar across all pages
 * Order: Home → Sports (College Baseball, MLB, NFL, NBA) → Dashboard → About → Pricing
 */
export const mainNavItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NFL', href: '/nfl' },
  { label: 'NBA', href: '/nba' },
  { label: 'Vision AI', href: '/vision-AI-Intelligence', badge: 'AI' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'About', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
];

/**
 * Footer navigation items
 */
export const footerNavItems: NavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
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
