'use client';

import { useState } from 'react';

export type Sport = 'mlb' | 'nfl' | 'nba' | 'ncaa';

interface SportTabsProps {
  defaultSport?: Sport;
  onSportChange?: (sport: Sport) => void;
}

const sports: { id: Sport; name: string; icon: string; season: string }[] = [
  { id: 'mlb', name: 'MLB', icon: '⚾', season: 'Off-Season' },
  { id: 'nfl', name: 'NFL', icon: '🏈', season: 'In Season' },
  { id: 'nba', name: 'NBA', icon: '🏀', season: 'In Season' },
  { id: 'ncaa', name: 'NCAA', icon: '🎓', season: 'Various' },
];

export function SportTabs({ defaultSport = 'nfl', onSportChange }: SportTabsProps) {
  const [activeSport, setActiveSport] = useState<Sport>(defaultSport);

  const handleSportChange = (sport: Sport) => {
    setActiveSport(sport);
    onSportChange?.(sport);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {sports.map((sport) => (
        <button
          key={sport.id}
          onClick={() => handleSportChange(sport.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
            ${
              activeSport === sport.id
                ? 'bg-burnt-orange text-white shadow-glow-sm'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }
          `}
        >
          <span className="text-lg">{sport.icon}</span>
          <span>{sport.name}</span>
        </button>
      ))}
    </div>
  );
}

// Compact version for mobile
export function SportTabsCompact({ defaultSport = 'nfl', onSportChange }: SportTabsProps) {
  const [activeSport, setActiveSport] = useState<Sport>(defaultSport);

  const handleSportChange = (sport: Sport) => {
    setActiveSport(sport);
    onSportChange?.(sport);
  };

  return (
    <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
      {sports.map((sport) => (
        <button
          key={sport.id}
          onClick={() => handleSportChange(sport.id)}
          className={`
            flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-all
            ${
              activeSport === sport.id
                ? 'bg-burnt-orange text-white'
                : 'text-white/60 hover:text-white'
            }
          `}
        >
          <span>{sport.icon}</span>
          <span className="hidden sm:inline">{sport.name}</span>
        </button>
      ))}
    </div>
  );
}
