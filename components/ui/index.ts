/**
 * BSI UI Components - Central Export
 *
 * Core design system primitives
 */

// Badge components
export { Badge, LiveBadge, GameStatusBadge, DataSourceBadge } from './Badge';
export type { BadgeProps, GameStatus } from './Badge';

// Button
export { Button } from './Button';
export type { ButtonProps } from './Button';

// Card components
export { Card, CardHeader, CardTitle, CardContent, StatCard } from './Card';
export type { CardProps, StatCardProps, CardVariant, SportAccent } from './Card';

// Empty state
export { EmptyState } from './EmptyState';
export type { EmptyStateProps, EmptyStateIcon } from './EmptyState';

// Layout
export { Container } from './Container';
export type { ContainerProps } from './Container';

export { Section } from './Section';
export type { SectionProps } from './Section';

// Form
export { Input } from './Input';
export type { InputProps } from './Input';

// Typography
export { Kicker } from './Kicker';
export type { KickerProps } from './Kicker';

export { PageHeader } from './PageHeader';
export type { PageHeaderProps } from './PageHeader';

// Loading states
export { Skeleton, SkeletonCard, SkeletonTableRow, SkeletonScoreCard } from './Skeleton';
export type { SkeletonProps } from './Skeleton';

// Marquee
export { Marquee } from './Marquee';

// Live Scores Marquee
export { LiveScoresMarquee } from './LiveScoresMarquee';
export type {
  LiveScoresMarqueeProps,
  TickerGame,
  GameStatus as TickerGameStatus,
  SportType,
} from './LiveScoresMarquee';

// Quote Block
export { QuoteBlock } from './QuoteBlock';

// StatCard (animated stats)
export { StatCard as AnimatedStatCard } from './StatCard';
export type { StatCardProps as AnimatedStatCardProps } from './StatCard';

// Team-themed components
export { TeamThemedCard, TeamBadge, TeamAccentText, TeamDivider } from './TeamThemedCard';
export type { TeamThemedCardProps } from './TeamThemedCard';

// Live ticker (re-exported from dedicated module)
export { LiveTicker } from '../live-ticker/LiveTicker';

// Tooltip
export { Tooltip } from './Tooltip';
export type { TooltipProps, TooltipPosition } from './Tooltip';

// Breadcrumb
export { Breadcrumb } from './Breadcrumb';
export type { BreadcrumbProps, BreadcrumbItem } from './Breadcrumb';
