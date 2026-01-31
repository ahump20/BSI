'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { type Sport } from './PositionIcon';

export interface FilterState {
  position: string;
  conference: string;
  status: string;
  search: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface PortalFiltersProps {
  sport?: Sport;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
  positions?: FilterOption[];
  conferences?: FilterOption[];
  className?: string;
}

// Default positions for each sport
const BASEBALL_POSITIONS: FilterOption[] = [
  { value: '', label: 'All Positions' },
  { value: 'P', label: 'Pitchers' },
  { value: 'C', label: 'Catchers' },
  { value: 'INF', label: 'Infielders' },
  { value: 'OF', label: 'Outfielders' },
  { value: 'UTL', label: 'Utility' },
];

const FOOTBALL_POSITIONS: FilterOption[] = [
  { value: '', label: 'All Positions' },
  { value: 'QB', label: 'Quarterbacks' },
  { value: 'RB', label: 'Running Backs' },
  { value: 'WR', label: 'Wide Receivers' },
  { value: 'TE', label: 'Tight Ends' },
  { value: 'OL', label: 'Offensive Line' },
  { value: 'DL', label: 'Defensive Line' },
  { value: 'LB', label: 'Linebackers' },
  { value: 'DB', label: 'Defensive Backs' },
  { value: 'K', label: 'Specialists' },
];

// Default conferences
const BASEBALL_CONFERENCES: FilterOption[] = [
  { value: '', label: 'All Conferences' },
  { value: 'SEC', label: 'SEC' },
  { value: 'ACC', label: 'ACC' },
  { value: 'Big 12', label: 'Big 12' },
  { value: 'Big Ten', label: 'Big Ten' },
  { value: 'Pac-12', label: 'Pac-12' },
  { value: 'Big East', label: 'Big East' },
  { value: 'AAC', label: 'AAC' },
  { value: 'Sun Belt', label: 'Sun Belt' },
  { value: 'C-USA', label: 'C-USA' },
  { value: 'MWC', label: 'Mountain West' },
  { value: 'WCC', label: 'WCC' },
];

const FOOTBALL_CONFERENCES: FilterOption[] = [
  { value: '', label: 'All Conferences' },
  { value: 'SEC', label: 'SEC' },
  { value: 'Big Ten', label: 'Big Ten' },
  { value: 'Big 12', label: 'Big 12' },
  { value: 'ACC', label: 'ACC' },
  { value: 'Pac-12', label: 'Pac-12' },
  { value: 'AAC', label: 'AAC' },
  { value: 'MWC', label: 'Mountain West' },
  { value: 'Sun Belt', label: 'Sun Belt' },
  { value: 'MAC', label: 'MAC' },
  { value: 'C-USA', label: 'C-USA' },
];

const STATUS_OPTIONS: FilterOption[] = [
  { value: '', label: 'All Status' },
  { value: 'in_portal', label: 'In Portal' },
  { value: 'committed', label: 'Committed' },
  { value: 'signed', label: 'Signed' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

// Search icon component
function SearchIcon() {
  return (
    <svg
      className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21L16.65 16.65" />
    </svg>
  );
}

export function PortalFilters({
  sport = 'baseball',
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
  positions,
  conferences,
  className,
}: PortalFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const positionOptions =
    positions || (sport === 'football' ? FOOTBALL_POSITIONS : BASEBALL_POSITIONS);
  const conferenceOptions =
    conferences || (sport === 'football' ? FOOTBALL_CONFERENCES : BASEBALL_CONFERENCES);

  const updateFilter = useCallback(
    (key: keyof FilterState, value: string) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    onFiltersChange({ position: '', conference: '', status: '', search: '' });
  }, [onFiltersChange]);

  const hasActiveFilters =
    filters.position || filters.conference || filters.status || filters.search;
  const activeFilterCount = [
    filters.position,
    filters.conference,
    filters.status,
    filters.search,
  ].filter(Boolean).length;

  return (
    <div
      className={cn(
        'sticky top-20 z-30',
        'rounded-xl border border-border-subtle',
        'bg-gradient-to-br from-charcoal-800/30 to-charcoal-900/30',
        'backdrop-blur-sm',
        className
      )}
    >
      {/* Main filter row */}
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search input */}
          <div className="flex-grow">
            <div className="relative">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search players..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 rounded-lg',
                  'bg-charcoal-700/50 border border-border-subtle',
                  'text-text-primary placeholder:text-text-muted',
                  'outline-none transition-all duration-200',
                  'focus:border-burnt-orange/40 focus:ring-1 focus:ring-burnt-orange/20',
                  'focus:shadow-[0_0_12px_rgba(191,87,0,0.1)]'
                )}
              />
            </div>
          </div>

          {/* Filter dropdowns - desktop */}
          <div className="hidden md:flex flex-wrap gap-3">
            <FilterSelect
              value={filters.position}
              onChange={(value) => updateFilter('position', value)}
              options={positionOptions}
            />
            <FilterSelect
              value={filters.conference}
              onChange={(value) => updateFilter('conference', value)}
              options={conferenceOptions}
            />
            <FilterSelect
              value={filters.status}
              onChange={(value) => updateFilter('status', value)}
              options={STATUS_OPTIONS}
            />
          </div>

          {/* Mobile expand button */}
          <button
            className="md:hidden flex items-center gap-2 px-4 py-2.5 rounded-lg bg-charcoal-700/50 border border-border-subtle text-text-primary text-sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <svg
              className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-burnt-orange text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile filters - expandable */}
        {isExpanded && (
          <div className="md:hidden mt-4 pt-4 border-t border-border-subtle space-y-3">
            <FilterSelect
              value={filters.position}
              onChange={(value) => updateFilter('position', value)}
              options={positionOptions}
              fullWidth
            />
            <FilterSelect
              value={filters.conference}
              onChange={(value) => updateFilter('conference', value)}
              options={conferenceOptions}
              fullWidth
            />
            <FilterSelect
              value={filters.status}
              onChange={(value) => updateFilter('status', value)}
              options={STATUS_OPTIONS}
              fullWidth
            />
          </div>
        )}

        {/* Results count and clear */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-text-tertiary">
            Showing <span className="text-text-primary font-medium">{filteredCount}</span> of{' '}
            <span className="text-text-primary">{totalCount}</span> entries
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-burnt-orange hover:text-burnt-orange-400 transition-colors flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Individual filter select component
function FilterSelect({
  value,
  onChange,
  options,
  fullWidth = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  fullWidth?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'px-3 py-2.5 rounded-lg',
        'bg-charcoal-700/50 border border-border-subtle',
        'text-text-primary text-sm',
        'outline-none cursor-pointer',
        'transition-all duration-200',
        'focus:border-burnt-orange/40',
        'hover:border-burnt-orange/20',
        fullWidth && 'w-full'
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// Quick filter chips (optional enhancement)
export function QuickFilterChips({
  activeFilter,
  onFilterChange,
  className,
}: {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  className?: string;
}) {
  const chips = [
    { value: '', label: 'All' },
    { value: 'in_portal', label: 'In Portal' },
    { value: 'committed', label: 'Committed' },
    { value: 'withdrawn', label: 'Withdrawn' },
  ];

  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-2', className)}>
      {chips.map((chip) => (
        <button
          key={chip.value}
          onClick={() => onFilterChange(chip.value)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap',
            'transition-all duration-200',
            activeFilter === chip.value
              ? 'bg-burnt-orange text-white shadow-[0_0_12px_rgba(191,87,0,0.3)]'
              : 'bg-charcoal-700/50 text-text-secondary hover:text-text-primary hover:bg-charcoal-700'
          )}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
