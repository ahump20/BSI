'use client';

import { useState, useMemo, useCallback } from 'react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { IntelHeader } from '@/components/dashboard/intel/IntelHeader';
import { SportFilter } from '@/components/dashboard/intel/SportFilter';
import { GameGrid } from '@/components/dashboard/intel/GameGrid';
import { useIntelDashboard, usePinnedBriefing } from '@/lib/intel/hooks';
import type { IntelMode, IntelSport, IntelGame } from '@/lib/intel/types';
import { SPORT_LABELS } from '@/lib/intel/types';

// Lazy-loaded Phase 3 + 4 components
import dynamic from 'next/dynamic';

const PrioritySignals = dynamic(
  () => import('@/components/dashboard/intel/PrioritySignals').then((m) => m.PrioritySignals),
  { ssr: false },
);
const SignalFeed = dynamic(
  () => import('@/components/dashboard/intel/SignalFeed').then((m) => m.SignalFeed),
  { ssr: false },
);
const GameCardHero = dynamic(
  () => import('@/components/dashboard/intel/GameCardHero').then((m) => m.GameCardHero),
  { ssr: false },
);
const GameCardMarquee = dynamic(
  () => import('@/components/dashboard/intel/GameCardMarquee').then((m) => m.GameCardMarquee),
  { ssr: false },
);
const NetRatingBar = dynamic(
  () => import('@/components/dashboard/intel/NetRatingBar').then((m) => m.NetRatingBar),
  { ssr: false },
);
const ModelHealth = dynamic(
  () => import('@/components/dashboard/intel/ModelHealth').then((m) => m.ModelHealth),
  { ssr: false },
);
const GameDetailSheet = dynamic(
  () => import('@/components/dashboard/intel/GameDetailSheet').then((m) => m.GameDetailSheet),
  { ssr: false },
);

export default function IntelDashboardPage() {
  const [sport, setSport] = useState<IntelSport>('all');
  const [mode, setMode] = useState<IntelMode>('coach');
  const [teamLens, setTeamLens] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<IntelGame | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const {
    games,
    hero,
    marquee,
    standard,
    signals,
    prioritySignals,
    standings,
    allTeams,
    isLoading,
  } = useIntelDashboard(sport, mode, teamLens);

  const { pinned, toggle: togglePin, isPinned } = usePinnedBriefing();

  const openGame = useCallback((g: IntelGame) => setSelectedGame(g), []);
  const closeGame = useCallback(() => setSelectedGame(null), []);

  const liveCount = useMemo(
    () => games.filter((g) => g.status === 'live').length,
    [games],
  );

  const briefingLine = useMemo(() => {
    const upcoming = games.filter((g) => g.status === 'scheduled').length;
    const finals = games.filter((g) => g.status === 'final').length;
    const live = games.filter((g) => g.status === 'live').length;
    const sportLabel = SPORT_LABELS[sport];
    const lens = teamLens ? ` · Lens: ${teamLens}` : '';
    return `${sportLabel} · ${live} live · ${upcoming} upcoming · ${finals} final · ${prioritySignals.length} priority${lens}`;
  }, [games, sport, teamLens, prioritySignals.length]);

  return (
    <main id="main-content" className="min-h-screen pt-24 md:pt-28">
      <Section padding="lg" className="pt-4">
        <Container size="wide">
          {/* Header */}
          <IntelHeader
            mode={mode}
            onModeChange={setMode}
            teamLens={teamLens}
            onTeamLensChange={setTeamLens}
            allTeams={allTeams}
            onOpenPalette={() => setPaletteOpen(true)}
            liveCount={liveCount}
            briefingLine={briefingLine}
          />

          {/* Sport Filter */}
          <SportFilter value={sport} onChange={setSport} />

          {/* Priority Signals */}
          <PrioritySignals
            signals={prioritySignals}
            isPinned={isPinned}
            onTogglePin={togglePin}
          />

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left column: Games */}
            <div className="lg:col-span-7">
              <GameGrid
                hero={hero}
                marquee={marquee}
                standard={standard}
                isLoading={isLoading}
                onSelectGame={openGame}
                heroCard={hero && (
                  <GameCardHero game={hero} onClick={() => openGame(hero)} />
                )}
                marqueeCards={marquee.length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                    {marquee.map((g) => (
                      <div key={g.id} className="min-w-[260px] flex-1">
                        <GameCardMarquee game={g} onClick={() => openGame(g)} />
                      </div>
                    ))}
                  </div>
                ) : undefined}
              />
            </div>

            {/* Right column: Signals + Standings + Charts */}
            <div className="lg:col-span-5 space-y-4">
              <SignalFeed
                signals={signals}
                isPinned={isPinned}
                onTogglePin={togglePin}
              />

              <NetRatingBar standings={standings} />

              <ModelHealth />
            </div>
          </div>

          {/* Game Detail Sheet */}
          <GameDetailSheet
            game={selectedGame}
            open={!!selectedGame}
            onClose={closeGame}
          />
        </Container>
      </Section>
    </main>
  );
}
