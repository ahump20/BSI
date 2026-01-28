/**
 * Game Detail Modal Components
 *
 * ESPN-style game detail modal system with tabbed navigation,
 * box scores, play-by-play, video highlights, and more.
 */

// Main modal
export { GameDetailModal, GameDetailModalSkeleton } from './GameDetailModal';

// Types
export type {
  GameDetailModalProps,
  ModalHeaderProps,
  TabNavigationProps,
  GamecastTabProps,
  RecapTabProps,
  BoxScoreTabProps,
  PlayByPlayTabProps,
  TeamStatsTabProps,
  VideosTabProps,
} from './GameDetailModal.types';

// Shared components (for custom implementations)
export { ModalHeader } from './shared/ModalHeader';
export { TabNavigation } from './shared/TabNavigation';

// Tab components (for standalone use)
export { GamecastTab } from './tabs/GamecastTab';
export { IntelTab, type IntelTabProps } from './tabs/IntelTab';
export { RecapTab } from './tabs/RecapTab';
export { BoxScoreTab } from './tabs/BoxScoreTab';
export { PlayByPlayTab } from './tabs/PlayByPlayTab';
export { TeamStatsTab } from './tabs/TeamStatsTab';
export { VideosTab } from './tabs/VideosTab';

// Full-page game detail components
export { GameHeader, type GameHeaderProps } from './GameHeader';
export { WinProbabilityChart } from './WinProbabilityChart';
