'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface SearchResult {
  type: 'team' | 'player' | 'article';
  id: string;
  label: string;
  subtitle?: string;
  url?: string;
}

interface SearchResponse {
  teams?: SearchResult[];
  players?: SearchResult[];
  articles?: SearchResult[];
}

const categoryLabels: Record<string, string> = {
  teams: 'Teams',
  players: 'Players',
  articles: 'Articles',
};

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse>({});
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flatten results for keyboard navigation
  const flatResults: SearchResult[] = [
    ...(results.teams || []),
    ...(results.players || []),
    ...(results.articles || []),
  ];

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults({});
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/college-baseball/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = (await res.json()) as SearchResponse;
      setResults(data);
      setIsOpen(true);
      setActiveIndex(-1);
    } catch {
      setResults({});
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced input handler
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, fetchSuggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(result: SearchResult) {
    setQuery(result.label);
    setIsOpen(false);
    if (result.url) {
      window.location.href = result.url;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || flatResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatResults.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < flatResults.length) {
          handleSelect(flatResults[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  // Track cumulative index across categories for active highlighting
  let cumulativeIndex = 0;

  return (
    <div className="relative w-full max-w-xl">
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (flatResults.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search teams, players, articles..."
          className="w-full pl-10 pr-4 py-3 rounded-lg bg-graphite border border-border-subtle text-white placeholder:text-text-tertiary font-mono text-sm focus:outline-none focus:border-burnt-orange focus:ring-1 focus:ring-burnt-orange/50 transition-colors"
          aria-label="Search college baseball"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="search-dropdown"
          role="combobox"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && flatResults.length > 0 && (
        <div
          ref={dropdownRef}
          id="search-dropdown"
          role="listbox"
          className="absolute z-50 top-full mt-2 w-full rounded-lg bg-charcoal border border-border-subtle shadow-xl overflow-hidden"
        >
          {(['teams', 'players', 'articles'] as const).map((category) => {
            const items = results[category];
            if (!items || items.length === 0) return null;

            const sectionStart = cumulativeIndex;

            return (
              <div key={category}>
                <div className="px-3 py-2 bg-midnight/50 border-b border-border-subtle">
                  <span className="text-text-tertiary text-xs font-bold uppercase tracking-wider">
                    {categoryLabels[category]}
                  </span>
                </div>
                {items.map((item, i) => {
                  const globalIndex = sectionStart + i;
                  const isActive = globalIndex === activeIndex;
                  // Update cumulative index after last item in section
                  if (i === items.length - 1) {
                    cumulativeIndex = sectionStart + items.length;
                  }

                  return (
                    <button
                      key={item.id}
                      role="option"
                      aria-selected={isActive}
                      onClick={() => handleSelect(item)}
                      className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${
                        isActive
                          ? 'bg-burnt-orange/20 text-white'
                          : 'text-text-secondary hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        {item.subtitle && (
                          <p className="text-xs text-text-tertiary truncate">{item.subtitle}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* No results state */}
      {isOpen && query.length >= 2 && !loading && flatResults.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full mt-2 w-full rounded-lg bg-charcoal border border-border-subtle shadow-xl p-4 text-center"
        >
          <p className="text-text-tertiary text-sm">No results for &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
