'use client';

/**
 * Cross-Sport Search Bar Component
 *
 * Provides unified search across teams, players, and games for all sports.
 * Features debounced search, keyboard navigation, and grouped results.
 *
 * Sports: MLB, NFL, NBA, NCAA (Baseball, Football, Basketball)
 *
 * Last Updated: 2025-01-07
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface SearchResult {
  id: string;
  type: 'team' | 'player' | 'game';
  name: string;
  subtitle?: string;
  sport: string;
  href: string;
  logo?: string;
  badge?: string;
}

interface SearchResultGroup {
  label: string;
  results: SearchResult[];
}

interface SearchBarProps {
  /** Placeholder text */
  placeholder?: string;
  /** Additional class names */
  className?: string;
  /** Variant for different contexts */
  variant?: 'navbar' | 'page' | 'modal';
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Callback when search is performed */
  onSearch?: (query: string) => void;
}

// ============================================================================
// Sport Display Helpers
// ============================================================================

const SPORT_LABELS: Record<string, string> = {
  mlb: 'MLB',
  nfl: 'NFL',
  nba: 'NBA',
  college_baseball: 'NCAA Baseball',
  cfb: 'NCAA Football',
  cbb: 'NCAA Basketball',
};

const SPORT_COLORS: Record<string, string> = {
  mlb: 'bg-red-600',
  nfl: 'bg-blue-700',
  nba: 'bg-orange-600',
  college_baseball: 'bg-amber-700',
  cfb: 'bg-green-700',
  cbb: 'bg-purple-700',
};

function getSportLabel(sport: string): string {
  return SPORT_LABELS[sport.toLowerCase()] || sport.toUpperCase();
}

function getSportColor(sport: string): string {
  return SPORT_COLORS[sport.toLowerCase()] || 'bg-gray-600';
}

// ============================================================================
// Search Bar Component
// ============================================================================

export function SearchBar({
  placeholder = 'Search teams, players, games...',
  className,
  variant = 'navbar',
  autoFocus = false,
  onSearch,
}: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResultGroup[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  // Flatten results for keyboard navigation
  const flatResults = results.flatMap((group) => group.results);

  // ========================================================================
  // Debounced Search
  // ========================================================================

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch teams from existing API
        const teamsRes = await fetch(`/api/teams/search?q=${encodeURIComponent(query)}&limit=6`);

        const groups: SearchResultGroup[] = [];

        if (teamsRes.ok) {
          const teams = await teamsRes.json();
          if (Array.isArray(teams) && teams.length > 0) {
            groups.push({
              label: 'Teams',
              results: teams.map((team: any) => ({
                id: `team-${team.id}`,
                type: 'team' as const,
                name: team.name,
                subtitle: team.conference,
                sport: team.sport,
                href: buildTeamHref(team.sport, team.id),
                badge: getSportLabel(team.sport),
              })),
            });
          }
        }

        // Quick links for common searches
        if (groups.length === 0) {
          // No results - show quick links
          groups.push({
            label: 'Quick Links',
            results: [
              {
                id: 'quick-mlb',
                type: 'team' as const,
                name: 'Browse MLB Teams',
                sport: 'mlb',
                href: '/mlb/teams',
                badge: 'MLB',
              },
              {
                id: 'quick-nfl',
                type: 'team' as const,
                name: 'Browse NFL Teams',
                sport: 'nfl',
                href: '/nfl/teams',
                badge: 'NFL',
              },
              {
                id: 'quick-ncaa',
                type: 'team' as const,
                name: 'Browse College Baseball',
                sport: 'college_baseball',
                href: '/college-baseball/teams',
                badge: 'NCAA',
              },
            ],
          });
        }

        setResults(groups);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Search error:', err);
        setError('Search failed. Please try again.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  // ========================================================================
  // Build URLs based on sport
  // ========================================================================

  function buildTeamHref(sport: string, teamId: string): string {
    const sportLower = sport.toLowerCase();
    switch (sportLower) {
      case 'mlb':
        return `/mlb/teams/${teamId}`;
      case 'nfl':
        return `/nfl/teams/${teamId}`;
      case 'nba':
        return `/nba/teams/${teamId}`;
      case 'college_baseball':
        return `/college-baseball/teams/${teamId}`;
      case 'cfb':
        return `/college-football/teams/${teamId}`;
      case 'cbb':
        return `/college-basketball/teams/${teamId}`;
      default:
        return `/teams/${teamId}`;
    }
  }

  // ========================================================================
  // Keyboard Navigation
  // ========================================================================

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || flatResults.length === 0) {
        if (e.key === 'Enter' && query.length >= 2) {
          // Navigate to search results page
          router.push(`/search?q=${encodeURIComponent(query)}`);
          setIsOpen(false);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && flatResults[selectedIndex]) {
            router.push(flatResults[selectedIndex].href);
            setIsOpen(false);
            setQuery('');
          } else if (query.length >= 2) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
            setIsOpen(false);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, flatResults, selectedIndex, query, router]
  );

  // ========================================================================
  // Click Outside Handler
  // ========================================================================

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ========================================================================
  // Render
  // ========================================================================

  const isNavbar = variant === 'navbar';

  return (
    <div
      ref={containerRef}
      className={cn('relative', isNavbar ? 'w-full max-w-xs lg:max-w-sm' : 'w-full', className)}
    >
      {/* Search Input */}
      <div className="relative">
        <SearchIcon
          className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary',
            isNavbar ? 'w-4 h-4' : 'w-5 h-5'
          )}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            'w-full bg-graphite border border-border-subtle rounded-lg',
            'text-white placeholder:text-text-tertiary',
            'focus:outline-none focus:border-burnt-orange focus:ring-1 focus:ring-burnt-orange/50',
            'transition-colors',
            isNavbar ? 'pl-9 pr-4 py-2 text-sm' : 'pl-11 pr-4 py-3 text-base'
          )}
          aria-label="Search"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
          aria-autocomplete="list"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <LoadingSpinner className="w-4 h-4" />
          </div>
        )}
        {!isLoading && query.length > 0 && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 right-0 mt-2 z-50',
            'bg-midnight border border-border-subtle rounded-lg shadow-xl',
            'max-h-[70vh] overflow-y-auto',
            'animate-in fade-in slide-in-from-top-2 duration-200'
          )}
          role="listbox"
        >
          {error ? (
            <div className="p-4 text-center text-text-secondary">{error}</div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((group, groupIndex) => (
                <div key={group.label}>
                  {/* Group Header */}
                  <div className="px-4 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    {group.label}
                  </div>

                  {/* Group Results */}
                  {group.results.map((result, resultIndex) => {
                    const flatIndex =
                      results.slice(0, groupIndex).reduce((acc, g) => acc + g.results.length, 0) +
                      resultIndex;
                    const isSelected = flatIndex === selectedIndex;

                    return (
                      <Link
                        key={result.id}
                        href={result.href}
                        onClick={() => {
                          setIsOpen(false);
                          setQuery('');
                        }}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors',
                          isSelected && 'bg-burnt-orange/10'
                        )}
                        role="option"
                        aria-selected={isSelected}
                      >
                        {/* Result Icon/Logo */}
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold',
                            getSportColor(result.sport)
                          )}
                        >
                          {result.type === 'team' ? (
                            <TeamIcon className="w-5 h-5" />
                          ) : result.type === 'player' ? (
                            <PlayerIcon className="w-5 h-5" />
                          ) : (
                            <GameIcon className="w-5 h-5" />
                          )}
                        </div>

                        {/* Result Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{result.name}</p>
                          {result.subtitle && (
                            <p className="text-xs text-text-tertiary truncate">{result.subtitle}</p>
                          )}
                        </div>

                        {/* Sport Badge */}
                        {result.badge && (
                          <span
                            className={cn(
                              'px-2 py-0.5 text-xs font-semibold rounded',
                              getSportColor(result.sport),
                              'text-white'
                            )}
                          >
                            {result.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}

              {/* View All Results */}
              {query.length >= 2 && (
                <div className="border-t border-border-subtle mt-2 pt-2 px-4 pb-2">
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 py-2 text-sm text-burnt-orange hover:text-burnt-orange-light transition-colors"
                  >
                    View all results for "{query}"
                    <ChevronRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-text-secondary">
              No results found for "{query}"
            </div>
          )}

          {/* Keyboard Shortcuts */}
          <div className="border-t border-border-subtle px-4 py-2 flex items-center gap-4 text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-graphite rounded text-[10px]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-graphite rounded text-[10px]">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-graphite rounded text-[10px]">esc</kbd>
              Close
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Icons
// ============================================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
      <path
        d="M12 2a10 10 0 019.33 6.33"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TeamIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function PlayerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function GameIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export default SearchBar;
