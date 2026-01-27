'use client';

import { useState } from 'react';
import { LiveScoresPanel } from '@/components/sports/LiveScoresPanel';
import type { Sport } from '@/components/sports/SportTabs';
import { SportIcon, type SportIconType } from '@/components/ui/SportIcon';

/**
 * Homepage live scores widget with sport-switching tabs
 * Defaults to NCAA (college baseball) per BSI sports priority
 */

const sports: { id: Sport; name: string; icon: SportIconType }[] = [
  { id: 'ncaa', name: 'College Baseball', icon: 'ncaa' },
  { id: 'mlb', name: 'MLB', icon: 'mlb' },
  { id: 'nfl', name: 'NFL', icon: 'nfl' },
  { id: 'nba', name: 'NBA', icon: 'nba' },
];

export function HomeLiveScores() {
  // Default to college baseball (BSI differentiator)
  const [activeSport, setActiveSport] = useState<Sport>('ncaa');

  return (
    <div className="w-full">
      {/* Sport Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {sports.map((sport) => (
          <button
            key={sport.id}
            onClick={() => setActiveSport(sport.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${
                activeSport === sport.id
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }
            `}
            aria-pressed={activeSport === sport.id}
          >
            <SportIcon icon={sport.icon} size="sm" />
            <span className="hidden sm:inline">{sport.name}</span>
          </button>
        ))}
      </div>

      {/* Live Scores Panel */}
      <LiveScoresPanel sport={activeSport} />
    </div>
  );
}
