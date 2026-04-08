'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { TeamCircle } from '@/components/sports/TeamCircle';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';

import { DegradedDataBanner } from '@/components/ui/DegradedDataBanner';
import { formatTimestamp } from '@/lib/utils/timezone';
import type { DataMeta } from '@/lib/types/data-meta';

interface Team {
  name: string;
  abbreviation: string;
  logo?: string;
  wins: number;
  losses: number;
  pct: number;
  gb: string;
  home: string;
  away: string;
  last10: string;
  streak: string;
}

interface Conference {
  name: string;
  teams: Team[];
}


export default function NBAStandingsPage() {
  const [selectedConference, setSelectedConference] = useState<string>('Eastern Conference');

  const { data: standingsData, loading, error, retry } = useSportData<{ standings?: Conference[]; meta?: DataMeta }>('/api/nba/standings');

  const standings = standingsData?.standings && standingsData.standings.length > 0
    ? standingsData.standings
    : [];
  const dataFresh = standings.length > 0;

  const currentConference = standings.find((c) => c.name === selectedConference);

  return (
    <>
      <div>
        {/* Breadcrumb */}
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
                2025-26 Season
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-gradient-blaze">
                NBA Standings
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary mt-2">
                Eastern & Western Conference standings with playoff positioning
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Conference Tabs */}
        <Section padding="sm" background="charcoal" borderTop>
          <Container>
            <div className="flex gap-2">
              {['Eastern Conference', 'Western Conference'].map((conf) => (
                <button
                  key={conf}
                  onClick={() => setSelectedConference(conf)}
                  className={`px-6 py-3 min-h-[44px] rounded-sm font-semibold transition-all ${
                    selectedConference === conf
                      ? 'bg-burnt-orange text-white'
                      : 'bg-background-tertiary text-text-secondary hover:bg-surface-medium'
                  }`}
                >
                  {conf.split(' ')[0]}
                </button>
              ))}
            </div>
          </Container>
        </Section>

        {/* Standings Table */}
        <Section padding="lg" background="charcoal">
          <Container>
            <DegradedDataBanner degraded={!!standingsData?.meta?.degraded} source={standingsData?.meta?.dataSource} />

            {loading ? (
              <Card variant="default" padding="lg">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-12 bg-background-tertiary rounded-sm"></div>
                  ))}
                </div>
              </Card>
            ) : error ? (
              <Card variant="default" padding="lg">
                <div className="text-center py-12">
                  <p className="text-text-secondary mb-4">Standings could not be loaded right now.</p>
                  <button onClick={retry} className="btn-heritage text-sm">Try Again</button>
                </div>
              </Card>
            ) : !dataFresh ? (
              <div className="text-center py-12">
                <p className="italic text-bsi-dust" style={{ fontFamily: 'var(--bsi-font-body)' }}>
                  Standings update during the season
                </p>
              </div>
            ) : (
              <ScrollReveal direction="up">
                <Card variant="default" padding="lg">
                  <h3 className="text-lg font-display font-bold text-burnt-orange mb-4">
                    {selectedConference}
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" aria-label="NBA standings by conference">
                      <thead>
                        <tr className="border-b border-border-subtle">
                          <th scope="col" className="text-left py-2 px-2 text-text-tertiary font-semibold w-8">
                            #
                          </th>
                          <th scope="col" className="text-left py-2 px-2 text-text-tertiary font-semibold">
                            Team
                          </th>
                          <th scope="col" className="text-center py-2 px-2 text-text-tertiary font-semibold">
                            W
                          </th>
                          <th scope="col" className="text-center py-2 px-2 text-text-tertiary font-semibold">
                            L
                          </th>
                          <th scope="col" className="text-center py-2 px-2 text-text-tertiary font-semibold">
                            PCT
                          </th>
                          <th scope="col" className="text-center py-2 px-2 text-text-tertiary font-semibold">
                            GB
                          </th>
                          <th scope="col" className="text-center py-2 px-2 text-text-tertiary font-semibold hidden md:table-cell">
                            HOME
                          </th>
                          <th scope="col" className="text-center py-2 px-2 text-text-tertiary font-semibold hidden md:table-cell">
                            AWAY
                          </th>
                          <th scope="col" className="text-center py-2 px-2 text-text-tertiary font-semibold hidden lg:table-cell">
                            L10
                          </th>
                          <th scope="col" className="text-center py-2 px-2 text-text-tertiary font-semibold hidden lg:table-cell">
                            STRK
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentConference?.teams.map((team, index) => {
                          const isPlayoffSpot = index < 6;
                          const isPlayIn = index >= 6 && index < 10;

                          return (
                            <tr
                              key={team.abbreviation}
                              className={`border-b border-border-subtle last:border-0 ${
                                isPlayoffSpot ? 'bg-success/5' : isPlayIn ? 'bg-warning/5' : ''
                              }`}
                            >
                              <td className="py-3 px-2 text-text-tertiary">{index + 1}</td>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <TeamCircle logo={team.logo} abbreviation={team.abbreviation} size="w-8 h-8" textSize="text-xs" />
                                  <span className="font-semibold text-text-primary">{team.name}</span>
                                  {isPlayoffSpot && (
                                    <Badge variant="success" className="text-xs hidden sm:inline">
                                      Playoff
                                    </Badge>
                                  )}
                                  {isPlayIn && (
                                    <Badge variant="warning" className="text-xs hidden sm:inline">
                                      Play-In
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="text-center py-3 px-2 text-text-primary font-mono">
                                {team.wins}
                              </td>
                              <td className="text-center py-3 px-2 text-text-primary font-mono">
                                {team.losses}
                              </td>
                              <td className="text-center py-3 px-2 text-text-primary font-mono">
                                {team.pct.toFixed(3)}
                              </td>
                              <td className="text-center py-3 px-2 text-text-secondary font-mono">
                                {team.gb}
                              </td>
                              <td className="text-center py-3 px-2 text-text-secondary font-mono hidden md:table-cell">
                                {team.home}
                              </td>
                              <td className="text-center py-3 px-2 text-text-secondary font-mono hidden md:table-cell">
                                {team.away}
                              </td>
                              <td className="text-center py-3 px-2 text-text-secondary font-mono hidden lg:table-cell">
                                {team.last10}
                              </td>
                              <td className="text-center py-3 px-2 text-text-secondary hidden lg:table-cell">
                                {team.streak}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Legend */}
                  <div className="mt-4 pt-4 border-t border-border-subtle flex gap-4 text-xs text-text-tertiary">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-success/20 rounded-sm"></span>
                      Playoff spot (1-6)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-warning/20 rounded-sm"></span>
                      Play-In (7-10)
                    </span>
                  </div>
                </Card>
              </ScrollReveal>
            )}

            {/* Data Source Footer */}
            <div className="mt-8 pt-4 border-t border-border-subtle">
              <DataSourceBadge source="NBA.com / ESPN" timestamp={formatTimestamp()} />
            </div>
          </Container>
        </Section>
      </div>

    </>
  );
}
