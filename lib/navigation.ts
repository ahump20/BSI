import { isPresenceCoachEnabled } from './feature-flags';
import {
  getActiveSports,
  SPORT_LABELS,
  SPORT_PATHS,
  type SportKey,
  type SeasonPhase,
} from './season';

export interface MainNavItem {
  label: string;
  href: string;
}

export interface LeagueNavItem extends MainNavItem {
  sport: SportKey;
  phase: SeasonPhase;
  phaseLabel?: string;
}

/**
 * Get restructured nav items.
 *
 * Primary:   page links always visible in the top bar.
 * Leagues:   all sports with season phase, rendered in a dropdown.
 * Secondary: utility pages in the "More" dropdown.
 */
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

  // All sports, already sorted by activity (regular > postseason > preseason > offseason)
  const leagues: LeagueNavItem[] = getActiveSports(now).map(({ sport, phase, label }) => ({
    label: SPORT_LABELS[sport],
    href: SPORT_PATHS[sport],
    sport,
    phase,
    phaseLabel: label,
  }));

  const secondary: MainNavItem[] = [
    { label: 'Savant', href: '/college-baseball/savant' },
    { label: 'Portal', href: '/college-baseball/portal' },
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

