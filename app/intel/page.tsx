'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IntelGame, IntelMode, IntelSport } from '@/lib/intel/types';
import { useIntelDashboard, usePinnedBriefing } from '@/lib/intel/hooks';
import { IntelHeader } from '@/components/dashboard/intel/IntelHeader';
import { SportFilter } from '@/components/dashboard/intel/SportFilter';
import { IntelSearch } from '@/components/dashboard/intel/IntelSearch';
import { PrioritySignals } from '@/components/dashboard/intel/PrioritySignals';
import { GameGrid } from '@/components/dashboard/intel/GameGrid';
import { GameCardHero } from '@/components/dashboard/intel/GameCardHero';
import { GameCardMarquee } from '@/components/dashboard/intel/GameCardMarquee';
import { SignalFeed } from '@/components/dashboard/intel/SignalFeed';
import { StandingsTable } from '@/components/dashboard/intel/StandingsTable';
import { ModelHealth } from '@/components/dashboard/intel/ModelHealth';
import { NetRatingBar } from '@/components/dashboard/intel/NetRatingBar';
import { IntelSidebar } from '@/components/dashboard/intel/IntelSidebar';
import { IntelSkeleton } from '@/components/dashboard/intel/IntelSkeleton';
import { NewsFeed } from '@/components/dashboard/intel/NewsFeed';
import { SPORT_ACCENT } from '@/lib/intel/types';

// Code-split overlays — only loaded on interaction
const GameDetailSheet = dynamic(
  () => import('@/components/dashboard/intel/GameDetailSheet').then((m) => m.GameDetailSheet),
  { ssr: false },
);
const CommandPalette = dynamic(
  () => import('@/components/dashboard/intel/CommandPalette').then((m) => m.CommandPalette),
  { ssr: false },
);

// ─────────────────────────────────────────────────────────────────────────────

export default function IntelDashboard() {
  // State
  const [sport, setSport] = useState<IntelSport>('all');
  const [mode, setMode] = useState<IntelMode>('fan');
  const [teamLens, setTeamLens] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<IntelGame | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Hooks
  const {
    games,
    hero,
    marquee,
    standard,
    signals,
    prioritySignals,
    standings,
    allTeams,
    news,
    newsLoading,
    isLoading,
    isError,
  } = useIntelDashboard(sport, mode, teamLens);

  const { toggle: togglePin, isPinned } = usePinnedBriefing();

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        const active = document.activeElement;
        const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
        if (!isInput) {
          e.preventDefault();
          searchRef.current?.querySelector('input')?.focus();
        }
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bsi-intel-accent', SPORT_ACCENT[sport]);
    return () => {
      root.style.setProperty('--bsi-intel-accent', SPORT_ACCENT.all);
    };
  }, [sport]);

  // Derived
  const liveCount = useMemo(() => games.filter((g) => g.status === 'live').length, [games]);
  const briefingLine = useMemo(() => {
    const parts: string[] = [];
    if (games.length > 0) parts.push(`${games.length} games tracked`);
    if (liveCount > 0) parts.push(`${liveCount} live`);
    if (signals.length > 0) parts.push(`${signals.length} signals`);
    return parts.join(' / ') || 'Waiting for data...';
  }, [games.length, liveCount, signals.length]);

  // Handlers
  const handleSelectGame = useCallback((game: IntelGame) => setSelectedGame(game), []);
  const handleCloseSheet = useCallback(() => setSelectedGame(null), []);
  const handleOpenPalette = useCallback(() => setPaletteOpen(true), []);
  const handleClosePalette = useCallback(() => setPaletteOpen(false), []);
  const handleSelectTeamFromPalette = useCallback((team: string) => {
    setTeamLens(team);
    setPaletteOpen(false);
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────

  if (isLoading) return <IntelSkeleton />;

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="font-display text-lg text-white/60">Unable to load intel data</p>
          <p className="mt-1 font-mono text-[12px] text-white/30">
            Check network connection or try refreshing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <IntelHeader
        mode={mode}
        onModeChange={setMode}
        teamLens={teamLens}
        onTeamLensChange={setTeamLens}
        allTeams={allTeams}
        onOpenPalette={handleOpenPalette}
        liveCount={liveCount}
        briefingLine={briefingLine}
      />

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <SportFilter value={sport} onChange={setSport} />
        <div ref={searchRef} className="flex-1 min-w-[200px]">
          <IntelSearch query={searchQuery} onChange={setSearchQuery} />
        </div>
      </div>

      {/* Priority signals banner */}
      {prioritySignals.length > 0 && (
        <div className="mb-6">
          <PrioritySignals
            signals={prioritySignals}
            isPinned={isPinned}
            onTogglePin={togglePin}
          />
        </div>
      )}

      {/* Main grid: content + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <main className="min-w-0">
          <GameGrid
            hero={hero}
            marquee={marquee}
            standard={standard}
            isLoading={false}
            onSelectGame={handleSelectGame}
            heroCard={hero ? <GameCardHero game={hero} onClick={() => handleSelectGame(hero)} /> : undefined}
            marqueeCards={
              marquee.length > 0 ? (
                <>
                  {marquee.map((g) => (
                    <GameCardMarquee key={g.id} game={g} onClick={() => handleSelectGame(g)} />
                  ))}
                </>
              ) : undefined
            }
          />
          <NewsFeed articles={news} isLoading={newsLoading} sport={sport} />
        </main>

        <IntelSidebar>
          <SignalFeed
            signals={signals}
            isPinned={isPinned}
            onTogglePin={togglePin}
          />
          <StandingsTable standings={standings} sport={sport} />
          <ModelHealth />
          <NetRatingBar standings={standings} />
        </IntelSidebar>
      </div>

      {/* Overlays */}
      <GameDetailSheet
        game={selectedGame}
        open={!!selectedGame}
        onClose={handleCloseSheet}
      />
      <CommandPalette
        open={paletteOpen}
        onClose={handleClosePalette}
        games={games}
        signals={signals}
        allTeams={allTeams}
        onSelectGame={(game) => {
          setSelectedGame(game);
          setPaletteOpen(false);
        }}
        onSelectTeam={handleSelectTeamFromPalette}
      />
    </div>
  );
}
