// Existing components
export { SportTabs, SportTabsCompact, type Sport } from './SportTabs';
export { ScoreCard, ScoreCardSkeleton, ScoreCardGrid, type ScoreCardProps } from './ScoreCard';
export { LiveScoresPanel } from './LiveScoresPanel';
export { StandingsTable } from './StandingsTable';
export { SportsGrid } from './SportsGrid';

// Design system components (ESPN-grade)
export { Tabs, type Tab, type TabsProps } from './Tabs';
export { StatTable, type Column, type StatTableProps } from './StatTable';
export { ScoreHeader, type ScoreHeaderGame, type TeamInfo, type GameStatus } from './ScoreHeader';
export { BottomNav, DEFAULT_NAV_ITEMS, type NavItem } from './BottomNav';

// Team comparison and analytics
export {
  TeamComparison,
  TeamComparisonSkeleton,
  type TeamComparisonProps,
  type TeamStats,
} from './TeamComparison';

// Historical context and tidbits
export {
  HistoricalContext,
  createRivalryFact,
  createStreakFact,
  createMilestoneFact,
  type ContextualFact,
  type FactType,
  type HistoricalContextProps,
} from './HistoricalContext';

// Sport page containers
export {
  SportPage,
  SportPageTwoColumn,
  GameDetailLayout,
  TeamComparisonSelector,
  type SportPageProps,
  type SportPageSection,
} from './SportPage';

// Player stats table
export {
  PlayerStatsTable,
  PlayerStatsTableSkeleton,
  type PlayerStatsTableProps,
} from './PlayerStatsTable';

// Data transparency and citation system
export {
  CitationFooter,
  DataFreshnessIndicator,
  DataSourceBadgeInline,
  DataSourcePanel,
  DataDisclaimer,
  type DataSource,
  type DataMeta,
} from './DataTransparency';
