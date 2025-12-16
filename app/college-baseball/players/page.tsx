'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'Games', href: '/college-baseball/games' },
  { label: 'Standings', href: '/college-baseball/standings' },
  { label: 'Players', href: '/college-baseball/players' },
];

interface Player {
  id: string;
  name: string;
  team: string;
  jersey: string;
  position: string;
  classYear: string;
  conference: string;
  bio: {
    height: string;
    weight: number;
    bats: string;
    throws: string;
    hometown: string;
  };
  battingStats?: {
    avg: number;
    homeRuns: number;
    rbi: number;
    ops: number;
    games: number;
    atBats: number;
    runs: number;
    hits: number;
    doubles: number;
    triples: number;
    walks: number;
    strikeouts: number;
    stolenBases: number;
    obp: number;
    slg: number;
  };
  pitchingStats?: {
    era: number;
    wins: number;
    losses: number;
    strikeouts: number;
    whip: number;
    games: number;
    gamesStarted: number;
    completeGames: number;
    shutouts: number;
    saves: number;
    inningsPitched: number;
    hits: number;
    runs: number;
    earnedRuns: number;
    walks: number;
  };
  draftProspect?: {
    isDraftEligible: boolean;
    mlbRank?: number;
    projection?: string;
    tools?: Record<string, number>;
  };
}

interface Filters {
  search: string;
  team: string;
  position: string;
  classYear: string;
  draftOnly: boolean;
}

const conferences = [
  { value: '', label: 'All Teams' },
  { value: 'Texas', label: 'Texas Longhorns' },
  { value: 'LSU', label: 'LSU Tigers' },
  { value: 'Texas A&M', label: 'Texas A&M Aggies' },
  { value: 'Arkansas', label: 'Arkansas Razorbacks' },
  { value: 'Florida', label: 'Florida Gators' },
  { value: 'Vanderbilt', label: 'Vanderbilt Commodores' },
  { value: 'Tennessee', label: 'Tennessee Volunteers' },
  { value: 'Ole Miss', label: 'Ole Miss Rebels' },
];

const positions = [
  { value: '', label: 'All Positions' },
  { value: 'P', label: 'Pitcher (P)' },
  { value: 'C', label: 'Catcher (C)' },
  { value: 'IF', label: 'Infield (IF)' },
  { value: 'OF', label: 'Outfield (OF)' },
];

const classYears = [
  { value: '', label: 'All Classes' },
  { value: 'Fr', label: 'Freshman' },
  { value: 'So', label: 'Sophomore' },
  { value: 'Jr', label: 'Junior' },
  { value: 'Sr', label: 'Senior' },
];

const sortOptions = [
  { value: 'mlbRank', label: 'MLB Draft Rank' },
  { value: 'avg', label: 'Batting Average' },
  { value: 'homeRuns', label: 'Home Runs' },
  { value: 'rbi', label: 'RBI' },
  { value: 'ops', label: 'OPS' },
  { value: 'era', label: 'ERA' },
  { value: 'strikeouts', label: 'Strikeouts' },
  { value: 'whip', label: 'WHIP' },
];

export default function CollegeBaseballPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    team: '',
    position: '',
    classYear: '',
    draftOnly: false,
  });
  const [sortBy, setSortBy] = useState('mlbRank');

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.team) params.append('team', filters.team);
      if (filters.position) params.append('position', filters.position);
      if (filters.classYear) params.append('class', filters.classYear);
      if (filters.draftOnly) params.append('draft', 'true');

      const response = await fetch(`/api/college-baseball/players?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setPlayers(data.players || []);
    } catch (err) {
      console.error('Error loading players:', err);
      setError(err instanceof Error ? err.message : 'Failed to load players');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const sortedPlayers = [...players].sort((a, b) => {
    switch (sortBy) {
      case 'mlbRank':
        return (a.draftProspect?.mlbRank || 999) - (b.draftProspect?.mlbRank || 999);
      case 'avg':
        return (b.battingStats?.avg || 0) - (a.battingStats?.avg || 0);
      case 'homeRuns':
        return (b.battingStats?.homeRuns || 0) - (a.battingStats?.homeRuns || 0);
      case 'rbi':
        return (b.battingStats?.rbi || 0) - (a.battingStats?.rbi || 0);
      case 'ops':
        return (b.battingStats?.ops || 0) - (a.battingStats?.ops || 0);
      case 'era':
        return (a.pitchingStats?.era || 99) - (b.pitchingStats?.era || 99);
      case 'strikeouts':
        return (b.pitchingStats?.strikeouts || 0) - (a.pitchingStats?.strikeouts || 0);
      case 'whip':
        return (a.pitchingStats?.whip || 99) - (b.pitchingStats?.whip || 99);
      default:
        return 0;
    }
  });

  const stats = {
    total: players.length,
    draftProspects: players.filter((p) => p.draftProspect?.isDraftEligible).length,
    pitchers: players.filter((p) => p.position === 'P').length,
    positionPlayers: players.filter((p) => p.position !== 'P').length,
  };

  const handleSearch = () => {
    loadPlayers();
  };

  const getToolGradeClass = (grade: number) => {
    if (grade >= 80) return 'bg-gradient-to-br from-success to-success/70';
    if (grade >= 70) return 'bg-gradient-to-br from-info to-info/70';
    if (grade >= 60) return 'bg-gradient-to-br from-warning to-warning/70';
    return 'bg-gradient-to-br from-text-tertiary to-text-tertiary/70';
  };

  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container>
            {/* Breadcrumb & Header */}
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/college-baseball"
                  className="text-text-tertiary hover:text-burnt-orange transition-colors"
                >
                  College Baseball
                </Link>
                <span className="text-text-tertiary">/</span>
                <span className="text-white">Players</span>
              </div>

              <div className="mb-8">
                <span className="kicker block mb-2">Player Database and Draft Prospects</span>
                <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display">
                  College Baseball <span className="text-gradient-blaze">Players</span>
                </h1>
                <p className="text-text-secondary mt-2 max-w-2xl">
                  Individual player statistics, MLB Draft prospect tracking, and scouting reports.
                  Practice to Play. Blaze Data Wins the Day.
                </p>
              </div>
            </ScrollReveal>

            {/* Search & Filters */}
            <ScrollReveal direction="up" delay={100}>
              <Card padding="lg" className="mb-8">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search Box */}
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search by player name, team, or hometown..."
                      className="flex-1 px-4 py-2 bg-charcoal border border-border-subtle rounded-lg text-white placeholder:text-text-tertiary focus:outline-none focus:border-burnt-orange transition-colors"
                      aria-label="Search players"
                    />
                    <button
                      onClick={handleSearch}
                      className="px-6 py-2 bg-burnt-orange text-white font-semibold rounded-lg hover:bg-burnt-orange/90 transition-colors"
                      aria-label="Search"
                    >
                      Search
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={filters.team}
                      onChange={(e) => setFilters({ ...filters, team: e.target.value })}
                      className="px-3 py-2 bg-charcoal border border-border-subtle rounded-lg text-white focus:outline-none focus:border-burnt-orange transition-colors"
                      aria-label="Filter by team"
                    >
                      {conferences.map((conf) => (
                        <option key={conf.value} value={conf.value}>
                          {conf.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filters.position}
                      onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                      className="px-3 py-2 bg-charcoal border border-border-subtle rounded-lg text-white focus:outline-none focus:border-burnt-orange transition-colors"
                      aria-label="Filter by position"
                    >
                      {positions.map((pos) => (
                        <option key={pos.value} value={pos.value}>
                          {pos.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filters.classYear}
                      onChange={(e) => setFilters({ ...filters, classYear: e.target.value })}
                      className="px-3 py-2 bg-charcoal border border-border-subtle rounded-lg text-white focus:outline-none focus:border-burnt-orange transition-colors"
                      aria-label="Filter by class year"
                    >
                      {classYears.map((year) => (
                        <option key={year.value} value={year.value}>
                          {year.label}
                        </option>
                      ))}
                    </select>

                    <label className="flex items-center gap-2 px-3 py-2 bg-charcoal border border-border-subtle rounded-lg cursor-pointer hover:border-burnt-orange/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={filters.draftOnly}
                        onChange={(e) => setFilters({ ...filters, draftOnly: e.target.checked })}
                        className="w-4 h-4 accent-burnt-orange"
                      />
                      <span className="text-sm text-white">Draft Prospects Only</span>
                    </label>
                  </div>
                </div>
              </Card>
            </ScrollReveal>

            {/* Stats Bar */}
            <ScrollReveal direction="up" delay={150}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card padding="md" className="text-center">
                  <div className="font-display text-2xl md:text-3xl font-bold text-burnt-orange">
                    {stats.total}
                  </div>
                  <div className="text-xs text-text-tertiary uppercase tracking-wider mt-1">
                    Total Players
                  </div>
                </Card>
                <Card padding="md" className="text-center">
                  <div className="font-display text-2xl md:text-3xl font-bold text-burnt-orange">
                    {stats.draftProspects}
                  </div>
                  <div className="text-xs text-text-tertiary uppercase tracking-wider mt-1">
                    Draft Prospects
                  </div>
                </Card>
                <Card padding="md" className="text-center">
                  <div className="font-display text-2xl md:text-3xl font-bold text-burnt-orange">
                    {stats.pitchers}
                  </div>
                  <div className="text-xs text-text-tertiary uppercase tracking-wider mt-1">
                    Pitchers
                  </div>
                </Card>
                <Card padding="md" className="text-center">
                  <div className="font-display text-2xl md:text-3xl font-bold text-burnt-orange">
                    {stats.positionPlayers}
                  </div>
                  <div className="text-xs text-text-tertiary uppercase tracking-wider mt-1">
                    Position Players
                  </div>
                </Card>
              </div>
            </ScrollReveal>

            {/* Sort Bar */}
            <ScrollReveal direction="up" delay={200}>
              <Card padding="sm" className="mb-6 flex items-center justify-between">
                <span className="text-sm text-text-tertiary">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 bg-charcoal border border-border-subtle rounded text-white text-sm focus:outline-none focus:border-burnt-orange transition-colors"
                  aria-label="Sort players"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Card>
            </ScrollReveal>

            {/* Players Grid */}
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block w-10 h-10 border-4 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin mb-4" />
                <p className="text-text-secondary">Loading players...</p>
              </div>
            ) : error ? (
              <Card padding="lg" className="text-center">
                <div className="text-error text-4xl mb-4">!</div>
                <h3 className="text-xl font-semibold text-white mb-2">Error Loading Players</h3>
                <p className="text-text-secondary">{error}</p>
              </Card>
            ) : sortedPlayers.length === 0 ? (
              <Card padding="lg" className="text-center">
                <div className="text-text-tertiary text-4xl mb-4">?</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Players Found</h3>
                <p className="text-text-secondary">Try adjusting your search or filter criteria.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sortedPlayers.map((player, index) => (
                  <ScrollReveal key={player.id} direction="up" delay={index * 30}>
                    <Card variant="hover" padding="none" className="overflow-hidden">
                      {/* Player Header */}
                      <div className="p-4 bg-gradient-to-r from-burnt-orange/20 to-transparent border-b border-border-subtle">
                        <h3 className="font-display text-xl font-bold text-white">{player.name}</h3>
                        <p className="text-text-secondary text-sm">{player.team}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-text-tertiary">
                          <span>#{player.jersey}</span>
                          <span>{player.position}</span>
                          <span>{player.classYear}</span>
                          <span>{player.conference}</span>
                        </div>
                      </div>

                      {/* Bio */}
                      <div className="p-4 bg-charcoal/30 border-b border-border-subtle">
                        <div className="grid grid-cols-5 gap-2 text-center text-sm">
                          <div>
                            <div className="text-text-tertiary text-xs uppercase">Height</div>
                            <div className="text-white font-medium">{player.bio.height}</div>
                          </div>
                          <div>
                            <div className="text-text-tertiary text-xs uppercase">Weight</div>
                            <div className="text-white font-medium">{player.bio.weight} lbs</div>
                          </div>
                          <div>
                            <div className="text-text-tertiary text-xs uppercase">Bats</div>
                            <div className="text-white font-medium">{player.bio.bats}</div>
                          </div>
                          <div>
                            <div className="text-text-tertiary text-xs uppercase">Throws</div>
                            <div className="text-white font-medium">{player.bio.throws}</div>
                          </div>
                          <div className="col-span-5 md:col-span-1">
                            <div className="text-text-tertiary text-xs uppercase">Hometown</div>
                            <div className="text-white font-medium truncate">
                              {player.bio.hometown}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="p-4">
                        {player.position === 'P' && player.pitchingStats ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div>
                                <div className="text-burnt-orange font-display text-lg font-bold">
                                  {player.pitchingStats.era.toFixed(2)}
                                </div>
                                <div className="text-text-tertiary text-xs">ERA</div>
                              </div>
                              <div>
                                <div className="text-burnt-orange font-display text-lg font-bold">
                                  {player.pitchingStats.wins}-{player.pitchingStats.losses}
                                </div>
                                <div className="text-text-tertiary text-xs">W-L</div>
                              </div>
                              <div>
                                <div className="text-burnt-orange font-display text-lg font-bold">
                                  {player.pitchingStats.strikeouts}
                                </div>
                                <div className="text-text-tertiary text-xs">SO</div>
                              </div>
                              <div>
                                <div className="text-burnt-orange font-display text-lg font-bold">
                                  {player.pitchingStats.whip.toFixed(2)}
                                </div>
                                <div className="text-text-tertiary text-xs">WHIP</div>
                              </div>
                            </div>
                          </div>
                        ) : player.battingStats ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div>
                                <div className="text-burnt-orange font-display text-lg font-bold">
                                  {player.battingStats.avg.toFixed(3)}
                                </div>
                                <div className="text-text-tertiary text-xs">AVG</div>
                              </div>
                              <div>
                                <div className="text-burnt-orange font-display text-lg font-bold">
                                  {player.battingStats.homeRuns}
                                </div>
                                <div className="text-text-tertiary text-xs">HR</div>
                              </div>
                              <div>
                                <div className="text-burnt-orange font-display text-lg font-bold">
                                  {player.battingStats.rbi}
                                </div>
                                <div className="text-text-tertiary text-xs">RBI</div>
                              </div>
                              <div>
                                <div className="text-burnt-orange font-display text-lg font-bold">
                                  {player.battingStats.ops.toFixed(3)}
                                </div>
                                <div className="text-text-tertiary text-xs">OPS</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-text-tertiary text-center text-sm">
                            No stats available
                          </p>
                        )}
                      </div>

                      {/* Draft Prospect Section */}
                      {player.draftProspect?.isDraftEligible && (
                        <div className="p-4 bg-gradient-to-r from-info/10 to-transparent border-t border-info/30">
                          <Badge variant="info" className="mb-3">
                            MLB Draft Rank: #{player.draftProspect.mlbRank}
                          </Badge>
                          {player.draftProspect.projection && (
                            <p className="text-text-secondary text-sm mb-3">
                              <strong>Projection:</strong> {player.draftProspect.projection}
                            </p>
                          )}
                          {player.draftProspect.tools && (
                            <div className="flex justify-center gap-3">
                              {Object.entries(player.draftProspect.tools).map(([tool, grade]) => (
                                <div key={tool} className="text-center">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${getToolGradeClass(
                                      grade
                                    )}`}
                                  >
                                    {grade}
                                  </div>
                                  <div className="text-text-tertiary text-xs mt-1 capitalize">
                                    {tool}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            )}

            {/* Data Attribution */}
            <div className="mt-12 text-center text-xs text-text-tertiary">
              <p>Player data sourced from official NCAA statistics.</p>
              <p className="mt-1">
                Last updated: {new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}{' '}
                CT
              </p>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
