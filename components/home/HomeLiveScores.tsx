'use client';

import { useState, useMemo } from 'react';
import { LiveScoresPanel } from '@/components/sports/LiveScoresPanel';
import type { Sport } from '@/components/sports/SportTabs';
import { getActiveSports, type SportKey } from '@/lib/season';

/**
 * Homepage live scores widget with sport-switching tabs.
 * Only shows tabs for in-season sports — no empty "No games today" for off-season sports.
 */

const SPORT_MAP: Record<SportKey, { id: Sport; name: string }> = {
  ncaa: { id: 'ncaa', name: 'College Baseball' },
  mlb: { id: 'mlb', name: 'MLB' },
  nfl: { id: 'nfl', name: 'NFL' },
  nba: { id: 'nba', name: 'NBA' },
  cfb: { id: 'ncaa', name: 'CFB' }, // CFB doesn't have a separate scoreboard
};

export function HomeLiveScores() {
  const activeSports = useMemo(() => {
    const all = getActiveSports();
    // Only show sports that are in-season and have a scoreboard
    const inSeason = all
      .filter((s) => s.phase !== 'offseason' && s.sport !== 'cfb') // CFB shares NCAA endpoint
      .map((s) => SPORT_MAP[s.sport])
      .filter(Boolean);

    // Always have at least college baseball + one more
    if (inSeason.length === 0) {
      return [SPORT_MAP.ncaa, SPORT_MAP.mlb];
    }

    // Ensure college baseball is first (BSI flagship)
    const ncaaIdx = inSeason.findIndex((s) => s.id === 'ncaa');
    if (ncaaIdx > 0) {
      const [ncaa] = inSeason.splice(ncaaIdx, 1);
      inSeason.unshift(ncaa);
    }

    return inSeason;
  }, []);

  // Default to college baseball — BSI's flagship sport
  const [activeSport, setActiveSport] = useState<Sport>('ncaa');

  return (
    <div className="glass-elevated rounded-2xl p-6 md:p-8 relative overflow-hidden">
      {/* Gradient top accent border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #BF5700, #FF6B35, #FDB913, transparent)' }}
      />

      {/* Sport Tabs — pill style */}
      <div className="flex flex-wrap gap-2 mb-6">
        {activeSports.map((sport) => (
          <button
            key={sport.id}
            onClick={() => setActiveSport(sport.id)}
            className={`
              flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
              ${
                activeSport === sport.id
                  ? 'text-white shadow-glow-sm'
                  : 'glass-subtle text-white/60 hover:text-white hover:bg-white/10'
              }
            `}
            style={
              activeSport === sport.id
                ? { background: 'linear-gradient(135deg, #BF5700, #FF6B35)' }
                : undefined
            }
            aria-pressed={activeSport === sport.id}
          >
            <span className="hidden sm:inline">{sport.name}</span>
            <span className="sm:hidden">{sport.name === 'College Baseball' ? 'CBB' : sport.name}</span>
          </button>
        ))}
      </div>

      {/* Live Scores Panel */}
      <LiveScoresPanel sport={activeSport} />
    </div>
  );
}
