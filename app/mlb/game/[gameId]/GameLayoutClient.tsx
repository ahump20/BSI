'use client';

import type { ReactNode } from 'react';
import GameLayoutShell, { useGameData } from '@/components/sports/GameLayoutShell';
import {
  BaseballScoreboard,
  type BaseballGameData,
} from '@/components/sports/scoreboards/BaseballScoreboard';

// Re-export the game data type under its original name so layout.tsx and
// child pages continue to import from this file without changes.
export type GameData = BaseballGameData;
export { useGameData };

const MLB_CONFIG = {
  sportSlug: 'mlb',
  apiPrefix: '/api/mlb',
  pollInterval: 30_000,
  defaultDataSource: 'MLB Stats API',
  breadcrumb: {
    sportLabel: 'MLB',
    sportHref: '/mlb',
    scoresLabel: 'Scores',
    scoresHref: '/mlb/scores',
  },
  tabs: [
    { id: 'summary', label: 'Summary', segment: '' },
    { id: 'box-score', label: 'Box Score', segment: 'box-score' },
    { id: 'play-by-play', label: 'Play-by-Play', segment: 'play-by-play' },
    { id: 'team-stats', label: 'Team Stats', segment: 'team-stats' },
    { id: 'recap', label: 'Recap', segment: 'recap' },
  ],
  isLive: (game: BaseballGameData): boolean => game.status.isLive,
  getMatchupLabel: (game: BaseballGameData): string | null =>
    `${game.teams.away.abbreviation} @ ${game.teams.home.abbreviation}`,
  renderScoreboard: (game: BaseballGameData, meta: import('@/lib/types/data-meta').DataMeta | null): ReactNode => (
    <BaseballScoreboard game={game} meta={meta} />
  ),
};

interface GameLayoutClientProps {
  children: ReactNode;
}

export default function GameLayoutClient({ children }: GameLayoutClientProps): ReactNode {
  return <GameLayoutShell config={MLB_CONFIG}>{children}</GameLayoutShell>;
}
