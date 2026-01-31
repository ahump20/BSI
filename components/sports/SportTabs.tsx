'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export type Sport = 'mlb' | 'nfl' | 'nba' | 'ncaa';

interface SportTabsProps {
  defaultSport?: Sport;
  onSportChange?: (sport: Sport) => void;
}

const sports: { id: Sport; label: string; icon: string; color: string }[] = [
  { id: 'mlb', label: 'MLB', icon: '/icons/baseball.svg', color: '#C41E3A' },
  { id: 'nfl', label: 'NFL', icon: '/icons/football.svg', color: '#013369' },
  { id: 'nba', label: 'NBA', icon: '/icons/basketball.svg', color: '#1D428A' },
  { id: 'ncaa', label: 'NCAA', icon: '/icons/baseball.svg', color: '#BF5700' },
];

export function SportTabs({ defaultSport = 'mlb', onSportChange }: SportTabsProps) {
  const [active, setActive] = useState<Sport>(defaultSport);

  useEffect(() => {
    setActive(defaultSport);
  }, [defaultSport]);

  const handleChange = (sport: Sport) => {
    setActive(sport);
    onSportChange?.(sport);
  };

  return (
    <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
      {sports.map((sport) => (
        <button
          key={sport.id}
          onClick={() => handleChange(sport.id)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            active === sport.id
              ? 'bg-[#BF5700] text-white shadow-lg'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <Image src={sport.icon} alt="" width={18} height={18} className="opacity-80" />
          {sport.label}
        </button>
      ))}
    </div>
  );
}

export function SportTabsCompact({ defaultSport = 'mlb', onSportChange }: SportTabsProps) {
  const [active, setActive] = useState<Sport>(defaultSport);

  useEffect(() => {
    setActive(defaultSport);
  }, [defaultSport]);

  const handleChange = (sport: Sport) => {
    setActive(sport);
    onSportChange?.(sport);
  };

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {sports.map((sport) => (
        <button
          key={sport.id}
          onClick={() => handleChange(sport.id)}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
            active === sport.id
              ? 'bg-[#BF5700] text-white'
              : 'bg-white/5 text-white/40 hover:text-white/70'
          }`}
        >
          {sport.label}
        </button>
      ))}
    </div>
  );
}
