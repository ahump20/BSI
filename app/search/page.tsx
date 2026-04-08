'use client';

/**
 * Cross-Sport Search Results Page
 *
 * Full search results page with filtering by sport and entity type.
 * Displays teams, players, and games across all covered sports.
 * Heritage Design System v2.1
 *
 * Last Updated: 2026-03-28
 */

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { ScrollReveal } from '@/components/cinematic';
import { SearchBar } from '@/components/layout-ds/SearchBar';
import { FilterPill } from '@/components/ui/FilterPill';

// ============================================================================
// Types
// ============================================================================

interface SearchResultItem {
  type: 'team' | 'player' | 'article' | 'game' | 'page';
  id: string;
  name: string;
  url: string;
  sport?: string;
  score: number;
}

interface SearchFilters {
  sport: string;
  type: string;
}

// ============================================================================
// Sport Helpers
// ============================================================================

const SPORT_OPTIONS = [
  { value: '', label: 'All Sports' },
  { value: 'mlb', label: 'MLB' },
  { value: 'nfl', label: 'NFL' },
  { value: 'nba', label: 'NBA' },
  { value: 'college_baseball', label: 'NCAA Baseball' },
  { value: 'cfb', label: 'NCAA Football' },
  { value: 'cbb', label: 'NCAA Basketball' },
];

const SPORT_LABELS: Record<string, string> = {
  mlb: 'MLB',
  nfl: 'NFL',
  nba: 'NBA',
  college_baseball: 'NCAA Baseball',
  cfb: 'NCAA Football',
  cbb: 'NCAA Basketball',
};

const SPORT_COLORS: Record<string, string> = {
  mlb: 'bg-[var(--heritage-oiler-red)]',
  nfl: 'bg-[var(--heritage-columbia-blue)]',
  nba: 'bg-orange-600',
  college_baseball: 'bg-[var(--bsi-warning)]',
  cfb: 'bg-[var(--bsi-primary)]',
  cbb: 'bg-[var(--heritage-columbia-blue)]',
};

function getSportLabel(sport: string): string {
  return SPORT_LABELS[sport.toLowerCase()] || sport.toUpperCase();
}

function getSportColor(sport: string): string {
  return SPORT_COLORS[sport.toLowerCase()] || 'bg-surface-dugout';
}

// ============================================================================
// Loading Fallback
// ============================================================================

function SearchLoading() {
  return (
    <>
      <div style={{ minHeight: '100vh', background: 'var(--surface-scoreboard)', color: 'var(--bsi-bone)' }}>
        <Section padding="lg" className="pt-6 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 mx-auto mb-4"
              style={{ borderTop: '2px solid var(--bsi-primary)', borderBottom: '2px solid var(--bsi-primary)', borderLeft: '2px solid transparent', borderRight: '2px solid transparent' }}
            />
            <p style={{ color: 'var(--bsi-dust)' }}>Loading search...</p>
          </div>
        </Section>
      </div>
    </>
  );
}

// ============================================================================
// Search Content (uses useSearchParams)
// ============================================================================

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [_query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    sport: searchParams.get('sport') || '',
    type: searchParams.get('type') || '',
  });

  // ========================================================================
  // Search Effect
  // ========================================================================

  useEffect(() => {
    if (!initialQuery || initialQuery.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const sportParam = filters.sport ? `&sport=${filters.sport}` : '';
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(initialQuery)}${sportParam}`,
          { signal: controller.signal }
        );

        if (res.ok) {
          const data = await res.json() as { results?: SearchResultItem[] };
          setResults(data.results ?? []);
        } else {
          throw new Error('Search failed');
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Search hit a snag — try again in a moment.');
          setResults([]);
        }
      } finally {
        clearTimeout(timeout);
        setIsLoading(false);
      }
    };

    fetchResults();
    return () => { controller.abort(); clearTimeout(timeout); };
  }, [initialQuery, filters.sport]);

  // Keep query state in sync
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Filter results by sport if filter is applied
  const filteredResults = filters.sport
    ? results.filter((r) => r.sport?.toLowerCase() === filters.sport.toLowerCase())
    : results;

  // Group results by sport
  const resultsBySport = filteredResults.reduce(
    (acc, item) => {
      const sport = (item.sport || item.type).toLowerCase();
      if (!acc[sport]) acc[sport] = [];
      acc[sport].push(item);
      return acc;
    },
    {} as Record<string, SearchResultItem[]>
  );

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <>
      <div style={{ minHeight: '100vh', background: 'var(--surface-scoreboard)', color: 'var(--bsi-bone)' }}>
        {/* Hero Header */}
        <Section padding="md" className="relative overflow-hidden" style={{ background: 'var(--surface-scoreboard)' }}>
          <Container>
            <ScrollReveal direction="up">
              <span className="heritage-stamp block mb-4">Search</span>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1
                className="text-3xl md:text-4xl font-bold uppercase tracking-wide mb-6"
                style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-bone)' }}
              >
                {initialQuery ? `Results for "${initialQuery}"` : 'Cross-Sport Search'}
              </h1>
            </ScrollReveal>

            {/* Large Search Bar */}
            <ScrollReveal direction="up" delay={150}>
              <div className="max-w-2xl">
                <SearchBar
                  variant="page"
                  placeholder="Search teams, players, games across all sports..."
                  autoFocus={!initialQuery}
                />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Filters & Results */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8">
              {/* Sport Filter */}
              <div className="flex flex-wrap gap-2">
                {SPORT_OPTIONS.map((option) => (
                  <FilterPill
                    key={option.value}
                    active={filters.sport === option.value}
                    onClick={() => setFilters((prev) => ({ ...prev, sport: option.value }))}
                    size="sm"
                  >
                    {option.label}
                  </FilterPill>
                ))}
              </div>
            </div>

            {/* Results Count */}
            {!isLoading && initialQuery && (
              <p style={{ color: 'var(--bsi-dust)' }} className="mb-6">
                Found {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
                {filters.sport && ` in ${getSportLabel(filters.sport)}`}
              </p>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <div
                  className="animate-spin w-8 h-8 rounded-full"
                  style={{ border: '2px solid var(--bsi-primary)', borderTopColor: 'transparent' }}
                />
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card variant="default" padding="lg" className="heritage-card text-center">
                <p className="mb-4" style={{ color: 'var(--bsi-danger)' }}>{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-heritage-fill px-4 py-2 rounded-sm transition-colors"
                >
                  Try Again
                </button>
              </Card>
            )}

            {/* No Results */}
            {!isLoading && !error && initialQuery && filteredResults.length === 0 && (
              <Card variant="default" padding="lg" className="heritage-card text-center">
                <div className="mb-4 flex justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-14 h-14" style={{ color: 'rgba(196,184,165,0.35)' }} stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <h2
                  className="text-xl font-semibold mb-2"
                  style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-bone)' }}
                >
                  No Results Found
                </h2>
                <p style={{ color: 'var(--bsi-dust)' }} className="mb-4">
                  No matches for &ldquo;{initialQuery}&rdquo;
                  {filters.sport && ` in ${getSportLabel(filters.sport)}`}
                </p>
                <p className="text-sm mb-6" style={{ color: 'rgba(196,184,165,0.5)' }}>
                  Try <Link href="/" className="font-medium transition-colors" style={{ color: 'var(--bsi-primary)' }}>Ask BSI</Link> on the homepage — it understands natural language questions like &ldquo;{initialQuery}&rdquo;.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/college-baseball/teams"
                    className="px-4 py-2 rounded-sm transition-colors"
                    style={{ background: 'var(--surface-dugout)', color: 'var(--bsi-bone)' }}
                  >
                    Browse NCAA Baseball
                  </Link>
                  <Link
                    href="/mlb/teams"
                    className="px-4 py-2 rounded-sm transition-colors"
                    style={{ background: 'var(--surface-dugout)', color: 'var(--bsi-bone)' }}
                  >
                    Browse MLB Teams
                  </Link>
                  <Link
                    href="/nfl/teams"
                    className="px-4 py-2 rounded-sm transition-colors"
                    style={{ background: 'var(--surface-dugout)', color: 'var(--bsi-bone)' }}
                  >
                    Browse NFL Teams
                  </Link>
                </div>
              </Card>
            )}

            {/* Empty State - No Query */}
            {!isLoading && !initialQuery && (
              <div className="space-y-8">
                {/* Popular Searches */}
                <div>
                  <h2
                    className="text-lg font-bold uppercase tracking-wide mb-4"
                    style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-bone)' }}
                  >
                    Popular Searches
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Texas Longhorns', 'NFL standings', 'wOBA leaders', 'NBA scores',
                      'College World Series', 'SEC baseball', 'MLB standings',
                      'transfer portal', 'Big 12 football', 'Savant leaderboard',
                    ].map((term) => (
                      <Link
                        key={term}
                        href={`/search?q=${encodeURIComponent(term)}`}
                        className="px-3 py-1.5 text-sm rounded-sm transition-colors"
                        style={{
                          background: 'var(--surface-press-box)',
                          border: '1px solid var(--border-vintage)',
                          color: 'var(--bsi-dust)',
                        }}
                      >
                        {term}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Ask BSI Callout */}
                <Card variant="default" padding="lg" className="heritage-card" style={{ borderColor: 'rgba(191,87,0,0.2)' }}>
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-sm flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(191,87,0,0.1)' }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" style={{ color: 'var(--bsi-primary)' }} stroke="currentColor" strokeWidth={1.5}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                        <path d="M12 16v-4M12 8h.01" />
                      </svg>
                    </div>
                    <div>
                      <h3
                        className="text-base font-bold uppercase tracking-wide mb-1"
                        style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-bone)' }}
                      >
                        Try Ask BSI
                      </h3>
                      <p className="text-sm mb-3" style={{ color: 'var(--bsi-dust)' }}>
                        Ask questions in plain English — &ldquo;Is Texas a CWS contender?&rdquo; or &ldquo;Who leads D1 in wOBA?&rdquo; — and get answers with links to the right page.
                      </p>
                      <Link
                        href="/"
                        className="text-sm font-semibold transition-colors"
                        style={{ color: 'var(--bsi-primary)' }}
                      >
                        Ask BSI on the homepage &rarr;
                      </Link>
                    </div>
                  </div>
                </Card>

                {/* Browse by Sport */}
                <div>
                  <h2
                    className="text-lg font-bold uppercase tracking-wide mb-4"
                    style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-bone)' }}
                  >
                    Browse by Sport
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl">
                    {[
                      { href: '/college-baseball', label: 'NCAA Baseball', sub: 'College Baseball' },
                      { href: '/mlb', label: 'MLB', sub: 'Major League Baseball' },
                      { href: '/nfl', label: 'NFL', sub: 'National Football League' },
                      { href: '/nba', label: 'NBA', sub: 'National Basketball Association' },
                      { href: '/cfb', label: 'CFB', sub: 'College Football' },
                    ].map((sport) => (
                      <Link
                        key={sport.href}
                        href={sport.href}
                        className="p-4 rounded-sm transition-colors"
                        style={{ background: 'var(--surface-dugout)' }}
                      >
                        <p className="font-medium" style={{ color: 'var(--bsi-bone)' }}>{sport.label}</p>
                        <p className="text-xs" style={{ color: 'rgba(196,184,165,0.5)' }}>{sport.sub}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Results - Grouped by Sport */}
            {!isLoading && !error && filteredResults.length > 0 && (
              <div className="space-y-8">
                {Object.entries(resultsBySport).map(([sport, items]) => (
                  <div key={sport}>
                    <h2
                      className="text-lg font-semibold mb-4 flex items-center gap-2"
                      style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-bone)' }}
                    >
                      <span
                        className={`w-3 h-3 rounded-full ${getSportColor(sport)}`}
                        aria-hidden="true"
                      />
                      {getSportLabel(sport)}
                      <span className="font-normal" style={{ color: 'rgba(196,184,165,0.5)' }}>({items.length})</span>
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {items.map((item, index) => (
                        <ScrollReveal key={`${item.type}-${item.id}-${item.url}-${index}`}>
                          <Link href={item.url} className="block group">
                            <Card
                              variant="default"
                              padding="md"
                              className="heritage-card h-full transition-all"
                              style={{ borderColor: 'var(--border-vintage)' }}
                            >
                              <div className="flex items-center gap-4">
                                {/* Type Badge */}
                                <div
                                  className={`w-12 h-12 rounded-sm flex items-center justify-center font-bold text-sm ${getSportColor(sport)} group-hover:scale-105 transition-transform`}
                                  style={{ color: 'var(--bsi-bone)' }}
                                >
                                  {item.name.substring(0, 2).toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="font-semibold transition-colors truncate group-hover:text-[var(--bsi-primary)]"
                                    style={{ color: 'var(--bsi-bone)' }}
                                  >
                                    {item.name}
                                  </p>
                                  <p className="text-xs truncate capitalize" style={{ color: 'rgba(196,184,165,0.5)' }}>
                                    {item.type} {item.sport ? `· ${item.sport}` : ''}
                                  </p>
                                </div>

                                {/* Arrow */}
                                <svg
                                  viewBox="0 0 24 24"
                                  className="w-5 h-5 shrink-0 transition-colors group-hover:text-[var(--bsi-primary)]"
                                  style={{ color: 'rgba(196,184,165,0.5)' }}
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M9 18l6-6-6-6" />
                                </svg>
                              </div>
                            </Card>
                          </Link>
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Container>
        </Section>
      </div>

    </>
  );
}

// ============================================================================
// Page Export (with Suspense boundary)
// ============================================================================

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  );
}
