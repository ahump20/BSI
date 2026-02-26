'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Clock, ExternalLink } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchResult {
  type: 'team' | 'player' | 'article' | 'game' | 'page';
  id: string;
  name: string;
  url: string;
  sport?: string;
  score: number;
  subtitle?: string;
}

// ---------------------------------------------------------------------------
// Quick links (shown when input is empty)
// ---------------------------------------------------------------------------

const QUICK_LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'Live Scores', href: '/scores' },
  { label: 'Standings', href: '/college-baseball/standings' },
];

// ---------------------------------------------------------------------------
// Recent searches (localStorage)
// ---------------------------------------------------------------------------

const RECENT_KEY = 'bsi-recent-searches';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentSearches().filter((q) => q !== query);
    recent.unshift(query);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // localStorage unavailable
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();

  // -----------------------------------------------------------------------
  // Open/close handlers
  // -----------------------------------------------------------------------

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery('');
    setResults([]);
    setSelectedIndex(0);
    setRecentSearches(getRecentSearches());
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
  }, []);

  // Listen for Cmd+K, Ctrl+K, "/" shortcut, and custom event from Navbar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) closePalette();
        else openPalette();
        return;
      }

      // "/" when not focused on an input/textarea
      if (
        e.key === '/' &&
        !open &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement)
      ) {
        e.preventDefault();
        openPalette();
      }
    };

    const handleCustomEvent = () => openPalette();

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomEvent);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomEvent);
    };
  }, [open, openPalette, closePalette]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      // Small delay to ensure the DOM is ready
      requestAnimationFrame(() => inputRef.current?.focus());
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // -----------------------------------------------------------------------
  // Search
  // -----------------------------------------------------------------------

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        setResults([]);
        return;
      }
      const data = (await res.json()) as { results?: SearchResult[] };
      setResults(data.results ?? []);
      setSelectedIndex(0);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.length >= 2) {
      timerRef.current = setTimeout(() => search(query), 200);
    } else {
      setResults([]);
    }
    return () => clearTimeout(timerRef.current);
  }, [query, search]);

  // -----------------------------------------------------------------------
  // Navigation
  // -----------------------------------------------------------------------

  const navigate = useCallback(
    (url: string) => {
      if (query.length >= 2) saveRecentSearch(query);
      closePalette();
      router.push(url);
    },
    [query, closePalette, router]
  );

  const handleWebSearch = useCallback(() => {
    if (query.length >= 2) saveRecentSearch(query);
    closePalette();
    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(query)}+site:blazesportsintel.com+OR+sports`,
      '_blank'
    );
  }, [query, closePalette]);

  // -----------------------------------------------------------------------
  // Keyboard navigation
  // -----------------------------------------------------------------------

  const totalItems = results.length + (query.length >= 2 ? 1 : 0); // +1 for web search row

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closePalette();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(totalItems, 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && selectedIndex < results.length) {
        navigate(results[selectedIndex].url);
      } else if (query.length >= 2) {
        handleWebSearch();
      }
    }
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (!open) return null;

  const typeLabel = (type: string) => {
    switch (type) {
      case 'team': return 'Team';
      case 'player': return 'Player';
      case 'article': return 'Article';
      case 'page': return 'Page';
      case 'game': return 'Game';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Search">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closePalette}
        aria-hidden="true"
      />

      {/* Palette container */}
      <div className="relative flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4">
        <div className="w-full max-w-xl bg-background-primary border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
            <Search className="w-5 h-5 text-text-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search teams, players, pages..."
              className="flex-1 bg-transparent text-text-primary text-base placeholder:text-text-muted outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden sm:inline text-[10px] text-text-muted bg-surface-light px-1.5 py-0.5 rounded font-mono">
              ESC
            </kbd>
          </div>

          {/* Results area */}
          <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto">
            {query.length < 2 ? (
              /* Empty state: quick links + recent searches */
              <div className="p-3">
                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-medium px-2 mb-1">
                      Recent
                    </p>
                    {recentSearches.map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setQuery(q);
                          search(q);
                        }}
                        className="flex items-center gap-2 w-full px-2 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-surface-light rounded-lg transition-colors text-left"
                      >
                        <Clock className="w-3.5 h-3.5 text-text-muted" />
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick links */}
                <p className="text-[10px] uppercase tracking-widest text-text-muted font-medium px-2 mb-1">
                  Quick Links
                </p>
                {QUICK_LINKS.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => navigate(link.href)}
                    className="flex items-center justify-between w-full px-2 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-surface-light rounded-lg transition-colors"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                  </button>
                ))}
              </div>
            ) : loading ? (
              /* Loading */
              <div className="px-4 py-8 text-center text-text-muted text-sm">
                Searching...
              </div>
            ) : results.length === 0 ? (
              /* No results — show web search fallback */
              <div className="p-3">
                <p className="text-sm text-text-muted text-center py-4">
                  No results on BSI
                </p>
                <button
                  onClick={handleWebSearch}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-colors text-left ${
                    selectedIndex === 0 ? 'bg-surface-light text-text-primary' : 'text-text-muted hover:bg-surface-light'
                  }`}
                >
                  <span className="text-sm">
                    Search the web for &quot;{query}&quot;
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
                </button>
              </div>
            ) : (
              /* Results */
              <div className="p-2">
                <p className="text-[10px] uppercase tracking-widest text-text-muted font-medium px-2 mb-1">
                  On BSI
                </p>
                {results.map((r, i) => (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => navigate(r.url)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-left ${
                      i === selectedIndex ? 'bg-surface-light' : 'hover:bg-surface-light'
                    }`}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    <span className="text-[10px] uppercase tracking-wider text-text-muted w-12 shrink-0 font-medium">
                      {typeLabel(r.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-text-primary truncate">{r.name}</div>
                      {r.sport && (
                        <div className="text-[11px] text-text-muted">{r.sport}</div>
                      )}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  </button>
                ))}

                {/* Web search fallback */}
                <div className="border-t border-border-subtle mt-1 pt-1">
                  <button
                    onClick={handleWebSearch}
                    onMouseEnter={() => setSelectedIndex(results.length)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-colors text-left ${
                      selectedIndex === results.length
                        ? 'bg-surface-light text-text-primary'
                        : 'text-text-muted hover:bg-surface-light'
                    }`}
                  >
                    <span className="text-sm">
                      Search the web for &quot;{query}&quot;
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border-subtle px-4 py-2 flex items-center gap-4 text-[10px] text-text-muted">
            <span>
              <kbd className="bg-surface-light px-1 py-0.5 rounded font-mono">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="bg-surface-light px-1 py-0.5 rounded font-mono">↵</kbd> select
            </span>
            <span>
              <kbd className="bg-surface-light px-1 py-0.5 rounded font-mono">esc</kbd> close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
