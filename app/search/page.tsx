'use client';

/**
 * Cross-Sport Search Results Page
 *
 * Full search results page with filtering by sport and entity type.
 * Displays teams, players, and games across all covered sports.
 *
 * Last Updated: 2026-02-27
 */

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { SearchBar } from '@/components/layout-ds/SearchBar';
import { HeroGlow } from '@/components/ui/HeroGlow';
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
  return SPORT_COLORS[sport.toLowerCase()] || 'bg-background-tertiary';
}

// ============================================================================
// Loading Fallback
// ============================================================================

function SearchLoading() {
  return (
    <>
      <div>
        <Section padding="lg" className="pt-6 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-burnt-orange mx-auto mb-4" />
            <p className="text-text-secondary">Loading search...</p>
          </div>
        </Section>
      </div>
      <Footer />
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
      <div>
        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <HeroGlow />

          <Container>
            <ScrollReveal direction="up">
              <span className="section-label block mb-4">Search</span>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-text-primary mb-6">
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
              <p className="text-text-secondary mb-6">
                Found {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
                {filters.sport && ` in ${getSportLabel(filters.sport)}`}
              </p>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin w-8 h-8 border-2 border-burnt-orange border-t-transparent rounded-full" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card variant="default" padding="lg" className="text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-burnt-orange text-white rounded-sm hover:bg-burnt-orange-dark transition-colors"
                >
                  Try Again
                </button>
              </Card>
            )}

            {/* No Results */}
            {!isLoading && !error && initialQuery && filteredResults.length === 0 && (
              <Card variant="default" padding="lg" className="text-center">
                <div className="mb-4 flex justify-center"><svg viewBox="0 0 24 24" fill="none" className="w-14 h-14 text-text-muted" stroke="currentColor" strokeWidth={1.5}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg></div>
                <h2 className="text-xl font-semibold text-text-primary mb-2">No Results Found</h2>
                <p className="text-text-secondary mb-4">
                  No matches for &ldquo;{initialQuery}&rdquo;
                  {filters.sport && ` in ${getSportLabel(filters.sport)}`}
                </p>
                <p className="text-sm text-text-tertiary mb-6">
                  Try <Link href="/" className="text-burnt-orange hover:text-ember transition-colors font-medium">Ask BSI</Link> on the homepage — it understands natural language questions like &ldquo;{initialQuery}&rdquo;.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/college-baseball/teams"
                    className="px-4 py-2 bg-background-tertiary text-text-primary rounded-sm hover:bg-surface-light transition-colors"
                  >
                    Browse NCAA Baseball
                  </Link>
                  <Link
                    href="/mlb/teams"
                    className="px-4 py-2 bg-background-tertiary text-text-primary rounded-sm hover:bg-surface-light transition-colors"
                  >
                    Browse MLB Teams
                  </Link>
                  <Link
                    href="/nfl/teams"
                    className="px-4 py-2 bg-background-tertiary text-text-primary rounded-sm hover:bg-surface-light transition-colors"
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
                  <h2 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary mb-4">
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
                        className="px-3 py-1.5 text-sm bg-surface-light border border-border-subtle rounded-full text-text-secondary hover:text-burnt-orange hover:border-burnt-orange/30 transition-colors"
                      >
                        {term}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Ask BSI Callout */}
                <Card variant="default" padding="lg" className="border-burnt-orange/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-sm bg-burnt-orange/10 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-burnt-orange" stroke="currentColor" strokeWidth={1.5}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                        <path d="M12 16v-4M12 8h.01" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold uppercase tracking-wide text-text-primary mb-1">
                        Try Ask BSI
                      </h3>
                      <p className="text-sm text-text-secondary mb-3">
                        Ask questions in plain English — &ldquo;Is Texas a CWS contender?&rdquo; or &ldquo;Who leads D1 in wOBA?&rdquo; — and get answers with links to the right page.
                      </p>
                      <Link
                        href="/"
                        className="text-sm text-burnt-orange font-semibold hover:text-ember transition-colors"
                      >
                        Ask BSI on the homepage &rarr;
                      </Link>
                    </div>
                  </div>
                </Card>

                {/* Browse by Sport */}
                <div>
                  <h2 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary mb-4">
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
                        className="p-4 bg-background-tertiary rounded-sm hover:bg-surface-light transition-colors"
                      >
                        <p className="font-medium text-text-primary">{sport.label}</p>
                        <p className="text-xs text-text-tertiary">{sport.sub}</p>
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
                    <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${getSportColor(sport)}`}
                        aria-hidden="true"
                      />
                      {getSportLabel(sport)}
                      <span className="text-text-tertiary font-normal">({items.length})</span>
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {items.map((item, index) => (
                        <ScrollReveal key={`${item.type}-${item.id}-${item.url}-${index}`}>
                          <Link href={item.url} className="block group">
                            <Card
                              variant="default"
                              padding="md"
                              className="h-full transition-all group-hover:border-burnt-orange"
                            >
                              <div className="flex items-center gap-4">
                                {/* Type Badge */}
                                <div
                                  className={`w-12 h-12 rounded-sm flex items-center justify-center text-white font-bold text-sm ${getSportColor(sport)} group-hover:scale-105 transition-transform`}
                                >
                                  {item.name.substring(0, 2).toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-text-primary group-hover:text-burnt-orange transition-colors truncate">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-text-tertiary truncate capitalize">
                                    {item.type} {item.sport ? `· ${item.sport}` : ''}
                                  </p>
                                </div>

                                {/* Arrow */}
                                <svg
                                  viewBox="0 0 24 24"
                                  className="w-5 h-5 text-text-tertiary group-hover:text-burnt-orange transition-colors shrink-0"
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

      <Footer />
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
