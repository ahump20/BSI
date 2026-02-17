'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, LiveBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton } from '@/components/ui/Skeleton';
import { CitationFooter } from '@/components/sports';

// ============================================================================
// TYPES
// ============================================================================

interface BattingLine {
  player: { id: string; name: string; position: string; year?: string };
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  so: number;
  avg: string;
}

interface PitchingLine {
  player: { id: string; name: string; year?: string };
  decision?: 'W' | 'L' | 'S' | 'H' | 'BS';
  ip: string;
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
  pitches?: number;
  strikes?: number;
  era: string;
}

interface Play {
  id: string;
  inning: number;
  halfInning: 'top' | 'bottom';
  description: string;
  result: string;
  isScoring: boolean;
  runsScored: number;
  scoreAfter: { away: number; home: number };
}

export interface CollegeGameData {
  id: string;
  date: string;
  status: {
    state: string;
    detailedState: string;
    inning?: number;
    inningState?: string;
    isLive: boolean;
    isFinal: boolean;
  };
  teams: {
    away: {
      name: string;
      abbreviation: string;
      score: number;
      isWinner: boolean;
      record?: string;
      conference?: string;
      ranking?: number;
    };
    home: {
      name: string;
      abbreviation: string;
      score: number;
      isWinner: boolean;
      record?: string;
      conference?: string;
      ranking?: number;
    };
  };
  venue: { name: string; city?: string; state?: string };
  linescore?: {
    innings: Array<{ away: number; home: number }>;
    totals: {
      away: { runs: number; hits: number; errors: number };
      home: { runs: number; hits: number; errors: number };
    };
  };
  boxscore?: {
    away: { batting: BattingLine[]; pitching: PitchingLine[] };
    home: { batting: BattingLine[]; pitching: PitchingLine[] };
  };
  plays?: Play[];
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
  timezone: string;
}

interface GameApiResponse {
  game?: CollegeGameData;
  meta?: DataMeta;
}

interface GameContextValue {
  game: CollegeGameData | null;
  loading: boolean;
  error: string | null;
  meta: DataMeta | null;
  refresh: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const GameContext = createContext<GameContextValue | null>(null);

export function useGameData() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameData must be used within a CollegeGameDetailLayout');
  }
  return context;
}

// ============================================================================
// HELPERS
// ============================================================================

function _formatTimestamp(isoString?: string): string {
  const date = isoString ? new Date(isoString) : new Date();
  return (
    date.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }) + ' CT'
  );
}

// ============================================================================
// LAYOUT COMPONENT
// ============================================================================

interface GameLayoutClientProps {
  children: ReactNode;
}

export default function GameLayoutClient({ children }: GameLayoutClientProps) {
  const params = useParams();
  const pathname = usePathname();
  const gameId = params?.gameId as string;

  const [game, setGame] = useState<CollegeGameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DataMeta | null>(null);

  const fetchGame = useCallback(async () => {
    if (!gameId) return;

    try {
      const res = await fetch(`/api/college-baseball/game/${gameId}`);
      if (!res.ok) throw new Error('Failed to fetch game data');
      const data = (await res.json()) as GameApiResponse;

      if (data.game) {
        setGame(data.game);
      }
      if (data.meta) {
        setMeta(data.meta);
      }
      setLoading(false);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    setLoading(true);
    fetchGame();
  }, [fetchGame]);

  // Auto-refresh for live games
  useEffect(() => {
    if (game?.status.isLive) {
      const interval = setInterval(fetchGame, 30000);
      return () => clearInterval(interval);
    }
  }, [game?.status.isLive, fetchGame]);

  // Tab navigation
  const tabs = [
    { id: 'summary', label: 'Summary', href: `/college-baseball/game/${gameId}` },
    { id: 'live', label: 'Game Day', href: `/college-baseball/game/${gameId}/live` },
    { id: 'box-score', label: 'Box Score', href: `/college-baseball/game/${gameId}/box-score` },
    {
      id: 'play-by-play',
      label: 'Play-by-Play',
      href: `/college-baseball/game/${gameId}/play-by-play`,
    },
    { id: 'team-stats', label: 'Team Stats', href: `/college-baseball/game/${gameId}/team-stats` },
    { id: 'recap', label: 'Recap', href: `/college-baseball/game/${gameId}/recap` },
  ];

  const getActiveTab = () => {
    if (pathname?.includes('/live')) return 'live';
    if (pathname?.includes('/box-score')) return 'box-score';
    if (pathname?.includes('/play-by-play')) return 'play-by-play';
    if (pathname?.includes('/team-stats')) return 'team-stats';
    if (pathname?.includes('/recap')) return 'recap';
    return 'summary';
  };

  const activeTab = getActiveTab();

  return (
    <GameContext.Provider value={{ game, loading, error, meta, refresh: fetchGame }}>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/college-baseball"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                College Baseball
              </Link>
              <span className="text-text-tertiary">/</span>
              <Link
                href="/college-baseball/scores"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                Scores
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">
                {game
                  ? `${game.teams.away.abbreviation} @ ${game.teams.home.abbreviation}`
                  : `Game ${gameId}`}
              </span>
            </nav>
          </Container>
        </Section>

        {loading ? (
          <Section padding="lg" background="charcoal">
            <Container>
              <div className="space-y-6">
                <Skeleton variant="text" width={300} height={40} />
                <Skeleton variant="rectangular" width="100%" height={150} />
                <Skeleton variant="rectangular" width="100%" height={400} />
              </div>
            </Container>
          </Section>
        ) : error ? (
          <Section padding="lg" background="charcoal">
            <Container>
              <Card variant="default" padding="lg" className="bg-error/10 border-error/30">
                <p className="text-error font-semibold">Unable to Load Game</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
                <p className="text-text-tertiary text-xs mt-2">
                  College baseball data can be spotty—try again in a moment.
                </p>
                <button
                  onClick={fetchGame}
                  className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors"
                >
                  Try Again
                </button>
              </Card>
            </Container>
          </Section>
        ) : game ? (
          <>
            {/* Game Header */}
            <Section padding="md" className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
              <Container>
                <ScrollReveal>
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <Badge variant="secondary">
                      {new Date(game.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Badge>
                    {game.status.isLive && <LiveBadge />}
                    {game.teams.away.conference && (
                      <Badge variant="outline">{game.teams.away.conference}</Badge>
                    )}
                  </div>

                  {/* Scoreboard */}
                  <div className="flex items-center justify-center gap-8 md:gap-16 py-6">
                    {/* Away Team */}
                    <div className="text-center">
                      <div className="w-16 h-16 bg-charcoal rounded-full flex items-center justify-center text-xl font-bold text-burnt-orange mx-auto mb-2 relative">
                        {game.teams.away.abbreviation}
                        {game.teams.away.ranking && (
                          <span className="absolute -top-1 -right-1 w-6 h-6 bg-burnt-orange text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {game.teams.away.ranking}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-white">{game.teams.away.name}</p>
                      <p className="text-xs text-text-tertiary">{game.teams.away.record || ''}</p>
                      <p
                        className={`text-4xl font-bold font-mono mt-2 ${
                          game.status.isFinal && game.teams.away.isWinner
                            ? 'text-white'
                            : 'text-text-secondary'
                        }`}
                      >
                        {game.teams.away.score}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="text-center">
                      {game.status.isLive ? (
                        <span className="flex items-center justify-center gap-1.5 text-success font-semibold">
                          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                          {game.status.inningState} {game.status.inning}
                        </span>
                      ) : game.status.isFinal ? (
                        <span className="text-text-tertiary font-semibold">FINAL</span>
                      ) : (
                        <span className="text-burnt-orange font-semibold">
                          {game.status.detailedState}
                        </span>
                      )}
                      <p className="text-xs text-text-tertiary mt-1">{game.venue?.name}</p>
                    </div>

                    {/* Home Team */}
                    <div className="text-center">
                      <div className="w-16 h-16 bg-charcoal rounded-full flex items-center justify-center text-xl font-bold text-burnt-orange mx-auto mb-2 relative">
                        {game.teams.home.abbreviation}
                        {game.teams.home.ranking && (
                          <span className="absolute -top-1 -right-1 w-6 h-6 bg-burnt-orange text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {game.teams.home.ranking}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-white">{game.teams.home.name}</p>
                      <p className="text-xs text-text-tertiary">{game.teams.home.record || ''}</p>
                      <p
                        className={`text-4xl font-bold font-mono mt-2 ${
                          game.status.isFinal && game.teams.home.isWinner
                            ? 'text-white'
                            : 'text-text-secondary'
                        }`}
                      >
                        {game.teams.home.score}
                      </p>
                    </div>
                  </div>

                  {/* Linescore Preview (compact) */}
                  {game.linescore && (
                    <Card variant="default" padding="sm" className="mt-4 max-w-2xl mx-auto">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border-subtle text-text-tertiary">
                              <th className="text-left p-1.5 w-12">Team</th>
                              {Array.from(
                                { length: Math.max(game.linescore.innings.length, 9) },
                                (_, i) => (
                                  <th key={i} className="text-center p-1.5 w-5">
                                    {i + 1}
                                  </th>
                                )
                              )}
                              <th className="text-center p-1.5 w-6 border-l border-border-subtle text-burnt-orange font-bold">
                                R
                              </th>
                              <th className="text-center p-1.5 w-6">H</th>
                              <th className="text-center p-1.5 w-6">E</th>
                            </tr>
                          </thead>
                          <tbody className="text-text-secondary">
                            <tr className="border-b border-border-subtle">
                              <td className="p-1.5 font-semibold text-white">
                                {game.teams.away.abbreviation}
                              </td>
                              {Array.from(
                                { length: Math.max(game.linescore.innings.length, 9) },
                                (_, i) => (
                                  <td key={i} className="text-center p-1.5 font-mono">
                                    {game.linescore?.innings[i]?.away ?? '-'}
                                  </td>
                                )
                              )}
                              <td className="text-center p-1.5 font-mono font-bold text-white border-l border-border-subtle">
                                {game.linescore.totals.away.runs}
                              </td>
                              <td className="text-center p-1.5 font-mono">
                                {game.linescore.totals.away.hits}
                              </td>
                              <td className="text-center p-1.5 font-mono">
                                {game.linescore.totals.away.errors}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-1.5 font-semibold text-white">
                                {game.teams.home.abbreviation}
                              </td>
                              {Array.from(
                                { length: Math.max(game.linescore.innings.length, 9) },
                                (_, i) => (
                                  <td key={i} className="text-center p-1.5 font-mono">
                                    {game.linescore?.innings[i]?.home ?? '-'}
                                  </td>
                                )
                              )}
                              <td className="text-center p-1.5 font-mono font-bold text-white border-l border-border-subtle">
                                {game.linescore.totals.home.runs}
                              </td>
                              <td className="text-center p-1.5 font-mono">
                                {game.linescore.totals.home.hits}
                              </td>
                              <td className="text-center p-1.5 font-mono">
                                {game.linescore.totals.home.errors}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}
                </ScrollReveal>
              </Container>
            </Section>

            {/* Tab Navigation */}
            <Section padding="none" background="charcoal" borderTop>
              <Container>
                <div className="flex gap-2 border-b border-border-subtle overflow-x-auto pb-px">
                  {tabs.map((tab) => (
                    <Link
                      key={tab.id}
                      href={tab.href}
                      className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                        activeTab === tab.id
                          ? 'text-burnt-orange border-burnt-orange'
                          : 'text-text-tertiary border-transparent hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </Link>
                  ))}
                </div>
              </Container>
            </Section>

            {/* Page Content */}
            <Section padding="lg" background="charcoal">
              <Container>
                <ScrollReveal key={pathname}>{children}</ScrollReveal>

                {/* Data Source Footer */}
                <CitationFooter
                  source={meta?.dataSource || 'NCAA / D1Baseball'}
                  fetchedAt={meta?.lastUpdated || new Date().toISOString()}
                  className="mt-8"
                />
                {game.status.isLive && (
                  <p className="text-xs text-text-tertiary text-center mt-2">
                    Auto-refreshing every 30 seconds
                  </p>
                )}
              </Container>
            </Section>
          </>
        ) : null}
      </main>

      <Footer />
    </GameContext.Provider>
  );
}
