'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton, SkeletonTableRow } from '@/components/ui/Skeleton';

interface RankedTeam {
  rank: number;
  team: string;
  conference: string;
  record?: string;
  previousRank?: number;
}

type TabType = 'rankings' | 'conferences' | 'portal' | 'analytics';

const conferences = [
  { name: 'SEC', teams: 16, description: 'Southeastern Conference' },
  { name: 'Big Ten', teams: 18, description: 'Big Ten Conference' },
  { name: 'Big 12', teams: 16, description: 'Big 12 Conference' },
  { name: 'ACC', teams: 17, description: 'Atlantic Coast Conference' },
  { name: 'Pac-12', teams: 4, description: 'Pacific-12 Conference' },
  { name: 'Mountain West', teams: 12, description: 'Mountain West Conference' },
  { name: 'AAC', teams: 14, description: 'American Athletic Conference' },
  { name: 'Sun Belt', teams: 14, description: 'Sun Belt Conference' },
];

function formatTimestamp(isoString?: string): string {
  const date = isoString ? new Date(isoString) : new Date();
  return (
    date.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    }) + ' CT'
  );
}

export default function CFBPage() {
  const [activeTab, setActiveTab] = useState<TabType>('rankings');
  const [rankings, setRankings] = useState<RankedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ncaa/rankings?sport=football');
      if (!res.ok) throw new Error('Failed to fetch rankings');
      const data = await res.json() as { rankings?: RankedTeam[]; meta?: { lastUpdated?: string } };
      setRankings(data.rankings || []);
      setLastUpdated(data.meta?.lastUpdated || new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Fallback preseason rankings
      setRankings([
        { rank: 1, team: 'Texas', conference: 'SEC' },
        { rank: 2, team: 'Ohio State', conference: 'Big Ten' },
        { rank: 3, team: 'Georgia', conference: 'SEC' },
        { rank: 4, team: 'Oregon', conference: 'Big Ten' },
        { rank: 5, team: 'Penn State', conference: 'Big Ten' },
        { rank: 6, team: 'Alabama', conference: 'SEC' },
        { rank: 7, team: 'Notre Dame', conference: 'Independent' },
        { rank: 8, team: 'Michigan', conference: 'Big Ten' },
        { rank: 9, team: 'Tennessee', conference: 'SEC' },
        { rank: 10, team: 'LSU', conference: 'SEC' },
        { rank: 11, team: 'USC', conference: 'Big Ten' },
        { rank: 12, team: 'Clemson', conference: 'ACC' },
        { rank: 13, team: 'Miami', conference: 'ACC' },
        { rank: 14, team: 'Oklahoma', conference: 'SEC' },
        { rank: 15, team: 'Ole Miss', conference: 'SEC' },
        { rank: 16, team: 'Colorado', conference: 'Big 12' },
        { rank: 17, team: 'Missouri', conference: 'SEC' },
        { rank: 18, team: 'Florida State', conference: 'ACC' },
        { rank: 19, team: 'Kansas State', conference: 'Big 12' },
        { rank: 20, team: 'Iowa State', conference: 'Big 12' },
        { rank: 21, team: 'SMU', conference: 'ACC' },
        { rank: 22, team: 'Arizona', conference: 'Big 12' },
        { rank: 23, team: 'BYU', conference: 'Big 12' },
        { rank: 24, team: 'Texas A&M', conference: 'SEC' },
        { rank: 25, team: 'Louisville', conference: 'ACC' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'rankings') fetchRankings();
  }, [activeTab, fetchRankings]);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'rankings', label: 'Rankings' },
    { id: 'conferences', label: 'Conferences' },
    { id: 'portal', label: 'Transfer Portal' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <>
      <main id="main-content">
        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-[#BF5700]/20 via-transparent to-transparent pointer-events-none" />
          <Container center>
            <ScrollReveal direction="up">
              <Badge variant="success" className="mb-4">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
                NCAA Division I FBS
              </Badge>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-center uppercase tracking-wide mb-4">
                College <span className="text-gradient-blaze">Football</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={150}>
              <p className="text-[#C9A227] font-semibold text-lg tracking-wide text-center mb-4">
                Longhorns. SEC. Big Ten. Every conference, every rivalry, covered right.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={200}>
              <p className="text-white/60 text-center max-w-2xl mx-auto mb-8">
                Conference standings, AP Top 25 rankings, transfer portal tracking, and advanced analytics for all 134 FBS programs.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={250}>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/dashboard"><Button variant="primary" size="lg">View Dashboard</Button></Link>
                <Link href="/cfb/transfer-portal"><Button variant="secondary" size="lg">Transfer Portal</Button></Link>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={300}>
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl">
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-[#BF5700]">134</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">FBS Teams</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-[#BF5700]">10</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Conferences</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-[#BF5700]">12</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Playoff Teams</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-[#BF5700]">SP+</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Advanced Data</div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Tabs and Content */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <div className="flex gap-2 mb-8 border-b border-white/10 overflow-x-auto pb-px">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id ? 'text-[#BF5700] border-[#BF5700]' : 'text-white/40 border-transparent hover:text-white'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Rankings Tab */}
            {activeTab === 'rankings' && (
              <>
                {loading ? (
                  <Card variant="default" padding="lg">
                    <CardHeader><Skeleton variant="text" width={200} height={24} /></CardHeader>
                    <CardContent>
                      <table className="w-full"><tbody>{Array.from({ length: 25 }).map((_, i) => <SkeletonTableRow key={i} columns={4} />)}</tbody></table>
                    </CardContent>
                  </Card>
                ) : (
                  <ScrollReveal>
                    <Card variant="default" padding="lg">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Image src="/icons/football.svg" alt="" width={20} height={20} className="opacity-60" />
                            AP Top 25 Rankings
                          </div>
                          <Badge variant="primary">2025-26 Season</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b-2 border-[#BF5700]">
                                {['Rank', 'Team', 'Conference', 'Record'].map((h) => (
                                  <th key={h} className="text-left p-3 text-white/40 font-semibold text-xs">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {rankings.map((team) => (
                                <tr key={team.rank} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  <td className="p-3 text-[#BF5700] font-bold text-lg">{team.rank}</td>
                                  <td className="p-3 font-semibold text-white">{team.team}</td>
                                  <td className="p-3 text-white/60">{team.conference}</td>
                                  <td className="p-3 text-white/60">{team.record || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <DataSourceBadge source="AP Poll / ESPN" timestamp={formatTimestamp(lastUpdated)} />
                          {error && <span className="text-xs text-yellow-400 ml-4">Using cached/preseason data</span>}
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                )}
              </>
            )}

            {/* Conferences Tab */}
            {activeTab === 'conferences' && (
              <ScrollReveal>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {conferences.map((conf) => (
                    <Card key={conf.name} variant="hover" padding="lg" className="text-center">
                      <div className="font-semibold text-white text-lg">{conf.name}</div>
                      <div className="text-sm text-white/40 mt-1">{conf.description}</div>
                      <div className="text-xs text-[#BF5700] mt-2">{conf.teams} Teams</div>
                    </Card>
                  ))}
                </div>
              </ScrollReveal>
            )}

            {/* Transfer Portal Tab */}
            {activeTab === 'portal' && (
              <Card variant="default" padding="lg">
                <CardHeader><CardTitle>Transfer Portal</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-white/60 mb-4">Track player movement across all FBS programs.</p>
                  <Link href="/cfb/transfer-portal">
                    <Button variant="primary">View Transfer Portal</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <Card variant="default" padding="lg">
                <CardHeader><CardTitle>Advanced Analytics</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-white/60 mb-4">
                    SP+ ratings, EPA metrics, and advanced statistics for teams and players across all FBS programs.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card variant="default" padding="md" className="text-center">
                      <div className="font-display text-2xl font-bold text-[#BF5700]">SP+</div>
                      <div className="text-xs text-white/40 mt-1">Team Efficiency Ratings</div>
                    </Card>
                    <Card variant="default" padding="md" className="text-center">
                      <div className="font-display text-2xl font-bold text-[#BF5700]">EPA</div>
                      <div className="text-xs text-white/40 mt-1">Expected Points Added</div>
                    </Card>
                    <Card variant="default" padding="md" className="text-center">
                      <div className="font-display text-2xl font-bold text-[#BF5700]">CFP</div>
                      <div className="text-xs text-white/40 mt-1">Playoff Projections</div>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            )}
          </Container>
        </Section>
        {/* Live Data Hub */}
        <Section padding="lg" background="midnight" borderTop>
          <Container>
            <ScrollReveal>
              <div className="text-center mb-12">
                <Badge variant="primary" className="mb-4">Live Coverage</Badge>
                <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide mt-2">
                  CFB <span className="text-gradient-blaze">Data Hub</span>
                </h2>
                <p className="text-white/60 mt-4 max-w-2xl mx-auto">
                  Live scores, conference standings, and rankings powered by ESPN.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <ScrollReveal delay={0}>
                <Link href="/cfb/scores">
                  <Card variant="hover" padding="lg" className="h-full">
                    <h3 className="text-lg font-semibold text-white mb-3">Live Scores</h3>
                    <p className="text-white/40 text-sm leading-relaxed mb-4">
                      Real-time scores and game updates for all FBS teams.
                    </p>
                    <Badge variant="success">Live</Badge>
                  </Card>
                </Link>
              </ScrollReveal>
              <ScrollReveal delay={100}>
                <Link href="/cfb/standings">
                  <Card variant="hover" padding="lg" className="h-full">
                    <h3 className="text-lg font-semibold text-white mb-3">Conference Standings</h3>
                    <p className="text-white/40 text-sm leading-relaxed mb-4">
                      Complete standings for SEC, Big Ten, Big 12, ACC, and all FBS conferences.
                    </p>
                    <Badge variant="success">Live</Badge>
                  </Card>
                </Link>
              </ScrollReveal>
              <ScrollReveal delay={200}>
                <Card variant="default" padding="lg" className="h-full">
                  <h3 className="text-lg font-semibold text-white mb-3">Rankings & Analytics</h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-4">
                    AP Top 25, playoff projections, and advanced analytics.
                  </p>
                  <Badge variant="warning">Coming Soon</Badge>
                </Card>
              </ScrollReveal>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
