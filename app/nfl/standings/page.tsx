'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { formatTimestamp } from '@/lib/utils/timezone';

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


// Static data for off-season display
const staticStandings: Conference[] = [
  {
    name: 'AFC',
    divisions: [
      {
        name: 'AFC East',
        teams: [
          {
            name: 'Buffalo Bills',
            abbreviation: 'BUF',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Miami Dolphins',
            abbreviation: 'MIA',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'New England Patriots',
            abbreviation: 'NE',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'New York Jets',
            abbreviation: 'NYJ',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
        ],
      },
      {
        name: 'AFC North',
        teams: [
          {
            name: 'Baltimore Ravens',
            abbreviation: 'BAL',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Cincinnati Bengals',
            abbreviation: 'CIN',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Cleveland Browns',
            abbreviation: 'CLE',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Pittsburgh Steelers',
            abbreviation: 'PIT',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
        ],
      },
      {
        name: 'AFC South',
        teams: [
          {
            name: 'Houston Texans',
            abbreviation: 'HOU',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Indianapolis Colts',
            abbreviation: 'IND',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Jacksonville Jaguars',
            abbreviation: 'JAX',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Tennessee Titans',
            abbreviation: 'TEN',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
        ],
      },
      {
        name: 'AFC West',
        teams: [
          {
            name: 'Kansas City Chiefs',
            abbreviation: 'KC',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Denver Broncos',
            abbreviation: 'DEN',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Las Vegas Raiders',
            abbreviation: 'LV',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Los Angeles Chargers',
            abbreviation: 'LAC',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
        ],
      },
    ],
  },
  {
    name: 'NFC',
    divisions: [
      {
        name: 'NFC East',
        teams: [
          {
            name: 'Dallas Cowboys',
            abbreviation: 'DAL',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Philadelphia Eagles',
            abbreviation: 'PHI',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'New York Giants',
            abbreviation: 'NYG',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Washington Commanders',
            abbreviation: 'WAS',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
        ],
      },
      {
        name: 'NFC North',
        teams: [
          {
            name: 'Detroit Lions',
            abbreviation: 'DET',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Green Bay Packers',
            abbreviation: 'GB',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Minnesota Vikings',
            abbreviation: 'MIN',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Chicago Bears',
            abbreviation: 'CHI',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
        ],
      },
      {
        name: 'NFC South',
        teams: [
          {
            name: 'Tampa Bay Buccaneers',
            abbreviation: 'TB',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Atlanta Falcons',
            abbreviation: 'ATL',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'New Orleans Saints',
            abbreviation: 'NO',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Carolina Panthers',
            abbreviation: 'CAR',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
        ],
      },
      {
        name: 'NFC West',
        teams: [
          {
            name: 'San Francisco 49ers',
            abbreviation: 'SF',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Seattle Seahawks',
            abbreviation: 'SEA',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Los Angeles Rams',
            abbreviation: 'LAR',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
          {
            name: 'Arizona Cardinals',
            abbreviation: 'ARI',
            wins: 0,
            losses: 0,
            ties: 0,
            pct: 0,
            pf: 0,
            pa: 0,
            diff: 0,
            streak: '-',
            divisionRecord: '0-0',
            confRecord: '0-0',
          },
        ],
      },
    ],
  },
];

export default function NFLStandingsPage() {
  const [standings, setStandings] = useState<Conference[]>(staticStandings);
  const [loading, setLoading] = useState(true);
  const [selectedConference, setSelectedConference] = useState<string>('AFC');
  const [isOffSeason, setIsOffSeason] = useState(true);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const res = await fetch('/api/nfl/standings');
        if (res.ok) {
          const data = (await res.json()) as { standings?: Conference[] };
          if (data.standings && data.standings.length > 0) {
            setStandings(data.standings);
            setIsOffSeason(false);
          }
        }
      } catch (err) {
        // Use static data
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
                href="/nfl"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
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
              <Badge variant="primary" className="mb-4">
                2025 Season
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-gradient-blaze">
                NFL Standings
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary mt-2">
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
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    selectedConference === conf
                      ? 'bg-burnt-orange text-white'
                      : 'bg-graphite text-text-secondary hover:bg-white/10'
                  }`}
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
            {isOffSeason && (
              <Card variant="default" padding="md" className="mb-6 bg-warning/10 border-warning/30">
                <p className="text-warning font-semibold">Off-Season</p>
                <p className="text-text-secondary text-sm mt-1">
                  The 2025 NFL season begins in September. Standings shown are placeholder data.
                </p>
              </Card>
            )}

            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} variant="default" padding="lg">
                    <div className="animate-pulse">
                      <div className="h-6 bg-graphite rounded w-32 mb-4"></div>
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((j) => (
                          <div key={j} className="h-10 bg-graphite rounded"></div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {currentConference?.divisions.map((division, index) => (
                  <ScrollReveal key={division.name} direction="up" delay={index * 100}>
                    <Card variant="default" padding="lg">
                      <h3 className="text-lg font-display font-bold text-burnt-orange mb-4">
                        {division.name}
                      </h3>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border-subtle">
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
                                T
                              </th>
                              <th className="text-center py-2 px-2 text-text-tertiary font-semibold">
                                PCT
                              </th>
                              <th className="text-center py-2 px-2 text-text-tertiary font-semibold hidden md:table-cell">
                                PF
                              </th>
                              <th className="text-center py-2 px-2 text-text-tertiary font-semibold hidden md:table-cell">
                                PA
                              </th>
                              <th className="text-center py-2 px-2 text-text-tertiary font-semibold hidden md:table-cell">
                                DIFF
                              </th>
                              <th className="text-center py-2 px-2 text-text-tertiary font-semibold hidden lg:table-cell">
                                STRK
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {division.teams.map((team, teamIndex) => (
                              <tr
                                key={team.abbreviation}
                                className={`border-b border-border-subtle last:border-0 ${
                                  teamIndex === 0 ? 'bg-success/5' : ''
                                }`}
                              >
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 bg-charcoal rounded-full flex items-center justify-center text-xs font-bold text-burnt-orange">
                                      {team.abbreviation}
                                    </span>
                                    <span className="font-semibold text-white">{team.name}</span>
                                  </div>
                                </td>
                                <td className="text-center py-3 px-2 text-white font-mono">
                                  {team.wins}
                                </td>
                                <td className="text-center py-3 px-2 text-white font-mono">
                                  {team.losses}
                                </td>
                                <td className="text-center py-3 px-2 text-white font-mono">
                                  {team.ties}
                                </td>
                                <td className="text-center py-3 px-2 text-white font-mono">
                                  {team.pct.toFixed(3)}
                                </td>
                                <td className="text-center py-3 px-2 text-text-secondary font-mono hidden md:table-cell">
                                  {team.pf}
                                </td>
                                <td className="text-center py-3 px-2 text-text-secondary font-mono hidden md:table-cell">
                                  {team.pa}
                                </td>
                                <td
                                  className={`text-center py-3 px-2 font-mono hidden md:table-cell ${team.diff > 0 ? 'text-success' : team.diff < 0 ? 'text-error' : 'text-text-secondary'}`}
                                >
                                  {team.diff > 0 ? '+' : ''}
                                  {team.diff}
                                </td>
                                <td className="text-center py-3 px-2 text-text-secondary hidden lg:table-cell">
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
            <div className="mt-8 pt-4 border-t border-border-subtle">
              <DataSourceBadge source="ESPN NFL API" timestamp={formatTimestamp()} />
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
