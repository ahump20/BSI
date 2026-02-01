'use client';

import { Badge } from '@/components/ui/Badge';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const variant = status === 'committed' ? 'success' : status === 'entered' ? 'primary' : 'secondary';
  return <Badge variant={variant} className={className}>{status}</Badge>;
}

interface PortalCardProps {
  children: React.ReactNode;
  className?: string;
}

export function PortalCard({ children, className = '' }: PortalCardProps) {
  return <div className={`bg-charcoal border border-border-subtle rounded-xl p-4 ${className}`}>{children}</div>;
}

export function PortalCardGrid({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>{children}</div>;
}

interface PortalFiltersProps {
  onFilterChange?: (filters: Record<string, string>) => void;
}

export function PortalFilters({ onFilterChange }: PortalFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <select className="bg-charcoal border border-border-subtle rounded-lg px-3 py-1.5 text-white text-sm" onChange={(e) => onFilterChange?.({ sport: e.target.value })}>
        <option value="">All Sports</option>
        <option value="baseball">Baseball</option>
        <option value="football">Football</option>
        <option value="basketball">Basketball</option>
      </select>
    </div>
  );
}

interface PortalHeroProps {
  title?: string;
  subtitle?: string;
}

export function PortalHero({ title = 'Transfer Portal', subtitle }: PortalHeroProps) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-white">{title}</h1>
      {subtitle && <p className="text-text-secondary mt-2">{subtitle}</p>}
    </div>
  );
}
