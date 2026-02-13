import { isPresenceCoachEnabled } from './feature-flags';

export interface MainNavItem {
  label: string;
  href: string;
}

export const mainNavItems: MainNavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NFL', href: '/nfl' },
  { label: 'NBA', href: '/nba' },
  { label: 'CFB', href: '/cfb' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'Vision AI', href: '/vision-ai' },
  ...(isPresenceCoachEnabled() ? [{ label: 'Presence Coach', href: '/presence-coach' }] : []),
  { label: 'Arcade', href: '/arcade' },
];
