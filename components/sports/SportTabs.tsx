'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export type Sport = 'mlb' | 'nfl' | 'nba' | 'ncaa';

interface SportTabsProps {
  defaultSport?: Sport;
  onSportChange?: (sport: Sport) => void;
}

const sports: { id: Sport; label: string; icon: string; color: string; dataSport: string }[] = [
  { id: 'mlb', label: 'MLB', icon: '/icons/baseball.svg', color: 'var(--bsi-primary)', dataSport: 'mlb' },
  { id: 'nfl', label: 'NFL', icon: '/icons/football.svg', color: 'var(--sport-accent)', dataSport: 'nfl' },
  { id: 'nba', label: 'NBA', icon: '/icons/basketball.svg', color: 'var(--sport-accent)', dataSport: 'nba' },
  { id: 'ncaa', label: 'NCAA', icon: '/icons/baseball.svg', color: 'var(--bsi-primary)', dataSport: 'college-baseball' },
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
    <div className="flex gap-2 p-1 bg-[var(--surface-press-box)] rounded-[2px]">
      {sports.map((sport) => (
        <button
          key={sport.id}
          data-sport={sport.dataSport}
          onClick={() => handleChange(sport.id)}
          className={`flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-[2px] text-sm font-semibold transition-all ${
            active === sport.id
              ? 'bg-[var(--bsi-primary)] text-white shadow-lg'
              : 'text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)]'
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
          data-sport={sport.dataSport}
          onClick={() => handleChange(sport.id)}
          className={`px-4 py-2 min-h-[44px] rounded-[2px] text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
            active === sport.id
              ? 'bg-[var(--bsi-primary)] text-white'
              : 'bg-[var(--surface-press-box)] text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-dust)]'
          }`}
        >
          {sport.label}
        </button>
      ))}
    </div>
  );
}
