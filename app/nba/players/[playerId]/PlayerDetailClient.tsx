'use client';

/**
 * NBA Player Detail Client
 *
 * Displays comprehensive NBA player profile with stats and game logs.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

interface PlayerInfo {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  jersey?: string;
  position: string;
  team?: { id: string; name: string; abbreviation: string };
  height?: string;
  weight?: number;
  age?: number;
  experience?: number;
  college?: string;
  birthPlace?: string;
  headshot?: string;
}

interface SeasonStats {
  season: number;
  stats: Record<string, number | string>;
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
  timezone: string;
}

interface PlayerAPIResponse {
  player?: PlayerInfo;
  stats?: SeasonStats;
  meta?: DataMeta;
  error?: string;
  message?: string;
}

type TabType = 'overview' | 'gamelog' | 'career';

export default function PlayerDetailClient({ playerId }: { playerId: string }) {
  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const [stats, setStats] = useState<SeasonStats | null>(null);
  const [meta, setMeta] = useState<DataMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const fetchPlayer = useCallback(async () => {
    if (!playerId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/nba/players/${playerId}`);
      if (!res.ok) {
        const errorData: PlayerAPIResponse = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch player data');
      }

      const data: PlayerAPIResponse = await res.json();
      if (data.player) setPlayer(data.player);
      if (data.stats) setStats(data.stats);
      if (data.meta) setMeta(data.meta);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchPlayer();
  }, [fetchPlayer]);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'gamelog', label: 'Game Log' },
    { id: 'career', label: 'Career' },
  ];

  const formatStat = (value: number | string | undefined, decimals: number = 1): string => {
    if (value === undefined || value === null) return '-';
    if (typeof value === 'string') return value;
    return decimals === 0 ? value.toString() : value.toFixed(decimals);
  };

  const primaryStats = stats?.stats || {};

  return (
    <>
      <main id="main-content">
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/nba"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                NBA
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">
                {loading ? 'Loading...' : player?.fullName || 'Player'}
              </span>
            </nav>
          </Container>
        </Section>

        {loading ? (
          <Section padding="lg">
            <Container>
              <div className="text-center py-16">
                <div className="inline-block w-10 h-10 border-4 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin mb-4" />
                <p className="text-text-secondary">Loading player data...</p>
              </div>
            </Container>
          </Section>
        ) : error ? (
          <Section padding="lg">
            <Container>
              <Card padding="lg" className="text-center">
                <div className="text-error text-4xl mb-4">!</div>
                <h3 className="text-xl font-semibold text-white mb-2">Error Loading Player</h3>
                <p className="text-text-secondary mb-4">{error}</p>
                <Link
                  href="/nba"
                  className="inline-block px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/90 transition-colors"
                >
                  Back to NBA
                </Link>
              </Card>
            </Container>
          </Section>
        ) : player ? (
          <>
            <Section padding="lg" className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
              <Container>
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <ScrollReveal direction="left">
                    <div className="relative w-40 h-40 rounded-lg overflow-hidden bg-graphite border border-border-subtle">
                      {player.headshot ? (
                        <Image
                          src={player.headshot}
                          alt={player.fullName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-text-tertiary">
                          {player.firstName?.[0]}
                          {player.lastName?.[0]}
                        </div>
                      )}
                    </div>
                  </ScrollReveal>

                  <div className="flex-1">
                    <ScrollReveal direction="up">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        {player.jersey && (
                          <Badge variant="primary" className="text-lg">
                            #{player.jersey}
                          </Badge>
                        )}
                        <Badge variant="secondary">{player.position}</Badge>
                      </div>
                    </ScrollReveal>

                    <ScrollReveal direction="up" delay={50}>
                      <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-2">
                        {player.fullName}
                      </h1>
                    </ScrollReveal>

                    <ScrollReveal direction="up" delay={100}>
                      <p className="text-text-secondary text-lg mb-4">
                        {player.team?.name || 'Free Agent'}
                      </p>
                    </ScrollReveal>

                    <ScrollReveal direction="up" delay={150}>
                      <div className="flex flex-wrap gap-6 text-sm">
                        {player.age && (
                          <div>
                            <span className="text-text-tertiary">Age:</span>{' '}
                            <span className="text-white font-medium">{player.age}</span>
                          </div>
                        )}
                        {player.height && (
                          <div>
                            <span className="text-text-tertiary">Height:</span>{' '}
                            <span className="text-white font-medium">{player.height}</span>
                          </div>
                        )}
                        {player.weight && (
                          <div>
                            <span className="text-text-tertiary">Weight:</span>{' '}
                            <span className="text-white font-medium">{player.weight} lbs</span>
                          </div>
                        )}
                        {player.college && (
                          <div>
                            <span className="text-text-tertiary">College:</span>{' '}
                            <span className="text-white font-medium">{player.college}</span>
                          </div>
                        )}
                      </div>
                    </ScrollReveal>
                  </div>

                  <ScrollReveal direction="right" delay={100}>
                    <Card padding="md" className="min-w-[200px]">
                      <div className="text-center mb-4">
                        <p className="text-text-tertiary text-xs uppercase tracking-wider mb-1">
                          {stats?.season} Season
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="font-display text-2xl font-bold text-burnt-orange">
                            {formatStat(primaryStats.points as number, 1)}
                          </div>
                          <div className="text-text-tertiary text-xs uppercase">PPG</div>
                        </div>
                        <div>
                          <div className="font-display text-2xl font-bold text-white">
                            {formatStat(primaryStats.rebounds as number, 1)}
                          </div>
                          <div className="text-text-tertiary text-xs uppercase">RPG</div>
                        </div>
                        <div>
                          <div className="font-display text-2xl font-bold text-white">
                            {formatStat(primaryStats.assists as number, 1)}
                          </div>
                          <div className="text-text-tertiary text-xs uppercase">APG</div>
                        </div>
                        <div>
                          <div className="font-display text-2xl font-bold text-burnt-orange">
                            {formatStat(primaryStats.fieldGoalPct as number, 1)}%
                          </div>
                          <div className="text-text-tertiary text-xs uppercase">FG%</div>
                        </div>
                      </div>
                    </Card>
                  </ScrollReveal>
                </div>
              </Container>
            </Section>

            <Section
              padding="none"
              className="border-b border-border-subtle sticky top-0 bg-charcoal z-10"
            >
              <Container>
                <div className="flex gap-1 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'text-burnt-orange border-b-2 border-burnt-orange'
                          : 'text-text-secondary hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </Container>
            </Section>

            <Section padding="lg" background="charcoal">
              <Container>
                {activeTab === 'overview' && (
                  <ScrollReveal direction="up">
                    <div className="grid gap-6 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>{stats?.season} Season Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4">
                            {Object.entries(primaryStats)
                              .slice(0, 12)
                              .map(([key, value]) => (
                                <div key={key} className="text-center">
                                  <div className="text-white font-mono font-semibold">
                                    {formatStat(value as number, 1)}
                                  </div>
                                  <div className="text-text-tertiary text-xs uppercase">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Player Info</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <dl className="space-y-3">
                            <div className="flex justify-between">
                              <dt className="text-text-tertiary">Full Name</dt>
                              <dd className="text-white">{player.fullName}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-text-tertiary">Position</dt>
                              <dd className="text-white">{player.position}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-text-tertiary">Team</dt>
                              <dd className="text-white">{player.team?.name || 'Free Agent'}</dd>
                            </div>
                            {player.college && (
                              <div className="flex justify-between">
                                <dt className="text-text-tertiary">College</dt>
                                <dd className="text-white">{player.college}</dd>
                              </div>
                            )}
                          </dl>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollReveal>
                )}

                {activeTab === 'gamelog' && (
                  <ScrollReveal direction="up">
                    <Card padding="lg" className="text-center">
                      <p className="text-text-secondary">Game log data coming soon.</p>
                    </Card>
                  </ScrollReveal>
                )}

                {activeTab === 'career' && (
                  <ScrollReveal direction="up">
                    <Card padding="lg" className="text-center">
                      <p className="text-text-secondary">Career statistics coming soon.</p>
                    </Card>
                  </ScrollReveal>
                )}

                <div className="mt-8 pt-4 border-t border-border-subtle">
                  <DataSourceBadge
                    source={meta?.dataSource || 'ESPN API'}
                    timestamp={meta?.lastUpdated || new Date().toISOString()}
                  />
                </div>
              </Container>
            </Section>
          </>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
