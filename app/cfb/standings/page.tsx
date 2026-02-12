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

interface CFBTeam {
  name: string;
  abbreviation: string;
  id?: string;
  logo?: string;
  wins: number;
  losses: number;
  pct: number;
  pf: number;
  pa: number;
  diff: number;
  streak: string;
  confRecord: string;
  conference: string;
}

interface Conference {
  name: string;
  teams: CFBTeam[];
}


export default function CFBStandingsPage() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(formatTimestamp());

  useEffect(() => {
    async function fetchStandings() {
      try {
        const res = await fetch('/api/cfb/standings');
        if (!res.ok) throw new Error('Failed to fetch standings');
        const data = await res.json() as { standings?: Conference[]; meta?: { lastUpdated?: string } };
        setConferences(data.standings || []);
        setLastUpdated(formatTimestamp());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load standings');
      } finally {
        setLoading(false);
      }
    }
    fetchStandings();
  }, []);

  return (
    <>
      <main id="main-content">
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/cfb" className="text-text-tertiary hover:text-burnt-orange transition-colors">CFB</Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">Standings</span>
            </nav>
          </Container>
        </Section>

        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">Conference Standings</Badge>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-gradient-blaze">
                CFB Standings
              </h1>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <p className="text-text-secondary mt-2">
                Complete FBS conference standings powered by ESPN data
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {loading ? (
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-48 bg-graphite rounded-lg animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <Card padding="lg" className="bg-error/10 border-error/30">
                <p className="text-error font-semibold">Data Unavailable</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
              </Card>
            ) : conferences.length === 0 ? (
              <Card padding="lg" className="text-center">
                <div className="text-6xl mb-4">🏈</div>
                <p className="text-text-secondary text-lg">Standings not available</p>
                <p className="text-text-tertiary text-sm mt-2">Standings are updated during the college football season</p>
              </Card>
            ) : (
              <div className="space-y-8">
                {conferences.map((conf, ci) => (
                  <ScrollReveal key={conf.name} delay={ci * 50}>
                    <Card variant="default" padding="none" className="overflow-hidden">
                      <div className="bg-burnt-orange/20 px-4 py-3 border-b border-border-subtle">
                        <h2 className="font-display text-lg font-bold text-white">{conf.name}</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-border-subtle text-text-tertiary text-xs uppercase tracking-wider">
                              <th className="py-2 px-4">Team</th>
                              <th className="py-2 px-4 text-center">W</th>
                              <th className="py-2 px-4 text-center">L</th>
                              <th className="py-2 px-4 text-center">PCT</th>
                              <th className="py-2 px-4 text-center hidden md:table-cell">PF</th>
                              <th className="py-2 px-4 text-center hidden md:table-cell">PA</th>
                              <th className="py-2 px-4 text-center hidden sm:table-cell">DIFF</th>
                              <th className="py-2 px-4 text-center hidden lg:table-cell">STRK</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-subtle">
                            {conf.teams.map((team, ti) => (
                              <tr key={team.abbreviation + ti} className="hover:bg-white/5 transition-colors">
                                <td className="py-2.5 px-4">
                                  <div className="flex items-center gap-3">
                                    {team.logo ? (
                                      <img src={team.logo} alt="" className="w-6 h-6 object-contain" />
                                    ) : (
                                      <div className="w-6 h-6 bg-charcoal rounded-full flex items-center justify-center text-[10px] font-bold text-burnt-orange">
                                        {team.abbreviation}
                                      </div>
                                    )}
                                    <span className="text-white font-medium text-sm">{team.name}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-4 text-center text-white font-mono text-sm">{team.wins}</td>
                                <td className="py-2.5 px-4 text-center text-text-secondary font-mono text-sm">{team.losses}</td>
                                <td className="py-2.5 px-4 text-center text-burnt-orange font-mono text-sm font-semibold">
                                  {team.pct.toFixed(3)}
                                </td>
                                <td className="py-2.5 px-4 text-center text-text-secondary font-mono text-sm hidden md:table-cell">{team.pf}</td>
                                <td className="py-2.5 px-4 text-center text-text-secondary font-mono text-sm hidden md:table-cell">{team.pa}</td>
                                <td className={`py-2.5 px-4 text-center font-mono text-sm hidden sm:table-cell ${team.diff > 0 ? 'text-success' : team.diff < 0 ? 'text-error' : 'text-text-secondary'}`}>
                                  {team.diff > 0 ? '+' : ''}{team.diff}
                                </td>
                                <td className="py-2.5 px-4 text-center text-text-tertiary text-sm hidden lg:table-cell">{team.streak}</td>
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

            <div className="mt-8 pt-4 border-t border-border-subtle">
              <DataSourceBadge source="ESPN CFB" timestamp={lastUpdated} />
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
