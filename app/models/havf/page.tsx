'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { CiteWidget } from '@/components/ui/CiteWidget';
import { JsonLd } from '@/components/JsonLd';
import { Footer } from '@/components/layout-ds/Footer';

// ---------------------------------------------------------------------------
// Component data — mirrors lib/analytics/havf.ts weights exactly
// ---------------------------------------------------------------------------

const COMPONENTS = [
  {
    key: 'H',
    name: 'Hitting',
    weight: 0.30,
    description:
      'Pure offensive production. How well does this player hit, measured against every other player in the cohort?',
    subStats: [
      { stat: 'AVG', weight: 0.25, description: 'Batting average — contact rate and ball-in-play quality' },
      { stat: 'OBP', weight: 0.25, description: 'On-base percentage — reaching base by any means' },
      { stat: 'SLG', weight: 0.20, description: 'Slugging percentage — total bases per at-bat' },
      { stat: 'wOBA', weight: 0.20, description: 'Weighted on-base average — assigns run values to each outcome' },
      { stat: 'ISO', weight: 0.10, description: 'Isolated power — extra-base hit ability (SLG minus AVG)' },
    ],
    color: 'var(--bsi-primary)',
  },
  {
    key: 'A',
    name: 'At-Bat Quality',
    weight: 0.25,
    description:
      'Plate discipline and process. A player who walks, avoids strikeouts, and drives the ball hard is winning at-bats even when the box score says otherwise.',
    subStats: [
      { stat: 'BB%', weight: 0.30, description: 'Walk rate — patience and pitch recognition' },
      { stat: 'K% (inv)', weight: 0.30, description: 'Inverted strikeout rate — fewer Ks means higher score' },
      { stat: 'BABIP', weight: 0.20, description: 'Batting average on balls in play — quality of contact' },
      { stat: 'HR%', weight: 0.20, description: 'Home run rate — damage per plate appearance' },
    ],
    color: 'var(--bsi-accent)',
  },
  {
    key: 'V',
    name: 'Velocity',
    weight: 0.25,
    description:
      'Power proxy. Without Hawk-Eye data at the college level, BSI uses power metrics as a proxy for bat speed and exit velocity — the physical tools that translate to the next level.',
    subStats: [
      { stat: 'ISO', weight: 0.40, description: 'Isolated power — the strongest proxy for raw bat speed' },
      { stat: 'SLG', weight: 0.35, description: 'Slugging — total bases reflect hard-hit frequency' },
      { stat: 'HR%', weight: 0.25, description: 'Home run rate — over-the-fence power' },
    ],
    color: '#FDB913',
  },
  {
    key: 'F',
    name: 'Fielding',
    weight: 0.20,
    description:
      'Defensive value. Fielding data at the college level is thin — BSI uses what exists and defaults to league-average (50) when data is unavailable rather than penalizing or rewarding blindly.',
    subStats: [
      { stat: 'FPCT', weight: 0.60, description: 'Fielding percentage — errors relative to chances' },
      { stat: 'RF', weight: 0.40, description: 'Range factor — putouts and assists per game' },
    ],
    color: 'rgba(255,255,255,0.5)',
  },
] as const;

const INTERPRETATION_TIERS = [
  { range: '80-100', label: 'Elite', description: 'Top of the cohort. Draft-board material.', color: 'var(--bsi-accent)' },
  { range: '60-79', label: 'Above Average', description: 'Strong performer with standout dimensions.', color: 'var(--bsi-primary)' },
  { range: '40-59', label: 'Average', description: 'Solid contributor. The shape of the radar matters more than the composite here.', color: 'rgba(255,255,255,0.5)' },
  { range: '20-39', label: 'Below Average', description: 'Weaknesses outweigh strengths against this cohort.', color: 'rgba(255,255,255,0.3)' },
  { range: '0-19', label: 'Developmental', description: 'Early-career or limited data. Not a death sentence — check the breakdown.', color: 'rgba(255,255,255,0.2)' },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HAVFMethodologyPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: 'HAV-F: College Baseball Player Evaluation Methodology',
          author: { '@type': 'Person', name: 'Austin Humphrey' },
          publisher: {
            '@type': 'Organization',
            name: 'Blaze Sports Intel',
            url: 'https://blazesportsintel.com',
          },
          datePublished: '2026-02-24',
          dateModified: '2026-02-24',
          url: 'https://blazesportsintel.com/models/havf',
          description:
            'HAV-F (Hitting, At-Bat Quality, Velocity, Fielding) is BSI\'s composite player evaluation metric for college baseball scouting analytics. Methodology, weights, and interpretation guide.',
          keywords: [
            'HAV-F analytics',
            'college baseball analytics',
            'college baseball scouting analytics',
            'player evaluation metric',
            'college baseball draft analytics',
          ],
          about: {
            '@type': 'Thing',
            name: 'College Baseball Player Analytics',
          },
        }}
      />
      <main id="main-content">
        <Section padding="sm" className="border-b border-border">
          <Container>
            <Breadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Models', href: '/models' },
                { label: 'HAV-F' },
              ]}
            />
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/8 via-transparent to-white/[0.02] pointer-events-none" />
          <Container size="narrow">
            <Badge variant="success" className="mb-4">Live — v1.0</Badge>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-wide text-text-primary mb-4">
              HAV-F{' '}
              <span className="bg-gradient-to-r from-burnt-orange to-gold bg-clip-text text-transparent">
                Methodology
              </span>
            </h1>
            <p className="text-text-tertiary text-lg leading-relaxed mb-6">
              Hitting. At-Bat Quality. Velocity. Fielding. Four measurable dimensions of player
              performance, compressed into a single composite score that tells you what batting
              average and ERA alone never will.
            </p>
            <p className="text-text-muted text-sm leading-relaxed">
              HAV-F is BSI&apos;s proprietary player evaluation framework for college baseball
              scouting analytics. Every player is scored 0-100 on each component via percentile
              rank against their cohort, then the four components are weighted into a composite.
              No black boxes — every weight and every input is documented below.
            </p>
          </Container>
        </Section>

        {/* Why HAV-F Exists */}
        <Section padding="lg" borderTop>
          <Container size="narrow">
            <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-text-primary mb-6">
              Why This Exists
            </h2>
            <div className="text-sm text-text-tertiary leading-relaxed space-y-4">
              <p>
                MLB has Statcast — Hawk-Eye cameras in all 30 ballparks tracking every pitch,
                swing, and throw at 300 frames per second. FanGraphs, Baseball Savant, and
                Baseball Reference turn that data into consumer-grade analytics. College
                baseball has nothing equivalent.
              </p>
              <p>
                TrackMan and Yakkertech are installed at many D1 programs, but that data stays
                behind closed doors. The public gets box scores and conference stats pages.
                If you want to evaluate a college player&apos;s actual profile — not just
                his batting average — you&apos;re on your own.
              </p>
              <p>
                HAV-F fills that gap. It takes the publicly available statistical output and
                builds a structured evaluation framework around it. The limitation is real:
                without pitch-tracking data, HAV-F uses power metrics as a proxy for bat speed
                and exit velocity (the V component). The advantage is also real: HAV-F provides
                a consistent, documented, comparable player evaluation that doesn&apos;t exist
                anywhere else for college baseball.
              </p>
            </div>
          </Container>
        </Section>

        {/* How It Works */}
        <Section padding="lg" borderTop>
          <Container size="narrow">
            <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-text-primary mb-6">
              How It Works
            </h2>
            <div className="text-sm text-text-tertiary leading-relaxed space-y-4 mb-10">
              <p>
                HAV-F scores are <strong className="text-text-secondary">percentile-based</strong>,
                not raw. A player with an 80 H-Score isn&apos;t &ldquo;80% good at hitting&rdquo; — he&apos;s
                better than 80% of the players in his cohort at hitting. This means scores
                automatically adjust as the cohort changes. A player who looks elite in a weak
                conference will score lower when ranked against the full D1 population.
              </p>
              <p>
                The computation runs in three steps:
              </p>
            </div>

            <div className="space-y-4 mb-10">
              {[
                {
                  step: '1. Build the percentile table',
                  detail:
                    'For each stat (AVG, OBP, SLG, etc.), sort all players in the cohort from lowest to highest. This sorted distribution becomes the lookup table for percentile ranking.',
                },
                {
                  step: '2. Rank each player',
                  detail:
                    'For each stat, binary search the sorted distribution to find where the player falls. The position in the distribution, adjusted for ties, becomes the percentile rank (0-100). A player at the median gets a 50.',
                },
                {
                  step: '3. Weight and composite',
                  detail:
                    'Sub-stat percentiles are weighted within each component (e.g., AVG 25% + OBP 25% + SLG 20% + wOBA 20% + ISO 10% = H-Score). The four component scores are then weighted into the final composite: H 30% + A 25% + V 25% + F 20%.',
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 items-start">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-burnt-orange mt-0.5 shrink-0 w-48">
                    {item.step}
                  </span>
                  <p className="text-sm text-text-tertiary leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>

            {/* Composite formula */}
            <div className="bg-surface-light border border-border-subtle rounded-xl p-5 sm:p-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-3">
                Composite Formula
              </span>
              <pre className="text-sm font-mono text-text-secondary leading-relaxed overflow-x-auto">
{`HAV-F = (H × 0.30) + (A × 0.25) + (V × 0.25) + (F × 0.20)

where H, A, V, F ∈ [0, 100]
and   HAV-F ∈ [0, 100]`}
              </pre>
            </div>
          </Container>
        </Section>

        {/* The Four Components */}
        <Section padding="lg" borderTop>
          <Container size="narrow">
            <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-text-primary mb-8">
              The Four Components
            </h2>

            <div className="space-y-10">
              {COMPONENTS.map((comp) => (
                <div key={comp.key} className="bg-surface-light border border-border-subtle rounded-xl p-5 sm:p-6">
                  {/* Component header */}
                  <div className="flex items-baseline gap-3 mb-3">
                    <span
                      className="font-display text-3xl font-bold"
                      style={{ color: comp.color }}
                    >
                      {comp.key}
                    </span>
                    <div>
                      <span className="font-display text-sm uppercase tracking-widest text-text-secondary">
                        {comp.name}
                      </span>
                      <span className="text-[10px] font-mono text-text-muted ml-2">
                        {(comp.weight * 100).toFixed(0)}% of composite
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-text-tertiary leading-relaxed mb-5">
                    {comp.description}
                  </p>

                  {/* Sub-stat weights */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-2">
                      Sub-stat weights
                    </span>
                    {comp.subStats.map((sub) => (
                      <div key={sub.stat} className="flex items-start gap-3">
                        <div className="flex items-center gap-2 shrink-0 w-28">
                          <code className="text-xs font-mono text-text-secondary bg-surface-light px-1.5 py-0.5 rounded">
                            {sub.stat}
                          </code>
                          <span className="text-[10px] font-mono text-text-muted">
                            {(sub.weight * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">{sub.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* Weight bar visualization */}
                  <div className="mt-4 h-2 rounded-full bg-surface-light overflow-hidden flex">
                    {comp.subStats.map((sub) => (
                      <div
                        key={sub.stat}
                        className="h-full first:rounded-l-full last:rounded-r-full"
                        style={{
                          width: `${sub.weight * 100}%`,
                          backgroundColor: comp.color,
                          opacity: 0.3 + sub.weight * 0.7,
                        }}
                        title={`${sub.stat}: ${(sub.weight * 100).toFixed(0)}%`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        {/* Interpreting Scores */}
        <Section padding="lg" borderTop>
          <Container size="narrow">
            <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-text-primary mb-6">
              Interpreting Scores
            </h2>
            <div className="text-sm text-text-tertiary leading-relaxed space-y-4 mb-8">
              <p>
                The composite tells you where a player sits overall. The component breakdown
                tells you <em className="text-text-secondary">why</em>. A 70 composite could be a
                well-rounded player (65/70/72/68) or a specialist (90/80/60/30). The shape
                of the radar chart matters as much as the number.
              </p>
              <p>
                Scouts already think this way — they evaluate tools separately before forming
                an overall grade. HAV-F formalizes that process against a statistical cohort
                rather than relying on subjective comparisons.
              </p>
            </div>

            <div className="space-y-3">
              {INTERPRETATION_TIERS.map((tier) => (
                <div
                  key={tier.range}
                  className="flex items-start gap-4 bg-surface-light border border-border-subtle rounded-xl p-4"
                >
                  <div className="shrink-0 w-20 text-center">
                    <span
                      className="text-lg font-display font-bold"
                      style={{ color: tier.color }}
                    >
                      {tier.range}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-text-secondary font-medium">{tier.label}</span>
                    <p className="text-xs text-text-muted mt-0.5">{tier.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        {/* Data Sources & Limitations */}
        <Section padding="lg" borderTop>
          <Container size="narrow">
            <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-text-primary mb-6">
              Data Sources & Limitations
            </h2>
            <div className="space-y-6">
              <div className="bg-surface-light border border-border-subtle rounded-xl p-5 sm:p-6">
                <h3 className="text-sm font-display uppercase tracking-wide text-text-primary mb-3">
                  What Feeds HAV-F
                </h3>
                <div className="text-sm text-text-tertiary leading-relaxed space-y-3">
                  <p>
                    Player batting statistics from the Highlightly Pro API, supplemented by
                    ESPN&apos;s college baseball endpoints where Highlightly coverage is thin.
                    Advanced metrics (wOBA, ISO, BB%, K%, BABIP, HR%) are derived from basic
                    batting lines using FanGraphs linear weights.
                  </p>
                  <p>
                    Fielding data comes from the same sources but is significantly less
                    reliable at the college level. Many programs don&apos;t report range factor,
                    and fielding percentage alone rewards immobility (a player who never reaches
                    the ball never makes an error). HAV-F acknowledges this by defaulting to a
                    neutral 50 when fielding data is unavailable.
                  </p>
                </div>
              </div>

              <div className="bg-surface-light border border-border-subtle rounded-xl p-5 sm:p-6">
                <h3 className="text-sm font-display uppercase tracking-wide text-text-primary mb-3">
                  Known Limitations
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      limitation: 'No pitch-tracking data',
                      detail:
                        'Exit velocity, launch angle, and bat speed are unavailable for college baseball. The V component uses power metrics (ISO, SLG, HR%) as a proxy. This correlates with — but does not measure — actual bat speed.',
                    },
                    {
                      limitation: 'Cohort-dependent scoring',
                      detail:
                        'Scores are relative to whoever is in the cohort. A 90 in a 30-player sample means something different than a 90 in a 300-player sample. Always check cohort size.',
                    },
                    {
                      limitation: 'Batting only',
                      detail:
                        'HAV-F v1.0 evaluates position players. Pitchers are not scored. A pitching-specific framework (K/9, BB/9, FIP, WHIP, velocity) is planned for v2.0.',
                    },
                    {
                      limitation: 'Early-season noise',
                      detail:
                        'Small sample sizes in the first 2-3 weeks of the season produce volatile scores. A player who goes 5-for-8 in opening weekend will look elite until the sample stabilizes.',
                    },
                    {
                      limitation: 'Fielding data quality',
                      detail:
                        'Fielding percentage and range factor are blunt instruments. The F component is weighted lowest (20%) for this reason, and defaults to 50 when data is missing.',
                    },
                  ].map((item) => (
                    <div key={item.limitation} className="flex gap-4 items-start">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-burnt-orange mt-0.5 shrink-0 w-48">
                        {item.limitation}
                      </span>
                      <p className="text-sm text-text-muted leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </Section>

        {/* Technical Implementation */}
        <Section padding="lg" borderTop>
          <Container size="narrow">
            <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-text-primary mb-6">
              Technical Implementation
            </h2>
            <div className="bg-surface-light border border-border-subtle rounded-xl p-5 sm:p-6 space-y-4">
              <div className="text-sm text-text-tertiary leading-relaxed space-y-3">
                <p>
                  The computation engine lives in{' '}
                  <code className="text-text-secondary bg-surface-light px-1.5 py-0.5 rounded text-xs font-mono">
                    lib/analytics/havf.ts
                  </code>
                  {' '}— pure math with no external dependencies. It takes an array of player stat
                  objects, builds a percentile table from the cohort, and returns scored results.
                </p>
                <p>
                  Percentile ranking uses binary search for O(log n) lookup per stat per player.
                  Ties are handled with midpoint averaging — if three players share the same
                  OBP, they all receive the percentile at the middle of the tie range.
                </p>
                <p>
                  Computed scores are persisted to Cloudflare D1 (the{' '}
                  <code className="text-text-secondary bg-surface-light px-1.5 py-0.5 rounded text-xs font-mono">
                    havf_scores
                  </code>{' '}
                  table) with raw input stats preserved for audit trail. The leaderboard API
                  reads from D1 with KV caching (5-minute TTL) for production performance.
                </p>
              </div>

              {/* Storage schema summary */}
              <div className="bg-surface-light rounded-lg p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-2">
                  D1 Schema Highlights
                </span>
                <pre className="text-xs font-mono text-text-muted leading-relaxed overflow-x-auto">
{`havf_scores
├── player_id       TEXT (unique per league+season)
├── h_score         REAL [0-100]
├── a_score         REAL [0-100]
├── v_score         REAL [0-100]
├── f_score         REAL [0-100]
├── havf_composite  REAL [0-100]
├── raw_avg, raw_obp, raw_slg, raw_woba, raw_iso
├── raw_bb_pct, raw_k_pct, raw_babip, raw_hr_rate
├── data_source     TEXT
└── computed_at     TEXT (ISO 8601)`}
                </pre>
              </div>
            </div>
          </Container>
        </Section>

        {/* Explore the Data */}
        <Section padding="lg" borderTop>
          <Container size="narrow">
            <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-text-primary mb-6">
              Explore the Data
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/college-baseball/analytics" className="block group">
                <Card variant="default" padding="lg" className="h-full hover:border-border-accent hover:bg-surface-light transition-all">
                  <Badge variant="accent" size="sm" className="mb-2">Live</Badge>
                  <h3 className="font-display text-sm uppercase tracking-wide text-text-primary group-hover:text-burnt-orange transition-colors mb-1">
                    HAV-F Leaderboard
                  </h3>
                  <p className="text-xs text-text-muted">
                    Top 50 college baseball players ranked by HAV-F composite with radar charts
                    and component breakdowns.
                  </p>
                </Card>
              </Link>
              <Link href="/college-baseball/players" className="block group">
                <Card variant="default" padding="lg" className="h-full hover:border-border-accent hover:bg-surface-light transition-all">
                  <Badge variant="primary" size="sm" className="mb-2">15 Profiles</Badge>
                  <h3 className="font-display text-sm uppercase tracking-wide text-text-primary group-hover:text-burnt-orange transition-colors mb-1">
                    Player Pages
                  </h3>
                  <p className="text-xs text-text-muted">
                    Individual player profiles with HAV-F scores, stat tables, and scouting
                    analytics for top prospects.
                  </p>
                </Card>
              </Link>
            </div>
          </Container>
        </Section>

        {/* Citation */}
        <Section padding="lg" borderTop>
          <Container size="narrow">
            <CiteWidget
              title="HAV-F: College Baseball Player Evaluation Methodology"
              path="/models/havf"
              date="2026-02-24"
            />

            {/* Navigation */}
            <div className="mt-12 flex flex-wrap gap-4 text-sm text-text-muted">
              <Link href="/models" className="hover:text-text-secondary transition-colors">
                &#8592; All Models
              </Link>
              <Link href="/college-baseball/analytics" className="hover:text-text-secondary transition-colors">
                HAV-F Leaderboard &#8594;
              </Link>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
