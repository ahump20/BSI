'use client';

import { useState } from 'react';
import { LiveScoresPanel } from '@/components/sports/LiveScoresPanel';
import type { Sport } from '@/components/sports/SportTabs';

/**
 * Homepage live scores widget with sport-switching tabs
 * Defaults to NCAA (college baseball) per BSI sports priority
 */

const sports: { id: Sport; name: string; icon: string }[] = [
  { id: 'ncaa', name: 'College Baseball', icon: '🎓' },
  { id: 'mlb', name: 'MLB', icon: '⚾' },
  { id: 'nfl', name: 'NFL', icon: '🏈' },
  { id: 'nba', name: 'NBA', icon: '🏀' },
];

export function HomeLiveScores() {
  // Default to college baseball (BSI differentiator)
  const [activeSport, setActiveSport] = useState<Sport>('ncaa');

  return (
    <div className="glass-elevated rounded-2xl p-6 md:p-8 relative overflow-hidden">
      {/* Gradient top accent border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #BF5700, #FF6B35, #FDB913, transparent)' }}
      />

      {/* Sport Tabs — Raycast pill style */}
      <div className="flex flex-wrap gap-2 mb-6">
        {sports.map((sport) => (
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
            <span>{sport.icon}</span>
            <span className="hidden sm:inline">{sport.name}</span>
          </button>
        ))}
      </div>

      {/* Live Scores Panel */}
      <LiveScoresPanel sport={activeSport} />
    </div>
  );
}
