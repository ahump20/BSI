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

export interface NFLGameData {
  id: string;
  date: string;
  status: {
    state: string;
    quarter?: number;
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
    };
    home: {
      name: string;
      abbreviation: string;
      score: number;
      isWinner: boolean;
      record?: string;
    };
  };
  venue: string;
  broadcast?: string;
  leaders?: {
    passing?: { name: string; stats: string };
    rushing?: { name: string; stats: string };
    receiving?: { name: string; stats: string };
  };
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
}

interface GameContextValue {
  game: NFLGameData | null;
  loading: boolean;
  error: string | null;
  meta: DataMeta | null;
  refresh: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGameData() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameData must be used within NFLGameLayoutClient');
  }
  return context;
}

interface GameLayoutClientProps {
  children: ReactNode;
}

export default function NFLGameLayoutClient({ children }: GameLayoutClientProps) {
  const params = useParams();
  const pathname = usePathname();
  const gameId = params?.gameId as string;

  const [game, setGame] = useState<NFLGameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DataMeta | null>(null);

  const fetchGame = useCallback(async () => {
    if (!gameId) return;

    try {
      const res = await fetch(`/api/nfl/games/${gameId}`);
      if (!res.ok) throw new Error('Failed to fetch game data');
      const data = (await res.json()) as {
        game?: NFLGameData;
        competitors?: Array<{
          homeAway: string;
          team?: { name?: string; abbreviation?: string };
          score?: string;
          winner?: boolean;
        }>;
        timestamp?: string;
        meta?: DataMeta;
      };

      if (data.game) {
        setGame(data.game);
      } else if (data.competitors) {
        // Transform ESPN-style response
        const away = data.competitors.find((c) => c.homeAway === 'away');
        const home = data.competitors.find((c) => c.homeAway === 'home');

        setGame({
          id: gameId,
          date: data.timestamp || new Date().toISOString(),
          status: {
            state: 'Unknown',
            quarter: undefined,
            timeRemaining: undefined,
            isLive: false,
            isFinal: false,
          },
          teams: {
            away: {
              name: away?.team?.name || 'Away',
              abbreviation: away?.team?.abbreviation || 'AWY',
              score: parseInt(away?.score || '0') || 0,
              isWinner: away?.winner || false,
              record: '',
            },
            home: {
              name: home?.team?.name || 'Home',
              abbreviation: home?.team?.abbreviation || 'HME',
              score: parseInt(home?.score || '0') || 0,
              isWinner: home?.winner || false,
              record: '',
            },
          },
          venue: 'TBD',
        });
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

  useEffect(() => {
    if (game?.status.isLive) {
      const interval = setInterval(fetchGame, 30000);
      return () => clearInterval(interval);
    }
  }, [game?.status.isLive, fetchGame]);

  const tabs = [
    { id: 'summary', label: 'Summary', href: `/nfl/game/${gameId}` },
    { id: 'box-score', label: 'Box Score', href: `/nfl/game/${gameId}/box-score` },
  ];

  const getActiveTab = () => {
    if (pathname?.includes('/box-score')) return 'box-score';
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
                href="/nfl"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                NFL
              </Link>
              <span className="text-text-tertiary">/</span>
              <Link
                href="/nfl/scores"
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
                          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />Q
                          {game.status.quarter} {game.status.timeRemaining}
                        </span>
                      ) : game.status.isFinal ? (
                        <span className="text-text-tertiary font-semibold">FINAL</span>
                      ) : (
                        <span className="text-burnt-orange font-semibold">{game.status.state}</span>
                      )}
                      <p className="text-xs text-text-tertiary mt-1">{game.venue}</p>
                    </div>

                    <div className="text-center">
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
                  source={meta?.dataSource || 'ESPN NFL API'}
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
