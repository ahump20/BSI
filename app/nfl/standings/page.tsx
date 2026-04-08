'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';

import { DegradedDataBanner } from '@/components/ui/DegradedDataBanner';
import { formatTimestamp } from '@/lib/utils/timezone';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import type { DataMeta } from '@/lib/types/data-meta';

interface Team {
  name: string;
  abbreviation: string;
  wins: number;
  losses: number;
  ties: number;
  pct: number;
  pf: number;
  pa: number;
  diff: number;
  streak: string;
  divisionRecord: string;
  confRecord: string;
}

interface Division {
  name: string;
  teams: Team[];
}

interface Conference {
  name: string;
  divisions: Division[];
}



export default function NFLStandingsPage() {
  const [selectedConference, setSelectedConference] = useState<string>('AFC');

  const { data: standingsData, loading, error, retry } = useSportData<{ standings?: Conference[]; meta?: DataMeta }>('/api/nfl/standings');

  const standings = standingsData?.standings && standingsData.standings.length > 0
    ? standingsData.standings
    : [];
  const isOffSeason = standings.length === 0 && !loading && !error;

  const currentConference = standings.find((c) => c.name === selectedConference);

  return (
    <>
      <div className="min-h-screen bg-surface-scoreboard text-bsi-bone">
        {/* Breadcrumb */}
        <Section padding="sm" style={{ borderBottom: '1px solid var(--border-vintage)' }}>
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/nfl"
                className="transition-colors"
                style={{ color: 'rgba(196,184,165,0.5)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bsi-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(196,184,165,0.5)')}
              >
                NFL
              </Link>
              <span style={{ color: 'rgba(196,184,165,0.5)' }}>/</span>
              <span className="font-medium text-bsi-bone">Standings</span>
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
              <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-bone)' }}>
                NFL Standings
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="mt-2 text-bsi-dust">
                Complete AFC and NFC standings with playoff positioning
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Conference Tabs */}
        <Section padding="sm" background="charcoal" borderTop>
          <Container>
            <div className="flex gap-2">
              {['AFC', 'NFC'].map((conf) => (
                <button
                  key={conf}
                  onClick={() => setSelectedConference(conf)}
                  className="px-6 py-3 min-h-[44px] rounded-sm font-semibold transition-all"
                  style={
                    selectedConference === conf
                      ? { background: 'var(--bsi-primary)', color: '#fff' }
                      : { background: 'var(--surface-dugout)', color: 'var(--bsi-dust)' }
                  }
                >
                  {conf}
                </button>
              ))}
            </div>
          </Container>
        </Section>

        {/* Standings Tables */}
        <Section padding="lg" background="charcoal">
          <Container>
            <DegradedDataBanner degraded={!!standingsData?.meta?.degraded} source={standingsData?.meta?.dataSource} />

            <DataErrorBoundary name="NFL Standings">
            {isOffSeason && (
              <Card variant="default" padding="md" className="mb-6 bg-surface-press-box border-border-vintage">
                <p className="font-semibold text-bsi-bone">Off-Season</p>
                <p className="text-sm mt-1 text-bsi-dust">
                  The 2025-26 NFL season has concluded. Final standings will display when live data is available from our API. The 2026 season kicks off in September.
                </p>
              </Card>
            )}

            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} variant="default" padding="lg">
                    <div className="animate-pulse">
                      <div className="h-6 rounded-sm w-32 mb-4 bg-surface-dugout"></div>
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((j) => (
                          <div key={j} className="h-10 rounded-sm bg-surface-dugout"></div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card variant="default" padding="lg">
                <div className="text-center py-12">
                  <p className="mb-4 text-bsi-dust">Standings could not be loaded right now.</p>
                  <button onClick={retry} className="btn-heritage text-sm">Try Again</button>
                </div>
              </Card>
            ) : isOffSeason ? (
              <div className="text-center py-12">
                <p className="italic" style={{ fontFamily: 'var(--bsi-font-body)', color: 'var(--bsi-dust, #C4B8A5)' }}>
                  Standings update during the season
                </p>
                <p className="text-sm mt-2" style={{ color: 'var(--bsi-dust, #C4B8A5)', opacity: 0.7 }}>
                  The 2026 NFL season kicks off in September
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {currentConference?.divisions.map((division, index) => (
                  <ScrollReveal key={division.name} direction="up" delay={index * 100}>
                    <Card variant="default" padding="lg">
                      <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-primary)' }}>
                        {division.name}
                      </h3>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-vintage)' }}>
                              <th className="text-left py-2 px-2 font-semibold" style={{ color: 'rgba(196,184,165,0.5)' }}>
                                Team
                              </th>
                              <th className="text-center py-2 px-2 font-semibold" style={{ color: 'rgba(196,184,165,0.5)' }}>
                                W
                              </th>
                              <th className="text-center py-2 px-2 font-semibold" style={{ color: 'rgba(196,184,165,0.5)' }}>
                                L
                              </th>
                              <th className="text-center py-2 px-2 font-semibold" style={{ color: 'rgba(196,184,165,0.5)' }}>
                                T
                              </th>
                              <th className="text-center py-2 px-2 font-semibold" style={{ color: 'rgba(196,184,165,0.5)' }}>
                                PCT
                              </th>
                              <th className="text-center py-2 px-2 font-semibold hidden md:table-cell" style={{ color: 'rgba(196,184,165,0.5)' }}>
                                PF
                              </th>
                              <th className="text-center py-2 px-2 font-semibold hidden md:table-cell" style={{ color: 'rgba(196,184,165,0.5)' }}>
                                PA
                              </th>
                              <th className="text-center py-2 px-2 font-semibold hidden md:table-cell" style={{ color: 'rgba(196,184,165,0.5)' }}>
                                DIFF
                              </th>
                              <th className="text-center py-2 px-2 font-semibold hidden lg:table-cell" style={{ color: 'rgba(196,184,165,0.5)' }}>
                                STRK
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {division.teams.map((team, teamIndex) => (
                              <tr
                                key={team.abbreviation}
                                className={`last:border-0 ${
                                  teamIndex === 0 ? 'bg-success/5' : ''
                                }`}
                                style={{ borderBottom: '1px solid var(--border-vintage)' }}
                              >
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-surface-dugout text-bsi-primary">
                                      {team.abbreviation}
                                    </span>
                                    <span className="font-semibold text-bsi-bone">{team.name}</span>
                                  </div>
                                </td>
                                <td className="text-center py-3 px-2 font-mono text-bsi-bone">
                                  {team.wins}
                                </td>
                                <td className="text-center py-3 px-2 font-mono text-bsi-bone">
                                  {team.losses}
                                </td>
                                <td className="text-center py-3 px-2 font-mono text-bsi-bone">
                                  {team.ties}
                                </td>
                                <td className="text-center py-3 px-2 font-mono text-bsi-bone">
                                  {team.pct.toFixed(3)}
                                </td>
                                <td className="text-center py-3 px-2 font-mono hidden md:table-cell text-bsi-dust">
                                  {team.pf}
                                </td>
                                <td className="text-center py-3 px-2 font-mono hidden md:table-cell text-bsi-dust">
                                  {team.pa}
                                </td>
                                <td
                                  className={`text-center py-3 px-2 font-mono hidden md:table-cell ${team.diff > 0 ? 'text-success' : team.diff < 0 ? 'text-error' : ''}`}
                                  style={team.diff === 0 ? { color: 'var(--bsi-dust)' } : undefined}
                                >
                                  {team.diff > 0 ? '+' : ''}
                                  {team.diff}
                                </td>
                                <td className="text-center py-3 px-2 hidden lg:table-cell text-bsi-dust">
                                  {team.streak}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            )}

            {/* Data Source Footer */}
            <div className="mt-8 pt-4" style={{ borderTop: '1px solid var(--border-vintage)' }}>
              <DataSourceBadge source="ESPN NFL API" timestamp={formatTimestamp()} />
            </div>
            </DataErrorBoundary>
          </Container>
        </Section>
      </div>

    </>
  );
}
