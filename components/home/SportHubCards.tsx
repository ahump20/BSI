'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { SportIcon } from '@/components/icons/SportIcon';
import { isInSeason, getReturnMonth, type SportKey } from '@/lib/season';

interface GameScore {
  id: string | number;
  away: { name: string; abbreviation?: string; score: number };
  home: { name: string; abbreviation?: string; score: number };
  status: string;
  isLive: boolean;
  isFinal: boolean;
  detail?: string;
  startTime?: string;
}

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

/**
 * Normalize game data from multiple API formats.
 * Handles: { games: [...] }, { scoreboard: { games: [...] } }, { data: [...events] }
 */
function normalizeGames(sport: string, data: Record<string, unknown>): GameScore[] {
  const scoreboard = data.scoreboard as Record<string, unknown> | undefined;

  // College baseball raw ESPN format: { data: [...events] }
  const rawData = data.data as Record<string, unknown>[] | undefined;
  if (Array.isArray(rawData) && rawData.length > 0 && rawData[0].competitions) {
    return rawData.map((event, i) => {
      const competitions = event.competitions as Record<string, unknown>[] | undefined;
      const comp = competitions?.[0] as Record<string, unknown> | undefined;
      const competitors = (comp?.competitors || []) as Record<string, unknown>[];

      const homeComp = competitors.find((c) => c.homeAway === 'home');
      const awayComp = competitors.find((c) => c.homeAway === 'away');
      const homeTeam = (homeComp?.team || {}) as Record<string, unknown>;
      const awayTeam = (awayComp?.team || {}) as Record<string, unknown>;

      const status = (comp?.status || event.status || {}) as Record<string, unknown>;
      const statusType = status?.type as Record<string, unknown> | undefined;

      return {
        id: (event.id as string | number) || i,
        away: {
          name: (awayTeam.displayName as string) || (awayTeam.name as string) || 'Away',
          abbreviation: (awayTeam.abbreviation as string) || (awayTeam.shortDisplayName as string) || '',
          score: Number(awayComp?.score ?? 0),
        },
        home: {
          name: (homeTeam.displayName as string) || (homeTeam.name as string) || 'Home',
          abbreviation: (homeTeam.abbreviation as string) || (homeTeam.shortDisplayName as string) || '',
          score: Number(homeComp?.score ?? 0),
        },
        status: (statusType?.shortDetail as string) || (statusType?.description as string) || 'Scheduled',
        isLive: statusType?.state === 'in',
        isFinal: statusType?.state === 'post' || statusType?.completed === true,
        detail: undefined,
        startTime: (statusType?.shortDetail as string) || undefined,
      };
    });
  }

  // Transformed/scoreboard format
  const rawGames = (data.games || scoreboard?.games || []) as Record<string, unknown>[];
  return rawGames.map((g: Record<string, unknown>, i: number) => {
    const rawTeams = g.teams as Record<string, unknown>[] | Record<string, Record<string, unknown>> | undefined;
    let homeEntry: Record<string, unknown> | undefined;
    let awayEntry: Record<string, unknown> | undefined;

    if (Array.isArray(rawTeams)) {
      homeEntry = rawTeams.find((t) => t.homeAway === 'home');
      awayEntry = rawTeams.find((t) => t.homeAway === 'away');
    } else if (rawTeams) {
      homeEntry = rawTeams.home as Record<string, unknown> | undefined;
      awayEntry = rawTeams.away as Record<string, unknown> | undefined;
    }

    const homeTeam = (homeEntry?.team as Record<string, unknown>) || homeEntry || {};
    const awayTeam = (awayEntry?.team as Record<string, unknown>) || awayEntry || {};

    const status = g.status as Record<string, unknown> | string | undefined;
    const statusType =
      typeof status === 'object' ? (status?.type as Record<string, unknown> | undefined) : undefined;

    const isLive =
      typeof status === 'object'
        ? statusType?.state === 'in' || status?.isLive === true
        : typeof status === 'string' && status.toLowerCase().includes('in progress');

    const isFinal =
      typeof status === 'object'
        ? status?.isFinal === true || statusType?.state === 'post'
        : typeof status === 'string' && status.toLowerCase().includes('final');

    const statusText =
      typeof status === 'object'
        ? (status?.detailedState as string) || (statusType?.description as string) || 'Scheduled'
        : (status as string) || 'Scheduled';

    const startTime =
      typeof status === 'object' ? (status?.startTime as string) || (statusType?.shortDetail as string) : undefined;

    return {
      id: (g.id as string | number) || i,
      away: {
        name: (awayTeam.displayName as string) || (awayTeam.name as string) || 'Away',
        abbreviation: (awayTeam.abbreviation as string) || (awayTeam.shortDisplayName as string) || '',
        score: Number(awayEntry?.score ?? 0),
      },
      home: {
        name: (homeTeam.displayName as string) || (homeTeam.name as string) || 'Home',
        abbreviation: (homeTeam.abbreviation as string) || (homeTeam.shortDisplayName as string) || '',
        score: Number(homeEntry?.score ?? 0),
      },
      status: statusText,
      isLive: Boolean(isLive),
      isFinal: Boolean(isFinal),
      detail:
        typeof status === 'object' && status?.inning
          ? `${status?.inningState ?? ''} ${status.inning}`
          : undefined,
      startTime: startTime || undefined,
    };
  });
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

function getEndpoint(sport: string): string {
  const base = sport === 'ncaa' ? '/api/college-baseball' : `/api/${sport}`;
  return `${API_BASE}${sport === 'nba' ? `${base}/scoreboard` : `${base}/scores`}`;
}

function getNextMatchup(games: GameScore[]): string | null {
  const upcoming = games.find((g) => !g.isLive && !g.isFinal);
  if (!upcoming) return null;
  const away = upcoming.away.abbreviation || upcoming.away.name;
  const home = upcoming.home.abbreviation || upcoming.home.name;
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
              className={`glass-default rounded-2xl p-6 h-full flex flex-col gap-3 transition-all duration-300 border border-white/[0.06] hover:border-white/[0.12] ${
                hub.inSeason
                  ? 'hover:shadow-glow-sm'
                  : 'opacity-60'
              }`}
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
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
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
          className={`glass-default rounded-2xl p-6 h-full flex flex-col gap-3 transition-all duration-300 border border-white/[0.06] hover:border-white/[0.12] ${
            isInSeason('cfb') ? 'hover:shadow-glow-sm' : 'opacity-60'
          }`}
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
