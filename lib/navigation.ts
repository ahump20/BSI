import { isPresenceCoachEnabled } from './feature-flags';
import {
  getActiveSports,
  isInSeason,
  SPORT_LABELS,
  SPORT_PATHS,
  type SportKey,
} from './season';

export interface MainNavItem {
  label: string;
  href: string;
}

/** Static nav items (always visible). */
const STATIC_PRIMARY: MainNavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
];

/** Utility / secondary pages — shown in "More" dropdown. */
const SECONDARY_PAGES: MainNavItem[] = [
  { label: 'Vision AI', href: '/vision-ai' },
  { label: 'Arcade', href: '/arcade' },
  ...(isPresenceCoachEnabled() ? [{ label: 'Presence Coach', href: '/presence-coach' }] : []),
];

/**
 * Get season-aware primary nav items.
 * In-season sports appear as top-level links; off-season sports go to secondary.
 */
export function getMainNavItems(date?: Date): {
  primary: MainNavItem[];
  secondary: MainNavItem[];
} {
  const now = date ?? new Date();
  const allSports: SportKey[] = ['ncaa', 'mlb', 'nfl', 'nba', 'cfb'];

  const primary: MainNavItem[] = [...STATIC_PRIMARY];
  const secondary: MainNavItem[] = [];

  for (const sport of allSports) {
    const item: MainNavItem = {
      label: SPORT_LABELS[sport],
      href: SPORT_PATHS[sport],
    };

    if (isInSeason(sport, now)) {
      primary.push(item);
    } else {
      secondary.push(item);
    }
  }

  secondary.push(...SECONDARY_PAGES);

  return { primary, secondary };
}

/**
 * Legacy export — flat list of all nav items.
 * Used by components that haven't migrated to primary/secondary split yet.
 */
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
