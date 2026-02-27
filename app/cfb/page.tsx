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
import { TabBar } from '@/components/ui/TabBar';
import { formatTimestamp } from '@/lib/utils/timezone';

interface RankedTeam {
  rank: number;
  team: string;
  conference: string;
  record?: string;
  previousRank?: number;
}

interface PortalEntry {
  name: string;
  position: string;
  fromSchool: string;
  toSchool?: string;
  rating?: number;
  status?: string;
}

type TabType = 'rankings' | 'conferences' | 'portal';

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
export default function CFBPage() {
  const [activeTab, setActiveTab] = useState<TabType>('rankings');
  const [rankings, setRankings] = useState<RankedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [portalEntries, setPortalEntries] = useState<PortalEntry[]>([]);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cfb/teams');
      if (!res.ok) throw new Error('Failed to fetch rankings');
      const data = await res.json() as {
        teams?: Array<{
          school?: string;
          name?: string;
          conference?: string;
          apRank?: number | null;
          coachesRank?: number | null;
        }>;
        meta?: { lastUpdated?: string };
      };

      const ranked = (data.teams || [])
        .filter((team) => {
          const ap = team.apRank ?? 0;
          const coaches = team.coachesRank ?? 0;
          return ap > 0 || coaches > 0;
        })
        .sort((a, b) => {
          const aRank = a.apRank && a.apRank > 0 ? a.apRank : (a.coachesRank || 999);
          const bRank = b.apRank && b.apRank > 0 ? b.apRank : (b.coachesRank || 999);
          return aRank - bRank;
        })
        .slice(0, 25)
        .map((team, idx) => ({
          rank: team.apRank && team.apRank > 0 ? team.apRank : idx + 1,
          team: team.school || team.name || 'Unknown Team',
          conference: team.conference || 'Independent',
        }));

      setRankings(ranked);
      setLastUpdated(data.meta?.lastUpdated || new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setRankings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPortalData = useCallback(async () => {
    if (portalEntries.length > 0) return;
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch('/api/cfb/transfer-portal');
      if (!res.ok) throw new Error('Failed to fetch transfer portal data');
      const data = await res.json() as { entries?: PortalEntry[]; players?: PortalEntry[] };
      setPortalEntries(data.entries || data.players || []);
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPortalLoading(false);
    }
  }, [portalEntries.length]);

  useEffect(() => {
    if (activeTab === 'rankings') fetchRankings();
    if (activeTab === 'portal') fetchPortalData();
  }, [activeTab, fetchRankings, fetchPortalData]);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'rankings', label: 'Rankings' },
    { id: 'conferences', label: 'Conferences' },
    { id: 'portal', label: 'Transfer Portal' },
  ];

  return (
    <>
      <div>
        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/20 via-transparent to-transparent pointer-events-none" />
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
              <p className="text-burnt-orange font-semibold text-lg tracking-wide text-center mb-4">
                Longhorns. SEC. Big Ten. Every conference, every rivalry, covered right.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={200}>
              <p className="text-text-secondary text-center max-w-2xl mx-auto mb-8">
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
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-surface-light border border-border rounded-2xl">
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">134</div>
                  <div className="text-xs uppercase tracking-wider text-text-muted mt-1">FBS Teams</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">10</div>
                  <div className="text-xs uppercase tracking-wider text-text-muted mt-1">Conferences</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">12</div>
                  <div className="text-xs uppercase tracking-wider text-text-muted mt-1">Playoff Teams</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">SP+</div>
                  <div className="text-xs uppercase tracking-wider text-text-muted mt-1">Advanced Data</div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Tabs and Content */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <TabBar tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabType)} size="sm" />

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
                              <tr className="border-b-2 border-burnt-orange">
                                {['Rank', 'Team', 'Conference', 'Record'].map((h) => (
                                  <th key={h} className="text-left p-3 text-text-muted font-semibold text-xs">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {rankings.map((team) => (
                                <tr key={team.rank} className="border-b border-border-subtle hover:bg-surface-light transition-colors">
                                  <td className="p-3 text-burnt-orange font-bold text-lg">{team.rank}</td>
                                  <td className="p-3 font-semibold text-text-primary">{team.team}</td>
                                  <td className="p-3 text-text-secondary">{team.conference}</td>
                                  <td className="p-3 text-text-secondary">{team.record || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {rankings.length === 0 && error && (
                          <div className="text-center py-8">
                            <p className="text-text-secondary mb-4">{error}</p>
                            <Button variant="primary" size="sm" onClick={() => fetchRankings()}>Retry</Button>
                          </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-border">
                          <DataSourceBadge source="SportsDataIO (Derived Rankings)" timestamp={formatTimestamp(lastUpdated)} />
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
                      <div className="font-semibold text-text-primary text-lg">{conf.name}</div>
                      <div className="text-sm text-text-muted mt-1">{conf.description}</div>
                      <div className="text-xs text-burnt-orange mt-2">{conf.teams} Teams</div>
                    </Card>
                  ))}
                </div>
              </ScrollReveal>
            )}

            {/* Transfer Portal Tab */}
            {activeTab === 'portal' && (
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Transfer Portal</span>
                    <Link href="/cfb/transfer-portal">
                      <Button variant="secondary" size="sm">Full Portal</Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {portalLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="h-10 bg-surface-light rounded animate-pulse" />
                      ))}
                    </div>
                  ) : portalError ? (
                    <div className="text-center py-8">
                      <p className="text-text-secondary mb-4">Unable to load transfer portal data.</p>
                      <Link href="/cfb/transfer-portal">
                        <Button variant="primary">View Transfer Portal Page</Button>
                      </Link>
                    </div>
                  ) : portalEntries.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-text-secondary mb-4">No transfer portal entries available yet.</p>
                      <Link href="/cfb/transfer-portal">
                        <Button variant="primary">View Transfer Portal</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-burnt-orange">
                            {['Player', 'Pos', 'From', 'To', 'Status'].map((h) => (
                              <th key={h} className="text-left p-3 text-text-muted font-semibold text-xs">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {portalEntries.slice(0, 25).map((entry, i) => (
                            <tr key={`${entry.name}-${i}`} className="border-b border-border-subtle hover:bg-surface-light transition-colors">
                              <td className="p-3 font-semibold text-text-primary">{entry.name}</td>
                              <td className="p-3 text-text-secondary">{entry.position}</td>
                              <td className="p-3 text-text-secondary">{entry.fromSchool}</td>
                              <td className="p-3 text-text-secondary">{entry.toSchool || 'Undecided'}</td>
                              <td className="p-3">
                                <Badge variant={entry.toSchool ? 'success' : 'warning'}>
                                  {entry.status || (entry.toSchool ? 'Committed' : 'In Portal')}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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
                <p className="text-text-secondary mt-4 max-w-2xl mx-auto">
                  Live scores, conference standings, and rankings powered by ESPN.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <ScrollReveal delay={0}>
                <Link href="/cfb/scores">
                  <Card variant="hover" padding="lg" className="h-full">
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Live Scores</h3>
                    <p className="text-text-muted text-sm leading-relaxed mb-4">
                      Real-time scores and game updates for all FBS teams.
                    </p>
                    <Badge variant="success">Live</Badge>
                  </Card>
                </Link>
              </ScrollReveal>
              <ScrollReveal delay={100}>
                <Link href="/cfb/standings">
                  <Card variant="hover" padding="lg" className="h-full">
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Conference Standings</h3>
                    <p className="text-text-muted text-sm leading-relaxed mb-4">
                      Complete standings for SEC, Big Ten, Big 12, ACC, and all FBS conferences.
                    </p>
                    <Badge variant="success">Live</Badge>
                  </Card>
                </Link>
              </ScrollReveal>
              <ScrollReveal delay={200}>
                <Link href="/cfb/transfer-portal">
                  <Card variant="hover" padding="lg" className="h-full">
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Transfer Portal</h3>
                    <p className="text-text-muted text-sm leading-relaxed mb-4">
                      Real-time portal entries, commitments, and recruiting intel.
                    </p>
                    <Badge variant="success">Live</Badge>
                  </Card>
                </Link>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* Film & Tracking Section */}
        <Section padding="lg" background="midnight" borderTop>
          <Container>
            <ScrollReveal>
              <Card variant="default" padding="lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-burnt-orange/15 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle size="md">Film &amp; Tracking Technology</CardTitle>
                    <p className="text-text-tertiary text-xs mt-0.5">How college football uses tracking data</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-text-secondary">
                  <li className="flex gap-2">
                    <span className="text-burnt-orange mt-1 shrink-0">&bull;</span>
                    <span><strong className="text-text-primary">Catapult GPS</strong> dominant across SEC and Power 4 — real-time workload, sprint distance, and collision load</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-burnt-orange mt-1 shrink-0">&bull;</span>
                    <span><strong className="text-text-primary">Hudl IQ:</strong> CV-based tracking from All-22 coaching film — extracting positional data without dedicated camera arrays</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-burnt-orange mt-1 shrink-0">&bull;</span>
                    <span><strong className="text-text-primary">SkillCorner:</strong> broadcast-feed tracking for speed, separation, and get-off time across televised games</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-burnt-orange mt-1 shrink-0">&bull;</span>
                    <span><strong className="text-text-primary">Sportlogiq</strong> (acquired by Teamworks Jan 2026) — formation recognition and route classification</span>
                  </li>
                </ul>
                <div className="mt-5 pt-4 border-t border-border-subtle">
                  <Link href="/vision-ai">
                    <Button variant="ghost" size="sm">Full Vision AI Landscape &rarr;</Button>
                  </Link>
                </div>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
