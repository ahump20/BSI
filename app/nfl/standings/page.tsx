'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton, SkeletonTableRow } from '@/components/ui/Skeleton';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NFL', href: '/nfl' },
];

interface StandingsTeam {
  TeamID: number;
  Key: string;
  Name: string;
  Wins: number;
  Losses: number;
  Ties: number;
  Percentage: number;
  PointsFor: number;
  PointsAgainst: number;
  NetPoints: number;
  Conference: string;
  Division: string;
  Streak: number;
}

interface StandingsResponse {
  success: boolean;
  season: number;
  standings: {
    afc: Record<string, StandingsTeam[]>;
    nfc: Record<string, StandingsTeam[]>;
  };
  rawData: StandingsTeam[];
  source: {
    provider: string;
    retrievedAt: string;
    cacheHit: boolean;
  };
  meta: {
    dataProvider: string;
    timezone: string;
  };
}

function formatTimestamp(isoString?: string): string {
  const date = isoString ? new Date(isoString) : new Date();
  return date.toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) + ' CT';
}

export default function NFLStandingsPage() {
  const [standings, setStandings] = useState<StandingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStandings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/nfl/standings');
      if (!response.ok) throw new Error('Failed to fetch standings');
      const data: StandingsResponse = await response.json();
      if (data.success) {
        setStandings(data);
      } else {
        throw new Error('API returned unsuccessful response');
      }
      setLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  const divisionOrder = ['East', 'North', 'South', 'West'];

  const DivisionTable = ({ teams, divName }: { teams: StandingsTeam[]; divName: string }) => (
    <div className="mb-6 last:mb-0">
      <h4 className="text-gold font-semibold mb-3">{divName}</h4>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-burnt-orange/50">
              <th className="text-left p-2 text-copper font-semibold text-sm">Team</th>
              <th className="text-center p-2 text-copper font-semibold text-sm">W</th>
              <th className="text-center p-2 text-copper font-semibold text-sm">L</th>
              <th className="text-center p-2 text-copper font-semibold text-sm">T</th>
              <th className="text-center p-2 text-copper font-semibold text-sm">PCT</th>
              <th className="text-center p-2 text-copper font-semibold text-sm">PF</th>
              <th className="text-center p-2 text-copper font-semibold text-sm">PA</th>
              <th className="text-center p-2 text-copper font-semibold text-sm">DIFF</th>
              <th className="text-center p-2 text-copper font-semibold text-sm">STRK</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, idx) => {
              const diffClass = team.NetPoints > 0 ? 'text-success' : team.NetPoints < 0 ? 'text-error' : 'text-text-secondary';
              const streakClass = team.Streak > 0 ? 'text-success' : team.Streak < 0 ? 'text-error' : 'text-text-secondary';
              const diffDisplay = team.NetPoints > 0 ? '+' + team.NetPoints : String(team.NetPoints);
              const streakDisplay = team.Streak > 0 ? 'W' + team.Streak : team.Streak < 0 ? 'L' + Math.abs(team.Streak) : '-';

              return (
                <tr key={team.TeamID} className="border-b border-border-subtle hover:bg-white/5 transition-colors">
                  <td className="p-2">
                    <span className="text-burnt-orange font-bold mr-2">{idx + 1}</span>
                    <span className="font-semibold text-white">{team.Name}</span>
                  </td>
                  <td className="text-center p-2 text-text-secondary">{team.Wins}</td>
                  <td className="text-center p-2 text-text-secondary">{team.Losses}</td>
                  <td className="text-center p-2 text-text-secondary">{team.Ties}</td>
                  <td className="text-center p-2 text-text-secondary">{team.Percentage.toFixed(3).replace('0.', '.')}</td>
                  <td className="text-center p-2 text-text-secondary">{team.PointsFor}</td>
                  <td className="text-center p-2 text-text-secondary">{team.PointsAgainst}</td>
                  <td className={'text-center p-2 ' + diffClass}>{diffDisplay}</td>
                  <td className={'text-center p-2 ' + streakClass}>{streakDisplay}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/nfl" className="text-text-tertiary hover:text-burnt-orange transition-colors">
                NFL
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">Standings</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">{standings?.season || 2025} Season</Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-4">
                NFL Standings
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary max-w-2xl">
                Complete AFC and NFC standings with win percentage, point differential, and playoff positioning.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Standings Content */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {loading ? (
              <div className="space-y-6">
                {['AFC', 'NFC'].map((conf) => (
                  <Card key={conf} variant="default" padding="lg">
                    <CardHeader>
                      <Skeleton variant="text" width={150} height={24} />
                    </CardHeader>
                    <CardContent>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-burnt-orange">
                            {['Team', 'W', 'L', 'T', 'PCT', 'PF', 'PA', 'DIFF', 'STRK'].map((h) => (
                              <th key={h} className="text-left p-3 text-copper font-semibold">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[1, 2, 3, 4].map((j) => (
                            <SkeletonTableRow key={j} columns={9} />
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card variant="default" padding="lg" className="bg-error/10 border-error/30">
                <p className="text-error font-semibold">Data Unavailable</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
                <button onClick={fetchStandings} className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors">
                  Retry
                </button>
              </Card>
            ) : !standings?.rawData?.length ? (
              <Card variant="default" padding="lg">
                <div className="text-center py-8">
                  <svg viewBox="0 0 24 24" className="w-16 h-16 text-burnt-orange mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <ellipse cx="12" cy="12" rx="9" ry="5" />
                    <path d="M12 7v10M7 12h10" />
                  </svg>
                  <p className="text-text-secondary">Offseason—no standings yet.</p>
                  <p className="text-text-tertiary text-sm mt-2">Check back when the regular season kicks off.</p>
                </div>
              </Card>
            ) : (
              <>
                {/* AFC Standings */}
                {standings.standings.afc && Object.keys(standings.standings.afc).length > 0 && (
                  <ScrollReveal>
                    <Card variant="default" padding="lg" className="mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <svg viewBox="0 0 24 24" className="w-6 h-6 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <ellipse cx="12" cy="12" rx="9" ry="5" />
                            <path d="M12 7v10M7 12h10" />
                          </svg>
                          AFC Standings
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {divisionOrder.map((div) => {
                          const teams = standings.standings.afc[div.toLowerCase()];
                          if (!teams?.length) return null;
                          return <DivisionTable key={div} teams={teams} divName={'AFC ' + div} />;
                        })}
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                )}

                {/* NFC Standings */}
                {standings.standings.nfc && Object.keys(standings.standings.nfc).length > 0 && (
                  <ScrollReveal>
                    <Card variant="default" padding="lg" className="mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <svg viewBox="0 0 24 24" className="w-6 h-6 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <ellipse cx="12" cy="12" rx="9" ry="5" />
                            <path d="M12 7v10M7 12h10" />
                          </svg>
                          NFC Standings
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {divisionOrder.map((div) => {
                          const teams = standings.standings.nfc[div.toLowerCase()];
                          if (!teams?.length) return null;
                          return <DivisionTable key={div} teams={teams} divName={'NFC ' + div} />;
                        })}
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                )}

                {/* Data Source */}
                <Card variant="default" padding="md">
                  <DataSourceBadge
                    source={standings.meta?.dataProvider || 'SportsDataIO'}
                    timestamp={formatTimestamp(standings.source?.retrievedAt)}
                  />
                </Card>
              </>
            )}
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
