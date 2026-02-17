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

interface WPTimelinePoint {
  inning: string;
  homeWP: number;
  event: string;
}

interface WPExampleResponse {
  example: {
    game_id: string;
    homeTeam: string;
    awayTeam: string;
    finalScore: string;
    date: string;
    wpTimeline: WPTimelinePoint[];
  };
  methodology: {
    model: string;
    inputs: string[];
    calibrationTarget: string;
  };
  meta?: { source: string; fetched_at: string };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WinProbabilityClient() {
  const { data: wpData, loading } =
    useSportData<WPExampleResponse>('/api/models/win-probability/example');

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: 'BSI Win Probability Model',
          author: { '@type': 'Person', name: 'Austin Humphrey' },
          publisher: { '@type': 'Organization', name: 'Blaze Sports Intel' },
          datePublished: '2026-02-17',
          url: 'https://blazesportsintel.com/models/win-probability',
          description: 'How BSI calculates real-time win probability during live games.',
        }}
      />
      <main id="main-content">
        <Section padding="sm" className="border-b border-white/10">
          <Container>
            <Breadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Models', href: '/models' },
                { label: 'Win Probability' },
              ]}
            />
          </Container>
        </Section>

        <Section padding="lg">
          <Container size="narrow">
            <Badge variant="warning" className="mb-4">In Development — v0.1</Badge>
            <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-white mb-4">
              Win Probability Model
            </h1>
            <p className="text-white/50 text-lg leading-relaxed mb-12">
              Real-time estimates of each team&#39;s likelihood of winning based on current game
              state. Updated pitch-by-pitch (baseball) or play-by-play (football/basketball).
            </p>

            {/* Definition */}
            <section className="mb-12">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                Definition
              </h2>
              <p className="text-sm text-white/50 leading-relaxed">
                Win probability is the estimated chance a team wins given the current score,
                inning/quarter/period, base-out state (baseball), down-and-distance (football), or
                shot clock situation (basketball). It&#39;s expressed as a percentage from 0 to 100
                for each team, always summing to 100%.
              </p>
            </section>

            {/* Inputs */}
            <section className="mb-12">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                Inputs
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Score differential', detail: 'Current lead/deficit between teams' },
                  { label: 'Game clock', detail: 'Inning + outs (baseball), quarter + time remaining (football/basketball)' },
                  { label: 'Base-out state', detail: 'Baseball only: runners on base + out count creates 24 distinct leverage states' },
                  { label: 'Home/away', detail: 'Historical home-field advantage factor by sport and venue' },
                  { label: 'Pre-game strength', detail: 'Team quality estimates from season record, RPI, or power ratings' },
                ].map((input) => (
                  <div
                    key={input.label}
                    className="flex gap-4 items-start bg-white/[0.03] border border-white/[0.06] rounded-lg p-4"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#BF5700] mt-0.5 shrink-0 w-28">
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
                  Teams play at their season-average level for the remainder of the game. No in-game
                  adjustments for pitching changes, injuries, or momentum shifts are modeled yet.
                </li>
                <li className="flex gap-2">
                  <span className="text-[#BF5700] mt-1 shrink-0">&#8226;</span>
                  Historical leverage data (base-out × inning × score) comes from MLB play-by-play
                  archives. College baseball leverage is extrapolated from pro data with conference
                  strength adjustments.
                </li>
                <li className="flex gap-2">
                  <span className="text-[#BF5700] mt-1 shrink-0">&#8226;</span>
                  Home-field advantage is static per sport (baseball: ~54%, football: ~57%,
                  basketball: ~60%). Venue-specific effects are not yet incorporated.
                </li>
              </ul>
            </section>

            {/* Live Validation Example */}
            <section className="mb-12">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                Validation
              </h2>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                <p className="text-sm text-white/50 leading-relaxed mb-3">
                  <strong className="text-white/70">Calibration target:</strong> when the model says
                  a team has a 70% win probability, that team should win approximately 70% of the
                  time across a large sample.
                </p>

                {loading && (
                  <div className="mt-4 space-y-2 animate-pulse">
                    <div className="h-4 bg-white/[0.06] rounded w-3/4" />
                    <div className="h-20 bg-white/[0.04] rounded-lg" />
                  </div>
                )}

                {wpData?.example && (
                  <div className="mt-4 bg-white/[0.02] rounded-lg p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#BF5700] mb-2">
                      Example: {wpData.example.awayTeam} at {wpData.example.homeTeam} — {wpData.example.finalScore}
                    </p>
                    <p className="text-[10px] text-white/20 mb-3">{wpData.example.date}</p>
                    <div className="space-y-1.5">
                      {wpData.example.wpTimeline.map((point, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-white/25 w-8 shrink-0">{point.inning}</span>
                          <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#BF5700] to-[#C9A227] rounded-full transition-all"
                              style={{ width: `${Math.round(point.homeWP * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-white/30 w-10 shrink-0 text-right">
                            {Math.round(point.homeWP * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-white/15 mt-3">
                      Home WP shown. Source: {wpData.methodology.model}, calibrated against {wpData.methodology.calibrationTarget}
                    </p>
                  </div>
                )}

                {!loading && !wpData?.example && (
                  <p className="text-sm text-white/50 leading-relaxed mt-3">
                    <strong className="text-white/70">Current status:</strong> v0.1 is calibrated
                    against 2024-2025 MLB regular season data. College baseball and football
                    calibration datasets are being assembled from historical game logs.
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
                  'Blowouts in early innings — the model can overstate comeback probability when the score differential is extreme but the game is young.',
                  'Pitching changes — a dominant reliever entering changes the true WP significantly, but the model doesn\'t yet account for individual pitcher quality.',
                  'Weather delays — suspended games or rain-shortened games break the inning-based framework.',
                  'Small-sample sports — college baseball has fewer plate appearances per game than MLB, making leverage tables noisier.',
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
                  Initial methodology documentation. Model framework established. Calibration
                  pending against college baseball dataset.
                </p>
              </div>
            </section>

            {/* Citation */}
            <CiteWidget
              title="BSI Win Probability Model"
              path="/models/win-probability"
              date="2026-02-17"
            />

            {/* Navigation */}
            <div className="mt-12 flex flex-wrap gap-4 text-sm text-white/30">
              <Link href="/models" className="hover:text-white/60 transition-colors">
                &#8592; All Models
              </Link>
              <Link href="/models/monte-carlo" className="hover:text-white/60 transition-colors">
                Monte Carlo &#8594;
              </Link>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
