'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { teamMetadata } from '@/lib/data/team-metadata';
import { formatTimestamp } from '@/lib/utils/timezone';

/** Map a full team name (e.g. "Texas Longhorns") to its teamMetadata slug (e.g. "texas"). */
function teamSlug(fullName: string): string {
  const lower = fullName.toLowerCase();
  for (const [slug, meta] of Object.entries(teamMetadata)) {
    if (meta.name.toLowerCase() === lower || meta.shortName.toLowerCase() === lower) {
      return slug;
    }
  }
  // Fallback: remove last word (mascot) and slugify
  const words = fullName.split(' ');
  if (words.length > 1) {
    return words.slice(0, -1).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
  }
  return fullName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

interface RankedTeam {
  rank: number;
  previousRank?: number;
  team: string;
  conference: string;
  record: string;
  points?: number;
  firstPlace?: number;
  rpi?: number;
  sos?: number;
  streak?: string;
}

interface RankingPoll {
  id: string;
  name: string;
  lastUpdated: string;
  teams: RankedTeam[];
}

const pollOptions = [
  { value: 'd1baseball', label: 'D1Baseball Top 25' },
  { value: 'coaches', label: 'USA Today Coaches Poll' },
  { value: 'perfectgame', label: 'Perfect Game' },
  { value: 'rpi', label: 'NCAA RPI' },
];

// ESPN API response shape
interface ESPNRankEntry {
  current: number;
  previous?: number;
  points?: number;
  firstPlaceVotes?: number;
  team: {
    id: string;
    name: string;           // Mascot name (e.g., "Bruins")
    location?: string;      // School name (e.g., "UCLA")
    nickname?: string;      // Short name (e.g., "UCLA")
    abbreviation?: string;
    logos?: Array<{ href: string }>;
  };
  recordSummary?: string;
}

interface ESPNRankingPoll {
  name: string;
  type?: string;
  ranks: ESPNRankEntry[];
}

interface RankingsApiResponse {
  timestamp?: string;
  rankings?: ESPNRankingPoll[];
  poll?: RankingPoll;
  meta?: {
    dataSource: string;
    lastUpdated: string;
    sport: string;
  };
}

// Transform ESPN rankings to our internal format
function transformESPNRankings(data: RankingsApiResponse): RankingPoll | null {
  // If we have the old format with poll, use it directly
  if (data.poll) {
    return data.poll;
  }

  // Transform ESPN format
  const firstPoll = data.rankings?.[0];
  if (!firstPoll || !firstPoll.ranks) {
    return null;
  }

  return {
    id: 'espn',
    name: firstPoll.name || 'ESPN Top 25',
    lastUpdated: data.meta?.lastUpdated || new Date().toISOString(),
    teams: firstPoll.ranks.map((entry) => ({
      rank: entry.current,
      previousRank: entry.previous,
      // Use location (school name) + name (mascot) for full team name
      // e.g., "UCLA" + "Bruins" = "UCLA Bruins"
      team: entry.team?.location
        ? `${entry.team.location} ${entry.team.name}`
        : entry.team?.nickname || entry.team?.name || 'Unknown',
      conference: '', // ESPN doesn't include conference in rankings
      record: entry.recordSummary || '',
      points: entry.points,
      firstPlace: entry.firstPlaceVotes,
    })),
  };
}

export default function CollegeBaseballRankingsPage() {
  const [selectedPoll, setSelectedPoll] = useState('d1baseball');

  const { data: rawData, loading, error } = useSportData<RankingsApiResponse>(
    '/api/college-baseball/rankings'
  );
  const rankings = rawData ? transformESPNRankings(rawData) : null;

  const getRankChange = (current: number, previous?: number) => {
    if (!previous || current === previous) return null;
    const change = previous - current;
    if (change > 0) return { direction: 'up', value: change };
    return { direction: 'down', value: Math.abs(change) };
  };

  const getStreakClass = (streak?: string) => {
    if (!streak) return 'text-text-tertiary';
    if (streak.startsWith('W')) return 'text-success';
    if (streak.startsWith('L')) return 'text-error';
    return 'text-text-tertiary';
  };

  return (
    <>
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
                <span className="text-white">Rankings</span>
              </div>

              <div className="mb-8">
                <span className="kicker block mb-2">NCAA Division I Baseball</span>
                <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display">
                  Top 25 <span className="text-gradient-blaze">Rankings</span>
                </h1>
                <p className="text-text-secondary mt-2 max-w-2xl">
                  The definitive college baseball rankings from D1Baseball, USA Today Coaches Poll,
                  Perfect Game, and the official NCAA RPI.
                </p>
              </div>
            </ScrollReveal>

            {/* Poll Selector */}
            <ScrollReveal direction="up" delay={100}>
              <div className="flex flex-wrap gap-2 mb-8">
                {pollOptions.map((poll) => (
                  <button
                    key={poll.value}
                    onClick={() => setSelectedPoll(poll.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedPoll === poll.value
                        ? 'bg-burnt-orange text-white'
                        : 'bg-charcoal text-text-secondary hover:text-white hover:bg-slate'
                    }`}
                  >
                    {poll.label}
                  </button>
                ))}
              </div>
            </ScrollReveal>

            {/* Rankings Info Card */}
            <ScrollReveal direction="up" delay={150}>
              <Card padding="lg" className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-white">
                      {pollOptions.find((p) => p.value === selectedPoll)?.label}
                    </h2>
                    {rankings && (
                      <p className="text-text-tertiary text-sm mt-1">
                        Last updated: {formatTimestamp(rankings.lastUpdated)}
                      </p>
                    )}
                  </div>
                  <Badge variant="primary">{new Date().getMonth() >= 8 ? new Date().getFullYear() + 1 : new Date().getFullYear()} Season</Badge>
                </div>
              </Card>
            </ScrollReveal>

            {/* Rankings Table */}
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block w-10 h-10 border-4 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin mb-4" />
                <p className="text-text-secondary">Loading rankings...</p>
              </div>
            ) : error ? (
              <Card padding="lg" className="text-center">
                <div className="text-error text-4xl mb-4">!</div>
                <h3 className="text-xl font-semibold text-white mb-2">Error Loading Rankings</h3>
                <p className="text-text-secondary">{error}</p>
              </Card>
            ) : !rankings || rankings.teams.length === 0 ? (
              <Card padding="lg" className="text-center">
                <div className="text-text-tertiary text-4xl mb-4">?</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Rankings Available</h3>
                <p className="text-text-secondary">
                  Rankings for this poll are not currently available.
                </p>
              </Card>
            ) : (
              <ScrollReveal direction="up" delay={200}>
                <Card padding="none" className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-charcoal border-b border-border-subtle">
                          <th className="text-left py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider w-16">
                            Rank
                          </th>
                          <th className="text-left py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                            Team
                          </th>
                          <th className="text-left py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider hidden md:table-cell">
                            Conference
                          </th>
                          <th className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                            Record
                          </th>
                          {selectedPoll === 'rpi' && (
                            <>
                              <th className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider hidden lg:table-cell">
                                SOS
                              </th>
                            </>
                          )}
                          {(selectedPoll === 'd1baseball' || selectedPoll === 'coaches') && (
                            <>
                              <th className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider hidden lg:table-cell">
                                Points
                              </th>
                              <th className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider hidden lg:table-cell">
                                #1 Votes
                              </th>
                            </>
                          )}
                          <th className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider hidden md:table-cell">
                            Streak
                          </th>
                          <th className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider w-24">
                            Change
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankings.teams.map((team) => {
                          const change = getRankChange(team.rank, team.previousRank);
                          const isTopTen = team.rank <= 10;

                          return (
                            <tr
                              key={`${team.team}-${team.rank}`}
                              className={`border-b border-border-subtle hover:bg-charcoal/50 transition-colors ${
                                isTopTen ? 'bg-burnt-orange/5' : ''
                              }`}
                            >
                              <td className="py-4 px-4">
                                <span
                                  className={`font-display text-lg font-bold ${
                                    isTopTen ? 'text-burnt-orange' : 'text-white'
                                  }`}
                                >
                                  {team.rank}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <Link
                                  href={`/college-baseball/teams/${teamSlug(team.team)}`}
                                  className="font-semibold text-white hover:text-burnt-orange transition-colors"
                                >
                                  {team.team}
                                </Link>
                              </td>
                              <td className="py-4 px-4 text-text-secondary hidden md:table-cell">
                                {team.conference}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className="text-white font-mono">{team.record}</span>
                              </td>
                              {selectedPoll === 'rpi' && (
                                <>
                                  <td className="py-4 px-4 text-center text-text-secondary font-mono hidden lg:table-cell">
                                    {team.sos ?? '-'}
                                  </td>
                                </>
                              )}
                              {(selectedPoll === 'd1baseball' || selectedPoll === 'coaches') && (
                                <>
                                  <td className="py-4 px-4 text-center text-text-secondary font-mono hidden lg:table-cell">
                                    {team.points ?? '-'}
                                  </td>
                                  <td className="py-4 px-4 text-center text-text-secondary hidden lg:table-cell">
                                    {team.firstPlace ? `(${team.firstPlace})` : '-'}
                                  </td>
                                </>
                              )}
                              <td
                                className={`py-4 px-4 text-center font-semibold hidden md:table-cell ${getStreakClass(team.streak)}`}
                              >
                                {team.streak ?? '-'}
                              </td>
                              <td className="py-4 px-4 text-center">
                                {change ? (
                                  <span
                                    className={`inline-flex items-center gap-1 ${
                                      change.direction === 'up' ? 'text-success' : 'text-error'
                                    }`}
                                  >
                                    {change.direction === 'up' ? (
                                      <svg
                                        className="w-4 h-4"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    ) : (
                                      <svg
                                        className="w-4 h-4"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    )}
                                    {change.value}
                                  </span>
                                ) : team.previousRank === undefined ? (
                                  <Badge variant="success" size="sm">
                                    NEW
                                  </Badge>
                                ) : (
                                  <span className="text-text-tertiary">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Legend */}
                  <div className="px-4 py-3 bg-charcoal border-t border-border-subtle">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-text-tertiary">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-burnt-orange/20 rounded" />
                        <span>Top 10 Teams</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-success">W</span>
                        <span>= Winning Streak</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-error">L</span>
                        <span>= Losing Streak</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </ScrollReveal>
            )}

            {/* Also Receiving Votes / Dropped Out */}
            {rankings && rankings.teams.length > 0 && (
              <ScrollReveal direction="up" delay={250}>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card padding="md">
                    <h3 className="font-display text-lg font-bold text-white mb-4">
                      Also Receiving Votes
                    </h3>
                    <p className="text-text-secondary text-sm">
                      Additional teams receiving votes will appear here as the season progresses.
                    </p>
                  </Card>
                  <Card padding="md">
                    <h3 className="font-display text-lg font-bold text-white mb-4">Dropped Out</h3>
                    <p className="text-text-secondary text-sm">
                      Teams that fell out of the rankings will appear here during the season.
                    </p>
                  </Card>
                </div>
              </ScrollReveal>
            )}

            {/* Data Attribution */}
            <div className="mt-12 text-center text-xs text-text-tertiary">
              <p>
                Rankings sourced from official polls and D1Baseball. Updated weekly during season.
              </p>
              {rankings && (
                <p className="mt-1">
                  Source data: {formatTimestamp(rankings.lastUpdated)}
                </p>
              )}
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
