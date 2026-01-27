'use client';

/**
 * Cross-Sport Search Results Page
 *
 * Full search results page with filtering by sport and entity type.
 * Displays teams, players, and games across all covered sports.
 *
 * Last Updated: 2025-01-07
 */

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { SearchBar } from '@/components/layout-ds/SearchBar';
import { PlayerSearchCard, GameSearchCard, RecentSearches } from '@/components/search';
import { useRecentSearches } from '@/lib/hooks/useRecentSearches';
import { SportIcon } from '@/components/ui/SportIcon';

// ============================================================================
// Types
// ============================================================================

interface TeamResult {
  id: string;
  name: string;
  abbreviation: string;
  conference: string;
  division?: string;
  sport: string;
  logo?: string;
  record?: string;
  ranking?: number;
  city?: string;
  state?: string;
}

interface PlayerResult {
  id: string;
  name: string;
  position: string;
  team: string;
  teamId: string;
  sport: string;
  number?: string;
  headshot?: string;
  stats?: string;
}

interface GameResult {
  id: string;
  homeTeam: { name: string; abbreviation: string; score?: number };
  awayTeam: { name: string; abbreviation: string; score?: number };
  date: string;
  status: string;
  sport: string;
  venue?: string;
}

interface SearchFilters {
  sport: string;
  type: 'all' | 'team' | 'player' | 'game';
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

const TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'team', label: 'Teams' },
  { value: 'player', label: 'Players' },
  { value: 'game', label: 'Games' },
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
  return SPORT_COLORS[sport.toLowerCase()] || 'bg-gray-600';
}

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

// ============================================================================
// Loading Fallback
// ============================================================================

function SearchLoading() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-burnt-orange mx-auto mb-4" />
            <p className="text-text-secondary">Loading search...</p>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}

// ============================================================================
// Search Content (uses useSearchParams)
// ============================================================================

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [teams, setTeams] = useState<TeamResult[]>([]);
  const [players, setPlayers] = useState<PlayerResult[]>([]);
  const [games, setGames] = useState<GameResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    sport: searchParams.get('sport') || '',
    type: (searchParams.get('type') as SearchFilters['type']) || 'all',
  });

  const { addSearch } = useRecentSearches();

  // ========================================================================
  // Search Effect
  // ========================================================================

  useEffect(() => {
    if (!initialQuery || initialQuery.length < 2) {
      setTeams([]);
      setPlayers([]);
      setGames([]);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const sportParam = filters.sport ? `&sport=${filters.sport}` : '';
        const types = filters.type === 'all' ? 'team,player,game' : filters.type;
        const res = await fetch(
          `/api/search/unified?q=${encodeURIComponent(initialQuery)}&types=${types}&limit=30${sportParam}`
        );

        if (res.ok) {
          const data = (await res.json()) as {
            success: boolean;
            data?: {
              results: {
                teams?: TeamResult[];
                players?: PlayerResult[];
                games?: GameResult[];
              };
            };
          };
          if (data.success && data.data) {
            setTeams(data.data.results.teams || []);
            setPlayers(data.data.results.players || []);
            setGames(data.data.results.games || []);
            // Add to recent searches
            addSearch(initialQuery);
          } else {
            throw new Error('Invalid response');
          }
        } else {
          throw new Error('Search failed');
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to fetch search results. Please try again.');
        setTeams([]);
        setPlayers([]);
        setGames([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [initialQuery, filters.sport, filters.type, addSearch]);

  // Filter teams by sport if filter is applied
  const filteredTeams = filters.sport
    ? teams.filter((t) => t.sport.toLowerCase() === filters.sport.toLowerCase())
    : teams;

  const filteredPlayers = filters.sport
    ? players.filter((p) => p.sport.toLowerCase() === filters.sport.toLowerCase())
    : players;

  const filteredGames = filters.sport
    ? games.filter((g) => g.sport.toLowerCase() === filters.sport.toLowerCase())
    : games;

  const totalResults = filteredTeams.length + filteredPlayers.length + filteredGames.length;

  const handleRecentSearchSelect = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  // Group teams by sport
  const teamsBySport = filteredTeams.reduce(
    (acc, team) => {
      const sport = team.sport.toLowerCase();
      if (!acc[sport]) acc[sport] = [];
      acc[sport].push(team);
      return acc;
    },
    {} as Record<string, TeamResult[]>
  );

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <>
      <main id="main-content">
        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                Cross-Sport Search
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-6">
                {initialQuery ? `Results for "${initialQuery}"` : 'Search'}
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
            {/* Recent Searches (when no query) */}
            {!initialQuery && (
              <RecentSearches onSelect={handleRecentSearchSelect} className="mb-8" />
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8">
              {/* Type Filter */}
              <div className="flex gap-2">
                {TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        type: option.value as SearchFilters['type'],
                      }))
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filters.type === option.value
                        ? 'bg-burnt-orange text-white'
                        : 'bg-graphite text-text-secondary hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Sport Filter */}
              <div className="flex gap-2 flex-wrap">
                {SPORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilters((prev) => ({ ...prev, sport: option.value }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filters.sport === option.value
                        ? 'bg-gold text-midnight'
                        : 'bg-graphite text-text-tertiary hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count */}
            {!isLoading && initialQuery && (
              <p className="text-text-secondary mb-6">
                Found {totalResults} result{totalResults !== 1 ? 's' : ''}
                {filters.sport && ` in ${getSportLabel(filters.sport)}`}
                {filters.type !== 'all' && ` (${filters.type}s)`}
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
                  className="px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange-dark transition-colors"
                >
                  Try Again
                </button>
              </Card>
            )}

            {/* No Results */}
            {!isLoading && !error && initialQuery && totalResults === 0 && (
              <Card variant="default" padding="lg" className="text-center">
                <div className="mb-4 text-text-tertiary flex justify-center">
                  <svg
                    className="w-16 h-16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21L16.65 16.65" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">No Results Found</h2>
                <p className="text-text-secondary mb-6">
                  We couldn&apos;t find anything matching &quot;{initialQuery}&quot;
                  {filters.sport && ` in ${getSportLabel(filters.sport)}`}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/mlb/teams"
                    className="px-4 py-2 bg-graphite text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Browse MLB Teams
                  </Link>
                  <Link
                    href="/nfl/teams"
                    className="px-4 py-2 bg-graphite text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Browse NFL Teams
                  </Link>
                  <Link
                    href="/college-baseball/teams"
                    className="px-4 py-2 bg-graphite text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Browse NCAA Baseball
                  </Link>
                </div>
              </Card>
            )}

            {/* Empty State - No Query */}
            {!isLoading && !initialQuery && (
              <Card variant="default" padding="lg" className="text-center">
                <div className="mb-4 text-text-tertiary flex justify-center">
                  <svg
                    className="w-16 h-16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="6" width="18" height="12" rx="2" />
                    <path d="M3 10h18M7 15h2M11 15h6" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Search Across All Sports</h2>
                <p className="text-text-secondary mb-6">
                  Find teams, players, and games across MLB, NFL, NBA, and NCAA sports.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl mx-auto">
                  <Link
                    href="/mlb"
                    className="p-4 bg-graphite rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="mb-2 text-burnt-orange flex justify-center">
                      <SportIcon icon="mlb" size="lg" />
                    </div>
                    <p className="font-medium text-white">MLB</p>
                    <p className="text-xs text-text-tertiary">Major League Baseball</p>
                  </Link>
                  <Link
                    href="/nfl"
                    className="p-4 bg-graphite rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="mb-2 text-burnt-orange flex justify-center">
                      <SportIcon icon="nfl" size="lg" />
                    </div>
                    <p className="font-medium text-white">NFL</p>
                    <p className="text-xs text-text-tertiary">National Football League</p>
                  </Link>
                  <Link
                    href="/college-baseball"
                    className="p-4 bg-graphite rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="mb-2 text-burnt-orange flex justify-center">
                      <SportIcon icon="ncaa" size="lg" />
                    </div>
                    <p className="font-medium text-white">NCAA Baseball</p>
                    <p className="text-xs text-text-tertiary">College Baseball</p>
                  </Link>
                </div>
              </Card>
            )}

            {/* Results */}
            {!isLoading && !error && totalResults > 0 && (
              <div className="space-y-8">
                {/* Players Section */}
                {(filters.type === 'all' || filters.type === 'player') &&
                  filteredPlayers.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-burnt-orange" aria-hidden="true" />
                        Players
                        <span className="text-text-tertiary font-normal">
                          ({filteredPlayers.length})
                        </span>
                      </h2>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredPlayers.map((player) => (
                          <ScrollReveal key={player.id}>
                            <PlayerSearchCard player={player} />
                          </ScrollReveal>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Games Section */}
                {(filters.type === 'all' || filters.type === 'game') &&
                  filteredGames.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-gold" aria-hidden="true" />
                        Games
                        <span className="text-text-tertiary font-normal">
                          ({filteredGames.length})
                        </span>
                      </h2>
                      <div className="grid gap-4 md:grid-cols-2">
                        {filteredGames.map((game) => (
                          <ScrollReveal key={game.id}>
                            <GameSearchCard game={game} />
                          </ScrollReveal>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Teams Section - Grouped by Sport */}
                {(filters.type === 'all' || filters.type === 'team') &&
                  filteredTeams.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-success" aria-hidden="true" />
                        Teams
                        <span className="text-text-tertiary font-normal">
                          ({filteredTeams.length})
                        </span>
                      </h2>
                      {Object.entries(teamsBySport).map(([sport, sportTeams]) => (
                        <div key={sport} className="mb-6">
                          <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${getSportColor(sport)}`}
                              aria-hidden="true"
                            />
                            {getSportLabel(sport)}
                            <span className="text-text-tertiary">({sportTeams.length})</span>
                          </h3>

                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {sportTeams.map((team) => (
                              <ScrollReveal key={team.id}>
                                <Link
                                  href={buildTeamHref(team.sport, team.id)}
                                  className="block group"
                                >
                                  <Card
                                    variant="default"
                                    padding="md"
                                    className="h-full transition-all group-hover:border-burnt-orange"
                                  >
                                    <div className="flex items-center gap-4">
                                      {/* Team Logo/Badge */}
                                      <div
                                        className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm ${getSportColor(team.sport)} group-hover:scale-105 transition-transform`}
                                      >
                                        {team.abbreviation ||
                                          team.name.substring(0, 2).toUpperCase()}
                                      </div>

                                      {/* Team Info */}
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-white group-hover:text-burnt-orange transition-colors truncate">
                                          {team.name}
                                        </p>
                                        <p className="text-xs text-text-tertiary truncate">
                                          {team.conference}
                                          {team.division && ` • ${team.division}`}
                                        </p>
                                        {team.record && (
                                          <p className="text-sm text-text-secondary mt-0.5 font-mono">
                                            {team.record}
                                          </p>
                                        )}
                                      </div>

                                      {/* Ranking Badge */}
                                      {team.ranking && (
                                        <div className="px-2 py-1 bg-gold/20 text-gold rounded text-xs font-bold">
                                          #{team.ranking}
                                        </div>
                                      )}

                                      {/* Arrow */}
                                      <svg
                                        viewBox="0 0 24 24"
                                        className="w-5 h-5 text-text-tertiary group-hover:text-burnt-orange transition-colors"
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
              </div>
            )}
          </Container>
        </Section>
      </main>

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
