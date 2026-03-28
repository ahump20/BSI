'use client';

/**
 * MLB Players Page
 *
 * Browse MLB player leaderboards with filtering and sorting.
 * Uses FanGraphs leaderboard data via /api/mlb/leaderboards endpoint.
 *
 * Last Updated: 2025-01-07
 */

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { useUserSettings } from '@/lib/hooks';
import { useSportData } from '@/lib/hooks/useSportData';
// Team lookup utilities available if needed: getTeamById, MLBTeamInfo

interface PlayerData {
  // FanGraphs player data shape
  Name: string;
  Team: string;
  playerid: number;
  // Batting stats
  G?: number;
  PA?: number;
  AB?: number;
  H?: number;
  HR?: number;
  RBI?: number;
  BB?: number;
  SO?: number;
  SB?: number;
  AVG?: number;
  OBP?: number;
  SLG?: number;
  OPS?: number;
  wOBA?: number;
  'wRC+'?: number;
  WAR?: number;
  // Pitching stats
  W?: number;
  L?: number;
  SV?: number;
  IP?: number;
  ERA?: number;
  WHIP?: number;
  FIP?: number;
  xFIP?: number;
  K?: number;
  'K/9'?: number;
  'BB/9'?: number;
}

interface LeaderboardResponse {
  leaderboard: {
    category: string;
    type: 'bat' | 'pit';
    season: number;
    league: string;
    position: string;
    qualified: boolean;
    sortBy: string;
    sortDirection: string;
  };
  data: PlayerData[];
  pagination: {
    page: number;
    pageSize: number;
    totalResults: number;
    totalPages: number;
  };
  meta: {
    dataSource: string;
    lastUpdated: string;
    timezone: string;
  };
}

type StatType = 'bat' | 'pit';

const positions = [
  { value: 'all', label: 'All Positions' },
  { value: 'c', label: 'Catcher' },
  { value: '1b', label: 'First Base' },
  { value: '2b', label: 'Second Base' },
  { value: 'ss', label: 'Shortstop' },
  { value: '3b', label: 'Third Base' },
  { value: 'of', label: 'Outfield' },
  { value: 'dh', label: 'Designated Hitter' },
];

const battingSortOptions = [
  { value: 'WAR', label: 'WAR' },
  { value: 'wRC+', label: 'wRC+' },
  { value: 'wOBA', label: 'wOBA' },
  { value: 'OPS', label: 'OPS' },
  { value: 'AVG', label: 'AVG' },
  { value: 'HR', label: 'Home Runs' },
  { value: 'RBI', label: 'RBI' },
  { value: 'SB', label: 'Stolen Bases' },
];

const pitchingSortOptions = [
  { value: 'WAR', label: 'WAR' },
  { value: 'FIP', label: 'FIP' },
  { value: 'xFIP', label: 'xFIP' },
  { value: 'ERA', label: 'ERA' },
  { value: 'WHIP', label: 'WHIP' },
  { value: 'K', label: 'Strikeouts' },
  { value: 'K/9', label: 'K/9' },
  { value: 'W', label: 'Wins' },
];

export default function MLBPlayersPage() {
  // Filters
  const [statType, setStatType] = useState<StatType>('bat');
  const [position, setPosition] = useState('all');
  const [league, setLeague] = useState<'all' | 'al' | 'nl'>('all');
  const [sortBy, setSortBy] = useState('WAR');
  const [qualified, setQualified] = useState(true);
  const [page, setPage] = useState(1);

  // User timezone for formatting
  const { formatDateTime, isLoaded: timezoneLoaded } = useUserSettings();

  // Format timestamp with user's timezone or fallback
  const displayTimestamp = (isoString?: string): string => {
    const date = isoString ? new Date(isoString) : new Date();
    if (timezoneLoaded) {
      return formatDateTime(date);
    }
    return (
      date.toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }) + ' CT'
    );
  };

  // Build API URL from filter state
  const leaderboardUrl = useMemo(() => {
    const params = new URLSearchParams({
      stat: statType,
      pos: position,
      lg: league,
      qual: qualified ? 'y' : 'n',
      sortby: sortBy,
      sortdir:
        sortBy === 'ERA' || sortBy === 'FIP' || sortBy === 'xFIP' || sortBy === 'WHIP'
          ? 'asc'
          : 'desc',
      limit: '50',
      page: page.toString(),
    });
    const category = statType === 'bat' ? 'batting' : 'pitching';
    return `/api/mlb/leaderboards/${category}?${params}`;
  }, [statType, position, league, qualified, sortBy, page]);

  const { data: rawData, loading, error, retry: fetchPlayers } = useSportData<LeaderboardResponse>(leaderboardUrl);

  const players = rawData?.data ?? [];
  const meta = rawData?.meta ?? null;
  const pagination = rawData?.pagination ?? null;

  // Reset sort to WAR when switching stat types
  useEffect(() => {
    setSortBy('WAR');
    setPage(1);
  }, [statType]);

  const sortOptions = statType === 'bat' ? battingSortOptions : pitchingSortOptions;

  const formatStat = (value: number | undefined, decimals: number = 3): string => {
    if (value === undefined) return '-';
    return decimals === 0 ? value.toString() : value.toFixed(decimals);
  };

  return (
    <>
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-[var(--border-vintage)]">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/mlb"
                className="text-[rgba(196,184,165,0.5)] hover:text-[var(--bsi-primary)] transition-colors"
              >
                MLB
              </Link>
              <span className="text-[rgba(196,184,165,0.5)]">/</span>
              <span className="text-[var(--bsi-bone)] font-medium">Players</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                Player Leaderboards
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-[var(--bsi-primary)] mb-4">
                MLB Players
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-[var(--bsi-dust)] max-w-2xl">
                Browse player statistics with advanced sabermetrics. Click any player for detailed
                stats, splits, and game logs.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Filters & Leaderboard */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {/* Stat Type Toggle */}
            <ScrollReveal direction="up">
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setStatType('bat')}
                  className={`px-6 py-2.5 rounded-sm font-semibold text-sm transition-all ${
                    statType === 'bat'
                      ? 'bg-[var(--bsi-primary)] text-white'
                      : 'bg-[var(--surface-dugout)] text-[var(--bsi-dust)] hover:bg-[var(--surface-press-box)] hover:text-[var(--bsi-bone)]'
                  }`}
                >
                  Batting
                </button>
                <button
                  onClick={() => setStatType('pit')}
                  className={`px-6 py-2.5 rounded-sm font-semibold text-sm transition-all ${
                    statType === 'pit'
                      ? 'bg-[var(--bsi-primary)] text-white'
                      : 'bg-[var(--surface-dugout)] text-[var(--bsi-dust)] hover:bg-[var(--surface-press-box)] hover:text-[var(--bsi-bone)]'
                  }`}
                >
                  Pitching
                </button>
              </div>
            </ScrollReveal>

            {/* Filters */}
            <ScrollReveal direction="up" delay={50}>
              <Card padding="md" className="mb-6">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Position Filter - only for batting */}
                  {statType === 'bat' && (
                    <select
                      value={position}
                      onChange={(e) => {
                        setPosition(e.target.value);
                        setPage(1);
                      }}
                      className="px-3 py-2 bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-sm text-[var(--bsi-bone)] text-sm focus:outline-none focus:border-[var(--bsi-primary)] transition-colors"
                      aria-label="Filter by position"
                    >
                      {positions.map((pos) => (
                        <option key={pos.value} value={pos.value}>
                          {pos.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* League Filter */}
                  <select
                    value={league}
                    onChange={(e) => {
                      setLeague(e.target.value as 'all' | 'al' | 'nl');
                      setPage(1);
                    }}
                    className="px-3 py-2 bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-sm text-[var(--bsi-bone)] text-sm focus:outline-none focus:border-[var(--bsi-primary)] transition-colors"
                    aria-label="Filter by league"
                  >
                    <option value="all">All Leagues</option>
                    <option value="al">American League</option>
                    <option value="nl">National League</option>
                  </select>

                  {/* Sort By */}
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(1);
                    }}
                    className="px-3 py-2 bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-sm text-[var(--bsi-bone)] text-sm focus:outline-none focus:border-[var(--bsi-primary)] transition-colors"
                    aria-label="Sort by"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        Sort: {opt.label}
                      </option>
                    ))}
                  </select>

                  {/* Qualified Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qualified}
                      onChange={(e) => {
                        setQualified(e.target.checked);
                        setPage(1);
                      }}
                      className="w-4 h-4 accent-burnt-orange"
                    />
                    <span className="text-sm text-[var(--bsi-dust)]">Qualified Only</span>
                  </label>
                </div>
              </Card>
            </ScrollReveal>

            {/* Results Count */}
            {pagination && !loading && (
              <ScrollReveal direction="up" delay={75}>
                <p className="text-sm text-[rgba(196,184,165,0.5)] mb-4">
                  Showing {players.length} of {pagination.totalResults} players
                  {pagination.totalPages > 1 &&
                    ` (Page ${pagination.page} of ${pagination.totalPages})`}
                </p>
              </ScrollReveal>
            )}

            {/* Players Table/Grid */}
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block w-10 h-10 border-4 border-[var(--bsi-primary)]/30 border-t-[var(--bsi-primary)] rounded-full animate-spin mb-4" />
                <p className="text-[var(--bsi-dust)]">Loading players...</p>
              </div>
            ) : error ? (
              <Card padding="lg" className="text-center">
                <div className="text-error text-4xl mb-4">!</div>
                <h3 className="text-xl font-semibold text-[var(--bsi-bone)] mb-2">Error Loading Players</h3>
                <p className="text-[var(--bsi-dust)]">{error}</p>
                <button
                  onClick={fetchPlayers}
                  className="mt-4 px-4 py-2 bg-[var(--bsi-primary)] text-white rounded-sm hover:bg-[var(--bsi-primary)]/90 transition-colors"
                >
                  Retry
                </button>
              </Card>
            ) : players.length === 0 ? (
              <Card padding="lg" className="text-center">
                <div className="text-[rgba(196,184,165,0.5)] text-4xl mb-4">?</div>
                <h3 className="text-xl font-semibold text-[var(--bsi-bone)] mb-2">No Players Found</h3>
                <p className="text-[var(--bsi-dust)]">Try adjusting your filters.</p>
              </Card>
            ) : (
              <ScrollReveal direction="up" delay={100}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--border-vintage)] text-[rgba(196,184,165,0.5)] text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Player</th>
                        <th className="py-3 px-4">Team</th>
                        {statType === 'bat' ? (
                          <>
                            <th className="py-3 px-4 text-right">G</th>
                            <th className="py-3 px-4 text-right">AVG</th>
                            <th className="py-3 px-4 text-right">HR</th>
                            <th className="py-3 px-4 text-right">RBI</th>
                            <th className="py-3 px-4 text-right">OPS</th>
                            <th className="py-3 px-4 text-right">wRC+</th>
                            <th className="py-3 px-4 text-right">WAR</th>
                          </>
                        ) : (
                          <>
                            <th className="py-3 px-4 text-right">G</th>
                            <th className="py-3 px-4 text-right">W-L</th>
                            <th className="py-3 px-4 text-right">ERA</th>
                            <th className="py-3 px-4 text-right">IP</th>
                            <th className="py-3 px-4 text-right">K</th>
                            <th className="py-3 px-4 text-right">FIP</th>
                            <th className="py-3 px-4 text-right">WAR</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-vintage)]">
                      {players.map((player, index) => (
                        <tr
                          key={player.playerid}
                          className="hover:bg-[var(--surface-press-box)] transition-colors group"
                        >
                          <td className="py-3 px-4 text-[rgba(196,184,165,0.5)] text-sm">
                            {(page - 1) * 50 + index + 1}
                          </td>
                          <td className="py-3 px-4">
                            <Link
                              href={`/mlb/players/${player.playerid}`}
                              className="font-medium text-[var(--bsi-bone)] group-hover:text-[var(--bsi-primary)] transition-colors"
                            >
                              {player.Name}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-[var(--bsi-dust)] text-sm">{player.Team}</td>
                          {statType === 'bat' ? (
                            <>
                              <td className="py-3 px-4 text-right text-[var(--bsi-dust)] font-mono text-sm">
                                {formatStat(player.G, 0)}
                              </td>
                              <td className="py-3 px-4 text-right text-[var(--bsi-bone)] font-mono text-sm">
                                {formatStat(player.AVG)}
                              </td>
                              <td className="py-3 px-4 text-right text-[var(--bsi-primary)] font-mono text-sm font-semibold">
                                {formatStat(player.HR, 0)}
                              </td>
                              <td className="py-3 px-4 text-right text-[var(--bsi-dust)] font-mono text-sm">
                                {formatStat(player.RBI, 0)}
                              </td>
                              <td className="py-3 px-4 text-right text-[var(--bsi-bone)] font-mono text-sm">
                                {formatStat(player.OPS)}
                              </td>
                              <td className="py-3 px-4 text-right text-[var(--bsi-primary)] font-mono text-sm font-semibold">
                                {formatStat(player['wRC+'], 0)}
                              </td>
                              <td className="py-3 px-4 text-right text-[var(--bsi-primary)] font-mono text-sm font-semibold">
                                {formatStat(player.WAR, 1)}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-3 px-4 text-right text-[var(--bsi-dust)] font-mono text-sm">
                                {formatStat(player.G, 0)}
                              </td>
                              <td className="py-3 px-4 text-right text-[var(--bsi-bone)] font-mono text-sm">
                                {player.W ?? '-'}-{player.L ?? '-'}
                              </td>
                              <td className="py-3 px-4 text-right text-[var(--bsi-primary)] font-mono text-sm font-semibold">
                                {formatStat(player.ERA, 2)}
                              </td>
                              <td className="py-3 px-4 text-right text-[var(--bsi-dust)] font-mono text-sm">
                                {formatStat(player.IP, 1)}
                              </td>
                              <td className="py-3 px-4 text-right text-[var(--bsi-bone)] font-mono text-sm">
                                {formatStat(player.K, 0)}
                              </td>
                              <td className="py-3 px-4 text-right text-[var(--bsi-primary)] font-mono text-sm font-semibold">
                                {formatStat(player.FIP, 2)}
                              </td>
                              <td className="py-3 px-4 text-right text-[var(--bsi-primary)] font-mono text-sm font-semibold">
                                {formatStat(player.WAR, 1)}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollReveal>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && !loading && (
              <ScrollReveal direction="up" delay={150}>
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-[var(--surface-dugout)] text-[var(--bsi-bone)] rounded-sm hover:bg-[var(--surface-press-box)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-[var(--bsi-dust)]">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="px-4 py-2 bg-[var(--surface-dugout)] text-[var(--bsi-bone)] rounded-sm hover:bg-[var(--surface-press-box)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </ScrollReveal>
            )}

            {/* Data Source Footer */}
            <div className="mt-8 pt-4 border-t border-[var(--border-vintage)]">
              <DataSourceBadge
                source={meta?.dataSource || 'FanGraphs'}
                timestamp={displayTimestamp(meta?.lastUpdated)}
              />
            </div>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
