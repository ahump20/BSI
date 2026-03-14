'use client';

import type { ReactNode } from 'react';
import GameLayoutShell, { useGameData } from '@/components/sports/GameLayoutShell';
import {
  EspnScoreboard,
  type EspnGameData,
  type EspnCompetitor,
  type EspnLeader,
  type EspnPlay,
} from '@/components/sports/scoreboards/EspnScoreboard';
import { deriveEspnTeams } from '@/components/sports/scoreboards/EspnScoreboard';

// Re-export types under their original names so layout.tsx and child pages
// continue to import from this file without changes.
export type GameData = EspnGameData;
export type Competitor = EspnCompetitor;
export type Leader = EspnLeader;
export type Play = EspnPlay;
export { useGameData };

const NFL_CONFIG = {
  sportSlug: 'nfl',
  apiPrefix: '/api/nfl',
  pollInterval: 30_000,
  defaultDataSource: 'ESPN NFL API',
  placeholderRedirect: '/nfl/games',
  breadcrumb: {
    sportLabel: 'NFL',
    sportHref: '/nfl',
    scoresLabel: 'Games',
    scoresHref: '/nfl/games',
  },
  tabs: [
    { id: 'summary', label: 'Summary', segment: '' },
    { id: 'box-score', label: 'Box Score', segment: 'box-score' },
    { id: 'play-by-play', label: 'Play-by-Play', segment: 'play-by-play' },
    { id: 'team-stats', label: 'Team Stats', segment: 'team-stats' },
    { id: 'recap', label: 'Recap', segment: 'recap' },
  ],
  isLive: (game: EspnGameData): boolean => game.status?.type?.state === 'in',
  getMatchupLabel: (game: EspnGameData): string | null => {
    const { home, away } = deriveEspnTeams(game);
    if (!home || !away) return null;
    return `${away.team?.abbreviation || 'Away'} vs ${home.team?.abbreviation || 'Home'}`;
  },
  renderScoreboard: (game: EspnGameData, meta: import('@/lib/types/data-meta').DataMeta | null): ReactNode => (
    <EspnScoreboard game={game} meta={meta} sportLabel="NFL" periodPrefix="Q" defaultPeriods={4} />
  ),
};

interface GameLayoutClientProps {
  children: ReactNode;
}

export default function GameLayoutClient({ children }: GameLayoutClientProps): ReactNode {
  return <GameLayoutShell config={NFL_CONFIG}>{children}</GameLayoutShell>;
}
