'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';

// ── SVG Sport Icons ──

const CoverageBaseballSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="12" cy="12" r="10" />
    <path d="M5 12C5 12 8 9 12 9C16 9 19 12 19 12" />
    <path d="M5 12C5 12 8 15 12 15C16 15 19 12 19 12" />
  </svg>
);
const CoverageFootballSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9" stroke="currentColor" strokeWidth={1.5}>
    <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(45 12 12)" />
    <path d="M12 7L12 17M9 10L15 14M15 10L9 14" />
  </svg>
);
const CoverageBasketballSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2V22M2 12H22" />
    <path d="M4.5 4.5C8 8 8 16 4.5 19.5M19.5 4.5C16 8 16 16 19.5 19.5" />
  </svg>
);
const CoverageStadiumSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9" stroke="currentColor" strokeWidth={1.5}>
    <path d="M3 21V10L12 3L21 10V21" /><path d="M3 14H21" /><rect x="8" y="14" width="8" height="7" />
  </svg>
);
const CoverageGradCapSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9" stroke="currentColor" strokeWidth={1.5}>
    <path d="M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" /><path d="M22 10v6" />
  </svg>
);

const COVERAGE_ICONS: Record<string, React.FC> = {
  'College Baseball': CoverageGradCapSvg,
  MLB: CoverageBaseballSvg,
  NFL: CoverageFootballSvg,
  NBA: CoverageBasketballSvg,
  'College Football': CoverageStadiumSvg,
};

const sportsCoverage = [
  {
    name: 'College Baseball',
    status: 'Full Coverage',
    statusColor: '#22C55E',
    href: '/college-baseball',
    teams: 'Every D1 Program',
    features: [
      'Live scores (30-second updates)',
      'Complete box scores',
      'Conference standings',
      'National rankings',
      'Player statistics',
      'Transfer portal tracking',
    ],
    sources: ['D1Baseball', 'NCAA Stats', 'ESPN'],
    updateFrequency: 'Real-time during games',
  },
  {
    name: 'MLB',
    status: 'Full Coverage',
    statusColor: '#22C55E',
    href: '/mlb',
    teams: 'All 30 Teams',
    features: [
      'Live scores and play-by-play',
      'Complete box scores',
      'Division standings',
      'Statcast metrics',
      'Player statistics',
      'Injury reports',
    ],
    sources: ['MLB Stats API', 'Baseball Reference', 'ESPN'],
    updateFrequency: 'Real-time during games',
  },
  {
    name: 'NFL',
    status: 'Full Coverage',
    statusColor: '#22C55E',
    href: '/nfl',
    teams: 'All 32 Teams',
    features: [
      'Live scores',
      'Team standings',
      'Player statistics',
      'Injury reports',
      'Schedule tracking',
    ],
    sources: ['ESPN API', 'Pro Football Reference'],
    updateFrequency: 'Real-time during games',
  },
  {
    name: 'NBA',
    status: 'Full Coverage',
    statusColor: '#22C55E',
    href: '/nba',
    teams: 'All 30 Teams',
    features: [
      'Live scores',
      'Conference standings',
      'Player statistics',
      'Schedule tracking',
    ],
    sources: ['ESPN API', 'Basketball Reference'],
    updateFrequency: 'Real-time during games',
  },
  {
    name: 'College Football',
    status: 'Full Coverage',
    statusColor: '#22C55E',
    href: '/cfb',
    teams: '134 FBS Programs',
    features: [
      'Live scores',
      'Conference standings',
      'Rankings',
      'Player statistics',
      'Schedule tracking',
    ],
    sources: ['ESPN API', 'SportsDataIO'],
    updateFrequency: 'Real-time during games',
  },
];

const dataSources = [
  {
    name: 'statsapi.mlb.com',
    sport: 'MLB',
    description: 'Official MLB statistics API. Real-time play-by-play, Statcast data, and historical statistics.',
    reliability: '99.9%',
  },
  {
    name: 'D1Baseball',
    sport: 'College Baseball',
    description: 'Comprehensive D1 baseball coverage. Rankings, standings, and player statistics.',
    reliability: '99.5%',
  },
  {
    name: 'ESPN API',
    sport: 'Multiple',
    description: 'Live scores, standings, and schedule data across MLB, NFL, and NBA.',
    reliability: '99.8%',
  },
  {
    name: 'Baseball Reference',
    sport: 'MLB',
    description: 'Historical statistics and advanced metrics. Career data and season splits.',
    reliability: '99.9%',
  },
  {
    name: 'Pro Football Reference',
    sport: 'NFL',
    description: 'Comprehensive NFL statistics. Team and player historical data.',
    reliability: '99.8%',
  },
  {
    name: 'Perfect Game',
    sport: 'Youth Baseball',
    description: 'Amateur and youth baseball prospect rankings and tournament data.',
    reliability: '99.5%',
  },
];

export default function CoveragePage() {
  return (
    <div
      className="min-h-screen grain-overlay bg-surface-scoreboard text-bsi-bone"
    >
      {/* ================================================================
          HERO
          ================================================================ */}
      <section
        className="relative overflow-hidden"
        style={{ padding: 'clamp(4rem, 8vw, 7rem) 0 clamp(3rem, 6vw, 5rem)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <ScrollReveal>
            <span className="heritage-stamp">Data Coverage</span>
            <h1
              className="mt-4 font-bold uppercase tracking-tight leading-[0.95] mb-5"
              style={{
                fontFamily: 'var(--bsi-font-display-hero)',
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                color: 'var(--bsi-bone)',
                textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
              }}
            >
              Complete Coverage Where It Matters
            </h1>
            <p
              className="font-serif italic text-lg leading-relaxed mb-8 max-w-2xl mx-auto text-bsi-primary"
            >
              Real-time data from official sources. MLB, NFL, NBA, and the most comprehensive college baseball coverage anywhere.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================
          STATS BAR
          ================================================================ */}
      <div
        className="relative"
        style={{
          background: 'var(--surface-dugout)',
          padding: 'clamp(1.5rem, 3vw, 2.5rem) 0',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '392+', label: 'Teams Tracked' },
              { value: '30s', label: 'Update Frequency' },
              { value: '6', label: 'Data Sources' },
              { value: '99.7%', label: 'Uptime' },
            ].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 100}>
                <div>
                  <div
                    className="text-3xl md:text-4xl font-bold"
                    style={{
                      fontFamily: 'var(--bsi-font-data, var(--font-mono))',
                      color: 'var(--bsi-primary)',
                    }}
                  >
                    {stat.value}
                  </div>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: 'rgba(196,184,165,0.5)' }}
                  >
                    {stat.label}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================
          SPORTS COVERAGE
          ================================================================ */}
      <section
        className="relative"
        style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="heritage-stamp">Sports Coverage</span>
              <h2
                className="mt-3 font-bold uppercase tracking-wide mb-4"
                style={{
                  fontFamily: 'var(--bsi-font-display)',
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                  color: 'var(--bsi-bone)',
                }}
              >
                Sports Coverage
              </h2>
              <p
                className="max-w-2xl mx-auto text-sm"
                style={{ color: 'rgba(196,184,165,0.5)' }}
              >
                Comprehensive coverage across professional and college sports.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-6">
            {sportsCoverage.map((sport, index) => (
              <ScrollReveal key={sport.name} delay={index * 100}>
                <div
                  className="heritage-card overflow-hidden"
                  style={{ borderTop: '2px solid var(--border-vintage)' }}
                >
                  <div className="grid md:grid-cols-4 gap-6 p-6">
                    {/* Sport Header */}
                    <div className="md:col-span-1">
                      <Link href={sport.href} className="group">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-bsi-dust">
                            {(() => { const Icon = COVERAGE_ICONS[sport.name]; return Icon ? <Icon /> : null; })()}
                          </span>
                          <div>
                            <h3
                              className="text-xl font-semibold transition-colors text-bsi-bone"
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bsi-primary)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bsi-bone)')}
                            >
                              {sport.name}
                            </h3>
                            <span
                              className="inline-block text-[10px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-sm"
                              style={{
                                background: `${sport.statusColor}1F`,
                                color: sport.statusColor,
                              }}
                            >
                              {sport.status}
                            </span>
                          </div>
                        </div>
                        <p
                          className="text-sm"
                          style={{ color: 'rgba(196,184,165,0.5)' }}
                        >
                          {sport.teams}
                        </p>
                      </Link>
                    </div>

                    {/* Features */}
                    <div className="md:col-span-2">
                      <h4
                        className="text-sm font-semibold uppercase mb-3"
                        style={{
                          fontFamily: 'var(--bsi-font-display)',
                          color: 'rgba(196,184,165,0.35)',
                        }}
                      >
                        Features
                      </h4>
                      <ul className="grid grid-cols-2 gap-2">
                        {sport.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-center gap-2 text-sm text-bsi-dust"
                          >
                            <span style={{ color: '#22C55E' }}>&#10003;</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Sources & Frequency */}
                    <div className="md:col-span-1">
                      <div className="mb-4">
                        <h4
                          className="text-sm font-semibold uppercase mb-2"
                          style={{
                            fontFamily: 'var(--bsi-font-display)',
                            color: 'rgba(196,184,165,0.35)',
                          }}
                        >
                          Data Sources
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {sport.sources.map((source) => (
                            <span
                              key={source}
                              className="inline-block text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-sm"
                              style={{
                                background: 'var(--surface-press-box)',
                                color: 'var(--bsi-dust)',
                              }}
                            >
                              {source}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4
                          className="text-sm font-semibold uppercase mb-1"
                          style={{
                            fontFamily: 'var(--bsi-font-display)',
                            color: 'rgba(196,184,165,0.35)',
                          }}
                        >
                          Updates
                        </h4>
                        <p
                          className="text-sm text-bsi-primary"
                        >
                          {sport.updateFrequency}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          DATA SOURCES
          ================================================================ */}
      <section
        className="relative"
        style={{
          padding: 'clamp(3rem, 6vw, 5rem) 0',
          background: 'var(--surface-dugout)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="heritage-stamp">Sources</span>
              <h2
                className="mt-3 font-bold uppercase tracking-wide mb-4"
                style={{
                  fontFamily: 'var(--bsi-font-display)',
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                  color: 'var(--bsi-bone)',
                }}
              >
                Our Data Sources
              </h2>
              <p
                className="max-w-2xl mx-auto text-sm"
                style={{ color: 'rgba(196,184,165,0.5)' }}
              >
                We pull from official APIs and trusted sources. Every stat is verified and timestamped.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataSources.map((source, index) => (
              <ScrollReveal key={source.name} delay={index * 100}>
                <div
                  className="heritage-card h-full p-6"
                  style={{ borderTop: '2px solid var(--border-vintage)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="inline-block text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-sm"
                      style={{
                        background: 'var(--surface-press-box)',
                        color: 'var(--bsi-dust)',
                      }}
                    >
                      {source.sport}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: '#22C55E' }}
                    >
                      {source.reliability} Uptime
                    </span>
                  </div>
                  <h3
                    className="text-lg font-semibold mb-2 text-bsi-bone"
                  >
                    {source.name}
                  </h3>
                  <p
                    className="text-sm font-serif"
                    style={{ color: 'rgba(196,184,165,0.5)' }}
                  >
                    {source.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          DATA QUALITY COMMITMENT
          ================================================================ */}
      <section
        className="relative"
        style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="heritage-stamp">Quality</span>
              <h2
                className="mt-3 font-bold uppercase tracking-wide mb-4"
                style={{
                  fontFamily: 'var(--bsi-font-display)',
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                  color: 'var(--bsi-bone)',
                }}
              >
                Our Data Quality Commitment
              </h2>
            </div>

            <div
              className="heritage-card p-8"
              style={{ borderLeft: '4px solid var(--bsi-primary)' }}
            >
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 mt-0.5 shrink-0 text-bsi-primary" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="8" width="7" height="13" rx="1" /><path d="M6 7v10M17.5 12v5" /></svg>
                  <div>
                    <h3
                      className="text-lg font-semibold mb-2 text-bsi-bone"
                    >
                      Cross-Referenced Data
                    </h3>
                    <p
                      className="text-sm font-serif"
                      style={{ color: 'rgba(196,184,165,0.5)' }}
                    >
                      Every critical statistic is cross-referenced against 3+ sources before publication. We do not guess.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 mt-0.5 shrink-0 text-bsi-primary" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  <div>
                    <h3
                      className="text-lg font-semibold mb-2 text-bsi-bone"
                    >
                      America/Chicago Timestamps
                    </h3>
                    <p
                      className="text-sm font-serif"
                      style={{ color: 'rgba(196,184,165,0.5)' }}
                    >
                      All data points include precise timestamps. You always know exactly when information was captured.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 mt-0.5 shrink-0 text-bsi-primary" stroke="currentColor" strokeWidth={1.5}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
                  <div>
                    <h3
                      className="text-lg font-semibold mb-2 text-bsi-bone"
                    >
                      Source Citations
                    </h3>
                    <p
                      className="text-sm font-serif"
                      style={{ color: 'rgba(196,184,165,0.5)' }}
                    >
                      Every stat includes its source. Full transparency on where our data comes from.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 mt-0.5 shrink-0 text-bsi-primary" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path d="M4.93 4.93l14.14 14.14" /></svg>
                  <div>
                    <h3
                      className="text-lg font-semibold mb-2 text-bsi-bone"
                    >
                      Zero Placeholders
                    </h3>
                    <p
                      className="text-sm font-serif"
                      style={{ color: 'rgba(196,184,165,0.5)' }}
                    >
                      Real numbers or we do not ship it. No estimates, no placeholder data, no made-up statistics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================
          CTA
          ================================================================ */}
      <section
        className="relative"
        style={{
          padding: 'clamp(3rem, 6vw, 5rem) 0',
          background: 'var(--surface-scoreboard)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h2
              className="font-bold uppercase tracking-wide mb-6"
              style={{
                fontFamily: 'var(--bsi-font-display)',
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                color: 'var(--bsi-bone)',
              }}
            >
              See Our{' '}
              <span className="text-bsi-primary">Data in Action</span>
            </h2>
            <p
              className="text-lg font-serif mb-8"
              style={{ color: 'rgba(196,184,165,0.5)' }}
            >
              Start your 14-day free trial and explore the most comprehensive sports data platform built for fans.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="btn-heritage-fill px-8 py-3 text-center">
                Start Free Trial
              </Link>
              <Link href="/college-baseball" className="btn-heritage px-8 py-3 text-center">
                Explore College Baseball
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </div>
  );
}
