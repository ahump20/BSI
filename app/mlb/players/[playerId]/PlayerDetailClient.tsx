'use client';

/**
 * MLB Player Detail Client
 *
 * Displays comprehensive player profile with stats, splits, and advanced metrics.
 * Uses /api/mlb/players/:playerId endpoint.
 *
 * Last Updated: 2025-01-07
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { useUserSettings } from '@/lib/hooks';
import { useSportData } from '@/lib/hooks/useSportData';
import type { DataMeta } from '@/lib/types/data-meta';

interface PlayerInfo {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  primaryNumber?: string;
  birthDate?: string;
  currentAge?: number;
  birthCity?: string;
  birthStateProvince?: string;
  birthCountry?: string;
  height?: string;
  weight?: number;
  active: boolean;
  mlbDebutDate?: string;
  draftYear?: number;
  currentTeam?: {
    id: number;
    name: string;
  };
  primaryPosition: {
    code: string;
    name: string;
    type: string;
    abbreviation: string;
  };
  batSide: {
    code: string;
    description: string;
  };
  pitchHand: {
    code: string;
    description: string;
  };
}

interface Assets {
  headshot: string;
  heroImage: string;
  teamLogo: string | null;
}

interface StatLine {
  season: number;
  team: { name: string };
  stat: Record<string, number | string>;
}

interface Stats {
  season: number;
  seasonStats: StatLine[];
  advancedStats?: Record<string, number>;
  splits?: {
    vsLeft?: Record<string, number>;
    vsRight?: Record<string, number>;
    home?: Record<string, number>;
    away?: Record<string, number>;
  };
  gameLog?: Array<{
    date: string;
    opponent: string;
    stat: Record<string, number | string>;
  }>;
}

interface PlayerAPIResponse {
  player?: PlayerInfo;
  assets?: Assets;
  stats?: Stats;
  meta?: DataMeta;
  error?: string;
  message?: string;
}

type TabType = 'overview' | 'splits' | 'gamelog' | 'advanced';

interface PlayerDetailClientProps {
  playerId: string;
}

export default function PlayerDetailClient({ playerId }: PlayerDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

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

  const { data: rawData, loading, error } = useSportData<PlayerAPIResponse>(
    playerId ? `/api/mlb/players/${playerId}?includeSplits=true` : null
  );

  const player = rawData?.player ?? null;
  const assets = rawData?.assets ?? null;
  const stats = rawData?.stats ?? null;
  const meta = rawData?.meta ?? null;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'splits', label: 'Splits' },
    { id: 'gamelog', label: 'Game Log' },
    { id: 'advanced', label: 'Advanced' },
  ];

  const formatStat = (value: number | string | undefined, decimals: number = 3): string => {
    if (value === undefined || value === null) return '-';
    if (typeof value === 'string') return value;
    return decimals === 0 ? value.toString() : value.toFixed(decimals);
  };

  // Get the primary stat line from season stats
  const primaryStats = stats?.seasonStats?.[0]?.stat || {};
  const isPitcher = meta?.isPitcher || false;

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
              <Link
                href="/mlb/players"
                className="text-[rgba(196,184,165,0.5)] hover:text-[var(--bsi-primary)] transition-colors"
              >
                Players
              </Link>
              <span className="text-[rgba(196,184,165,0.5)]">/</span>
              <span className="text-[var(--bsi-bone)] font-medium">
                {loading ? 'Loading...' : player?.fullName || 'Player'}
              </span>
            </nav>
          </Container>
        </Section>

        {loading ? (
          <Section padding="lg">
            <Container>
              <div className="text-center py-16">
                <div className="inline-block w-10 h-10 border-4 border-[var(--bsi-primary)]/30 border-t-[var(--bsi-primary)] rounded-full animate-spin mb-4" />
                <p className="text-[var(--bsi-dust)]">Loading player data...</p>
              </div>
            </Container>
          </Section>
        ) : error ? (
          <Section padding="lg">
            <Container>
              <Card padding="lg" className="text-center">
                <div className="text-error text-4xl mb-4">!</div>
                <h3 className="text-xl font-semibold text-[var(--bsi-bone)] mb-2">Error Loading Player</h3>
                <p className="text-[var(--bsi-dust)] mb-4">{error}</p>
                <Link
                  href="/mlb/players"
                  className="inline-block px-4 py-2 bg-[var(--bsi-primary)] text-white rounded-sm hover:bg-[var(--bsi-primary)]/90 transition-colors"
                >
                  Back to Players
                </Link>
              </Card>
            </Container>
          </Section>
        ) : player ? (
          <>
            {/* Player Header */}
            <Section padding="lg" className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

              <Container>
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Headshot */}
                  <ScrollReveal direction="left">
                    <div className="relative w-40 h-40 rounded-sm overflow-hidden bg-[var(--surface-dugout)] border border-[var(--border-vintage)]">
                      {assets?.headshot ? (
                        <Image
                          src={assets.headshot}
                          alt={player.fullName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-[rgba(196,184,165,0.5)]">
                          {player.firstName?.[0]}
                          {player.lastName?.[0]}
                        </div>
                      )}
                    </div>
                  </ScrollReveal>

                  {/* Info */}
                  <div className="flex-1">
                    <ScrollReveal direction="up">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        {player.primaryNumber && (
                          <Badge variant="primary" className="text-lg">
                            #{player.primaryNumber}
                          </Badge>
                        )}
                        <Badge variant="secondary">{player.primaryPosition.abbreviation}</Badge>
                        {isPitcher ? (
                          <Badge variant="info">Pitcher</Badge>
                        ) : (
                          <Badge variant="info">Position Player</Badge>
                        )}
                      </div>
                    </ScrollReveal>

                    <ScrollReveal direction="up" delay={50}>
                      <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-[var(--bsi-primary)] mb-2">
                        {player.fullName}
                      </h1>
                    </ScrollReveal>

                    <ScrollReveal direction="up" delay={100}>
                      <p className="text-[var(--bsi-dust)] text-lg mb-4">
                        {player.currentTeam?.name || 'Free Agent'}
                      </p>
                    </ScrollReveal>

                    {/* Bio Stats */}
                    <ScrollReveal direction="up" delay={150}>
                      <div className="flex flex-wrap gap-6 text-sm">
                        {player.currentAge && (
                          <div>
                            <span className="text-[rgba(196,184,165,0.5)]">Age:</span>{' '}
                            <span className="text-[var(--bsi-bone)] font-medium">{player.currentAge}</span>
                          </div>
                        )}
                        {player.height && (
                          <div>
                            <span className="text-[rgba(196,184,165,0.5)]">Height:</span>{' '}
                            <span className="text-[var(--bsi-bone)] font-medium">{player.height}</span>
                          </div>
                        )}
                        {player.weight && (
                          <div>
                            <span className="text-[rgba(196,184,165,0.5)]">Weight:</span>{' '}
                            <span className="text-[var(--bsi-bone)] font-medium">{player.weight} lbs</span>
                          </div>
                        )}
                        <div>
                          <span className="text-[rgba(196,184,165,0.5)]">Bats:</span>{' '}
                          <span className="text-[var(--bsi-bone)] font-medium">
                            {player.batSide?.description || player.batSide?.code}
                          </span>
                        </div>
                        <div>
                          <span className="text-[rgba(196,184,165,0.5)]">Throws:</span>{' '}
                          <span className="text-[var(--bsi-bone)] font-medium">
                            {player.pitchHand?.description || player.pitchHand?.code}
                          </span>
                        </div>
                        {player.birthCity && (
                          <div>
                            <span className="text-[rgba(196,184,165,0.5)]">From:</span>{' '}
                            <span className="text-[var(--bsi-bone)] font-medium">
                              {player.birthCity}
                              {player.birthStateProvince && `, ${player.birthStateProvince}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </ScrollReveal>
                  </div>

                  {/* Quick Stats Card */}
                  <ScrollReveal direction="right" delay={100}>
                    <Card padding="md" className="min-w-[200px]">
                      <div className="text-center mb-4">
                        <p className="text-[rgba(196,184,165,0.5)] text-xs uppercase tracking-wider mb-1">
                          {stats?.season} Season
                        </p>
                      </div>
                      {isPitcher ? (
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="font-display text-2xl font-bold text-[var(--bsi-primary)]">
                              {formatStat(primaryStats.era as number, 2)}
                            </div>
                            <div className="text-[rgba(196,184,165,0.5)] text-xs uppercase">ERA</div>
                          </div>
                          <div>
                            <div className="font-display text-2xl font-bold text-[var(--bsi-bone)]">
                              {primaryStats.wins ?? '-'}-{primaryStats.losses ?? '-'}
                            </div>
                            <div className="text-[rgba(196,184,165,0.5)] text-xs uppercase">W-L</div>
                          </div>
                          <div>
                            <div className="font-display text-2xl font-bold text-[var(--bsi-bone)]">
                              {formatStat(primaryStats.strikeOuts as number, 0)}
                            </div>
                            <div className="text-[rgba(196,184,165,0.5)] text-xs uppercase">K</div>
                          </div>
                          <div>
                            <div className="font-display text-2xl font-bold text-[var(--bsi-primary)]">
                              {formatStat(primaryStats.whip as number, 2)}
                            </div>
                            <div className="text-[rgba(196,184,165,0.5)] text-xs uppercase">WHIP</div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="font-display text-2xl font-bold text-[var(--bsi-primary)]">
                              {formatStat(primaryStats.avg as number)}
                            </div>
                            <div className="text-[rgba(196,184,165,0.5)] text-xs uppercase">AVG</div>
                          </div>
                          <div>
                            <div className="font-display text-2xl font-bold text-[var(--bsi-bone)]">
                              {formatStat(primaryStats.homeRuns as number, 0)}
                            </div>
                            <div className="text-[rgba(196,184,165,0.5)] text-xs uppercase">HR</div>
                          </div>
                          <div>
                            <div className="font-display text-2xl font-bold text-[var(--bsi-bone)]">
                              {formatStat(primaryStats.rbi as number, 0)}
                            </div>
                            <div className="text-[rgba(196,184,165,0.5)] text-xs uppercase">RBI</div>
                          </div>
                          <div>
                            <div className="font-display text-2xl font-bold text-[var(--bsi-primary)]">
                              {formatStat(primaryStats.ops as number)}
                            </div>
                            <div className="text-[rgba(196,184,165,0.5)] text-xs uppercase">OPS</div>
                          </div>
                        </div>
                      )}
                    </Card>
                  </ScrollReveal>
                </div>
              </Container>
            </Section>

            {/* Tabs */}
            <Section
              padding="none"
              className="border-b border-[var(--border-vintage)] sticky top-0 bg-[var(--surface-dugout)] z-10"
            >
              <Container>
                <div className="flex gap-1 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'text-[var(--bsi-primary)] border-b-2 border-[var(--bsi-primary)]'
                          : 'text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </Container>
            </Section>

            {/* Tab Content */}
            <Section padding="lg" background="charcoal">
              <Container>
                {activeTab === 'overview' && (
                  <ScrollReveal direction="up">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Season Stats */}
                      <Card>
                        <CardHeader>
                          <CardTitle>{stats?.season} Season Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {isPitcher ? (
                            <div className="grid grid-cols-3 gap-4">
                              {[
                                { label: 'Games', value: primaryStats.gamesPlayed, decimals: 0 },
                                { label: 'GS', value: primaryStats.gamesStarted, decimals: 0 },
                                { label: 'IP', value: primaryStats.inningsPitched, decimals: 1 },
                                { label: 'ERA', value: primaryStats.era, decimals: 2 },
                                { label: 'WHIP', value: primaryStats.whip, decimals: 2 },
                                { label: 'W', value: primaryStats.wins, decimals: 0 },
                                { label: 'L', value: primaryStats.losses, decimals: 0 },
                                { label: 'SV', value: primaryStats.saves, decimals: 0 },
                                { label: 'K', value: primaryStats.strikeOuts, decimals: 0 },
                                { label: 'BB', value: primaryStats.baseOnBalls, decimals: 0 },
                                { label: 'H', value: primaryStats.hits, decimals: 0 },
                                { label: 'HR', value: primaryStats.homeRuns, decimals: 0 },
                              ].map((stat) => (
                                <div key={stat.label} className="text-center">
                                  <div className="text-[var(--bsi-bone)] font-mono font-semibold">
                                    {formatStat(stat.value as number, stat.decimals)}
                                  </div>
                                  <div className="text-[rgba(196,184,165,0.5)] text-xs uppercase">
                                    {stat.label}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-4">
                              {[
                                { label: 'G', value: primaryStats.gamesPlayed, decimals: 0 },
                                { label: 'AB', value: primaryStats.atBats, decimals: 0 },
                                { label: 'H', value: primaryStats.hits, decimals: 0 },
                                { label: 'AVG', value: primaryStats.avg, decimals: 3 },
                                { label: 'OBP', value: primaryStats.obp, decimals: 3 },
                                { label: 'SLG', value: primaryStats.slg, decimals: 3 },
                                { label: 'OPS', value: primaryStats.ops, decimals: 3 },
                                { label: 'HR', value: primaryStats.homeRuns, decimals: 0 },
                                { label: 'RBI', value: primaryStats.rbi, decimals: 0 },
                                { label: 'R', value: primaryStats.runs, decimals: 0 },
                                { label: 'SB', value: primaryStats.stolenBases, decimals: 0 },
                                { label: 'BB', value: primaryStats.baseOnBalls, decimals: 0 },
                              ].map((stat) => (
                                <div key={stat.label} className="text-center">
                                  <div className="text-[var(--bsi-bone)] font-mono font-semibold">
                                    {formatStat(stat.value as number, stat.decimals)}
                                  </div>
                                  <div className="text-[rgba(196,184,165,0.5)] text-xs uppercase">
                                    {stat.label}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Player Info */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Player Info</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <dl className="space-y-3">
                            <div className="flex justify-between">
                              <dt className="text-[rgba(196,184,165,0.5)]">Full Name</dt>
                              <dd className="text-[var(--bsi-bone)]">{player.fullName}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-[rgba(196,184,165,0.5)]">Position</dt>
                              <dd className="text-[var(--bsi-bone)]">{player.primaryPosition.name}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-[rgba(196,184,165,0.5)]">Bats/Throws</dt>
                              <dd className="text-[var(--bsi-bone)]">
                                {player.batSide?.code}/{player.pitchHand?.code}
                              </dd>
                            </div>
                            {player.mlbDebutDate && (
                              <div className="flex justify-between">
                                <dt className="text-[rgba(196,184,165,0.5)]">MLB Debut</dt>
                                <dd className="text-[var(--bsi-bone)]">{player.mlbDebutDate}</dd>
                              </div>
                            )}
                            {player.draftYear && (
                              <div className="flex justify-between">
                                <dt className="text-[rgba(196,184,165,0.5)]">Draft Year</dt>
                                <dd className="text-[var(--bsi-bone)]">{player.draftYear}</dd>
                              </div>
                            )}
                            {player.birthCountry && (
                              <div className="flex justify-between">
                                <dt className="text-[rgba(196,184,165,0.5)]">Birth Country</dt>
                                <dd className="text-[var(--bsi-bone)]">{player.birthCountry}</dd>
                              </div>
                            )}
                          </dl>
                        </CardContent>
                      </Card>

                      {/* Advanced Stats */}
                      {stats?.advancedStats && (
                        <Card className="md:col-span-2">
                          <CardHeader>
                            <CardTitle>Advanced Metrics</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                              {Object.entries(stats.advancedStats).map(([key, value]) => (
                                <div key={key} className="text-center">
                                  <div className="text-[var(--bsi-primary)] font-mono font-semibold">
                                    {formatStat(value, 3)}
                                  </div>
                                  <div className="text-[rgba(196,184,165,0.5)] text-xs uppercase">{key}</div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollReveal>
                )}

                {activeTab === 'splits' && stats?.splits && (
                  <ScrollReveal direction="up">
                    <div className="grid gap-6 md:grid-cols-2">
                      {stats.splits.vsLeft && (
                        <Card>
                          <CardHeader>
                            <CardTitle>vs Left-Handed</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                              {Object.entries(stats.splits.vsLeft)
                                .slice(0, 9)
                                .map(([key, value]) => (
                                  <div key={key} className="text-center">
                                    <div className="text-[var(--bsi-bone)] font-mono font-semibold">
                                      {formatStat(
                                        value,
                                        key.includes('avg') ||
                                          key.includes('obp') ||
                                          key.includes('slg')
                                          ? 3
                                          : 0
                                      )}
                                    </div>
                                    <div className="text-[rgba(196,184,165,0.5)] text-xs uppercase">
                                      {key}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      {stats.splits.vsRight && (
                        <Card>
                          <CardHeader>
                            <CardTitle>vs Right-Handed</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                              {Object.entries(stats.splits.vsRight)
                                .slice(0, 9)
                                .map(([key, value]) => (
                                  <div key={key} className="text-center">
                                    <div className="text-[var(--bsi-bone)] font-mono font-semibold">
                                      {formatStat(
                                        value,
                                        key.includes('avg') ||
                                          key.includes('obp') ||
                                          key.includes('slg')
                                          ? 3
                                          : 0
                                      )}
                                    </div>
                                    <div className="text-[rgba(196,184,165,0.5)] text-xs uppercase">
                                      {key}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      {stats.splits.home && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Home</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                              {Object.entries(stats.splits.home)
                                .slice(0, 9)
                                .map(([key, value]) => (
                                  <div key={key} className="text-center">
                                    <div className="text-[var(--bsi-bone)] font-mono font-semibold">
                                      {formatStat(
                                        value,
                                        key.includes('avg') ||
                                          key.includes('obp') ||
                                          key.includes('slg')
                                          ? 3
                                          : 0
                                      )}
                                    </div>
                                    <div className="text-[rgba(196,184,165,0.5)] text-xs uppercase">
                                      {key}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      {stats.splits.away && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Away</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                              {Object.entries(stats.splits.away)
                                .slice(0, 9)
                                .map(([key, value]) => (
                                  <div key={key} className="text-center">
                                    <div className="text-[var(--bsi-bone)] font-mono font-semibold">
                                      {formatStat(
                                        value,
                                        key.includes('avg') ||
                                          key.includes('obp') ||
                                          key.includes('slg')
                                          ? 3
                                          : 0
                                      )}
                                    </div>
                                    <div className="text-[rgba(196,184,165,0.5)] text-xs uppercase">
                                      {key}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollReveal>
                )}

                {activeTab === 'gamelog' && (
                  <ScrollReveal direction="up">
                    <Card padding="none">
                      {stats?.gameLog && stats.gameLog.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-[var(--border-vintage)] text-[rgba(196,184,165,0.5)] text-xs uppercase tracking-wider">
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Opponent</th>
                                {/* Add relevant stat columns */}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-vintage)]">
                              {stats.gameLog.map((game, idx) => (
                                <tr key={idx} className="hover:bg-[var(--surface-press-box)] transition-colors">
                                  <td className="py-3 px-4 text-[var(--bsi-bone)] text-sm">{game.date}</td>
                                  <td className="py-3 px-4 text-[var(--bsi-dust)] text-sm">
                                    {game.opponent}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-[var(--bsi-dust)]">
                          Game log data not available. Enable game log in API request.
                        </div>
                      )}
                    </Card>
                  </ScrollReveal>
                )}

                {activeTab === 'advanced' && (
                  <ScrollReveal direction="up">
                    <Card>
                      <CardHeader>
                        <CardTitle>Advanced Sabermetrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {stats?.advancedStats ? (
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
                            {Object.entries(stats.advancedStats).map(([key, value]) => (
                              <div key={key} className="text-center">
                                <div className="text-[var(--bsi-primary)] font-display text-xl font-bold">
                                  {formatStat(value, 3)}
                                </div>
                                <div className="text-[rgba(196,184,165,0.5)] text-xs uppercase mt-1">
                                  {key}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[var(--bsi-dust)] text-center">
                            Advanced metrics not available for this player.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                )}

                {/* Data Source Footer */}
                <div className="mt-8 pt-4 border-t border-[var(--border-vintage)]">
                  <DataSourceBadge
                    source={meta?.dataSource || 'MLB Stats API'}
                    timestamp={displayTimestamp(meta?.lastUpdated)}
                  />
                </div>
              </Container>
            </Section>
          </>
        ) : null}
      </div>

      <Footer />
    </>
  );
}
