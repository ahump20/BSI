'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { SportIcon } from '@/components/icons/SportIcon';

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
  key: 'ncaa' | 'mlb' | 'nfl' | 'nba';
  name: string;
  href: string;
  accent: string;
  games: GameScore[];
  loading: boolean;
  error: boolean;
}

const SPORT_CONFIG: Omit<SportHub, 'games' | 'loading' | 'error'>[] = [
  { key: 'ncaa', name: 'College Baseball', href: '/college-baseball', accent: '#BF5700' },
  { key: 'mlb', name: 'MLB', href: '/mlb', accent: '#C41E3A' },
  { key: 'nfl', name: 'NFL', href: '/nfl', accent: '#013369' },
  { key: 'nba', name: 'NBA', href: '/nba', accent: '#FF6B35' },
];

function normalizeGames(sport: string, data: Record<string, unknown>): GameScore[] {
  const scoreboard = data.scoreboard as Record<string, unknown> | undefined;
  const rawGames = (data.games || scoreboard?.games || []) as Record<string, unknown>[];
  return rawGames.map((g: Record<string, unknown>, i: number) => {
    // ESPN returns teams as array with homeAway field, or as { home, away } object
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

// TODO (Austin): This is where you decide how to display the "next matchup"
// when there are no live games. Options to consider:
// - Show the next scheduled game's teams + start time
// - Show "No games today" in off-season
// - Show last final score as a fallback
// The function signature and data are ready — just fill in the display logic.
function getNextMatchup(games: GameScore[]): string | null {
  const upcoming = games.find((g) => !g.isLive && !g.isFinal);
  if (!upcoming) return null;
  const away = upcoming.away.abbreviation || upcoming.away.name;
  const home = upcoming.home.abbreviation || upcoming.home.name;
  return `${away} vs ${home}`;
}

export function SportHubCards() {
  const [hubs, setHubs] = useState<SportHub[]>(
    SPORT_CONFIG.map((c) => ({ ...c, games: [], loading: true, error: false }))
  );
  const hubsRef = useRef(hubs);
  hubsRef.current = hubs;

  const fetchAll = useCallback(async () => {
    const results = await Promise.allSettled(
      SPORT_CONFIG.map(async (config) => {
        const res = await fetch(getEndpoint(config.key));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return normalizeGames(config.key, data as Record<string, unknown>);
      })
    );

    setHubs((prev) =>
      prev.map((hub, i) => {
        const result = results[i];
        if (result.status === 'fulfilled') {
          return { ...hub, games: result.value, loading: false, error: false };
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {hubs.map((hub) => {
        const liveCount = hub.games.filter((g) => g.isLive).length;
        const nextMatchup = getNextMatchup(hub.games);

        return (
          <Link key={hub.key} href={hub.href} className="group">
            <div className="glass-card-hover p-5 h-full flex flex-col gap-3">
              {/* Icon + name */}
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${hub.accent}20`, color: hub.accent }}
                >
                  <SportIcon sport={hub.key} className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg text-white uppercase tracking-wide group-hover:text-[#BF5700] transition-colors">
                  {hub.name}
                </h3>
              </div>

              {/* Status */}
              <div className="flex-1 flex flex-col justify-end gap-1.5">
                {hub.loading ? (
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

      <Link href="/cfb" className="group">
        <div className="glass-card-hover p-5 h-full flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(139,69,19,0.2)', color: '#8B4513' }}
            >
              <SportIcon sport="cfb" className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg text-white uppercase tracking-wide group-hover:text-[#BF5700] transition-colors">
              CFB
            </h3>
          </div>
          <div className="flex-1 flex items-end">
            <span className="px-2 py-0.5 text-xs font-semibold bg-green-500/20 text-green-400 rounded-full">
              Active
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
