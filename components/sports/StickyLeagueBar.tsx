'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SPORT_LABELS, SPORT_PATHS, type SportKey } from '@/lib/season';

/** Ordered list of sports for the league bar. */
const LEAGUE_ORDER: SportKey[] = ['ncaa', 'mlb', 'nfl', 'nba', 'cfb'];

/** All sport path prefixes — used to determine if bar should render. */
const SPORT_PREFIXES = Object.values(SPORT_PATHS);

/**
 * Sticky sport-switching strip that sits directly below the Navbar.
 * Only renders on sport pages (paths starting with a known sport prefix).
 * Highlights the active sport with a burnt-orange bottom border.
 */
export function StickyLeagueBar() {
  const pathname = usePathname();

  // Hide on non-sport pages (homepage, arcade, nil-valuation, etc.)
  const onSportPage = SPORT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );
  if (!onSportPage) return null;

  return (
    <div className="sticky top-14 z-30 bg-midnight/95 backdrop-blur-md border-b border-white/10">
      <nav
        className="max-w-7xl mx-auto overflow-x-auto scrollbar-hide"
        role="navigation"
        aria-label="Sport navigation"
      >
        <ul className="flex items-center gap-1 px-4 min-w-max">
          {LEAGUE_ORDER.map((sport) => {
            const href = SPORT_PATHS[sport];
            const label = SPORT_LABELS[sport];
            const active =
              pathname === href || pathname.startsWith(href + '/');

            return (
              <li key={sport}>
                <Link
                  href={href}
                  className={`block px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                    active
                      ? 'border-[#BF5700] text-white'
                      : 'border-transparent text-white/50 hover:text-white/80'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
