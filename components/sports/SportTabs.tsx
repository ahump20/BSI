'use client';

import { useState } from 'react';
import { SportIcon, type SportIconType } from '@/components/ui/SportIcon';

export type Sport = 'mlb' | 'nfl' | 'nba' | 'ncaa';

interface SportTabsProps {
  defaultSport?: Sport;
  onSportChange?: (sport: Sport) => void;
}

const sports: { id: Sport; name: string; icon: SportIconType; season: string }[] = [
  { id: 'mlb', name: 'MLB', icon: 'mlb', season: 'Off-Season' },
  { id: 'nfl', name: 'NFL', icon: 'nfl', season: 'In Season' },
  { id: 'nba', name: 'NBA', icon: 'nba', season: 'In Season' },
  { id: 'ncaa', name: 'NCAA', icon: 'ncaa', season: 'Various' },
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
          <SportIcon icon={sport.icon} size="sm" />
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
          <SportIcon icon={sport.icon} size="xs" />
          <span className="hidden sm:inline">{sport.name}</span>
        </button>
      ))}
    </div>
  );
}
