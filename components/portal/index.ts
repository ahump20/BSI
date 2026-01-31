// Portal Component Library
// Shared components for Transfer Portal Tracker across baseball and football

// Re-export types from lib/portal for convenience
export type {
  PortalEntry,
  PortalSport,
  PortalFilters as PortalFilterConfig,
  PortalStats,
} from '@/lib/portal/types';

// Status Badge with animated pulse dot
export { StatusBadge, type PortalStatus, type StatusBadgeProps } from './StatusBadge';

// Star Rating for recruiting (primarily CFB)
export { StarRating, EliteBadge, type StarRatingProps } from './StarRating';

// Position Icons with sport-specific variants
export {
  PositionIcon,
  PositionIconContainer,
  type PositionIconProps,
  type Sport,
} from './PositionIcon';

// Portal Card - main entry display
export { PortalCard, PortalCardGrid, type PortalCardProps } from './PortalCard';

// Filter Bar with search and dropdowns
export {
  PortalFilters,
  QuickFilterChips,
  type FilterState,
  type FilterOption,
  type PortalFiltersProps,
} from './PortalFilters';

// Status Legend for explaining portal statuses
export { StatusLegend, type StatusLegendProps } from './StatusLegend';
