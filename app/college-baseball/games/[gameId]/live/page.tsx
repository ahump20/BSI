'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Linescore } from '@/components/college-baseball/Linescore';
import { PlayByPlay } from '@/components/college-baseball/PlayByPlay';
import { MatchupCard } from '@/components/college-baseball/MatchupCard';

/* ────────────────────────────────────────────────────────────
   Type Definitions
   ──────────────────────────────────────────────────────────── */

interface TeamLinescore {
  name: string;
  abbreviation: string;
  innings: number[];
  runs: number;
  hits: number;
  errors: number;
}

interface LinescoreData {
  away: TeamLinescore;
  home: TeamLinescore;
  currentInning: number;
  isTopInning: boolean;
}

interface PitcherStats {
  era: string;
  wins: number;
  so: number;
}

interface BatterStats {
  avg: string;
  hr: number;
  rbi: number;
}

interface Pitcher {
  name: string;
  stats: PitcherStats;
}

interface Batter {
  name: string;
  stats: BatterStats;
}

interface Play {
  inning: number;
  topBottom: 'top' | 'bottom';
  description: string;
  timestamp: string;
}

interface Game {
  id: string;
  status: 'pre' | 'live' | 'final';
  startTime: string;
  venue: string;
  linescore: LinescoreData;
  plays: Play[];
  matchup: {
    pitcher: Pitcher;
    batter: Batter;
  };
  meta: {
    source: string;
    fetched_at: string;
    timezone: string;
  };
}

/* ────────────────────────────────────────────────────────────
   Static Params (required for static export)
   ──────────────────────────────────────────────────────────── */

export function generateStaticParams(): { gameId: string }[] {
  return [];
}

/* ────────────────────────────────────────────────────────────
   Polling Interval
   ──────────────────────────────────────────────────────────── */

const POLL_INTERVAL_MS = 15_000;

/* ────────────────────────────────────────────────────────────
   Live Game Day Experience Page
   ──────────────────────────────────────────────────────────── */

export default function LiveGameDayPage() {
  const params = useParams<{ gameId: string }>();
  const gameId = params?.gameId;

  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchGame = useCallback(async () => {
    if (!gameId) return;
    try {
      const res = await fetch(`/api/college-baseball/game/${gameId}`);
      if (!res.ok) throw new Error(`Failed to fetch game data (${res.status})`);
      const data: Game = await res.json();
      setGame(data);
      setError(null);
      setLastUpdated(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'America/Chicago',
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  /* Initial fetch + polling */
  useEffect(() => {
    fetchGame();

    timerRef.current = setInterval(fetchGame, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchGame]);

  /* ── Loading State ────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-burnt-orange border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-sm text-white/60">Loading game data...</p>
        </div>
      </div>
    );
  }

  /* ── Error State ──────────────────────────────────────────── */
  if (error && !game) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center px-4">
        <div className="bg-charcoal-900 border border-red-500/30 rounded-lg p-8 max-w-md text-center">
          <h2 className="font-display text-xl font-bold uppercase text-red-400 mb-2">
            Game Unavailable
          </h2>
          <p className="text-white/60 text-sm mb-4">{error}</p>
          <button
            onClick={fetchGame}
            className="px-4 py-2 bg-burnt-orange text-white font-display text-sm uppercase tracking-wider rounded hover:bg-burnt-orange-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!game) return null;

  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';

  return (
    <main className="min-h-screen bg-midnight text-white">
      {/* ── Header Bar ───────────────────────────────────────── */}
      <header className="bg-charcoal border-b border-white/10 sticky top-0 z-sticky">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/college-baseball/games"
              className="text-white/40 hover:text-burnt-orange transition-colors text-sm"
            >
              &larr; Schedule
            </a>
            <span className="text-white/20">|</span>
            {isLive && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-glow" />
                <span className="font-display text-xs uppercase tracking-wider text-red-400">
                  Live
                </span>
              </span>
            )}
            {isFinal && (
              <span className="font-display text-xs uppercase tracking-wider text-white/50">
                Final
              </span>
            )}
            {game.status === 'pre' && (
              <span className="font-display text-xs uppercase tracking-wider text-burnt-orange">
                Pregame
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-white/40">
            {game.venue && <span>{game.venue}</span>}
            {lastUpdated && (
              <span className="font-mono">
                Updated {lastUpdated} CT
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Box Score Headline ───────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pt-8 pb-4">
        <div className="flex items-center justify-center gap-6 md:gap-12">
          {/* Away */}
          <div className="flex flex-col items-center gap-1">
            <span className="font-display text-lg md:text-2xl uppercase tracking-wider text-white/80">
              {game.linescore.away.abbreviation}
            </span>
            <span className="font-mono text-4xl md:text-6xl font-bold text-white">
              {game.linescore.away.runs}
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <span className="font-display text-xs uppercase tracking-widest text-white/30">
              {isLive
                ? `${game.linescore.isTopInning ? 'Top' : 'Bot'} ${game.linescore.currentInning}`
                : isFinal
                  ? 'Final'
                  : 'vs'}
            </span>
            <span className="text-burnt-orange text-2xl font-bold">@</span>
          </div>

          {/* Home */}
          <div className="flex flex-col items-center gap-1">
            <span className="font-display text-lg md:text-2xl uppercase tracking-wider text-white/80">
              {game.linescore.home.abbreviation}
            </span>
            <span className="font-mono text-4xl md:text-6xl font-bold text-white">
              {game.linescore.home.runs}
            </span>
          </div>
        </div>
      </section>

      {/* ── Linescore ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-4">
        <Linescore
          away={game.linescore.away}
          home={game.linescore.home}
          currentInning={isLive ? game.linescore.currentInning : undefined}
          isTopInning={isLive ? game.linescore.isTopInning : undefined}
        />
      </section>

      {/* ── Matchup + Play-by-Play Grid ──────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Matchup Card */}
          <div className="lg:col-span-1">
            <h3 className="font-display text-sm uppercase tracking-wider text-white/50 mb-3">
              Current Matchup
            </h3>
            <MatchupCard
              pitcher={game.matchup.pitcher}
              batter={game.matchup.batter}
            />
          </div>

          {/* Play-by-Play */}
          <div className="lg:col-span-2">
            <h3 className="font-display text-sm uppercase tracking-wider text-white/50 mb-3">
              Play-by-Play
            </h3>
            <PlayByPlay plays={game.plays} />
          </div>
        </div>
      </section>

      {/* ── Footer Attribution ───────────────────────────────── */}
      <footer className="max-w-6xl mx-auto px-4 py-8 border-t border-white/5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30">
          <span>
            Data: {game.meta.source} | Timezone: {game.meta.timezone}
          </span>
          <span className="font-mono">
            Fetched: {game.meta.fetched_at}
          </span>
        </div>
      </footer>
    </main>
  );
}
