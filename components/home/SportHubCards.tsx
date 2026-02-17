'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { SportIcon } from '@/components/icons/SportIcon';
import { isInSeason, getReturnMonth, type SportKey } from '@/lib/season';
import { normalizeGames, type GameScore } from '@/lib/scores/normalize';

interface SportHub {
  key: SportKey;
  name: string;
  href: string;
  accent: string;
  games: GameScore[];
  loading: boolean;
  error: boolean;
  inSeason: boolean;
}

const SPORT_CONFIG: Omit<SportHub, 'games' | 'loading' | 'error' | 'inSeason'>[] = [
  { key: 'ncaa', name: 'College Baseball', href: '/college-baseball', accent: '#BF5700' },
  { key: 'mlb', name: 'MLB', href: '/mlb', accent: '#C41E3A' },
  { key: 'nfl', name: 'NFL', href: '/nfl', accent: '#013369' },
  { key: 'nba', name: 'NBA', href: '/nba', accent: '#FF6B35' },
];

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

function getEndpoint(sport: string): string {
  const base = sport === 'ncaa' ? '/api/college-baseball' : `/api/${sport}`;
  return `${API_BASE}${sport === 'nba' ? `${base}/scoreboard` : `${base}/scores`}`;
}

function getNextMatchup(games: GameScore[]): string | null {
  // Prefer a ranked upcoming game for the preview
  const ranked = games.find((g) => !g.isLive && !g.isFinal && (g.away.rank || g.home.rank));
  const upcoming = ranked || games.find((g) => !g.isLive && !g.isFinal);
  if (!upcoming) return null;
  const away = upcoming.away.rank
    ? `#${upcoming.away.rank} ${upcoming.away.abbreviation || upcoming.away.name}`
    : upcoming.away.abbreviation || upcoming.away.name;
  const home = upcoming.home.rank
    ? `#${upcoming.home.rank} ${upcoming.home.abbreviation || upcoming.home.name}`
    : upcoming.home.abbreviation || upcoming.home.name;
  return `${away} vs ${home}`;
}

export function SportHubCards() {
  const now = new Date();

  const [hubs, setHubs] = useState<SportHub[]>(
    SPORT_CONFIG.map((c) => ({
      ...c,
      games: [],
      loading: isInSeason(c.key, now),
      error: false,
      inSeason: isInSeason(c.key, now),
    }))
  );
  const hubsRef = useRef(hubs);
  hubsRef.current = hubs;

  const fetchAll = useCallback(async () => {
    // Only fetch scores for in-season sports
    const inSeasonConfigs = SPORT_CONFIG.filter((c) => isInSeason(c.key));

    const results = await Promise.allSettled(
      inSeasonConfigs.map(async (config) => {
        const res = await fetch(getEndpoint(config.key));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { key: config.key, games: normalizeGames(config.key, data as Record<string, unknown>) };
      })
    );

    setHubs((prev) =>
      prev.map((hub) => {
        if (!hub.inSeason) return hub;
        const idx = inSeasonConfigs.findIndex((c) => c.key === hub.key);
        if (idx === -1) return hub;
        const result = results[idx];
        if (result.status === 'fulfilled') {
          return { ...hub, games: result.value.games, loading: false, error: false };
        }
        return { ...hub, loading: false, error: true };
      })
    );
  }, []);

  useEffect(() => {
    fetchAll();

    const getInterval = () => {
      const anyLive = hubsRef.current.some((h) => h.games.some((g) => g.isLive));
      return anyLive ? 30_000 : 60_000;
    };

    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(async () => {
        await fetchAll();
        schedule();
      }, getInterval());
    };
    schedule();

    return () => clearTimeout(timer);
  }, [fetchAll]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {hubs.map((hub) => {
        const liveCount = hub.games.filter((g) => g.isLive).length;
        const nextMatchup = getNextMatchup(hub.games);
        const isFlag = hub.key === 'ncaa';

        return (
          <Link
            key={hub.key}
            href={hub.href}
            className={`group ${isFlag ? 'sm:col-span-2 lg:col-span-2' : ''}`}
          >
            <div
              className={`glass-default rounded-2xl p-6 h-full flex flex-col gap-3 transition-all duration-300 border border-white/[0.06] hover:border-white/[0.12] card-accent-line hover:scale-[1.02] hover:-translate-y-1 ${
                hub.inSeason
                  ? 'hover:shadow-glow-sm'
                  : 'opacity-60'
              }`}
              style={{ '--card-accent': hub.accent } as React.CSSProperties}
            >
              {/* Icon + name */}
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${hub.accent}20`, color: hub.accent }}
                >
                  <SportIcon sport={hub.key} className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-white uppercase tracking-wide group-hover:text-[#FF6B35] transition-colors">
                    {hub.name}
                  </h3>
                  {isFlag && (
                    <span className="text-[10px] uppercase tracking-widest text-[#BF5700]/70 font-medium">
                      Flagship
                    </span>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="flex-1 flex flex-col justify-end gap-1.5">
                {!hub.inSeason ? (
                  <span className="text-xs text-white/30">
                    Returns {getReturnMonth(hub.key)}
                  </span>
                ) : hub.loading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-white/5 rounded w-2/3 animate-pulse" />
                    <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
                  </div>
                ) : hub.error ? (
                  <span className="text-xs text-white/30">Unavailable</span>
                ) : (
                  <>
                    {liveCount > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" role="status" aria-label={`${liveCount} ${hub.name} game${liveCount !== 1 ? 's' : ''} in progress`} />
                        <span className="text-sm font-semibold text-green-400">
                          {liveCount} LIVE
                        </span>
                      </div>
                    ) : hub.games.length > 0 ? (
                      <span className="text-xs text-white/40">
                        {hub.games.filter((g) => g.isFinal).length > 0
                          ? `${hub.games.filter((g) => g.isFinal).length} final today`
                          : `${hub.games.length} scheduled`}
                      </span>
                    ) : (
                      <span className="text-xs text-white/30">No games today</span>
                    )}

                    {nextMatchup && (
                      <span className="text-xs text-white/50 truncate">{nextMatchup}</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </Link>
        );
      })}

      {/* CFB */}
      <Link href="/cfb" className="group">
        <div
          className={`glass-default rounded-2xl p-6 h-full flex flex-col gap-3 transition-all duration-300 border border-white/[0.06] hover:border-white/[0.12] card-accent-line hover:scale-[1.02] hover:-translate-y-1 ${
            isInSeason('cfb') ? 'hover:shadow-glow-sm' : 'opacity-60'
          }`}
          style={{ '--card-accent': '#8B4513' } as React.CSSProperties}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(139,69,19,0.2)', color: '#8B4513' }}
            >
              <SportIcon sport="cfb" className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg text-white uppercase tracking-wide group-hover:text-[#FF6B35] transition-colors">CFB</h3>
          </div>
          <div className="flex-1 flex items-end">
            <span className="text-xs text-white/30">
              {isInSeason('cfb') ? 'Scores & Standings' : `Returns ${getReturnMonth('cfb')}`}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
