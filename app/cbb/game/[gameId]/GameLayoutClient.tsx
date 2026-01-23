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

export interface CBBGameData {
  id: string;
  date: string;
  status: {
    state: string;
    period?: number;
    timeRemaining?: string;
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
      ranking?: number;
    };
    home: {
      name: string;
      abbreviation: string;
      score: number;
      isWinner: boolean;
      record?: string;
      ranking?: number;
    };
  };
  venue: string;
  broadcast?: string;
  leaders?: {
    points?: { name: string; stats: string };
    rebounds?: { name: string; stats: string };
    assists?: { name: string; stats: string };
  };
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
}

interface GameContextValue {
  game: CBBGameData | null;
  loading: boolean;
  error: string | null;
  meta: DataMeta | null;
  refresh: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGameData(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameData must be used within CBBGameLayoutClient');
  }
  return context;
}

export function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

interface GameLayoutClientProps {
  children: ReactNode;
}

export default function CBBGameLayoutClient({ children }: GameLayoutClientProps) {
  const params = useParams();
  const pathname = usePathname();
  const gameId = params?.gameId as string;

  const [game, setGame] = useState<CBBGameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DataMeta | null>(null);

  const fetchGame = useCallback(async () => {
    if (!gameId) return;

    try {
      const res = await fetch(`/api/cbb/game/${gameId}`);
      if (!res.ok) throw new Error('Failed to fetch game data');
      const data = await res.json();

      if (data.game) {
        setGame(data.game);
      }
      if (data.meta) {
        setMeta(data.meta);
      }
      setLoading(false);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    setLoading(true);
    fetchGame();
  }, [fetchGame]);

  useEffect(() => {
    if (game?.status.isLive) {
      const interval = setInterval(fetchGame, 30000);
      return () => clearInterval(interval);
    }
  }, [game?.status.isLive, fetchGame]);

  const tabs = [
    { id: 'summary', label: 'Summary', href: `/cbb/game/${gameId}` },
    { id: 'box-score', label: 'Box Score', href: `/cbb/game/${gameId}/box-score` },
    { id: 'play-by-play', label: 'Play-by-Play', href: `/cbb/game/${gameId}/play-by-play` },
    { id: 'team-stats', label: 'Team Stats', href: `/cbb/game/${gameId}/team-stats` },
    { id: 'recap', label: 'Recap', href: `/cbb/game/${gameId}/recap` },
  ];

  const getActiveTab = () => {
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
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/nba"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                College Basketball
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
                <Skeleton variant="rect" width="100%" height={150} />
                <Skeleton variant="rect" width="100%" height={400} />
              </div>
            </Container>
          </Section>
        ) : error ? (
          <Section padding="lg" background="charcoal">
            <Container>
              <Card variant="default" padding="lg" className="bg-error/10 border-error/30">
                <p className="text-error font-semibold">Unable to Load Game</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
                <button
                  onClick={fetchGame}
                  className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors"
                >
                  Retry
                </button>
              </Card>
            </Container>
          </Section>
        ) : game ? (
          <>
            <Section padding="md" className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
              <Container>
                <ScrollReveal>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="secondary">
                      {new Date(game.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Badge>
                    {game.status.isLive && <LiveBadge />}
                  </div>

                  <div className="flex items-center justify-center gap-8 md:gap-16 py-6">
                    <div className="text-center">
                      {game.teams.away.ranking && (
                        <span className="text-burnt-orange text-sm font-bold">
                          #{game.teams.away.ranking}
                        </span>
                      )}
                      <div className="w-16 h-16 bg-charcoal rounded-full flex items-center justify-center text-xl font-bold text-burnt-orange mx-auto mb-2">
                        {game.teams.away.abbreviation}
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

                    <div className="text-center">
                      {game.status.isLive ? (
                        <span className="flex items-center justify-center gap-1.5 text-success font-semibold">
                          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                          {game.status.period === 1 ? '1st' : '2nd'} {game.status.timeRemaining}
                        </span>
                      ) : game.status.isFinal ? (
                        <span className="text-text-tertiary font-semibold">FINAL</span>
                      ) : (
                        <span className="text-burnt-orange font-semibold">{game.status.state}</span>
                      )}
                      <p className="text-xs text-text-tertiary mt-1">{game.venue}</p>
                    </div>

                    <div className="text-center">
                      {game.teams.home.ranking && (
                        <span className="text-burnt-orange text-sm font-bold">
                          #{game.teams.home.ranking}
                        </span>
                      )}
                      <div className="w-16 h-16 bg-charcoal rounded-full flex items-center justify-center text-xl font-bold text-burnt-orange mx-auto mb-2">
                        {game.teams.home.abbreviation}
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
                </ScrollReveal>
              </Container>
            </Section>

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

            <Section padding="lg" background="charcoal">
              <Container>
                <ScrollReveal key={pathname}>{children}</ScrollReveal>

                <CitationFooter
                  source={meta?.dataSource || 'ESPN College Basketball'}
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
