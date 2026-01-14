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
export { Skeleton, SkeletonCard, SkeletonTableRow, SkeletonScoreCard } from './Skeleton';
export type { SkeletonProps } from './Skeleton';

// Marquee
export { Marquee } from './Marquee';

// Quote Block
export { QuoteBlock } from './QuoteBlock';

// Live ticker (re-exported from dedicated module)
export { LiveTicker } from '../live-ticker/LiveTicker';

// TailAdmin-inspired components
export { StatsCard } from './StatsCard';
export type { StatsCardProps } from './StatsCard';

export { DataTable } from './DataTable';
export type { DataTableProps, ColumnDef } from './DataTable';

export { ChartCard } from './ChartCard';
export type { ChartCardProps } from './ChartCard';

export { ProgressBar } from './ProgressBar';
export type { ProgressBarProps } from './ProgressBar';

export { Dropdown } from './Dropdown';
export type { DropdownProps, DropdownItem } from './Dropdown';

export { Tabs } from './Tabs';
export type { TabsProps, Tab } from './Tabs';
