/**
 * BSI UI Components - Central Export
 *
 * Core design system primitives with covenant styling
 */

// Badge components
export {
  Badge,
  LiveBadge,
  FireBadge,
  ChampionshipBadge,
  GameStatusBadge,
  DataSourceBadge,
} from './Badge';
export type { BadgeProps, GameStatus } from './Badge';

// Button components
export { Button, FireButton, IconButton } from './Button';
export type { ButtonProps } from './Button';

// Card components
export { Card, CardHeader, CardTitle, CardContent, StatCard, SportStatCard } from './Card';
export type { CardProps, StatCardProps } from './Card';

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
export {
  Skeleton,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonScoreCard,
  SkeletonStatCard,
  SkeletonStandingsRow,
  SkeletonPlayerCard,
  SkeletonHero,
} from './Skeleton';
export type { SkeletonProps } from './Skeleton';

// Marquee
export { Marquee } from './Marquee';

// Quote Block
export { QuoteBlock } from './QuoteBlock';

// Live ticker
export { LiveTicker } from './LiveTicker';
