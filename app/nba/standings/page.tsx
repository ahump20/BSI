'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

interface Team {
  name: string;
  abbreviation: string;
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

function formatTimestamp(): string {
  const date = new Date();
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
}

export default function NBAStandingsPage() {
  const [standings, setStandings] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConference, setSelectedConference] = useState<string>('Eastern Conference');
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const res = await fetch('/api/nba/standings');
        if (res.ok) {
          const data = (await res.json()) as { standings?: Conference[] };
          if (data.standings && data.standings.length > 0) {
            setStandings(data.standings);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, []);

  const currentConference = standings.find((c) => c.name === selectedConference);

  return (
    <>
      <main id="main-content">
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
              <span className="text-white font-medium">Standings</span>
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
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    selectedConference === conf
                      ? 'bg-burnt-orange text-white'
                      : 'bg-graphite text-text-secondary hover:bg-white/10'
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
            {error && (
              <Card variant="default" padding="md" className="mb-6 bg-warning/10 border-warning/30">
                <p className="text-warning font-semibold">Unable to load standings</p>
                <p className="text-text-secondary text-sm mt-1">
                  Live data is temporarily unavailable. Please try again shortly.
                </p>
              </Card>
            )}

            {loading ? (
              <Card variant="default" padding="lg">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-12 bg-graphite rounded"></div>
                  ))}
                </div>
              </Card>
            ) : (
              <ScrollReveal direction="up">
                <Card variant="default" padding="lg">
                  <h3 className="text-lg font-display font-bold text-burnt-orange mb-4">
                    {selectedConference}
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border-subtle">
                          <th className="text-left py-2 px-2 text-text-tertiary font-semibold w-8">
                            #
                          </th>
                          <th className="text-left py-2 px-2 text-text-tertiary font-semibold">
                            Team
                          </th>
                          <th className="text-center py-2 px-2 text-text-tertiary font-semibold">
                            W
                          </th>
                          <th className="text-center py-2 px-2 text-text-tertiary font-semibold">
                            L
                          </th>
                          <th className="text-center py-2 px-2 text-text-tertiary font-semibold">
                            PCT
                          </th>
                          <th className="text-center py-2 px-2 text-text-tertiary font-semibold">
                            GB
                          </th>
                          <th className="text-center py-2 px-2 text-text-tertiary font-semibold hidden md:table-cell">
                            HOME
                          </th>
                          <th className="text-center py-2 px-2 text-text-tertiary font-semibold hidden md:table-cell">
                            AWAY
                          </th>
                          <th className="text-center py-2 px-2 text-text-tertiary font-semibold hidden lg:table-cell">
                            L10
                          </th>
                          <th className="text-center py-2 px-2 text-text-tertiary font-semibold hidden lg:table-cell">
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
                                  <span className="w-8 h-8 bg-charcoal rounded-full flex items-center justify-center text-xs font-bold text-burnt-orange">
                                    {team.abbreviation}
                                  </span>
                                  <span className="font-semibold text-white">{team.name}</span>
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
                              <td className="text-center py-3 px-2 text-white font-mono">
                                {team.wins}
                              </td>
                              <td className="text-center py-3 px-2 text-white font-mono">
                                {team.losses}
                              </td>
                              <td className="text-center py-3 px-2 text-white font-mono">
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
                      <span className="w-3 h-3 bg-success/20 rounded"></span>
                      Playoff spot (1-6)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-warning/20 rounded"></span>
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
      </main>

      <Footer />
    </>
  );
}
