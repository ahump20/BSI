'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import type { EvaluationSport } from '@/lib/evaluate/metrics';
import { SPORT_LABELS } from '@/lib/evaluate/metrics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchResult {
  id: string;
  name: string;
  sport: string;
  team: string;
  position: string;
  url: string;
  sportLabel: string;
}

interface PlayerSearchProps {
  /** Called when a player is selected */
  onSelect?: (result: SearchResult) => void;
  /** Navigate on select instead of calling onSelect */
  navigateOnSelect?: boolean;
  /** Pre-filter to a specific sport */
  sportFilter?: EvaluationSport | '';
  /** Placeholder text */
  placeholder?: string;
  /** Auto-focus the input */
  autoFocus?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Sport Filter Pills
// ---------------------------------------------------------------------------

const SPORT_OPTIONS: Array<{ value: EvaluationSport | ''; label: string }> = [
  { value: '', label: 'All Sports' },
  { value: 'college-baseball', label: 'College Baseball' },
  { value: 'mlb', label: 'MLB' },
  { value: 'nfl', label: 'NFL' },
  { value: 'nba', label: 'NBA' },
];

function SportPills({
  selected,
  onChange,
}: {
  selected: EvaluationSport | '';
  onChange: (v: EvaluationSport | '') => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {SPORT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 text-xs font-mono uppercase tracking-wide rounded-sm border transition-colors ${
            selected === opt.value
              ? 'bg-burnt-orange/20 text-burnt-orange border-burnt-orange/30'
              : 'bg-transparent text-text-muted border-border-subtle hover:text-text-secondary hover:border-border-strong'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sport Badge Color
// ---------------------------------------------------------------------------

function sportBadgeVariant(sport: string): 'primary' | 'secondary' | 'accent' | 'info' {
  switch (sport) {
    case 'college-baseball': return 'primary';
    case 'mlb': return 'accent';
    case 'nfl': return 'info';
    case 'nba': return 'secondary';
    default: return 'secondary';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlayerSearch({
  onSelect,
  navigateOnSelect = false,
  sportFilter: initialSportFilter = '',
  placeholder = 'Search players across all sports\u2026',
  autoFocus = false,
  className = '',
}: PlayerSearchProps) {
  const [query, setQuery] = useState('');
  const [sport, setSport] = useState<EvaluationSport | ''>(initialSportFilter);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q: query });
        if (sport) params.set('sport', sport);
        const res = await fetch(`/api/evaluate/search?${params}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = (await res.json()) as { results: SearchResult[] };
          setResults(data.results || []);
          setShowDropdown(true);
        }
      } catch {
        // Aborted or network error — ignore
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, sport]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setShowDropdown(false);
      setQuery(result.name);
      onSelect?.(result);
    },
    [onSelect]
  );

  return (
    <div ref={containerRef} className={`space-y-3 ${className}`}>
      {/* Sport filter pills */}
      {!initialSportFilter && <SportPills selected={sport} onChange={setSport} />}

      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full px-4 py-3 bg-surface-dugout border border-border-subtle rounded-sm text-text-primary placeholder-text-muted text-sm font-body focus:outline-none focus:border-burnt-orange/50 transition-colors"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
          </div>
        )}

        {/* Results dropdown */}
        {showDropdown && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface-dugout border border-border-subtle rounded-sm shadow-lg z-50 max-h-80 overflow-y-auto">
            {results.map((r) => {
              const content = (
                <div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-press-box transition-colors cursor-pointer border-b border-border-subtle last:border-b-0">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{r.name}</p>
                    <p className="text-[11px] text-text-muted">
                      {r.position && `${r.position} · `}{r.team}
                    </p>
                  </div>
                  <Badge variant={sportBadgeVariant(r.sport)} size="sm">
                    {r.sportLabel}
                  </Badge>
                </div>
              );

              if (navigateOnSelect) {
                return (
                  <Link key={`${r.sport}-${r.id}`} href={r.url} onClick={() => setShowDropdown(false)}>
                    {content}
                  </Link>
                );
              }

              return (
                <div key={`${r.sport}-${r.id}`} onClick={() => handleSelect(r)}>
                  {content}
                </div>
              );
            })}
          </div>
        )}

        {/* No results */}
        {showDropdown && query.length >= 2 && results.length === 0 && !searching && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface-dugout border border-border-subtle rounded-sm shadow-lg z-50">
            <p className="px-4 py-3 text-sm text-text-muted text-center">
              No players found for &ldquo;{query}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
