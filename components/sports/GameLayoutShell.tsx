'use client';

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { ScrollReveal } from '@/components/cinematic';
import { Skeleton } from '@/components/ui/Skeleton';
import { CitationFooter } from '@/components/sports';
import type { DataMeta } from '@/lib/types/data-meta';

// ============================================================================
// TYPES
// ============================================================================

/** Minimal game data contract — sport-specific shapes extend this. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGameData = Record<string, any>;

interface GameContextValue<T = AnyGameData> {
  game: T | null;
  loading: boolean;
  error: string | null;
  meta: DataMeta | null;
  refresh: () => void;
}

interface TabConfig {
  id: string;
  label: string;
  /** Path segment after /game/{gameId}/ — empty string for summary tab. */
  segment: string;
}

interface BreadcrumbConfig {
  /** Display name in breadcrumb, e.g. "NFL", "College Baseball" */
  sportLabel: string;
  /** Root link for the sport, e.g. "/nfl" */
  sportHref: string;
  /** Label for the scores/games link, e.g. "Scores" or "Games" */
  scoresLabel: string;
  /** Path for scores link, e.g. "/nfl/games" */
  scoresHref: string;
}

interface GameLayoutShellConfig {
  /** Sport slug used in routes, e.g. "nfl", "mlb", "college-baseball" */
  sportSlug: string;
  /** API path prefix, e.g. "/api/nfl" */
  apiPrefix: string;
  /** Polling interval in ms for live games. */
  pollInterval: number;
  /** Default data source shown when meta is unavailable. */
  defaultDataSource: string;
  /** Breadcrumb configuration. */
  breadcrumb: BreadcrumbConfig;
  /** Tab definitions. Order determines display order. */
  tabs: TabConfig[];
  /** Optional placeholder gameId that should redirect (e.g. NFL uses this). */
  placeholderRedirect?: string;
  /** Extra message shown below the error, e.g. "data can be spotty". */
  errorHint?: string;
  /** Button label for retry action. Defaults to "Retry". */
  retryLabel?: string;
  /**
   * Extract a breadcrumb matchup string from game data.
   * Return null to show "Game {gameId}" as fallback.
   */
  getMatchupLabel: (game: AnyGameData) => string | null;
  /**
   * Determine whether the game is currently live.
   */
  isLive: (game: AnyGameData) => boolean;
  /**
   * Render the scoreboard + linescore section.
   * Receives game data and meta so each sport can render its own format.
   */
  renderScoreboard: (game: AnyGameData, meta: DataMeta | null) => ReactNode;
}

// ============================================================================
// CONTEXT
// ============================================================================

const GameContext = createContext<GameContextValue | null>(null);

/**
 * Access game data from the nearest GameLayoutShell.
 * The generic parameter lets consumers cast to their sport-specific type.
 */
export function useGameData<T = AnyGameData>(): GameContextValue<T> {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameData must be used within a GameLayoutShell');
  }
  return context as GameContextValue<T>;
}

// ============================================================================
// COMPONENT
// ============================================================================

interface GameLayoutShellProps {
  config: GameLayoutShellConfig;
  children: ReactNode;
}

export default function GameLayoutShell({ config, children }: GameLayoutShellProps): ReactNode {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  // Static export serves a "placeholder" shell for game IDs that weren't
  // pre-rendered. useParams() returns "placeholder" in that case, but the
  // browser URL has the real game ID. Extract it from the pathname.
  const rawParamId = params?.gameId as string;
  const gameId = (() => {
    if (rawParamId && rawParamId !== 'placeholder') return rawParamId;
    // pathname looks like /{sportSlug}/game/{realId}/... — extract segment [3]
    const segments = pathname?.split('/').filter(Boolean) ?? [];
    const gameIdx = segments.indexOf('game');
    if (gameIdx >= 0 && segments[gameIdx + 1] && segments[gameIdx + 1] !== 'placeholder') {
      return segments[gameIdx + 1];
    }
    return rawParamId; // fallback
  })();

  const [game, setGame] = useState<AnyGameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DataMeta | null>(null);

  // Placeholder redirect (NFL uses this pattern)
  useEffect(() => {
    if (config.placeholderRedirect && gameId === 'placeholder') {
      router.replace(config.placeholderRedirect);
    }
  }, [gameId, router, config.placeholderRedirect]);

  const fetchGame = useCallback(async () => {
    if (!gameId || (config.placeholderRedirect && gameId === 'placeholder')) return;

    try {
      const res = await fetch(`${config.apiPrefix}/game/${gameId}`);
      if (!res.ok) throw new Error('Failed to fetch game data');
      const data = (await res.json()) as { game?: AnyGameData; meta?: DataMeta };

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
  }, [gameId, config.apiPrefix, config.placeholderRedirect]);

  useEffect(() => {
    setLoading(true);
    fetchGame();
  }, [fetchGame]);

  // Auto-refresh for live games
  useEffect(() => {
    if (game && config.isLive(game)) {
      const interval = setInterval(fetchGame, config.pollInterval);
      return () => clearInterval(interval);
    }
  }, [game, fetchGame, config]);

  // Build tab hrefs from config
  const tabs = config.tabs.map((tab) => ({
    ...tab,
    href: tab.segment
      ? `/${config.sportSlug}/game/${gameId}/${tab.segment}`
      : `/${config.sportSlug}/game/${gameId}`,
  }));

  const getActiveTab = (): string => {
    for (const tab of config.tabs) {
      if (tab.segment && pathname?.includes(`/${tab.segment}`)) {
        return tab.id;
      }
    }
    return config.tabs[0]?.id || 'summary';
  };

  const activeTab = getActiveTab();
  const live = game ? config.isLive(game) : false;
  const pollSeconds = Math.round(config.pollInterval / 1000);

  // Placeholder gameId — don't render anything, redirect is in flight
  if (config.placeholderRedirect && gameId === 'placeholder') {
    return null;
  }

  const matchupLabel = game ? config.getMatchupLabel(game) : null;

  // Update page title with matchup once data loads
  if (typeof document !== 'undefined' && matchupLabel) {
    const sportLabel = config.sportSlug === 'college-baseball' ? 'College Baseball' : config.sportSlug.toUpperCase();
    document.title = `${matchupLabel} | ${sportLabel} | Blaze Sports Intel`;
  }

  return (
    <GameContext.Provider value={{ game, loading, error, meta, refresh: fetchGame }}>
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href={config.breadcrumb.sportHref}
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                {config.breadcrumb.sportLabel}
              </Link>
              <span className="text-text-tertiary">/</span>
              <Link
                href={config.breadcrumb.scoresHref}
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                {config.breadcrumb.scoresLabel}
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-text-primary font-medium">
                {matchupLabel || `Game ${gameId}`}
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
                {config.errorHint && (
                  <p className="text-text-tertiary text-xs mt-2">{config.errorHint}</p>
                )}
                <button
                  onClick={fetchGame}
                  className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-sm hover:bg-burnt-orange/80 transition-colors"
                >
                  {config.retryLabel || 'Retry'}
                </button>
              </Card>
            </Container>
          </Section>
        ) : game ? (
          <>
            {/* Game Header — sport-specific scoreboard */}
            <Section padding="md" className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
              <Container>
                <ScrollReveal>{config.renderScoreboard(game, meta)}</ScrollReveal>
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
                          : 'text-text-tertiary border-transparent hover:text-text-primary'
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
                  source={meta?.dataSource || config.defaultDataSource}
                  fetchedAt={meta?.lastUpdated || new Date().toISOString()}
                  className="mt-8"
                />
                {live && (
                  <p className="text-xs text-text-tertiary text-center mt-2">
                    Auto-refreshing every {pollSeconds} seconds
                  </p>
                )}
              </Container>
            </Section>
          </>
        ) : null}
      </div>

    </GameContext.Provider>
  );
}
