'use client';

/**
 * MLB Team Detail Client
 *
 * Displays comprehensive team information including roster, depth chart,
 * schedule, and statistics. Uses centralized team data and user timezone.
 *
 * Last Updated: 2025-01-07
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton } from '@/components/ui/Skeleton';
import { useUserSettings } from '@/lib/hooks';
import { getTeamBySlug } from '@/lib/utils/mlb-teams';
import type { DataMeta } from '@/lib/types/data-meta';

interface Player {
  id: string;
  fullName: string;
  primaryNumber?: string;
  primaryPosition: {
    abbreviation: string;
  };
  batSide: {
    code: string;
  };
  pitchHand?: {
    code: string;
  };
  currentAge?: number;
  height?: string;
  weight?: number;
}

interface TeamData {
  id: number;
  name: string;
  venue?: {
    name: string;
  };
}

interface QuickStats {
  record?: string;
  winPct?: string;
  gamesBack?: string;
  streak?: string;
  divisionRank?: string;
  runDifferential?: number;
}

type TabType = 'roster' | 'depthchart' | 'schedule' | 'stats';

interface APIResponse {
  team?: TeamData;
  roster?: { roster: Player[] };
  quickStats?: QuickStats;
  meta?: DataMeta;
  error?: string;
  message?: string;
}

interface TeamDetailClientProps {
  teamId: string;
}

export default function TeamDetailClient({ teamId }: TeamDetailClientProps) {
  const [_teamData, setTeamData] = useState<TeamData | null>(null);
  const [roster, setRoster] = useState<Player[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DataMeta | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('roster');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  // User timezone for formatting
  const { formatDateTime, isLoaded: timezoneLoaded } = useUserSettings();

  // Get team info from centralized data
  const teamInfo = getTeamBySlug(teamId);

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

  const fetchTeam = useCallback(async () => {
    if (!teamId) return;

    setLoading(true);
    setError(null);
    try {
      // Use the slug - API now accepts both numeric IDs and slugs
      const res = await fetch(`/api/mlb/teams/${teamId}`);
      if (!res.ok) {
        const errorData: APIResponse = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch team data');
      }

      const data: APIResponse = await res.json();

      if (data.team) {
        setTeamData(data.team);
      }
      if (data.roster?.roster) {
        setRoster(data.roster.roster);
      }
      if (data.quickStats) {
        setQuickStats(data.quickStats);
      }
      if (data.meta) {
        setMeta(data.meta);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'roster', label: 'Roster' },
    { id: 'depthchart', label: 'Depth Chart' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'stats', label: 'Stats' },
  ];

  const positionGroups = [
    { id: 'all', label: 'All' },
    { id: 'pitchers', label: 'Pitchers' },
    { id: 'catchers', label: 'Catchers' },
    { id: 'infielders', label: 'Infielders' },
    { id: 'outfielders', label: 'Outfielders' },
  ];

  const filterRoster = (players: Player[]) => {
    if (positionFilter === 'all') return players;
    if (positionFilter === 'pitchers')
      return players.filter((p) =>
        ['P', 'SP', 'RP', 'CL'].includes(p.primaryPosition.abbreviation)
      );
    if (positionFilter === 'catchers')
      return players.filter((p) => p.primaryPosition.abbreviation === 'C');
    if (positionFilter === 'infielders')
      return players.filter((p) =>
        ['1B', '2B', '3B', 'SS'].includes(p.primaryPosition.abbreviation)
      );
    if (positionFilter === 'outfielders')
      return players.filter((p) =>
        ['LF', 'CF', 'RF', 'OF', 'DH'].includes(p.primaryPosition.abbreviation)
      );
    return players;
  };

  const RosterContent = () => {
    if (!roster.length) {
      return (
        <Card variant="default" padding="lg">
          <div className="text-center py-8">
            <p className="text-text-secondary">Roster data loading or not yet available.</p>
            <p className="text-text-tertiary text-sm mt-2">
              The 40-man roster will populate once spring training rosters are finalized. Check back
              when the boys report to camp.
            </p>
          </div>
        </Card>
      );
    }

    const filteredRoster = filterRoster(roster);

    return (
      <>
        <div className="flex flex-wrap gap-2 mb-6">
          {positionGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => setPositionFilter(group.id)}
              className={`px-4 py-2 rounded-md text-sm transition-all ${
                positionFilter === group.id
                  ? 'bg-burnt-orange text-white font-semibold'
                  : 'bg-background-tertiary text-text-secondary hover:bg-surface-light hover:text-text-primary'
              }`}
            >
              {group.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoster.map((player) => (
            <Card
              key={player.id}
              variant="default"
              padding="md"
              className="hover:border-burnt-orange transition-all"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-lg flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: teamInfo?.primaryColor || 'var(--bsi-primary)' }}
                >
                  {player.primaryNumber || '-'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary truncate">{player.fullName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {player.primaryPosition.abbreviation}
                    </Badge>
                    <span className="text-xs text-text-tertiary">
                      {player.batSide.code}/{player.pitchHand?.code || '-'}
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">
                    {player.height} | {player.weight} lbs | Age {player.currentAge}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </>
    );
  };

  const DepthChartContent = () => {
    const positions = [
      { position: 'C', label: 'Catcher' },
      { position: '1B', label: 'First Base' },
      { position: '2B', label: 'Second Base' },
      { position: 'SS', label: 'Shortstop' },
      { position: '3B', label: 'Third Base' },
      { position: 'LF', label: 'Left Field' },
      { position: 'CF', label: 'Center Field' },
      { position: 'RF', label: 'Right Field' },
      { position: 'DH', label: 'DH' },
    ];

    const pitchingRoles = [
      { role: 'SP', label: 'Starting Pitchers' },
      { role: 'RP', label: 'Relief Pitchers' },
      { role: 'CL', label: 'Closer' },
    ];

    return (
      <div className="space-y-8">
        <Card variant="default" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-burnt-orange"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              Position Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {positions.map((pos) => {
                const players = roster.filter(
                  (p) => p.primaryPosition.abbreviation === pos.position
                );
                return (
                  <div key={pos.position} className="bg-background-tertiary rounded-lg p-4">
                    <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">
                      {pos.label}
                    </p>
                    {players.length > 0 ? (
                      <div className="space-y-2">
                        {players.slice(0, 2).map((player, idx) => (
                          <div
                            key={player.id}
                            className={`flex items-center gap-2 ${idx === 0 ? 'text-text-primary' : 'text-text-secondary'}`}
                          >
                            <span className="text-xs text-burnt-orange font-mono w-6">
                              {player.primaryNumber}
                            </span>
                            <span className="text-sm truncate">{player.fullName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-text-tertiary text-sm">-</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card variant="default" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-burnt-orange"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Pitching Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {pitchingRoles.map((role) => {
                const pitchers = roster.filter((p) =>
                  role.role === 'SP'
                    ? ['SP', 'P'].includes(p.primaryPosition.abbreviation)
                    : role.role === 'CL'
                      ? p.primaryPosition.abbreviation === 'CL'
                      : p.primaryPosition.abbreviation === 'RP'
                );
                return (
                  <div key={role.role}>
                    <p className="text-sm font-semibold text-text-primary mb-3">{role.label}</p>
                    {pitchers.length > 0 ? (
                      <div className="space-y-2">
                        {pitchers
                          .slice(0, role.role === 'SP' ? 5 : role.role === 'CL' ? 1 : 6)
                          .map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center justify-between bg-background-tertiary rounded-lg px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-burnt-orange font-mono w-6">
                                  {player.primaryNumber}
                                </span>
                                <span className="text-sm text-text-secondary">
                                  {player.fullName}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-text-tertiary text-sm">-</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const ScheduleContent = () => (
    <Card variant="default" padding="lg">
      <div className="text-center py-8">
        <svg
          viewBox="0 0 24 24"
          className="w-16 h-16 text-text-tertiary mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <p className="text-text-secondary">Schedule drops when Opening Day gets closer.</p>
        <p className="text-text-tertiary text-sm mt-2 mb-4">
          MLB releases the full slate in late January. We&apos;ll have it the minute it&apos;s
          official.
        </p>
        <Link
          href="/mlb/scores"
          className="inline-flex items-center gap-2 px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors"
        >
          View Today&apos;s Games
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </Card>
  );

  const StatsContent = () => (
    <div className="grid gap-6 md:grid-cols-2">
      <Card variant="default" padding="lg">
        <CardHeader>
          <CardTitle>Team Batting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-text-tertiary">
            Team batting stats populate once the season starts. No spring training fluff—only
            regular season numbers.
          </div>
        </CardContent>
      </Card>
      <Card variant="default" padding="lg">
        <CardHeader>
          <CardTitle>Team Pitching</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-text-tertiary">
            Rotation and bullpen stats show up when games count. Check back after Opening Day.
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Fallback if team not found in centralized data
  const displayName = teamInfo?.name || teamId.toUpperCase();
  const displayAbbrev = teamInfo?.abbrev || teamId.toUpperCase();
  const displayLeague = teamInfo?.league || '';
  const displayDivision = teamInfo?.division || '';

  return (
    <>
      <div>
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
              <Link
                href="/mlb/teams"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                Teams
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-text-primary font-medium">{displayName}</span>
            </nav>
          </Container>
        </Section>

        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal>
              <div className="flex items-center gap-6">
                <div
                  className="w-24 h-24 rounded-xl flex items-center justify-center text-3xl font-bold text-white"
                  style={{ backgroundColor: teamInfo?.primaryColor || 'var(--bsi-primary)' }}
                >
                  {displayAbbrev}
                </div>
                <div>
                  <Badge variant="secondary" className="mb-2">
                    {displayLeague} {displayDivision}
                  </Badge>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-gradient-blaze">
                    {displayName}
                  </h1>
                  {quickStats?.record && (
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-text-secondary text-lg font-mono">{quickStats.record}</p>
                      {quickStats.streak && (
                        <Badge variant={quickStats.streak.startsWith('W') ? 'success' : 'error'}>
                          {quickStats.streak}
                        </Badge>
                      )}
                      {quickStats.divisionRank && (
                        <span className="text-sm text-text-tertiary">
                          {quickStats.divisionRank} in {displayDivision}
                        </span>
                      )}
                    </div>
                  )}
                  {teamInfo?.venue && (
                    <p className="text-text-tertiary text-sm mt-1">{teamInfo.venue}</p>
                  )}
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <div className="flex gap-2 mb-8 border-b border-border-subtle overflow-x-auto pb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === tab.id ? 'text-burnt-orange border-burnt-orange' : 'text-text-tertiary border-transparent hover:text-text-primary'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <Card variant="default" padding="lg">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-background-tertiary rounded-lg">
                      <Skeleton variant="rectangular" width={56} height={56} className="rounded-lg" />
                      <div className="flex-1">
                        <Skeleton variant="text" width={150} height={18} />
                        <Skeleton variant="text" width={100} height={14} className="mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : error ? (
              <Card variant="default" padding="lg" className="bg-error/10 border-error/30">
                <p className="text-error font-semibold">Unable to Load Team Data</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
                <button
                  onClick={fetchTeam}
                  className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors"
                >
                  Retry
                </button>
              </Card>
            ) : (
              <ScrollReveal key={activeTab}>
                {activeTab === 'roster' && <RosterContent />}
                {activeTab === 'depthchart' && <DepthChartContent />}
                {activeTab === 'schedule' && <ScheduleContent />}
                {activeTab === 'stats' && <StatsContent />}
              </ScrollReveal>
            )}

            <div className="mt-8 pt-4 border-t border-border-subtle">
              <DataSourceBadge
                source={meta?.dataSource || 'MLB Stats API'}
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
