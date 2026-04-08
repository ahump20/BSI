'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FilterPill } from '@/components/ui/FilterPill';
import { ScrollReveal } from '@/components/cinematic';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { HeroGlow } from '@/components/ui/HeroGlow';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { teamMetadata } from '@/lib/data/team-metadata';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { DegradedDataBanner } from '@/components/ui/DegradedDataBanner';
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
    degraded?: boolean;
  };
}

/** Look up a team's conference from teamMetadata by matching name. */
function lookupConference(teamName: string): string {
  const lower = teamName.toLowerCase();
  for (const meta of Object.values(teamMetadata)) {
    if (meta.name.toLowerCase() === lower || meta.shortName.toLowerCase() === lower) {
      return meta.conference;
    }
  }
  // Fallback: try matching just the school name (first word(s) before mascot)
  const words = teamName.split(' ');
  if (words.length > 1) {
    const school = words.slice(0, -1).join(' ').toLowerCase();
    for (const meta of Object.values(teamMetadata)) {
      if (meta.shortName.toLowerCase() === school) return meta.conference;
    }
  }
  return '';
}

// Transform rankings API response to our internal format.
// Handles both flat format (handler-normalized) and legacy ESPN nested format.
function transformESPNRankings(data: RankingsApiResponse): RankingPoll | null {
  if (data.poll) return data.poll;

  const rankings = data.rankings;
  if (!rankings?.length) return null;

  const first = rankings[0] as unknown as Record<string, unknown>;

  // Flat format: each entry has { rank, team, record, prev_rank }
  if ('rank' in first && typeof first.rank === 'number') {
    return {
      id: 'espn',
      name: 'D1Baseball Top 25',
      lastUpdated: data.meta?.lastUpdated || new Date().toISOString(),
      teams: (rankings as unknown as Array<Record<string, unknown>>).map((entry) => ({
        rank: entry.rank as number,
        previousRank: (entry.prev_rank as number) ?? undefined,
        team: (entry.team as string) || 'Unknown',
        conference: lookupConference((entry.team as string) || ''),
        record: (entry.record as string) || '',
        points: (entry.points as number) || undefined,
        firstPlace: (entry.firstPlaceVotes as number) || undefined,
      })),
    };
  }

  // Legacy nested ESPN format: { name, ranks: [{ current, team: { location, name } }] }
  const poll = first as unknown as ESPNRankingPoll;
  if (!poll.ranks) return null;

  return {
    id: 'espn',
    name: poll.name || 'ESPN Top 25',
    lastUpdated: data.meta?.lastUpdated || new Date().toISOString(),
    teams: poll.ranks.map((entry) => {
      const teamName = entry.team?.location
        ? `${entry.team.location} ${entry.team.name}`
        : entry.team?.nickname || entry.team?.name || 'Unknown';
      return {
        rank: entry.current,
        previousRank: entry.previous,
        team: teamName,
        conference: lookupConference(teamName),
        record: entry.recordSummary || '',
        points: entry.points || undefined,
        firstPlace: entry.firstPlaceVotes || undefined,
      };
    }),
  };
}

export default function CollegeBaseballRankingsPage() {
  const [selectedPoll, setSelectedPoll] = useState('d1baseball');

  const { data: rawData, loading, error, retry } = useSportData<RankingsApiResponse>(
    '/api/college-baseball/rankings'
  );
  const rankings = rawData ? transformESPNRankings(rawData) : null;

  // Determine which optional columns have real data
  const hasPoints = rankings?.teams.some((t) => t.points != null && t.points > 0) ?? false;
  const hasFirstPlace = rankings?.teams.some((t) => t.firstPlace != null && t.firstPlace > 0) ?? false;
  const hasStreak = rankings?.teams.some((t) => t.streak && t.streak !== '-') ?? false;
  const hasConference = rankings?.teams.some((t) => t.conference && t.conference.length > 0) ?? false;

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
      <div>
        <Section padding="lg" className="pt-6 relative overflow-hidden">
          <HeroGlow position="50% 15%" spread="65%" />
          <Container>
            {/* Breadcrumb & Header */}
            <ScrollReveal direction="up">
              <Breadcrumb
                className="mb-4"
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'College Baseball', href: '/college-baseball' },
                  { label: 'Rankings' },
                ]}
              />

              <div className="mb-8">
                <span className="section-label block mb-3">NCAA Division I Baseball</span>
                <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display">
                  Top 25 <span className="text-gradient-blaze">Rankings</span>
                </h1>
                <p className="text-burnt-orange font-serif italic text-lg mt-2 max-w-2xl">
                  D1Baseball, USA Today Coaches Poll, Perfect Game, and NCAA RPI — all in one place.
                </p>
              </div>
            </ScrollReveal>

            {/* Poll Selector */}
            <ScrollReveal direction="up" delay={100}>
              <div className="flex flex-wrap gap-2 mb-8">
                {pollOptions.map((poll) => (
                  <FilterPill
                    key={poll.value}
                    active={selectedPoll === poll.value}
                    onClick={() => setSelectedPoll(poll.value)}
                  >
                    {poll.label}
                  </FilterPill>
                ))}
              </div>
            </ScrollReveal>

            {/* Rankings Info Card */}
            <ScrollReveal direction="up" delay={150}>
              <Card padding="lg" className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-text-primary">
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

            <DegradedDataBanner degraded={!!rawData?.meta?.degraded} source={rawData?.meta?.dataSource} />

            {/* Rankings Table */}
            <DataErrorBoundary name="Rankings">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block w-10 h-10 border-4 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin mb-4" />
                <p className="text-text-secondary">Loading rankings...</p>
                <p className="text-text-tertiary text-xs mt-2">This usually takes a few seconds</p>
              </div>
            ) : error ? (
              <Card padding="lg" className="text-center">
                <div className="text-error text-4xl mb-4">!</div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">Error Loading Rankings</h3>
                <p className="text-text-secondary mb-4">{error}</p>
                <button
                  onClick={retry}
                  className="px-4 py-2 bg-burnt-orange/20 text-burnt-orange rounded-sm text-sm font-medium hover:bg-burnt-orange/30 transition-colors"
                >
                  Try again
                </button>
              </Card>
            ) : !rankings || rankings.teams.length === 0 ? (
              <Card padding="lg" className="text-center">
                <div className="text-text-tertiary text-4xl mb-4">?</div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">No Rankings Available</h3>
                <p className="text-text-secondary mb-4">
                  Rankings for this poll are not currently available. Try another source.
                </p>
                <button
                  onClick={retry}
                  className="px-4 py-2 bg-surface-light text-text-secondary rounded-sm text-sm font-medium hover:bg-surface-medium transition-colors"
                >
                  Refresh
                </button>
              </Card>
            ) : (
              <ScrollReveal direction="up" delay={200}>
                <Card padding="none" className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-surface-press-box border-b border-border-vintage">
                          <th className="text-left py-4 px-4 text-xs font-semibold text-bsi-dust uppercase tracking-wider w-16">
                            Rank
                          </th>
                          <th className="text-left py-4 px-4 text-xs font-semibold text-bsi-dust uppercase tracking-wider">
                            Team
                          </th>
                          {hasConference && (
                            <th className="text-left py-4 px-4 text-xs font-semibold text-bsi-dust uppercase tracking-wider hidden md:table-cell">
                              Conference
                            </th>
                          )}
                          <th className="text-center py-4 px-4 text-xs font-semibold text-bsi-dust uppercase tracking-wider">
                            Record
                          </th>
                          {selectedPoll === 'rpi' && (
                            <th className="text-center py-4 px-4 text-xs font-semibold text-bsi-dust uppercase tracking-wider hidden lg:table-cell">
                              SOS
                            </th>
                          )}
                          {hasPoints && (
                            <th className="text-center py-4 px-4 text-xs font-semibold text-bsi-dust uppercase tracking-wider hidden lg:table-cell">
                              Points
                            </th>
                          )}
                          {hasFirstPlace && (
                            <th className="text-center py-4 px-4 text-xs font-semibold text-bsi-dust uppercase tracking-wider hidden lg:table-cell">
                              #1 Votes
                            </th>
                          )}
                          {hasStreak && (
                            <th className="text-center py-4 px-4 text-xs font-semibold text-bsi-dust uppercase tracking-wider hidden md:table-cell">
                              Streak
                            </th>
                          )}
                          <th className="text-center py-4 px-4 text-xs font-semibold text-bsi-dust uppercase tracking-wider w-24">
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
                              className={`border-b border-border-subtle hover:bg-background-secondary/50 transition-colors ${
                                isTopTen ? 'bg-burnt-orange/5' : ''
                              }`}
                            >
                              <td className="py-4 px-4">
                                <span
                                  className={`font-display text-lg font-bold ${
                                    isTopTen ? 'text-burnt-orange' : 'text-text-primary'
                                  }`}
                                >
                                  {team.rank}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <Link
                                  href={`/college-baseball/teams/${teamSlug(team.team)}`}
                                  className="font-semibold text-text-primary hover:text-burnt-orange transition-colors"
                                >
                                  {team.team}
                                </Link>
                              </td>
                              {hasConference && (
                                <td className="py-4 px-4 text-text-secondary hidden md:table-cell">
                                  {team.conference}
                                </td>
                              )}
                              <td className="py-4 px-4 text-center">
                                <span className="text-text-primary font-mono">{team.record}</span>
                              </td>
                              {selectedPoll === 'rpi' && (
                                <td className="py-4 px-4 text-center text-text-secondary font-mono hidden lg:table-cell">
                                  {team.sos ?? '-'}
                                </td>
                              )}
                              {hasPoints && (
                                <td className="py-4 px-4 text-center text-text-secondary font-mono hidden lg:table-cell">
                                  {team.points ?? '-'}
                                </td>
                              )}
                              {hasFirstPlace && (
                                <td className="py-4 px-4 text-center text-text-secondary hidden lg:table-cell">
                                  {team.firstPlace ? `(${team.firstPlace})` : '-'}
                                </td>
                              )}
                              {hasStreak && (
                                <td
                                  className={`py-4 px-4 text-center font-semibold hidden md:table-cell ${getStreakClass(team.streak)}`}
                                >
                                  {team.streak ?? '-'}
                                </td>
                              )}
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
                  <div className="px-4 py-3 bg-surface-press-box border-t border-border-vintage">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-bsi-dust">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-burnt-orange/20 rounded-sm" />
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

            {/* Dropped Out — shows teams that fell from the Top 25 based on rank movement */}
            {rankings && rankings.teams.length > 0 && (() => {
              const droppedOut = rankings.teams.filter(
                (t) => t.previousRank !== undefined && t.previousRank <= 25 && t.rank > 25
              );
              const alsoReceiving = rankings.teams.filter(
                (t) => t.rank > 25 && (t.points ?? 0) > 0
              );
              if (droppedOut.length === 0 && alsoReceiving.length === 0) return null;
              return (
                <ScrollReveal direction="up" delay={250}>
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {alsoReceiving.length > 0 && (
                      <Card padding="md">
                        <h3 className="font-display text-lg font-bold text-text-primary mb-4">
                          Also Receiving Votes
                        </h3>
                        <div className="space-y-2">
                          {alsoReceiving.map((t) => (
                            <div key={t.team} className="flex items-center justify-between text-sm">
                              <Link
                                href={`/college-baseball/teams/${teamSlug(t.team)}`}
                                className="text-text-primary hover:text-burnt-orange transition-colors font-medium"
                              >
                                {t.team}
                              </Link>
                              <span className="text-text-secondary font-mono text-xs">
                                {t.points} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                    {droppedOut.length > 0 && (
                      <Card padding="md">
                        <h3 className="font-display text-lg font-bold text-text-primary mb-4">
                          Dropped Out
                        </h3>
                        <div className="space-y-2">
                          {droppedOut.map((t) => (
                            <div key={t.team} className="flex items-center justify-between text-sm">
                              <Link
                                href={`/college-baseball/teams/${teamSlug(t.team)}`}
                                className="text-text-primary hover:text-burnt-orange transition-colors font-medium"
                              >
                                {t.team}
                              </Link>
                              <span className="text-error text-xs">
                                was #{t.previousRank}
                              </span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                </ScrollReveal>
              );
            })()}

            {/* Savant Cross-Link */}
            <div className="mt-10">
              <Link
                href="/college-baseball/savant"
                className="block p-4 transition-colors group bg-surface-dugout border border-border-vintage"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="heritage-stamp text-[10px] text-bsi-primary">BSI SAVANT</span>
                    <p className="font-oswald uppercase text-sm tracking-wider mt-1 text-bsi-bone">
                      Rankings only tell half the story
                    </p>
                    <p className="font-cormorant text-xs mt-1 text-bsi-dust">
                      Park-adjusted wOBA, wRC+, FIP — the metrics that predict who&apos;s real and who&apos;s due for regression
                    </p>
                  </div>
                  <svg viewBox="0 0 24 24" className="w-5 h-5 opacity-40 group-hover:opacity-70 group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" strokeWidth="2" className="text-bsi-primary">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>

            {/* Data Attribution */}
            <div className="mt-6 pt-4 border-t border-border-vintage flex justify-center">
              <DataAttribution
                source="D1Baseball"
                lastUpdated={rankings?.lastUpdated}
              />
            </div>
            </DataErrorBoundary>
          </Container>
        </Section>
      </div>

    </>
  );
}
