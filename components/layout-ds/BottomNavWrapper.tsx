'use client';

import { useMemo } from 'react';
import { BottomNav } from '@/components/sports';
import { isInSeason, SPORT_LABELS, SPORT_PATHS, type SportKey } from '@/lib/season';

/**
 * Season-aware bottom nav for mobile.
 * Shows Home + up to 4 in-season sports. Falls back to defaults if fewer than 4 are active.
 */
export function BottomNavWrapper() {
  const items = useMemo(() => {
    const now = new Date();
    const allSports: SportKey[] = ['ncaa', 'mlb', 'nba', 'nfl', 'cfb'];
    const active = allSports.filter((s) => isInSeason(s, now));

    // If fewer than 3 in-season, add off-season sports to fill
    const pool = active.length >= 3
      ? active
      : [...active, ...allSports.filter((s) => !active.includes(s))];

    const sportItems = pool.slice(0, 4).map((s) => ({
      label: SPORT_LABELS[s],
      href: SPORT_PATHS[s],
    }));

    return [{ label: 'Home', href: '/' }, ...sportItems];
  }, []);

  return <BottomNav items={items} className="md:hidden" />;
}
