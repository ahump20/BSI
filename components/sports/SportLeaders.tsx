'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Sport } from './SportTabs';

interface Leader {
  name: string;
  team: string;
  value: number | string;
  position?: string;
}

interface SportLeadersConfig {
  title: string;
  statLabel: string;
  endpoint: string;
  viewAllHref: string;
  extractLeaders: (data: Record<string, unknown>) => Leader[];
}

const sportConfigs: Record<Sport, SportLeadersConfig> = {
  mlb: {
    title: 'WAR Leaders',
    statLabel: 'WAR',
    endpoint: '/api/mlb/leaderboards/batting?limit=5',
    viewAllHref: '/mlb/players',
    extractLeaders: (data) => {
      const leaders = (data.leaders || []) as Record<string, unknown>[];
      return leaders.map((p) => ({
        name: (p.name || p.Name || '') as string,
        team: (p.team || p.Team || '') as string,
        value: Number(p.war || p.WAR || 0),
        position: p.position as string | undefined,
      }));
    },
  },
  nfl: {
    title: 'Passing Yards Leaders',
    statLabel: 'YDS',
    endpoint: '/api/nfl/stats/leaders?category=passing&stat=yards',
    viewAllHref: '/nfl/players',
    extractLeaders: (data) => {
      const leaders = (data.leaders || data.athletes || []) as Record<string, unknown>[];
      return leaders.slice(0, 5).map((p) => ({
        name: (p.name || p.displayName || '') as string,
        team: (p.team || p.teamAbbreviation || '') as string,
        value: (p.value || p.stat || p.yards || 0) as number | string,
        position: (p.position || 'QB') as string,
      }));
    },
  },
  nba: {
    title: 'Points Per Game Leaders',
    statLabel: 'PPG',
    endpoint: '/api/nba/stats/leaders?category=scoring',
    viewAllHref: '/nba/players',
    extractLeaders: (data) => {
      const leaders = (data.leaders || data.athletes || []) as Record<string, unknown>[];
      return leaders.slice(0, 5).map((p) => ({
        name: (p.name || p.displayName || '') as string,
        team: (p.team || p.teamAbbreviation || '') as string,
        value: (p.value || p.stat || p.ppg || 0) as number | string,
        position: p.position as string | undefined,
      }));
    },
  },
  ncaa: {
    title: 'Batting Average Leaders',
    statLabel: 'AVG',
    endpoint: '/api/college-baseball/players?sort=avg&limit=5',
    viewAllHref: '/college-baseball/players',
    extractLeaders: (data) => {
      const leaders = (data.players || data.leaders || []) as Record<string, unknown>[];
      return leaders.slice(0, 5).map((p) => ({
        name: (p.name || p.displayName || '') as string,
        team: (p.team || p.school || '') as string,
        value: (p.avg || p.battingAverage || p.value || 0) as number | string,
        position: p.position as string | undefined,
      }));
    },
  },
};

interface SportLeadersProps {
  sport: Sport;
  className?: string;
}

export function SportLeaders({ sport, className = '' }: SportLeadersProps) {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const config = useMemo(() => sportConfigs[sport], [sport]);

  useEffect(() => {
    async function fetchLeaders() {
      setLoading(true);
      try {
        const res = await fetch(config.endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setLeaders(config.extractLeaders(data as Record<string, unknown>));
      } catch {
        setLeaders([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaders();
  }, [sport, config]);

  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{config.title}</h3>
        <Link
          href={config.viewAllHref}
          className="text-sm text-[#BF5700] hover:text-[#FF6B35] transition-colors"
        >
          View All →
        </Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-lg animate-pulse">
              <div className="h-3 bg-white/10 rounded w-1/2 mb-2" />
              <div className="h-5 bg-white/10 rounded w-3/4 mb-1" />
              <div className="h-7 bg-white/10 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : leaders.length === 0 ? (
        <p className="text-white/30 text-sm text-center py-6">No leader data available</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {leaders.map((player, index) => (
            <div
              key={`${player.name}-${index}`}
              className="p-4 bg-white/5 rounded-lg hover:bg-white/8 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 flex items-center justify-center bg-[#BF5700]/20 text-[#BF5700] rounded-full text-xs font-bold">
                  {index + 1}
                </span>
                <span className="text-xs text-white/40">{player.team}</span>
              </div>
              <p className="font-semibold text-white text-sm truncate">{player.name}</p>
              <p className="text-2xl font-bold text-[#BF5700]">
                {typeof player.value === 'number' ? player.value.toFixed(1) : player.value}
              </p>
              <p className="text-xs text-white/30">{config.statLabel}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
