'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
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

interface CompetitorTeam {
  id?: string;
  displayName?: string;
  abbreviation?: string;
  shortDisplayName?: string;
  logo?: string;
  logos?: Array<{ href?: string }>;
  color?: string;
}

export interface Competitor {
  homeAway?: string;
  winner?: boolean;
  score?: string;
  team?: CompetitorTeam;
  records?: Array<{ summary?: string }>;
  linescores?: Array<{ value?: number }>;
  statistics?: Array<{ name?: string; displayValue?: string }>;
}

export interface Leader {
  name?: string;
  displayName?: string;
  leaders?: Array<{
    displayValue?: string;
    athlete?: { displayName?: string; position?: { abbreviation?: string } };
  }>;
}

interface PlayType {
  id?: string;
  text?: string;
}

export interface Play {
  id?: string;
  type?: PlayType;
  text?: string;
  shortText?: string;
  period?: { number?: number; displayValue?: string };
  clock?: { displayValue?: string };
  scoringPlay?: boolean;
  scoreValue?: number;
  homeScore?: string;
  awayScore?: string;
  team?: { id?: string; displayName?: string; abbreviation?: string };
  wallclock?: string;
  start?: { down?: number; distance?: number; yardLine?: number; yardsToEndzone?: number };
  end?: { down?: number; distance?: number; yardLine?: number; yardsToEndzone?: number };
  statYardage?: number;
}

export interface GameData {
  id?: string;
  status?: {
    type?: {
      completed?: boolean;
      state?: string;
      shortDetail?: string;
      description?: string;
    };
    period?: number;
    displayClock?: string;
  };
  competitors?: Competitor[];
  boxscore?: Record<string, unknown>;
  leaders?: Leader[];
  plays?: Play[];
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
}

interface GameApiResponse {
  game?: GameData;
  meta?: DataMeta;
}

interface GameContextValue {
  game: GameData | null;
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
    throw new Error('useGameData must be used within NFLGameLayout');
  }
  return context;
}

// ============================================================================
// HELPERS
// ============================================================================

function getTeamLogo(competitor?: Competitor): string | null {
  return competitor?.team?.logos?.[0]?.href || competitor?.team?.logo || null;
}

function getQuarterLabel(index: number): string {
  if (index < 4) return `Q${index + 1}`;
  return `OT${index - 3}`;
}

function isGameLive(game: GameData): boolean {
  return game.status?.type?.state === 'in';
}

function isGameFinal(game: GameData): boolean {
  return game.status?.type?.completed === true;
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
  const router = useRouter();
  const gameId = params?.gameId as string;

  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DataMeta | null>(null);

  // Placeholder redirect
  useEffect(() => {
    if (gameId === 'placeholder') {
      router.replace('/nfl/games');
    }
  }, [gameId, router]);

  const fetchGame = useCallback(async () => {
    if (!gameId || gameId === 'placeholder') return;

    try {
      const res = await fetch(`/api/nfl/game/${gameId}`);
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

  // Auto-refresh for live games (30s)
  useEffect(() => {
    if (game && isGameLive(game)) {
      const interval = setInterval(fetchGame, 30000);
      return () => clearInterval(interval);
    }
  }, [game, fetchGame]);

  // Derive teams
  const homeTeam = game?.competitors?.find((c) => c.homeAway === 'home');
  const awayTeam = game?.competitors?.find((c) => c.homeAway === 'away');

  // Tab navigation
  const tabs = [
    { id: 'summary', label: 'Summary', href: `/nfl/game/${gameId}` },
    { id: 'box-score', label: 'Box Score', href: `/nfl/game/${gameId}/box-score` },
    { id: 'play-by-play', label: 'Play-by-Play', href: `/nfl/game/${gameId}/play-by-play` },
    { id: 'team-stats', label: 'Team Stats', href: `/nfl/game/${gameId}/team-stats` },
    { id: 'recap', label: 'Recap', href: `/nfl/game/${gameId}/recap` },
  ];

  const getActiveTab = () => {
    if (pathname?.includes('/box-score')) return 'box-score';
    if (pathname?.includes('/play-by-play')) return 'play-by-play';
    if (pathname?.includes('/team-stats')) return 'team-stats';
    if (pathname?.includes('/recap')) return 'recap';
    return 'summary';
  };

  const activeTab = getActiveTab();

  // Determine max periods for linescore columns
  const maxPeriods = Math.max(
    homeTeam?.linescores?.length || 4,
    awayTeam?.linescores?.length || 4,
    4
  );

  const live = game ? isGameLive(game) : false;
  const final = game ? isGameFinal(game) : false;

  // Placeholder gameId — don't render anything, redirect is in flight
  if (gameId === 'placeholder') {
    return null;
  }

  return (
    <GameContext.Provider value={{ game, loading, error, meta, refresh: fetchGame }}>
      <main id="main-content">
        {/* Breadcrumb */}
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
                href="/nfl/games"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                Games
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">
                {awayTeam && homeTeam
                  ? `${awayTeam.team?.abbreviation || 'Away'} vs ${homeTeam.team?.abbreviation || 'Home'}`
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
            {/* Game Header */}
            <Section padding="md" className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
              <Container>
                <ScrollReveal>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="secondary">
                      {game.status?.type?.shortDetail || game.status?.type?.description || 'NFL'}
                    </Badge>
                    {live && <LiveBadge />}
                  </div>

                  {/* Scoreboard */}
                  <div className="flex items-center justify-center gap-8 md:gap-16 py-6">
                    {/* Away Team */}
                    <div className="text-center">
                      <div className="w-16 h-16 bg-charcoal rounded-full flex items-center justify-center overflow-hidden mx-auto mb-2">
                        {getTeamLogo(awayTeam) ? (
                          <img
                            src={getTeamLogo(awayTeam)!}
                            alt={awayTeam?.team?.abbreviation || 'Away'}
                            className="w-12 h-12 object-contain"
                          />
                        ) : (
                          <span className="text-xl font-bold text-burnt-orange">
                            {awayTeam?.team?.abbreviation || 'AWY'}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-white">
                        {awayTeam?.team?.shortDisplayName || awayTeam?.team?.displayName || 'Away'}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {awayTeam?.records?.[0]?.summary || ''}
                      </p>
                      <p
                        className={`text-4xl font-bold font-mono mt-2 ${
                          final && awayTeam?.winner ? 'text-white' : 'text-text-secondary'
                        }`}
                      >
                        {awayTeam?.score || '-'}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="text-center">
                      {live ? (
                        <span className="flex items-center justify-center gap-1.5 text-success font-semibold">
                          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                          Q{game.status?.period || '?'} {game.status?.displayClock || ''}
                        </span>
                      ) : final ? (
                        <span className="text-text-tertiary font-semibold">FINAL</span>
                      ) : (
                        <span className="text-burnt-orange font-semibold">
                          {game.status?.type?.shortDetail || 'Scheduled'}
                        </span>
                      )}
                    </div>

                    {/* Home Team */}
                    <div className="text-center">
                      <div className="w-16 h-16 bg-charcoal rounded-full flex items-center justify-center overflow-hidden mx-auto mb-2">
                        {getTeamLogo(homeTeam) ? (
                          <img
                            src={getTeamLogo(homeTeam)!}
                            alt={homeTeam?.team?.abbreviation || 'Home'}
                            className="w-12 h-12 object-contain"
                          />
                        ) : (
                          <span className="text-xl font-bold text-burnt-orange">
                            {homeTeam?.team?.abbreviation || 'HME'}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-white">
                        {homeTeam?.team?.shortDisplayName || homeTeam?.team?.displayName || 'Home'}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {homeTeam?.records?.[0]?.summary || ''}
                      </p>
                      <p
                        className={`text-4xl font-bold font-mono mt-2 ${
                          final && homeTeam?.winner ? 'text-white' : 'text-text-secondary'
                        }`}
                      >
                        {homeTeam?.score || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Quarter Linescore */}
                  {(awayTeam?.linescores?.length || homeTeam?.linescores?.length) && (
                    <Card variant="default" padding="sm" className="mt-4 max-w-2xl mx-auto">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border-subtle text-text-tertiary">
                              <th className="text-left p-1.5 w-12">Team</th>
                              {Array.from({ length: maxPeriods }, (_, i) => (
                                <th key={i} className="text-center p-1.5 w-8">
                                  {getQuarterLabel(i)}
                                </th>
                              ))}
                              <th className="text-center p-1.5 w-8 border-l border-border-subtle text-burnt-orange font-bold">
                                T
                              </th>
                            </tr>
                          </thead>
                          <tbody className="text-text-secondary">
                            <tr className="border-b border-border-subtle">
                              <td className="p-1.5 font-semibold text-white">
                                {awayTeam?.team?.abbreviation || 'AWY'}
                              </td>
                              {Array.from({ length: maxPeriods }, (_, i) => (
                                <td key={i} className="text-center p-1.5 font-mono">
                                  {awayTeam?.linescores?.[i]?.value ?? '-'}
                                </td>
                              ))}
                              <td className="text-center p-1.5 font-mono font-bold text-white border-l border-border-subtle">
                                {awayTeam?.score || '-'}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-1.5 font-semibold text-white">
                                {homeTeam?.team?.abbreviation || 'HME'}
                              </td>
                              {Array.from({ length: maxPeriods }, (_, i) => (
                                <td key={i} className="text-center p-1.5 font-mono">
                                  {homeTeam?.linescores?.[i]?.value ?? '-'}
                                </td>
                              ))}
                              <td className="text-center p-1.5 font-mono font-bold text-white border-l border-border-subtle">
                                {homeTeam?.score || '-'}
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
                  source={meta?.dataSource || 'ESPN NFL API'}
                  fetchedAt={meta?.lastUpdated || new Date().toISOString()}
                  className="mt-8"
                />
                {live && (
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
