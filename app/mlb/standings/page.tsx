'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton, SkeletonTableRow } from '@/components/ui/Skeleton';
import { formatTimestamp } from '@/lib/utils/timezone';

interface Team {
  teamName: string;
  teamAbbreviation?: string;
  wins: number;
  losses: number;
  winPercentage: number;
  gamesBack: number;
  division: string;
  league: string;
  runsScored: number;
  runsAllowed: number;
  streakCode: string;
  home?: string;
  away?: string;
  last10?: string;
  runDiff?: number;
  wcRank?: number;
  wcGamesBack?: number;
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
  timezone: string;
}

type ViewType = 'division' | 'league' | 'wildcard';
export default function MLBStandingsPage() {
  const [viewType, setViewType] = useState<ViewType>('division');
  const [sortColumn, setSortColumn] = useState<string>('wins');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { data: rawData, loading, error, retry } = useSportData<{ standings?: Team[]; meta?: DataMeta }>(
    '/api/mlb/standings'
  );
  const standings = rawData?.standings || [];
  const meta = rawData?.meta || null;

  // Sort function
  const sortTeams = (teams: Team[]): Team[] => {
    return [...teams].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortColumn) {
        case 'team':
          aVal = a.teamName;
          bVal = b.teamName;
          break;
        case 'wins':
          aVal = a.wins;
          bVal = b.wins;
          break;
        case 'losses':
          aVal = a.losses;
          bVal = b.losses;
          break;
        case 'pct':
          aVal = a.winPercentage;
          bVal = b.winPercentage;
          break;
        case 'gb':
          aVal = a.gamesBack;
          bVal = b.gamesBack;
          break;
        case 'rs':
          aVal = a.runsScored;
          bVal = b.runsScored;
          break;
        case 'ra':
          aVal = a.runsAllowed;
          bVal = b.runsAllowed;
          break;
        case 'diff':
          aVal = a.runsScored - a.runsAllowed;
          bVal = b.runsScored - b.runsAllowed;
          break;
        default:
          aVal = a.wins;
          bVal = b.wins;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Group standings by league and division
  const standingsByDivision: Record<string, Team[]> = {};
  standings.forEach((team) => {
    const divKey = `${team.league} ${team.division}`;
    if (!standingsByDivision[divKey]) standingsByDivision[divKey] = [];
    standingsByDivision[divKey].push(team);
  });

  // Sort teams within each division
  Object.keys(standingsByDivision).forEach((div) => {
    standingsByDivision[div] = sortTeams(standingsByDivision[div]);
  });

  // Group by league for league view
  const standingsByLeague: Record<string, Team[]> = {};
  standings.forEach((team) => {
    if (!standingsByLeague[team.league]) standingsByLeague[team.league] = [];
    standingsByLeague[team.league].push(team);
  });
  Object.keys(standingsByLeague).forEach((league) => {
    standingsByLeague[league] = sortTeams(standingsByLeague[league]);
  });

  const divisionOrder = ['AL East', 'AL Central', 'AL West', 'NL East', 'NL Central', 'NL West'];
  const leagueOrder = ['AL', 'NL'];

  const views: { id: ViewType; label: string }[] = [
    { id: 'division', label: 'Division' },
    { id: 'league', label: 'League' },
    { id: 'wildcard', label: 'Wild Card' },
  ];

  const SortableHeader = ({
    column,
    label,
    className = '',
  }: {
    column: string;
    label: string;
    className?: string;
  }) => (
    <th
      scope="col"
      className={`text-left p-3 text-text-tertiary font-semibold cursor-pointer hover:text-burnt-orange transition-colors ${className}`}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortColumn === column && (
          <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
            {sortDirection === 'desc' ? <path d="M7 10l5 5 5-5z" /> : <path d="M7 14l5-5 5 5z" />}
          </svg>
        )}
      </div>
    </th>
  );

  const StandingsTable = ({
    teams,
    showDivision = false,
  }: {
    teams: Team[];
    showDivision?: boolean;
  }) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px]" aria-label="MLB division standings">
        <thead>
          <tr className="border-b-2 border-burnt-orange">
            <th scope="col" className="text-left p-3 text-text-tertiary font-semibold w-8">#</th>
            <SortableHeader column="team" label="Team" className="sticky left-0 bg-background-secondary z-10" />
            <SortableHeader column="wins" label="W" />
            <SortableHeader column="losses" label="L" />
            <SortableHeader column="pct" label="PCT" />
            <SortableHeader column="gb" label="GB" />
            <th scope="col" className="text-left p-3 text-text-tertiary font-semibold">HOME</th>
            <th scope="col" className="text-left p-3 text-text-tertiary font-semibold">AWAY</th>
            <SortableHeader column="rs" label="RS" />
            <SortableHeader column="ra" label="RA" />
            <SortableHeader column="diff" label="DIFF" />
            <th scope="col" className="text-left p-3 text-text-tertiary font-semibold">STRK</th>
            <th scope="col" className="text-left p-3 text-text-tertiary font-semibold">L10</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, idx) => {
            const diff = team.runsScored - team.runsAllowed;
            return (
              <tr
                key={team.teamName}
                className="border-b border-border-subtle hover:bg-surface-light transition-colors"
              >
                <td className="p-3 text-burnt-orange font-bold">{idx + 1}</td>
                <td className="p-3 sticky left-0 bg-background-secondary z-10">
                  <Link
                    href={`/mlb/teams/${team.teamAbbreviation?.toLowerCase() || team.teamName.toLowerCase().replace(/\s+/g, '-')}`}
                    className="font-semibold text-text-primary hover:text-burnt-orange transition-colors flex items-center gap-2"
                  >
                    {team.teamName}
                    {showDivision && (
                      <span className="text-text-tertiary text-xs">{team.division}</span>
                    )}
                  </Link>
                </td>
                <td className="p-3 text-text-secondary font-mono">{team.wins}</td>
                <td className="p-3 text-text-secondary font-mono">{team.losses}</td>
                <td className="p-3 text-text-secondary font-mono">
                  {team.winPercentage.toFixed(3).replace('0.', '.')}
                </td>
                <td className="p-3 text-text-secondary font-mono">
                  {team.gamesBack === 0 ? '-' : team.gamesBack.toFixed(1)}
                </td>
                <td className="p-3 text-text-secondary font-mono">{team.home || '-'}</td>
                <td className="p-3 text-text-secondary font-mono">{team.away || '-'}</td>
                <td className="p-3 text-text-secondary font-mono">{team.runsScored}</td>
                <td className="p-3 text-text-secondary font-mono">{team.runsAllowed}</td>
                <td
                  className={`p-3 font-mono font-semibold ${diff > 0 ? 'text-success' : diff < 0 ? 'text-error' : 'text-text-secondary'}`}
                >
                  {diff > 0 ? `+${diff}` : diff}
                </td>
                <td
                  className={`p-3 font-mono ${team.streakCode?.startsWith('W') ? 'text-success' : team.streakCode?.startsWith('L') ? 'text-error' : 'text-text-secondary'}`}
                >
                  {team.streakCode || '-'}
                </td>
                <td className="p-3 text-text-secondary font-mono">{team.last10 || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const WildCardTable = ({ teams, league: _league }: { teams: Team[]; league: string }) => {
    // Filter non-division leaders and sort by WC position
    const divisionLeaders = new Set<string>();
    const divisions = ['East', 'Central', 'West'];

    divisions.forEach((div) => {
      const divTeams = teams.filter((t) => t.division === div);
      if (divTeams.length > 0) {
        const leader = divTeams.reduce((best, current) =>
          current.wins > best.wins ? current : best
        );
        divisionLeaders.add(leader.teamName);
      }
    });

    const wcTeams = teams
      .filter((t) => !divisionLeaders.has(t.teamName))
      .sort((a, b) => b.wins - a.wins);

    const wcSpots = 3; // 3 wild card spots per league

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]" aria-label="MLB wild card standings">
          <thead>
            <tr className="border-b-2 border-burnt-orange">
              <th scope="col" className="text-left p-3 text-text-tertiary font-semibold w-8">WC</th>
              <th scope="col" className="text-left p-3 text-text-tertiary font-semibold">Team</th>
              <th scope="col" className="text-left p-3 text-text-tertiary font-semibold">W</th>
              <th scope="col" className="text-left p-3 text-text-tertiary font-semibold">L</th>
              <th scope="col" className="text-left p-3 text-text-tertiary font-semibold">PCT</th>
              <th scope="col" className="text-left p-3 text-text-tertiary font-semibold">WCGB</th>
              <th scope="col" className="text-left p-3 text-text-tertiary font-semibold">STRK</th>
              <th scope="col" className="text-left p-3 text-text-tertiary font-semibold">L10</th>
            </tr>
          </thead>
          <tbody>
            {wcTeams.map((team, idx) => {
              const isInWCSpot = idx < wcSpots;
              const wcGb =
                idx === 0
                  ? 0
                  : (wcTeams[0].wins - team.wins + (team.losses - wcTeams[0].losses)) / 2;

              return (
                <tr
                  key={team.teamName}
                  className={`border-b border-border-subtle hover:bg-surface-light transition-colors ${
                    isInWCSpot
                      ? 'bg-success/5'
                      : idx === wcSpots
                        ? 'border-t-2 border-burnt-orange'
                        : ''
                  }`}
                >
                  <td
                    className={`p-3 font-bold ${isInWCSpot ? 'text-success' : 'text-text-tertiary'}`}
                  >
                    {isInWCSpot ? idx + 1 : '-'}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/mlb/teams/${team.teamAbbreviation?.toLowerCase() || team.teamName.toLowerCase().replace(/\s+/g, '-')}`}
                      className="font-semibold text-text-primary hover:text-burnt-orange transition-colors flex items-center gap-2"
                    >
                      {team.teamName}
                      <span className="text-text-tertiary text-xs">{team.division}</span>
                    </Link>
                  </td>
                  <td className="p-3 text-text-secondary font-mono">{team.wins}</td>
                  <td className="p-3 text-text-secondary font-mono">{team.losses}</td>
                  <td className="p-3 text-text-secondary font-mono">
                    {team.winPercentage.toFixed(3).replace('0.', '.')}
                  </td>
                  <td className="p-3 text-text-secondary font-mono">
                    {wcGb === 0 ? '-' : wcGb.toFixed(1)}
                  </td>
                  <td
                    className={`p-3 font-mono ${team.streakCode?.startsWith('W') ? 'text-success' : team.streakCode?.startsWith('L') ? 'text-error' : 'text-text-secondary'}`}
                  >
                    {team.streakCode || '-'}
                  </td>
                  <td className="p-3 text-text-secondary font-mono">{team.last10 || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {wcTeams.length > wcSpots && (
          <div className="mt-4 text-xs text-text-tertiary">
            Teams above the line are in Wild Card position
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/mlb"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                MLB
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-text-primary font-medium">Standings</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                2025 Season
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-4">
                MLB Standings
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary max-w-2xl">
                Complete Major League Baseball standings with division, league, and wild card views.
                Updated throughout the season.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* View Toggle & Content */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {/* View Toggle */}
            <div className="flex flex-wrap gap-2 mb-8">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setViewType(view.id)}
                  className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    viewType === view.id
                      ? 'bg-burnt-orange text-white'
                      : 'bg-background-tertiary text-text-secondary hover:bg-surface-medium hover:text-text-primary'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} variant="default" padding="lg">
                    <CardHeader>
                      <Skeleton variant="text" width={200} height={24} />
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b-2 border-burnt-orange">
                              {[
                                '#',
                                'Team',
                                'W',
                                'L',
                                'PCT',
                                'GB',
                                'HOME',
                                'AWAY',
                                'RS',
                                'RA',
                                'DIFF',
                                'STRK',
                                'L10',
                              ].map((h) => (
                                <th key={h} scope="col" className="text-left p-3 text-text-tertiary font-semibold">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[1, 2, 3, 4, 5].map((j) => (
                              <SkeletonTableRow key={j} columns={13} />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card variant="default" padding="lg" className="bg-error/10 border-error/30">
                <p className="text-error font-semibold">Data Unavailable</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
                <button
                  onClick={retry}
                  className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors"
                >
                  Retry
                </button>
              </Card>
            ) : standings.length === 0 ? (
              <Card variant="default" padding="lg">
                <div className="text-center py-8">
                  <p className="text-text-secondary">No standings data available</p>
                  <p className="text-text-tertiary text-sm mt-2">
                    Standings will be available when the 2025 season begins
                  </p>
                </div>
              </Card>
            ) : (
              <>
                {/* Division View */}
                {viewType === 'division' && (
                  <div className="grid gap-6 lg:grid-cols-2">
                    {divisionOrder
                      .filter((div) => standingsByDivision[div]?.length > 0)
                      .map((division) => (
                        <ScrollReveal key={division}>
                          <Card variant="default" padding="lg">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-3">
                                <svg
                                  viewBox="0 0 24 24"
                                  className="w-5 h-5 text-burnt-orange"
                                  fill="currentColor"
                                >
                                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                </svg>
                                {division}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <StandingsTable teams={standingsByDivision[division]} />
                            </CardContent>
                          </Card>
                        </ScrollReveal>
                      ))}
                  </div>
                )}

                {/* League View */}
                {viewType === 'league' && (
                  <div className="space-y-6">
                    {leagueOrder
                      .filter((league) => standingsByLeague[league]?.length > 0)
                      .map((league) => (
                        <ScrollReveal key={league}>
                          <Card variant="default" padding="lg">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-3">
                                <svg
                                  viewBox="0 0 24 24"
                                  className="w-5 h-5 text-burnt-orange"
                                  fill="currentColor"
                                >
                                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                </svg>
                                {league === 'AL' ? 'American League' : 'National League'}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <StandingsTable teams={standingsByLeague[league]} showDivision />
                            </CardContent>
                          </Card>
                        </ScrollReveal>
                      ))}
                  </div>
                )}

                {/* Wild Card View */}
                {viewType === 'wildcard' && (
                  <div className="grid gap-6 lg:grid-cols-2">
                    {leagueOrder
                      .filter((league) => standingsByLeague[league]?.length > 0)
                      .map((league) => (
                        <ScrollReveal key={league}>
                          <Card variant="default" padding="lg">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-3">
                                <svg
                                  viewBox="0 0 24 24"
                                  className="w-5 h-5 text-burnt-orange"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                                {league === 'AL' ? 'AL Wild Card' : 'NL Wild Card'}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <WildCardTable teams={standingsByLeague[league]} league={league} />
                            </CardContent>
                          </Card>
                        </ScrollReveal>
                      ))}
                  </div>
                )}

                {/* Data Source Footer */}
                <div className="mt-6 pt-4 border-t border-border-subtle">
                  <DataSourceBadge
                    source={meta?.dataSource || 'MLB Stats API'}
                    timestamp={formatTimestamp(meta?.lastUpdated)}
                  />
                </div>
              </>
            )}
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
