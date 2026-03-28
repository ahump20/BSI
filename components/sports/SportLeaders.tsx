'use client';

import { useState, useEffect } from 'react';
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
  const config = sportConfigs[sport];

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    async function fetchLeaders() {
      setLoading(true);
      try {
        const res = await fetch(config.endpoint, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setLeaders(config.extractLeaders(data as Record<string, unknown>));
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setLeaders([]);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    }
    fetchLeaders();
    return () => { controller.abort(); clearTimeout(timeout); };
  }, [sport, config]);

  return (
    <div className={`bg-[var(--surface-press-box)] border border-[var(--border-vintage)] rounded-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--bsi-bone)]">{config.title}</h3>
        <Link
          href={config.viewAllHref}
          className="text-sm text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] transition-colors"
        >
          View All →
        </Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 bg-[var(--surface-press-box)] rounded-sm animate-pulse">
              <div className="h-3 bg-surface rounded-sm w-1/2 mb-2" />
              <div className="h-5 bg-surface rounded-sm w-3/4 mb-1" />
              <div className="h-7 bg-surface rounded-sm w-1/3" />
            </div>
          ))}
        </div>
      ) : leaders.length === 0 ? (
        <p className="text-[rgba(196,184,165,0.35)] text-sm text-center py-6">Leader stats update as games are played</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {leaders.map((player, index) => (
            <div
              key={`${player.name}-${index}`}
              className="p-4 bg-[var(--surface-press-box)] rounded-sm hover:bg-surface transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 flex items-center justify-center bg-[var(--bsi-primary)]/20 text-[var(--bsi-primary)] rounded-full text-xs font-bold">
                  {index + 1}
                </span>
                <span className="text-xs text-[rgba(196,184,165,0.35)]">{player.team}</span>
              </div>
              <p className="font-semibold text-[var(--bsi-bone)] text-sm truncate">{player.name}</p>
              <p className="text-2xl font-bold text-[var(--bsi-primary)]">
                {typeof player.value === 'number' ? player.value.toFixed(1) : player.value}
              </p>
              <p className="text-xs text-[rgba(196,184,165,0.35)]">{config.statLabel}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
