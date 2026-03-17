'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, FreshnessBadge } from '@/components/ui/Badge';
import { FilterPill } from '@/components/ui/FilterPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataFreshnessIndicator } from '@/components/ui/DataFreshnessIndicator';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { SkeletonScoreCard } from '@/components/ui/Skeleton';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { HeroGlow } from '@/components/ui/HeroGlow';
import { toDataMeta } from '@/lib/utils/data-meta';
import { formatScheduleDate, getDateOffset } from '@/lib/utils/timezone';
import type { DataMeta } from '@/lib/types/data-meta';
import { IntelStreamCard } from '@/components/intel/IntelStreamCard';

interface Team {
  id: string;
  name: string;
  shortName: string;
  conference: string;
  score: number | null;
  record: { wins: number; losses: number };
}

interface Game {
  id: string;
  date: string;
  time: string;
  status: 'scheduled' | 'live' | 'final' | 'postponed' | 'canceled';
  inning?: number;
  homeTeam: Team;
  awayTeam: Team;
  venue: string;
  tv?: string;
  situation?: string;
}

interface ScoresApiResponse {
  success?: boolean;
  data?: Game[];
  games?: Game[];
  live?: boolean;
  meta?: DataMeta;
  message?: string;
  timestamp?: string;
}

const conferences = ['All', 'SEC', 'ACC', 'Big 12', 'Big Ten', 'Sun Belt', 'AAC'];

function GameIntelTrigger({ game }: { game: Game }) {
  const [open, setOpen] = useState(false);
  if (game.status !== 'scheduled') return null;

  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-display uppercase tracking-widest text-text-tertiary hover:text-burnt-orange transition-colors"
      >
        <span
          className="w-1 h-1 rounded-full bg-current"
          style={{ opacity: open ? 1 : 0.5 }}
        />
        {open ? 'Hide Intel' : 'Pregame Intel'}
      </button>
      {open && (
        <div className="pb-2">
          <IntelStreamCard
            homeTeam={game.homeTeam.name}
            awayTeam={game.awayTeam.name}
            sport="college-baseball"
            gameId={game.id}
            analysisType="pregame"
          />
        </div>
      )}
    </div>
  );
}

function TeamRow({
  team,
  won,
  isScheduled,
  fallbackAbbr,
}: {
  team: Team;
  won: boolean;
  isScheduled: boolean;
  fallbackAbbr: string;
}) {
  const displayName = team.shortName || team.name || fallbackAbbr;
  const record = `${team.record.wins}-${team.record.losses}`;

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`truncate font-semibold ${won ? 'text-text-primary' : 'text-text-secondary'}`}>
            {displayName}
          </span>
          {won && (
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-success" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          )}
        </div>
        <p className="text-xs text-text-tertiary">{record}</p>
      </div>
      <span
        className={`font-display text-2xl ${won ? 'text-burnt-orange' : 'text-text-primary'}`}
        {...(!isScheduled ? { 'aria-live': 'polite' as const } : {})}
      >
        {team.score ?? (isScheduled ? '-' : 0)}
      </span>
    </div>
  );
}

function GameCard({ game }: { game: Game }) {
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const isScheduled = game.status === 'scheduled';
  const awayWon = isFinal && (game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0);
  const homeWon = isFinal && (game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0);

  const gameHref = isLive
    ? `/college-baseball/game/${game.id}/live`
    : isFinal
      ? `/college-baseball/game/${game.id}/box-score`
      : `/college-baseball/game/${game.id}`;

  return (
    <Link href={gameHref} className="block">
      <div
        className={`bg-background-tertiary rounded-sm border transition-all hover:border-burnt-orange hover:bg-surface-light ${
          isLive ? 'border-success' : 'border-border-subtle'
        }`}
      >
        {/* Game Status Bar */}
        <div
          className={`px-4 py-2 rounded-t-sm flex items-center justify-between ${
            isLive ? 'bg-success/20' : isFinal ? 'bg-background-secondary' : 'bg-burnt-orange/20'
          }`}
        >
          <span
            className={`text-xs font-semibold uppercase ${
              isLive ? 'text-success' : isFinal ? 'text-text-tertiary' : 'text-burnt-orange'
            }`}
          >
            {isLive ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                {game.inning ? `Inning ${game.inning}` : 'Live'}
              </span>
            ) : isFinal ? (
              'Final'
            ) : game.status === 'postponed' ? (
              'Postponed'
            ) : (
              game.time
            )}
          </span>
          <Badge variant="default" className="text-xs">
            {game.homeTeam.conference || game.awayTeam.conference || 'NCAA'}
          </Badge>
        </div>

        {/* Teams */}
        <div className="p-4 space-y-3">
          <TeamRow team={game.awayTeam} won={awayWon} isScheduled={isScheduled} fallbackAbbr="AWY" />
          <TeamRow team={game.homeTeam} won={homeWon} isScheduled={isScheduled} fallbackAbbr="HME" />
        </div>

        {/* Venue Footer */}
        {game.venue && game.venue !== 'TBD' && (
          <div className="px-4 pb-3 text-xs text-text-tertiary border-t border-border-subtle pt-3">
            {game.venue}
            {game.tv && <span className="ml-2 text-burnt-orange">• {game.tv}</span>}
          </div>
        )}
      </div>
    </Link>
  );
}

interface GameSectionProps {
  games: Game[];
  status: Game['status'];
  label: string;
  showPulse?: boolean;
  className?: string;
}

function GameSection({ games, status, label, showPulse, className }: GameSectionProps) {
  const filtered = games.filter((g) => g.status === status);
  if (filtered.length === 0) return null;

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        {showPulse && <span className="w-2 h-2 bg-success rounded-full animate-pulse" />}
        {label}
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((game) => (
          <ScrollReveal key={game.id}>
            <GameCard game={game} />
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}

export default function CollegeBaseballScoresPage() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [selectedConference, setSelectedConference] = useState('All');
  const [liveGamesDetected, setLiveGamesDetected] = useState(false);
  const [isYesterdayFallback, setIsYesterdayFallback] = useState(false);

  // Hydration-safe: only compute date-dependent values on the client
  useEffect(() => {
    setMounted(true);
    const initialDate = getDateOffset(0);
    setSelectedDate(initialDate);

    // Read conference filter from URL param
    const params = new URLSearchParams(window.location.search);
    const confParam = params.get('conf');
    if (confParam && conferences.includes(confParam)) {
      setSelectedConference(confParam);
    }
  }, []);

  const confParam = selectedConference !== 'All' ? `&conference=${selectedConference}` : '';
  const { data: rawData, meta: responseMeta, loading, error, retry } = useSportData<ScoresApiResponse>(
    selectedDate ? `/api/college-baseball/schedule?date=${selectedDate}${confParam}` : null,
    { refreshInterval: 30000, refreshWhen: liveGamesDetected, timeout: 10000 }
  );

  const games = useMemo(() => rawData?.data || rawData?.games || [], [rawData]);
  const hasLiveGames = useMemo(() => games.some((g) => g.status === 'live'), [games]);

  const meta: DataMeta | null = useMemo(() => toDataMeta(responseMeta), [responseMeta]);

  // Sync live detection to enable auto-refresh
  useEffect(() => { setLiveGamesDetected(hasLiveGames); }, [hasLiveGames]);

  // Yesterday fallback: when today has zero games, show yesterday instead
  // rawData !== null ensures we only trigger AFTER a fetch completes,
  // not before the first fetch starts (prevents race with useSportData loading state).
  useEffect(() => {
    if (
      mounted &&
      !loading &&
      !error &&
      rawData !== null &&
      games.length === 0 &&
      selectedDate === getDateOffset(0) &&
      !isYesterdayFallback
    ) {
      setIsYesterdayFallback(true);
      setSelectedDate(getDateOffset(-1));
    }
  }, [mounted, loading, error, rawData, games.length, selectedDate, isYesterdayFallback]);

  // Manual date selection resets fallback
  const handleDateSelect = useCallback((date: string) => {
    setIsYesterdayFallback(false);
    setSelectedDate(date);
  }, []);

  // Persist conference filter in URL
  useEffect(() => {
    if (!mounted) return;
    const url = new URL(window.location.href);
    if (selectedConference !== 'All') {
      url.searchParams.set('conf', selectedConference);
    } else {
      url.searchParams.delete('conf');
    }
    history.replaceState(null, '', url.toString());
  }, [selectedConference, mounted]);

  // Count games per conference
  const conferenceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const game of games) {
      const homeConf = game.homeTeam.conference;
      const awayConf = game.awayTeam.conference;
      if (homeConf) counts[homeConf] = (counts[homeConf] || 0) + 1;
      if (awayConf && awayConf !== homeConf) counts[awayConf] = (counts[awayConf] || 0) + 1;
    }
    return counts;
  }, [games]);

  const liveCount = useMemo(() => games.filter((g) => g.status === 'live').length, [games]);

  // Date navigation — computed client-side only to avoid hydration mismatch
  const dateOptions = useMemo(() => mounted ? [
    { offset: -2, label: formatScheduleDate(getDateOffset(-2)) },
    { offset: -1, label: 'Yesterday' },
    { offset: 0, label: 'Today' },
    { offset: 1, label: 'Tomorrow' },
    { offset: 2, label: formatScheduleDate(getDateOffset(2)) },
  ] : [
    { offset: -2, label: '\u00A0' },
    { offset: -1, label: 'Yesterday' },
    { offset: 0, label: 'Today' },
    { offset: 1, label: 'Tomorrow' },
    { offset: 2, label: '\u00A0' },
  ], [mounted]);

  return (
    <>
      <div>
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
              <span className="text-text-primary font-medium">Scores</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <HeroGlow shape="80% 50%" intensity={0.07} />

          <Container>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <ScrollReveal direction="up">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="section-label">Live Scores</span>
                    {hasLiveGames && <FreshnessBadge isLive fetchedAt={meta?.fetched_at} />}
                  </div>
                </ScrollReveal>

                <ScrollReveal direction="up" delay={100}>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-gradient-blaze">
                    College Baseball Scores
                  </h1>
                </ScrollReveal>

                <ScrollReveal direction="up" delay={150}>
                  <p className="text-burnt-orange font-serif italic text-lg mt-2">
                    All 300+ D1 programs. Updated every 30 seconds during live games.
                  </p>
                </ScrollReveal>
              </div>
            </div>
          </Container>
        </Section>

        {/* Filters & Games */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <DataErrorBoundary name="College Baseball Scores">
            {/* Date Selector */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => handleDateSelect(getDateOffset(-3))}
                className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
                aria-label="Previous days"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              {dateOptions.map((option) => {
                const dateValue = getDateOffset(option.offset);

                return (
                  <FilterPill
                    key={option.offset}
                    active={selectedDate === dateValue}
                    onClick={() => handleDateSelect(dateValue)}
                    uppercase={false}
                    className="whitespace-nowrap"
                  >
                    {option.label}
                  </FilterPill>
                );
              })}

              <button
                onClick={() => handleDateSelect(getDateOffset(3))}
                className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
                aria-label="Next days"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* Conference Filter */}
            <div className="flex flex-wrap gap-2 mb-8">
              {conferences.map((conf) => {
                const count = conf === 'All' ? games.length : (conferenceCounts[conf] || 0);
                return (
                  <FilterPill
                    key={conf}
                    active={selectedConference === conf}
                    onClick={() => setSelectedConference(conf)}
                    aria-pressed={selectedConference === conf}
                  >
                    {conf}{count > 0 ? ` (${count})` : ''}
                  </FilterPill>
                );
              })}
            </div>

            {/* Game Status Header */}
            {!loading && !error && games.length > 0 && (
              <div className="mb-6 flex items-center gap-2 text-sm text-text-secondary">
                {isYesterdayFallback ? (
                  <span className="flex items-center gap-2">
                    <span className="text-text-tertiary">Yesterday&apos;s Results</span>
                    <span className="text-burnt-orange font-semibold">{games.length} {games.length === 1 ? 'game' : 'games'}</span>
                  </span>
                ) : hasLiveGames ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <span className="text-success font-semibold">{liveCount} live</span>
                    <span className="text-text-tertiary">&middot; {games.length} total {games.length === 1 ? 'game' : 'games'} today</span>
                  </span>
                ) : (
                  <span>{games.length} {games.length === 1 ? 'game' : 'games'}</span>
                )}
              </div>
            )}

            {/* Games Grid */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonScoreCard key={i} />
                ))}
              </div>
            ) : error ? (
              <Card variant="default" padding="lg" className="bg-warning/10 border-warning/30">
                <p className="text-warning font-semibold">Unable to Load Scores</p>
                <p className="text-text-secondary text-sm mt-1">
                  The scores API returned an error. This is usually temporary — try again in a moment.
                </p>
                <button
                  onClick={() => retry()}
                  className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-sm hover:bg-burnt-orange/80 transition-colors"
                >
                  Retry
                </button>
              </Card>
            ) : games.length === 0 ? (
              <EmptyState
                type={meta?.degraded ? 'source-unavailable' : 'no-games'}
                sport="college-baseball"
                onRetry={meta?.degraded ? () => retry() : undefined}
              />
            ) : (
              <>
                {/* Live Games Section */}
                {games.some((g) => g.status === 'live') && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      Live Games
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {games
                        .filter((g) => g.status === 'live')
                        .map((game) => (
                          <ScrollReveal key={game.id}>
                            <GameCard game={game} />
                          </ScrollReveal>
                        ))}
                    </div>
                  </div>
                )}

                {/* Final Games */}
                {games.some((g) => g.status === 'final') && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Final</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {games
                        .filter((g) => g.status === 'final')
                        .map((game) => (
                          <ScrollReveal key={game.id}>
                            <GameCard game={game} />
                          </ScrollReveal>
                        ))}
                    </div>
                  </div>
                )}

                {/* Scheduled Games */}
                {games.some((g) => g.status === 'scheduled') && (
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Upcoming</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {games
                        .filter((g) => g.status === 'scheduled')
                        .map((game) => (
                          <div key={game.id}>
                            <ScrollReveal>
                              <GameCard game={game} />
                            </ScrollReveal>
                            <GameIntelTrigger game={game} />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Data Freshness Footer */}
                <div className="mt-8 pt-4 border-t border-border-subtle space-y-2">
                  <DataFreshnessIndicator
                    lastUpdated={meta?.fetched_at ? new Date(meta.fetched_at) : undefined}
                    source={meta?.source || 'ESPN'}
                    refreshInterval={hasLiveGames ? 30 : undefined}
                    isCached={!hasLiveGames && !!rawData}
                  />
                  {meta?.degraded && (
                    <p className="text-xs text-[var(--bsi-warning)]/60 text-center">
                      Limited data — advanced stats unavailable
                    </p>
                  )}
                </div>
              </>
            )}
            </DataErrorBoundary>

            {/* Savant Cross-Link */}
            <div className="mt-10">
              <Link
                href="/college-baseball/savant"
                className="block p-4 transition-colors group"
                style={{ background: 'var(--surface-dugout, #161616)', border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="heritage-stamp text-[10px]" style={{ color: 'var(--bsi-primary, #BF5700)' }}>BSI SAVANT</span>
                    <p className="font-oswald uppercase text-sm tracking-wider mt-1" style={{ color: 'var(--bsi-bone, #F5F2EB)' }}>
                      The box score is just the beginning
                    </p>
                    <p className="font-cormorant text-xs mt-1" style={{ color: 'var(--bsi-dust, #C4B8A5)' }}>
                      Park-adjusted wOBA, wRC+, FIP for 300+ D1 programs — updated every 6 hours
                    </p>
                  </div>
                  <svg viewBox="0 0 24 24" className="w-5 h-5 opacity-40 group-hover:opacity-70 group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--bsi-primary, #BF5700)' }}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
