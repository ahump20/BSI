/**
 * Game Detail Modal Types
 *
 * Props and interfaces for the ESPN-style game detail modal system.
 */

import type {
  UnifiedGame,
  UnifiedBoxScore,
  NormalizedPlay,
  VideoHighlight,
  GameRecap,
  GameDetailTab,
  UnifiedSportKey,
} from '@/lib/types/adapters';

export interface GameDetailModalProps {
  gameId: string | null;
  sport: UnifiedSportKey;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: GameDetailTab;
}

export interface ModalHeaderProps {
  game: UnifiedGame;
  onClose: () => void;
}

export interface TabNavigationProps {
  activeTab: GameDetailTab;
  onTabChange: (tab: GameDetailTab) => void;
  sport: UnifiedSportKey;
  gameStatus: UnifiedGame['status'];
  availableTabs: GameDetailTab[];
}

export interface GamecastTabProps {
  game: UnifiedGame;
  boxScore: UnifiedBoxScore | null;
  recentPlays: NormalizedPlay[];
  loading: boolean;
}

export interface RecapTabProps {
  recap: GameRecap | null;
  game: UnifiedGame;
  loading: boolean;
}

export interface BoxScoreTabProps {
  boxScore: UnifiedBoxScore | null;
  sport: UnifiedSportKey;
  loading: boolean;
}

export interface PlayByPlayTabProps {
  plays: NormalizedPlay[];
  sport: UnifiedSportKey;
  loading: boolean;
}

export interface TeamStatsTabProps {
  boxScore: UnifiedBoxScore | null;
  sport: UnifiedSportKey;
  loading: boolean;
}

export interface VideosTabProps {
  videos: VideoHighlight[];
  loading: boolean;
}
