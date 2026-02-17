'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { CiteWidget } from '@/components/ui/CiteWidget';
import { JsonLd } from '@/components/JsonLd';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProjectedTeam {
  team: string;
  projectedWins: number;
  projectedLosses: number;
  tournamentOdds: number;
  cwsOdds: number;
  nationalSeedOdds: number;
}

interface MCExampleResponse {
  example: {
    conference: string;
    simulations: number;
    date: string;
    projectedStandings: ProjectedTeam[];
  };
  methodology: {
    model: string;
    simCount: number;
    inputs: string[];
    assumptions: string[];
  };
  meta?: { source: string; fetched_at: string };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MonteCarloClient() {
  const { data: mcData, loading } =
    useSportData<MCExampleResponse>('/api/models/monte-carlo/example');

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: 'BSI Monte Carlo Simulation Model',
          author: { '@type': 'Person', name: 'Austin Humphrey' },
          publisher: { '@type': 'Organization', name: 'Blaze Sports Intel' },
          datePublished: '2026-02-17',
          url: 'https://blazesportsintel.com/models/monte-carlo',
          description: 'Season projection methodology using Monte Carlo simulation.',
        }}
      />
      <main id="main-content">
        <Section padding="sm" className="border-b border-white/10">
          <Container>
            <Breadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Models', href: '/models' },
                { label: 'Monte Carlo' },
              ]}
            />
          </Container>
        </Section>

        <Section padding="lg">
          <Container size="narrow">
            <Badge variant="warning" className="mb-4">In Development — v0.1</Badge>
            <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-white mb-4">
              Monte Carlo Simulation
            </h1>
            <p className="text-white/50 text-lg leading-relaxed mb-12">
              Project season outcomes by simulating thousands of remaining schedules. Each
              simulation plays out every unplayed game using team strength estimates, then
              aggregates results into probability distributions for standings, tournament bids,
              and championship odds.
            </p>

            {/* Definition */}
            <section className="mb-12">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                Definition
              </h2>
              <p className="text-sm text-white/50 leading-relaxed">
                Monte Carlo simulation is a computational technique that runs a model thousands of
                times with randomized inputs to estimate the probability distribution of outcomes.
                In sports: simulate the remaining schedule 10,000 times, vary game results based on
                team quality, and count how often each team finishes in each position.
              </p>
            </section>

            {/* Inputs */}
            <section className="mb-12">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                Inputs
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Team strength', detail: 'Power rating derived from current record, strength of schedule, run differential (baseball) or point differential (football/basketball)' },
                  { label: 'Remaining schedule', detail: 'Every unplayed game with opponent, home/away, and date' },
                  { label: 'Home advantage', detail: 'Sport-specific home-field win rate adjustment applied per game' },
                  { label: 'Conference rules', detail: 'Tiebreaker logic, division structure, and tournament seeding criteria by conference' },
                  { label: 'Tournament selection', detail: 'RPI thresholds, at-large bid criteria, and automatic qualifier rules for postseason modeling' },
                ].map((input) => (
                  <div
                    key={input.label}
                    className="flex gap-4 items-start bg-white/[0.03] border border-white/[0.06] rounded-lg p-4"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#BF5700] mt-0.5 shrink-0 w-32">
                      {input.label}
                    </span>
                    <p className="text-sm text-white/50 leading-relaxed">{input.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Assumptions */}
            <section className="mb-12">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                Assumptions
              </h2>
              <ul className="space-y-2 text-sm text-white/50 leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-[#BF5700] mt-1 shrink-0">&#8226;</span>
                  Team strength is treated as a fixed value that doesn&#39;t change across the
                  remaining schedule. In reality, injuries, transfers, and development alter team
                  quality mid-season.
                </li>
                <li className="flex gap-2">
                  <span className="text-[#BF5700] mt-1 shrink-0">&#8226;</span>
                  Each game outcome is independent. Series momentum, fatigue effects from
                  back-to-back games, and travel impact are not modeled.
                </li>
                <li className="flex gap-2">
                  <span className="text-[#BF5700] mt-1 shrink-0">&#8226;</span>
                  10,000 simulations is the default run count. This produces stable probability
                  estimates (standard error &lt;1% for most outcomes) without excessive computation
                  time.
                </li>
              </ul>
            </section>

            {/* Live Simulation Example */}
            <section className="mb-12">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                Validation
              </h2>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                <p className="text-sm text-white/50 leading-relaxed mb-3">
                  <strong className="text-white/70">Backtest approach:</strong> run the simulation at
                  multiple points during past seasons and compare projected standings to actual final
                  standings.
                </p>

                {loading && (
                  <div className="mt-4 space-y-2 animate-pulse">
                    <div className="h-4 bg-white/[0.06] rounded w-3/4" />
                    <div className="h-32 bg-white/[0.04] rounded-lg" />
                  </div>
                )}

                {mcData?.example && (
                  <div className="mt-4 bg-white/[0.02] rounded-lg p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#BF5700] mb-1">
                      Sample: {mcData.example.conference} Conference
                    </p>
                    <p className="text-[10px] text-white/20 mb-3">
                      {mcData.example.simulations.toLocaleString()} simulations — {mcData.example.date}
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-white/25 uppercase tracking-wider border-b border-white/[0.06]">
                            <th className="text-left py-2 pr-3">Team</th>
                            <th className="text-right py-2 px-2">W-L</th>
                            <th className="text-right py-2 px-2">Tourney</th>
                            <th className="text-right py-2 px-2">CWS</th>
                            <th className="text-right py-2 pl-2">Nat. Seed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mcData.example.projectedStandings.map((team) => (
                            <tr key={team.team} className="border-b border-white/[0.03]">
                              <td className="py-2 pr-3 text-white/60 font-medium">{team.team}</td>
                              <td className="py-2 px-2 text-right text-white/40 font-mono">
                                {team.projectedWins.toFixed(1)}-{team.projectedLosses.toFixed(1)}
                              </td>
                              <td className="py-2 px-2 text-right text-white/40 font-mono">
                                {(team.tournamentOdds * 100).toFixed(0)}%
                              </td>
                              <td className="py-2 px-2 text-right text-white/40 font-mono">
                                {(team.cwsOdds * 100).toFixed(0)}%
                              </td>
                              <td className="py-2 pl-2 text-right text-white/40 font-mono">
                                {(team.nationalSeedOdds * 100).toFixed(0)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-white/15 mt-3">
                      Model: {mcData.methodology.model} — {mcData.methodology.simCount.toLocaleString()} sims
                    </p>
                  </div>
                )}

                {!loading && !mcData?.example && (
                  <p className="text-sm text-white/50 leading-relaxed mt-3">
                    <strong className="text-white/70">Current status:</strong> backtest framework is
                    built. 2024-2025 college baseball season is the primary validation target.
                  </p>
                )}
              </div>
            </section>

            {/* Failure Modes */}
            <section className="mb-12">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                Failure Modes
              </h2>
              <div className="space-y-3">
                {[
                  'Early-season instability — with fewer than 15 games played, team strength estimates are noisy. Projections before mid-March (baseball) should be treated as rough sketches, not forecasts.',
                  'Transfer portal churn — college baseball rosters can change materially between fall and opening weekend. Pre-season strength ratings may not reflect actual roster composition.',
                  'Conference tournament chaos — single-elimination formats amplify variance. The simulation captures this probabilistically, but individual bracket outcomes are inherently unpredictable.',
                  'Schedule incompleteness — if remaining schedule data has gaps (postponements not yet rescheduled), the simulation underestimates remaining games and skews projections.',
                ].map((mode, i) => (
                  <div
                    key={i}
                    className="flex gap-3 items-start bg-red-500/5 border border-red-500/10 rounded-lg p-4"
                  >
                    <span className="text-red-400/60 text-xs font-bold mt-0.5 shrink-0">!</span>
                    <p className="text-sm text-white/50 leading-relaxed">{mode}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Version History */}
            <section className="mb-12">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                Version History
              </h2>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#BF5700]">v0.1</span>
                  <span className="text-white/20">|</span>
                  <span className="text-xs text-white/30">February 2026</span>
                </div>
                <p className="text-sm text-white/40 mt-1">
                  Initial methodology documentation. Simulation engine scaffolded. Backtest
                  validation pending 2025 season completion.
                </p>
              </div>
            </section>

            {/* Citation */}
            <CiteWidget
              title="BSI Monte Carlo Simulation Model"
              path="/models/monte-carlo"
              date="2026-02-17"
            />

            {/* Navigation */}
            <div className="mt-12 flex flex-wrap gap-4 text-sm text-white/30">
              <Link href="/models" className="hover:text-white/60 transition-colors">
                &#8592; All Models
              </Link>
              <Link href="/models/win-probability" className="hover:text-white/60 transition-colors">
                Win Probability &#8594;
              </Link>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
