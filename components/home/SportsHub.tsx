'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';
import { withAlpha } from '@/lib/utils/color';
import { BaseballIcon, FootballIcon, BasketballIcon, StadiumIcon } from '@/components/icons/SportIcons';

// ────────────────────────────────────────
// Sports Hub data
// ────────────────────────────────────────

const SPORT_COUNT_KEYS: Record<string, string> = {
  'College Baseball': 'college-baseball',
  'MLB': 'mlb',
  'NFL': 'nfl',
  'NBA': 'nba',
  'CFB': 'cfb',
};

interface SportCardData {
  name: string;
  icon: React.FC<{ className?: string }>;
  href: string;
  description: string;
  color: string;
}

const sports: SportCardData[] = [
  {
    name: 'College Baseball',
    icon: BaseballIcon,
    href: '/college-baseball',
    description: 'Every D1 team. Live scores, box scores, standings, rankings, portal tracking, and weekly editorial.',
    color: 'var(--bsi-primary)',
  },
  {
    name: 'MLB',
    icon: BaseballIcon,
    href: '/mlb',
    description: 'Live scores, standings, and the advanced metrics \u2014 wOBA, FIP, wRC+ \u2014 that tell you what the box score won\u2019t.',
    color: '#C41E3A',
  },
  {
    name: 'NFL',
    icon: FootballIcon,
    href: '/nfl',
    description: 'Live scores, standings, and team coverage built for the fan who watches past the primetime window.',
    color: '#013369',
  },
  {
    name: 'NBA',
    icon: BasketballIcon,
    href: '/nba',
    description: 'Live scores, standings, and game analytics across the full league \u2014 not just the coasts.',
    color: 'var(--bsi-accent)',
  },
  {
    name: 'CFB',
    icon: StadiumIcon,
    href: '/cfb',
    description: 'Scores, standings, and conference coverage from the Big 12 to the Sun Belt.',
    color: '#D97706',
  },
];

// ────────────────────────────────────────
// Actionable context line per sport
// ────────────────────────────────────────

function SportStatusLine({ counts, color }: { counts?: { live: number; today: number }; color: string }) {
  if (!counts) return null;

  const { live, today } = counts;
  let text: string;
  let accent = false;

  if (live > 0) {
    text = `${live} game${live > 1 ? 's' : ''} live now`;
    accent = true;
  } else if (today > 0) {
    text = `${today} game${today > 1 ? 's' : ''} today`;
  } else {
    text = 'No games today';
  }

  return (
    <p
      className="text-[11px] mt-1.5 font-semibold uppercase tracking-wider flex items-center gap-1.5"
      style={{
        fontFamily: 'var(--bsi-font-data)',
        color: accent ? color : 'var(--bsi-dust)',
      }}
    >
      {accent && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }} />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: color }} />
        </span>
      )}
      {text}
    </p>
  );
}

// ────────────────────────────────────────
// Live game badge for sport cards
// ────────────────────────────────────────

function LiveGameBadge({ live, today, color }: { live: number; today: number; color: string }) {
  if (live > 0) {
    return (
      <span
        className="absolute top-3 right-3 heritage-stamp"
        style={{ padding: '1px 8px', fontSize: '9px', backgroundColor: withAlpha(color, 0.12), color, borderColor: withAlpha(color, 0.3) }}
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: color }}
            />
            <span
              className="relative inline-flex rounded-full h-1.5 w-1.5"
              style={{ backgroundColor: color }}
            />
          </span>
          {live} Live
        </span>
      </span>
    );
  }

  if (today > 0) {
    return (
      <span
        className="absolute top-3 right-3 heritage-stamp"
        style={{ padding: '1px 8px', fontSize: '9px', backgroundColor: withAlpha(color, 0.08), color, borderColor: withAlpha(color, 0.2) }}
      >
        {today} Today
      </span>
    );
  }

  return null;
}

// ────────────────────────────────────────
// Sports Hub Section
// ────────────────────────────────────────

interface SportsHubProps {
  sportCounts: Map<string, { live: number; today: number }>;
}

export function SportsHub({ sportCounts }: SportsHubProps) {
  return (
      <section
        className="py-16 px-4 sm:px-6 lg:px-8 relative surface-lifted accent-glow-warm-left"
      >
        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal direction="up">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="heritage-stamp mb-2">Coverage</span>
                <div className="flex items-center gap-3 mt-2">
                  <div className="section-rule-thick" />
                  <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide" style={{ color: 'var(--bsi-bone)' }}>
                    Our Sports
                  </h2>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* College Baseball — flagship hero card */}
          {(() => {
            const flagship = sports[0];
            const FlagshipIcon = flagship.icon;
            return (
          <ScrollReveal direction="up" className="mb-4">
            <Link href={flagship.href} className="group block">
              <div
                className="heritage-card relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                style={{
                  borderLeft: `3px solid ${flagship.color}`,
                  background: `linear-gradient(135deg, var(--surface-dugout) 0%, ${withAlpha(flagship.color, 0.03)} 100%)`,
                }}
              >
                {/* Accent glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    border: `1px solid ${withAlpha(flagship.color, 0.35)}`,
                    borderRadius: '2px',
                    boxShadow: `inset 0 1px 0 ${withAlpha(flagship.color, 0.1)}, 0 0 24px ${withAlpha(flagship.color, 0.06)}`,
                  }}
                  aria-hidden="true"
                />

                <LiveGameBadge
                  live={sportCounts.get('college-baseball')?.live ?? 0}
                  today={sportCounts.get('college-baseball')?.today ?? 0}
                  color={flagship.color}
                />

                <div
                  className="w-16 h-16 flex items-center justify-center shrink-0 transition-all duration-300"
                  style={{ background: withAlpha(flagship.color, 0.06), color: flagship.color }}
                >
                  <FlagshipIcon className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-wide mb-1 transition-colors" style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-bone)' }}>
                    <span className="group-hover:text-[var(--bsi-primary)] transition-colors duration-300">
                      {flagship.name}
                    </span>
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--bsi-dust)' }}>
                    {flagship.description}
                  </p>
                  <SportStatusLine counts={sportCounts.get('college-baseball')} color={flagship.color} />
                </div>

                <span className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all shrink-0" style={{ color: 'var(--bsi-primary)' }}>
                  Explore &rarr;
                </span>
              </div>
            </Link>
          </ScrollReveal>
            );
          })()}

          {/* Remaining 4 sports — 2x2 grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sports.slice(1).map((sport, index) => {
              const countKey = SPORT_COUNT_KEYS[sport.name];
              const counts = countKey ? sportCounts.get(countKey) : undefined;

              return (
                <ScrollReveal
                  key={sport.name}
                  direction="up"
                  delay={index * 80}
                >
                  <Link href={sport.href} className="group block h-full">
                    <div
                      className="heritage-card relative p-5 h-full flex items-start gap-4 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                      style={{
                        borderLeft: `2px solid ${sport.color}`,
                        background: `linear-gradient(135deg, var(--surface-dugout) 0%, ${withAlpha(sport.color, 0.02)} 100%)`,
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          border: `1px solid ${withAlpha(sport.color, 0.35)}`,
                          borderRadius: '2px',
                          boxShadow: `inset 0 1px 0 ${withAlpha(sport.color, 0.1)}, 0 0 20px ${withAlpha(sport.color, 0.06)}`,
                        }}
                        aria-hidden="true"
                      />

                      <LiveGameBadge
                        live={counts?.live ?? 0}
                        today={counts?.today ?? 0}
                        color={sport.color}
                      />

                      <div
                        className="w-14 h-14 flex items-center justify-center shrink-0 transition-all duration-300"
                        style={{ background: withAlpha(sport.color, 0.06), color: sport.color }}
                      >
                        <sport.icon className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold uppercase tracking-wide mb-1 transition-colors" style={{ color: 'var(--bsi-bone)' }}>
                          <span className="group-hover:text-[var(--bsi-primary)] transition-colors duration-300">
                            {sport.name}
                          </span>
                        </h3>
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--bsi-dust)' }}>
                          {sport.description}
                        </p>
                        <SportStatusLine counts={counts} color={sport.color} />
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>
  );
}
