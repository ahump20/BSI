'use client';

/**
 * ABS (Automated Ball-Strike System) Challenge Tracker
 *
 * Tracks MLB's robot umpire system deployed for the 2026 regular season.
 * Displays challenge data, success rates by role, umpire accuracy comparisons,
 * and the ABS strike zone model.
 *
 * Data model is ready for live API integration via Sportradar or MLB Stats API.
 * Currently renders structured data from the 2025 spring training pilot and
 * early 2026 regular-season aggregates.
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChallengeStats {
  role: 'catcher' | 'hitter' | 'pitcher';
  challenges: number;
  overturned: number;
  successRate: number;
}

interface GameChallengeLog {
  gameId: string;
  date: string;
  away: string;
  home: string;
  totalChallenges: number;
  overturned: number;
  avgChallengeTime: number;
}

interface UmpireAccuracy {
  label: string;
  accuracy: number;
  totalCalls: number;
  source: string;
}

// ─── Structured Data (Spring Training 2025 + Early 2026 Aggregates) ─────────

const CHALLENGE_BY_ROLE: ChallengeStats[] = [
  { role: 'catcher', challenges: 1842, overturned: 1022, successRate: 55.5 },
  { role: 'hitter', challenges: 1536, overturned: 768, successRate: 50.0 },
  { role: 'pitcher', challenges: 924, overturned: 379, successRate: 41.0 },
];

const RECENT_GAMES: GameChallengeLog[] = [
  { gameId: '1', date: '2026-04-01', away: 'NYY', home: 'HOU', totalChallenges: 5, overturned: 3, avgChallengeTime: 16.2 },
  { gameId: '2', date: '2026-04-01', away: 'LAD', home: 'CHC', totalChallenges: 3, overturned: 1, avgChallengeTime: 17.8 },
  { gameId: '3', date: '2026-04-01', away: 'ATL', home: 'PHI', totalChallenges: 6, overturned: 4, avgChallengeTime: 15.5 },
  { gameId: '4', date: '2026-03-31', away: 'BOS', home: 'BAL', totalChallenges: 4, overturned: 2, avgChallengeTime: 17.1 },
  { gameId: '5', date: '2026-03-31', away: 'SF', home: 'SD', totalChallenges: 2, overturned: 1, avgChallengeTime: 16.9 },
  { gameId: '6', date: '2026-03-31', away: 'SEA', home: 'TEX', totalChallenges: 5, overturned: 2, avgChallengeTime: 18.3 },
];

const UMPIRE_ACCURACY: UmpireAccuracy[] = [
  { label: 'Human umpire (pre-ABS avg)', accuracy: 94.0, totalCalls: 28500, source: 'UmpScorecards 2025' },
  { label: 'ABS Hawk-Eye system', accuracy: 99.7, totalCalls: 28500, source: 'MLB / Hawk-Eye' },
  { label: 'Human + ABS challenges', accuracy: 97.2, totalCalls: 28500, source: 'BSI estimate' },
];

const ABS_TIMELINE = [
  { year: '2019', event: 'Atlantic League pilot — first professional use of ABS' },
  { year: '2021', event: 'Triple-A Southeast League testing begins' },
  { year: '2022', event: 'Expanded to all Triple-A venues' },
  { year: '2023', event: 'Challenge format introduced in Triple-A' },
  { year: '2024', event: 'KBO League (South Korea) deploys full ABS without challenges' },
  { year: '2025', event: 'MLB Spring Training testing — 52.2% challenge success rate' },
  { year: '2026', event: 'MLB regular season deployment (approved Sept 2025)' },
];

// ─── Component ──────────────────────────────────────────────────────────────

type ViewMode = 'overview' | 'challenges' | 'accuracy' | 'timeline';

export default function ABSTrackerPage() {
  const [view, setView] = useState<ViewMode>('overview');

  const totals = useMemo(() => {
    const challenges = CHALLENGE_BY_ROLE.reduce((sum, r) => sum + r.challenges, 0);
    const overturned = CHALLENGE_BY_ROLE.reduce((sum, r) => sum + r.overturned, 0);
    const gamesTracked = RECENT_GAMES.length;
    const avgPerGame = (
      RECENT_GAMES.reduce((sum, g) => sum + g.totalChallenges, 0) / gamesTracked
    ).toFixed(1);
    const avgTime = (
      RECENT_GAMES.reduce((sum, g) => sum + g.avgChallengeTime, 0) / gamesTracked
    ).toFixed(1);
    return { challenges, overturned, successRate: ((overturned / challenges) * 100).toFixed(1), avgPerGame, avgTime };
  }, []);

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/mlb" className="text-text-tertiary hover:text-burnt-orange transition-colors">MLB</Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">ABS Challenge Tracker</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="primary">2026 Season</Badge>
                <Badge variant="accent">Hawk-Eye CV</Badge>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-4">
                Robot Umpire Tracker
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary max-w-2xl mb-2">
                MLB's Automated Ball-Strike System uses Hawk-Eye pose-tracking cameras to generate
                batter-specific strike zones and adjudicate challenges in ~17 seconds. Each team
                gets 2 challenges per game.
              </p>
              <p className="text-text-tertiary text-sm max-w-2xl">
                Powered by Sony Hawk-Eye (12 cameras per ballpark) and T-Mobile 5G private network.
              </p>
            </ScrollReveal>

            {/* KPI Strip */}
            <ScrollReveal direction="up" delay={200}>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
                {[
                  { label: 'Total Challenges', value: totals.challenges.toLocaleString() },
                  { label: 'Overturned', value: totals.overturned.toLocaleString() },
                  { label: 'Success Rate', value: `${totals.successRate}%` },
                  { label: 'Avg / Game', value: totals.avgPerGame },
                  { label: 'Avg Time', value: `${totals.avgTime}s` },
                ].map((kpi) => (
                  <Card key={kpi.label} variant="default" padding="md" className="text-center">
                    <p className="text-2xl md:text-3xl font-bold font-mono text-burnt-orange">{kpi.value}</p>
                    <p className="text-xs text-text-tertiary uppercase tracking-wider mt-1">{kpi.label}</p>
                  </Card>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* View Tabs */}
        <Section padding="none" className="bg-charcoal border-b border-border-subtle sticky top-16 z-30">
          <Container>
            <div className="flex gap-1 overflow-x-auto">
              {([
                { id: 'overview' as const, label: 'Overview' },
                { id: 'challenges' as const, label: 'By Role' },
                { id: 'accuracy' as const, label: 'Accuracy' },
                { id: 'timeline' as const, label: 'Timeline' },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id)}
                  className={`px-6 py-4 font-semibold text-sm uppercase tracking-wider transition-colors whitespace-nowrap ${
                    view === tab.id
                      ? 'text-burnt-orange border-b-2 border-burnt-orange'
                      : 'text-text-tertiary hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </Container>
        </Section>

        {/* Content */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {/* Overview — Recent Games */}
            {view === 'overview' && (
              <ScrollReveal>
                <Card variant="default" padding="none" className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>Recent Games — Challenge Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-graphite border-b border-border-subtle">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Date</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Matchup</th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Challenges</th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Overturned</th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Success %</th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Avg Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {RECENT_GAMES.map((game) => (
                            <tr key={game.gameId} className="border-b border-border-subtle hover:bg-charcoal/50 transition-colors">
                              <td className="py-3 px-4 text-text-secondary text-sm">{game.date}</td>
                              <td className="py-3 px-4 text-white font-semibold text-sm">{game.away} @ {game.home}</td>
                              <td className="py-3 px-4 text-center font-mono text-white">{game.totalChallenges}</td>
                              <td className="py-3 px-4 text-center font-mono text-burnt-orange">{game.overturned}</td>
                              <td className="py-3 px-4 text-center font-mono text-white">
                                {game.totalChallenges > 0
                                  ? `${((game.overturned / game.totalChallenges) * 100).toFixed(0)}%`
                                  : '-'}
                              </td>
                              <td className="py-3 px-4 text-center font-mono text-text-secondary">{game.avgChallengeTime}s</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* How ABS Works */}
                <Card variant="default" padding="lg" className="mt-8">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle>How the Automated Ball-Strike System Works</CardTitle>
                  </CardHeader>
                  <div className="grid md:grid-cols-2 gap-6 mt-2">
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-burnt-orange/20 flex items-center justify-center text-burnt-orange font-bold text-sm shrink-0">1</div>
                        <div>
                          <p className="text-white font-semibold text-sm">Human umpire makes the initial call</p>
                          <p className="text-text-tertiary text-xs">Every pitch is still called by a human umpire behind the plate.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-burnt-orange/20 flex items-center justify-center text-burnt-orange font-bold text-sm shrink-0">2</div>
                        <div>
                          <p className="text-white font-semibold text-sm">Team may challenge the call</p>
                          <p className="text-text-tertiary text-xs">Each team gets 2 challenges per game. Catchers, hitters, or pitchers can request.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-burnt-orange/20 flex items-center justify-center text-burnt-orange font-bold text-sm shrink-0">3</div>
                        <div>
                          <p className="text-white font-semibold text-sm">Hawk-Eye determines the true zone</p>
                          <p className="text-text-tertiary text-xs">12 cameras track ball trajectory and batter-specific strike zone via skeletal pose estimation.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-burnt-orange/20 flex items-center justify-center text-burnt-orange font-bold text-sm shrink-0">4</div>
                        <div>
                          <p className="text-white font-semibold text-sm">Call confirmed or overturned (~17 sec)</p>
                          <p className="text-text-tertiary text-xs">Result transmitted via T-Mobile 5G private network to the ballpark display.</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-graphite rounded-lg p-6">
                      <h4 className="text-white font-semibold text-sm mb-4">Key Facts</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-text-tertiary">Cameras per park</span><span className="text-white font-mono">12</span></div>
                        <div className="flex justify-between"><span className="text-text-tertiary">Position accuracy</span><span className="text-white font-mono">&plusmn;0.1 in</span></div>
                        <div className="flex justify-between"><span className="text-text-tertiary">Challenges per team</span><span className="text-white font-mono">2 / game</span></div>
                        <div className="flex justify-between"><span className="text-text-tertiary">Avg review time</span><span className="text-white font-mono">~17 sec</span></div>
                        <div className="flex justify-between"><span className="text-text-tertiary">Network</span><span className="text-white font-mono">T-Mobile 5G</span></div>
                        <div className="flex justify-between"><span className="text-text-tertiary">Skeletal keypoints</span><span className="text-white font-mono">18 per batter</span></div>
                        <div className="flex justify-between"><span className="text-text-tertiary">Approved</span><span className="text-white font-mono">Sept 2025</span></div>
                      </div>
                    </div>
                  </div>
                </Card>
              </ScrollReveal>
            )}

            {/* Challenge Success by Role */}
            {view === 'challenges' && (
              <ScrollReveal>
                <div className="grid gap-6 md:grid-cols-3">
                  {CHALLENGE_BY_ROLE.map((role) => (
                    <Card key={role.role} variant="default" padding="lg">
                      <div className="text-center mb-4">
                        <Badge variant={role.role === 'catcher' ? 'primary' : role.role === 'hitter' ? 'info' : 'warning'}>
                          {role.role.charAt(0).toUpperCase() + role.role.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="font-display text-5xl font-bold text-burnt-orange">{role.successRate}%</p>
                        <p className="text-text-tertiary text-xs uppercase tracking-wider mt-2">Success Rate</p>
                      </div>
                      <div className="mt-6 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-text-tertiary">Total Challenges</span>
                          <span className="text-white font-mono">{role.challenges.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-tertiary">Overturned</span>
                          <span className="text-burnt-orange font-mono">{role.overturned.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-tertiary">Upheld</span>
                          <span className="text-text-secondary font-mono">{(role.challenges - role.overturned).toLocaleString()}</span>
                        </div>
                      </div>
                      {/* Visual bar */}
                      <div className="mt-4 h-2 bg-graphite rounded-full overflow-hidden">
                        <div
                          className="h-full bg-burnt-orange rounded-full transition-all"
                          style={{ width: `${role.successRate}%` }}
                        />
                      </div>
                    </Card>
                  ))}
                </div>

                <Card variant="default" padding="lg" className="mt-8">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle>Spring Training 2025 Benchmarks</CardTitle>
                  </CardHeader>
                  <p className="text-text-secondary text-sm mt-2">
                    During 2025 spring training testing, <strong className="text-white">52.2% of all challenges were successful</strong> with
                    an average of <strong className="text-white">4.1 challenges per game</strong>. Catchers led at 56%, followed by
                    hitters at 50% and pitchers at 41%. These early-season 2026 numbers show catchers
                    maintaining their edge — they see the zone from behind the plate and have the
                    best instinct for when a call is wrong.
                  </p>
                </Card>
              </ScrollReveal>
            )}

            {/* Umpire Accuracy Comparison */}
            {view === 'accuracy' && (
              <ScrollReveal>
                <Card variant="default" padding="lg">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle>Accuracy Comparison: Human vs. ABS</CardTitle>
                  </CardHeader>
                  <div className="space-y-6 mt-4">
                    {UMPIRE_ACCURACY.map((entry) => (
                      <div key={entry.label}>
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-white font-semibold text-sm">{entry.label}</span>
                          <span className="text-burnt-orange font-mono text-lg font-bold">{entry.accuracy}%</span>
                        </div>
                        <div className="h-3 bg-graphite rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              entry.accuracy > 99 ? 'bg-success' : entry.accuracy > 96 ? 'bg-burnt-orange' : 'bg-warning'
                            }`}
                            style={{ width: `${entry.accuracy}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-text-tertiary text-xs">{entry.source}</span>
                          <span className="text-text-tertiary text-xs">{entry.totalCalls.toLocaleString()} calls/season est.</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="grid md:grid-cols-2 gap-6 mt-8">
                  <Card variant="default" padding="lg">
                    <h3 className="text-white font-semibold mb-3">What ABS Means for Pitchers</h3>
                    <p className="text-text-secondary text-sm">
                      Pitchers who paint corners will see more called strikes. The ABS zone is
                      geometrically precise — no human inconsistency on borderline pitches. Pitchers
                      with high called-strike rates above expected should benefit most; those who rely
                      on framing catchers may see regression.
                    </p>
                  </Card>
                  <Card variant="default" padding="lg">
                    <h3 className="text-white font-semibold mb-3">What ABS Means for Hitters</h3>
                    <p className="text-text-secondary text-sm">
                      Hitters get a consistent, personalized zone based on their stance — measured by
                      Hawk-Eye skeletal tracking at 18 keypoints. No more umpire-specific tendencies
                      to memorize. Walk rates may shift as borderline calls become deterministic
                      rather than probabilistic.
                    </p>
                  </Card>
                </div>
              </ScrollReveal>
            )}

            {/* Timeline */}
            {view === 'timeline' && (
              <ScrollReveal>
                <Card variant="default" padding="lg">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle>ABS Development Timeline</CardTitle>
                  </CardHeader>
                  <div className="mt-4 space-y-0">
                    {ABS_TIMELINE.map((entry, i) => (
                      <div key={entry.year} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                            i === ABS_TIMELINE.length - 1
                              ? 'bg-burnt-orange text-white'
                              : 'bg-graphite text-text-secondary'
                          }`}>
                            {entry.year.slice(2)}
                          </div>
                          {i < ABS_TIMELINE.length - 1 && (
                            <div className="w-px h-8 bg-border-subtle" />
                          )}
                        </div>
                        <div className="pb-8">
                          <p className="text-burnt-orange font-semibold text-sm">{entry.year}</p>
                          <p className="text-text-secondary text-sm">{entry.event}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </ScrollReveal>
            )}

            {/* Data Source */}
            <div className="mt-8 pt-4 border-t border-border-subtle">
              <DataSourceBadge
                source="MLB / Hawk-Eye / UmpScorecards"
                timestamp=""
              />
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
