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
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];