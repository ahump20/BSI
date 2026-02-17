import { isPresenceCoachEnabled } from './feature-flags';
import {
  getSeasonPhase,
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
  const allSports: SportKey[] = ['ncaa', 'mlb', 'nfl', 'nba', 'cfb'];

  const primary: MainNavItem[] = [
    { label: 'Live', href: '/scores' },
    { label: 'Intel', href: '/intel' },
    { label: 'Models', href: '/models' },
    { label: 'Pricing', href: '/pricing' },
  ];

  // All sports go into the Leagues dropdown, sorted by activity
  const leagues: LeagueNavItem[] = allSports.map((sport) => {
    const season = getSeasonPhase(sport, now);
    return {
      label: SPORT_LABELS[sport],
      href: SPORT_PATHS[sport],
      sport,
      phase: season.phase,
      phaseLabel: season.label,
    };
  });

  // Sort: active sports first (regular > postseason > preseason > offseason)
  const phaseOrder: Record<SeasonPhase, number> = {
    regular: 0,
    postseason: 1,
    preseason: 2,
    offseason: 3,
  };
  leagues.sort((a, b) => phaseOrder[a.phase] - phaseOrder[b.phase]);

  const secondary: MainNavItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Glossary', href: '/glossary' },
    { label: 'Data Sources', href: '/models/data-quality' },
    { label: 'Arcade', href: '/arcade' },
    { label: 'About', href: '/about' },
    ...(isPresenceCoachEnabled() ? [{ label: 'Presence Coach', href: '/presence-coach' }] : []),
  ];

  return { primary, leagues, secondary };
}

/**
 * Legacy export — flat list of all nav items.
 * Used by components that haven't migrated to the primary/leagues/secondary split yet.
 */
export const mainNavItems: MainNavItem[] = [
  { label: 'Live', href: '/scores' },
  { label: 'Intel', href: '/intel' },
  { label: 'Models', href: '/models' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NFL', href: '/nfl' },
  { label: 'NBA', href: '/nba' },
  { label: 'CFB', href: '/cfb' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Glossary', href: '/glossary' },
  ...(isPresenceCoachEnabled() ? [{ label: 'Presence Coach', href: '/presence-coach' }] : []),
  { label: 'Arcade', href: '/arcade' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
];
