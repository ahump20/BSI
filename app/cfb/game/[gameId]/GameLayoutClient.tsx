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

const CFB_CONFIG = {
  sportSlug: 'cfb',
  apiPrefix: '/api/cfb',
  pollInterval: 30_000,
  defaultDataSource: 'ESPN CFB API',
  breadcrumb: {
    sportLabel: 'CFB',
    sportHref: '/cfb',
    scoresLabel: 'Scores',
    scoresHref: '/cfb/scores',
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
    return `${away.team?.abbreviation || 'Away'} @ ${home.team?.abbreviation || 'Home'}`;
  },
  renderScoreboard: (game: EspnGameData, meta: import('@/lib/types/data-meta').DataMeta | null): ReactNode => (
    <EspnScoreboard game={game} meta={meta} sportLabel="CFB" periodPrefix="Q" defaultPeriods={4} />
  ),
};

interface GameLayoutClientProps {
  children: ReactNode;
}

export default function GameLayoutClient({ children }: GameLayoutClientProps): ReactNode {
  return <GameLayoutShell config={CFB_CONFIG}>{children}</GameLayoutShell>;
}
