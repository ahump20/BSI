import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { preseason2026, getTierLabel } from '@/lib/data/preseason-2026';
import type { PreseasonTeamData } from '@/lib/data/preseason-2026';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sort preseason teams by rank, return as [slug, data] tuples. */
function rankedTeams(): [string, PreseasonTeamData][] {
  return Object.entries(preseason2026).sort(([, a], [, b]) => a.rank - b.rank);
}

/** Get ESPN logo URL for a team slug. Falls back to a transparent pixel. */
function logoUrl(slug: string): string {
  const meta = teamMetadata[slug];
  if (!meta) return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  return getLogoUrl(meta.espnId, meta.logoId);
}

/** Short display name for a team slug. */
function displayName(slug: string): string {
  return teamMetadata[slug]?.shortName ?? preseason2026[slug]?.conference ?? slug;
}

/** Conference badge color mapping. */
function confColor(conf: string): string {
  const map: Record<string, string> = {
    SEC: '#C9A227',
    ACC: '#013CA6',
    'Big 12': '#CF202E',
    'Big Ten': '#0B1560',
    'Pac-12': '#004C1A',
  };
  return map[conf] ?? '#6B7280';
}

/** Bubble status based on rank and tier. */
function bubbleStatus(rank: number, tier: string): { label: string; color: string; bg: string } {
  if (rank <= 12) return { label: 'Safe', color: 'var(--bsi-success)', bg: 'rgba(16,185,129,0.12)' };
  if (rank <= 16) return { label: 'Projected Host', color: '#C9A227', bg: 'rgba(201,162,39,0.12)' };
  if (tier === 'sleeper' || rank <= 20) return { label: 'Bubble', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' };
  return { label: 'Work to Do', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' };
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const allRanked = rankedTeams();
const top16 = allRanked.filter(([, t]) => t.rank <= 16);
const bubbleTeams = allRanked.filter(([, t]) => t.rank >= 13 && t.rank <= 25);

// Pair top 16 into 8 super regional matchups (1v16, 2v15, etc.)
const superRegionalPairs: [string, string][] = [];
for (let i = 0; i < 8; i++) {
  const high = top16[i];
  const low = top16[15 - i];
  if (high && low) {
    superRegionalPairs.push([high[0], low[0]]);
  }
}

// Tournament timeline
const TIMELINE = [
  { date: 'May 20-24', event: 'Conference Tournaments', desc: 'Final resumes are built. Auto-bids awarded.' },
  { date: 'May 26', event: 'Selection Monday', desc: 'NCAA reveals the 64-team field, 16 national seeds, and regional pairings.' },
  { date: 'May 30 - Jun 1', event: 'NCAA Regionals', desc: '16 four-team, double-elimination regionals hosted by national seeds.' },
  { date: 'Jun 6-8', event: 'Super Regionals', desc: '8 best-of-three series. Winners punch their ticket to Omaha.' },
  { date: 'Jun 14-15', event: 'CWS Opens', desc: 'Eight teams begin the double-elimination bracket at Charles Schwab Field.' },
  { date: 'Jun 21-23', event: 'CWS Finals', desc: 'Best-of-three championship series. A national champion is crowned.' },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TournamentHubPage() {
  return (
    <>
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <Breadcrumb
              items={[
                { label: 'College Baseball', href: '/college-baseball' },
                { label: 'Tournament HQ' },
              ]}
            />
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#C9A227]/5 via-transparent to-burnt-orange/5 pointer-events-none" />
          <Container>
            <div className="max-w-3xl mb-4">
              <Badge variant="warning" className="mb-4">
                2026 Season Framework
              </Badge>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-wide text-text-primary mb-4">
                Tournament{' '}
                <span className="bg-gradient-to-r from-[#C9A227] to-burnt-orange bg-clip-text text-transparent">
                  HQ
                </span>
              </h1>
              <p className="text-text-tertiary text-lg leading-relaxed">
                The road to Omaha starts with 64 teams and ends with one. Bracket projections, bubble
                tracking, and everything between Selection Monday and the final out at Charles Schwab Field.
              </p>
            </div>
          </Container>
        </Section>

        {/* ── BRACKET PROJECTION ─────────────────────────────────────────────── */}
        <Section padding="lg" borderTop id="bracket">
          <Container size="wide">
            <div className="mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-text-primary mb-2">
                Bracket{' '}
                <span className="text-[#C9A227]">Projection</span>
              </h2>
              <p className="text-sm text-text-muted max-w-2xl">
                Based on BSI preseason power rankings. Top 16 teams project as regional hosts.
                The NCAA tournament is a 64-team, double-elimination gauntlet — 16 regionals feed
                into 8 super regionals, and those 8 winners converge on Omaha.
              </p>
            </div>

            {/* Tournament Flow: 16 Regionals → 8 Supers → CWS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

              {/* Column 1: 16 Regional Seeds */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-[#C9A227] rounded-full" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-text-secondary">
                    16 Regionals
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {top16.map(([slug, team], i) => (
                    <Link
                      key={slug}
                      href={`/college-baseball/teams/${slug}`}
                      className="group flex items-center gap-2.5 bg-surface-light border border-border-subtle rounded-sm p-2.5 hover:border-[#C9A227]/40 transition-all"
                    >
                      <span className="text-[11px] font-mono text-[#C9A227] w-5 shrink-0 text-right">
                        {i + 1}
                      </span>
                      <Image
                        src={logoUrl(slug)}
                        alt={displayName(slug)}
                        width={28}
                        height={28}
                        className="shrink-0"
                        unoptimized
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-text-secondary font-medium truncate group-hover:text-[#C9A227] transition-colors">
                          {displayName(slug)}
                        </p>
                        <p className="text-[10px] text-text-muted truncate">
                          {team.conference} &middot; {team.record2025.split('(')[0].trim()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Column 2: 8 Super Regionals */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-burnt-orange rounded-full" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-text-secondary">
                    8 Super Regionals
                  </h3>
                </div>
                <div className="space-y-2">
                  {superRegionalPairs.map(([highSlug, lowSlug], i) => {
                    const highTeam = preseason2026[highSlug];
                    const lowTeam = preseason2026[lowSlug];
                    return (
                      <div
                        key={i}
                        className="bg-surface-light border border-border-subtle rounded-sm overflow-hidden"
                      >
                        <div className="px-3 py-1.5 bg-gradient-to-r from-[#C9A227]/8 to-transparent border-b border-border-subtle">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                            Super Regional {i + 1}
                          </span>
                        </div>
                        <div className="divide-y divide-border-subtle">
                          {/* High seed */}
                          <Link
                            href={`/college-baseball/teams/${highSlug}`}
                            className="flex items-center gap-2.5 px-3 py-2 hover:bg-surface-medium/50 transition-colors"
                          >
                            <span className="text-[10px] font-mono text-[#C9A227] w-4 text-right">
                              {highTeam.rank}
                            </span>
                            <Image
                              src={logoUrl(highSlug)}
                              alt={displayName(highSlug)}
                              width={22}
                              height={22}
                              className="shrink-0"
                              unoptimized
                            />
                            <span className="text-sm text-text-secondary font-medium truncate flex-1">
                              {displayName(highSlug)}
                            </span>
                            <Badge
                              size="sm"
                              variant="outline"
                              style={{ borderColor: confColor(highTeam.conference), color: confColor(highTeam.conference) }}
                            >
                              {highTeam.conference}
                            </Badge>
                          </Link>
                          {/* Low seed */}
                          <Link
                            href={`/college-baseball/teams/${lowSlug}`}
                            className="flex items-center gap-2.5 px-3 py-2 hover:bg-surface-medium/50 transition-colors"
                          >
                            <span className="text-[10px] font-mono text-text-muted w-4 text-right">
                              {lowTeam.rank}
                            </span>
                            <Image
                              src={logoUrl(lowSlug)}
                              alt={displayName(lowSlug)}
                              width={22}
                              height={22}
                              className="shrink-0"
                              unoptimized
                            />
                            <span className="text-sm text-text-muted font-medium truncate flex-1">
                              {displayName(lowSlug)}
                            </span>
                            <Badge
                              size="sm"
                              variant="outline"
                              style={{ borderColor: confColor(lowTeam.conference), color: confColor(lowTeam.conference) }}
                            >
                              {lowTeam.conference}
                            </Badge>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Column 3: CWS */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-gradient-to-b from-[#C9A227] to-burnt-orange rounded-full" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-text-secondary">
                    College World Series
                  </h3>
                </div>
                <div className="bg-surface-light border border-[#C9A227]/20 rounded-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-[#C9A227]/10 via-[#C9A227]/5 to-transparent px-4 py-3 border-b border-[#C9A227]/10">
                    <p className="font-display text-xs font-bold uppercase tracking-wider text-[#C9A227]">
                      Charles Schwab Field &middot; Omaha, NE
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5">June 14-23, 2026</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-text-muted leading-relaxed">
                      Eight super regional winners converge on Omaha for a double-elimination bracket,
                      culminating in a best-of-three championship series.
                    </p>
                    {/* Projected CWS Field — top 8 seeds */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
                        Projected Field
                      </p>
                      {top16.slice(0, 8).map(([slug, team]) => (
                        <Link
                          key={slug}
                          href={`/college-baseball/teams/${slug}`}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-surface-medium/50 transition-colors group"
                        >
                          <Image
                            src={logoUrl(slug)}
                            alt={displayName(slug)}
                            width={20}
                            height={20}
                            className="shrink-0"
                            unoptimized
                          />
                          <span className="text-sm text-text-secondary group-hover:text-[#C9A227] transition-colors truncate flex-1">
                            {displayName(slug)}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {team.record2025.split('(')[0].trim()}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CWS Format Explainer */}
                <div className="mt-4 bg-surface-light border border-border-subtle rounded-sm p-4">
                  <h4 className="font-display text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                    How It Works
                  </h4>
                  <div className="space-y-2 text-xs text-text-muted leading-relaxed">
                    <div className="flex gap-2">
                      <span className="text-[#C9A227] font-mono shrink-0">01</span>
                      <span>Eight teams split into two four-team, double-elimination brackets.</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[#C9A227] font-mono shrink-0">02</span>
                      <span>Each bracket produces one finalist. Lose twice and you&apos;re done.</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[#C9A227] font-mono shrink-0">03</span>
                      <span>The two bracket winners meet in a best-of-three championship series.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Flow arrows (desktop only) */}
            <div className="hidden lg:flex items-center justify-center gap-4 mt-6">
              <div className="flex items-center gap-2 text-[10px] text-text-muted uppercase tracking-wider">
                <span>64 Teams</span>
                <span className="text-[#C9A227]">&rarr;</span>
                <span>16 Regionals</span>
                <span className="text-[#C9A227]">&rarr;</span>
                <span>8 Supers</span>
                <span className="text-[#C9A227]">&rarr;</span>
                <span>CWS (8)</span>
                <span className="text-[#C9A227]">&rarr;</span>
                <span className="text-[#C9A227] font-semibold">Champion</span>
              </div>
            </div>
          </Container>
        </Section>

        {/* ── BUBBLE WATCH ───────────────────────────────────────────────────── */}
        <Section padding="lg" borderTop id="bubble">
          <Container>
            <div className="mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-text-primary mb-2">
                Bubble{' '}
                <span className="text-[#C9A227]">Watch</span>
              </h2>
              <p className="text-sm text-text-muted max-w-2xl">
                The NCAA tournament takes 64 teams. Thirty-one get auto-bids through conference
                tournaments. The remaining 33 at-large bids come down to resume, strength of schedule,
                and late-season momentum. These teams are on the edge.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {bubbleTeams.map(([slug, team]) => {
                const status = bubbleStatus(team.rank, team.tier);
                return (
                  <Link
                    key={slug}
                    href={`/college-baseball/teams/${slug}`}
                    className="group block"
                  >
                    <Card variant="default" padding="md" className="h-full hover:border-[#C9A227]/30 transition-all">
                      <div className="flex items-start gap-3">
                        <Image
                          src={logoUrl(slug)}
                          alt={displayName(slug)}
                          width={40}
                          height={40}
                          className="shrink-0 mt-0.5"
                          unoptimized
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-[#C9A227]">#{team.rank}</span>
                            <h3 className="font-display text-base font-bold uppercase tracking-wide text-text-primary group-hover:text-[#C9A227] transition-colors truncate">
                              {displayName(slug)}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              size="sm"
                              variant="outline"
                              style={{ borderColor: confColor(team.conference), color: confColor(team.conference) }}
                            >
                              {team.conference}
                            </Badge>
                            <span className="text-xs text-text-muted">
                              {team.record2025.split('(')[0].trim()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                              style={{ backgroundColor: status.bg, color: status.color }}
                            >
                              {status.label}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              {getTierLabel(team.tier)}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                            {team.outlook.split('.').slice(0, 2).join('.') + '.'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </Container>
        </Section>

        {/* ── CWS PREVIEW ────────────────────────────────────────────────────── */}
        <Section padding="lg" borderTop id="cws">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Main content */}
              <div className="lg:col-span-3">
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-text-primary mb-2">
                  The Road to{' '}
                  <span className="text-[#C9A227]">Omaha</span>
                </h2>
                <div className="space-y-4 text-text-tertiary leading-relaxed">
                  <p>
                    The College World Series has been played in Omaha, Nebraska since 1950 &mdash;
                    making it the longest-running city-sport relationship in NCAA history. Charles
                    Schwab Field (formerly TD Ameritrade Park) has hosted since 2011, seating 24,000
                    fans in a stadium purpose-built for the event.
                  </p>
                  <p>
                    Getting there is the hard part. The NCAA tournament is a 64-team gauntlet that
                    eliminates 56 teams in two weeks. Regionals are double-elimination, four-team
                    brackets hosted by the top 16 national seeds. Win your regional, and you earn a
                    super regional &mdash; a best-of-three series against another regional champion,
                    hosted by the higher seed.
                  </p>
                  <p>
                    What separates college baseball from every other NCAA tournament: there is no
                    single-elimination luck. Double-elimination means the best team almost always
                    advances. You have to beat a team twice to knock them out. That rewards depth,
                    pitching, and the ability to win under pressure &mdash; which is why programs like
                    LSU, Florida, and Texas keep showing up.
                  </p>
                  <p>
                    The CWS itself is two four-team brackets, each double-elimination. The bracket
                    winners meet in a best-of-three championship series &mdash; typically played on a
                    Monday and Tuesday (and Wednesday if needed) in late June. It is, by any measure,
                    the best championship event in college sports.
                  </p>
                </div>
              </div>

              {/* Sidebar: CWS Quick Facts */}
              <div className="lg:col-span-2">
                <Card variant="default" className="overflow-hidden">
                  <div className="bg-gradient-to-r from-[#C9A227]/10 via-transparent to-burnt-orange/5 px-5 py-4 border-b border-border-subtle">
                    <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#C9A227]">
                      CWS Quick Facts
                    </h3>
                  </div>
                  <div className="divide-y divide-border-subtle">
                    {[
                      { label: 'Location', value: 'Omaha, Nebraska' },
                      { label: 'Venue', value: 'Charles Schwab Field' },
                      { label: 'Capacity', value: '24,000' },
                      { label: 'First CWS', value: '1947 (Kalamazoo, MI)' },
                      { label: 'In Omaha Since', value: '1950' },
                      { label: 'Most Titles', value: 'USC (12)' },
                      { label: 'Active Streak', value: 'LSU (7 titles)' },
                      { label: '2025 Champion', value: 'LSU Tigers' },
                      { label: 'Format', value: 'Double-elimination + best-of-3 final' },
                    ].map((fact) => (
                      <div key={fact.label} className="flex items-center justify-between px-5 py-3">
                        <span className="text-xs text-text-muted uppercase tracking-wider">{fact.label}</span>
                        <span className="text-sm text-text-secondary font-medium text-right">{fact.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* What It Takes */}
                <Card variant="default" padding="lg" className="mt-4">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-text-secondary mb-3">
                    What It Takes to Get There
                  </h3>
                  <div className="space-y-3">
                    {[
                      { stat: '10 wins', desc: 'Minimum to win a regional, super regional, and CWS bracket' },
                      { stat: '3 aces', desc: 'You need a Friday, Saturday, and Sunday starter who can go deep' },
                      { stat: 'Top-20 RPI', desc: 'At-large teams below 20 RPI rarely get selected' },
                      { stat: 'Home field', desc: 'Regional hosts win ~75% of the time — seeding matters' },
                    ].map((item) => (
                      <div key={item.stat} className="flex gap-3">
                        <span className="text-sm font-mono text-[#C9A227] shrink-0 w-20">{item.stat}</span>
                        <span className="text-xs text-text-muted leading-relaxed">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </Container>
        </Section>

        {/* ── PROJECTED REGIONAL HOSTS (enhanced) ────────────────────────────── */}
        <Section padding="lg" borderTop id="hosts">
          <Container>
            <div className="mb-6">
              <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide text-text-primary mb-2">
                Projected Regional{' '}
                <span className="text-[#C9A227]">Hosts</span>
              </h2>
              <p className="text-sm text-text-muted max-w-2xl">
                The NCAA selects 16 national seeds as regional hosts based on overall record, RPI,
                strength of schedule, and results against ranked opponents. These projections are
                based on BSI preseason power rankings.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {top16.map(([slug, team], i) => {
                const meta = teamMetadata[slug];
                return (
                  <Link
                    key={slug}
                    href={`/college-baseball/teams/${slug}`}
                    className="group block"
                  >
                    <div className="bg-surface-light border border-border-subtle rounded-sm p-4 hover:border-[#C9A227]/30 transition-all h-full">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#C9A227]/10 text-[#C9A227] text-xs font-mono font-bold">
                          {i + 1}
                        </span>
                        <Image
                          src={logoUrl(slug)}
                          alt={displayName(slug)}
                          width={36}
                          height={36}
                          className="shrink-0"
                          unoptimized
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-text-secondary font-bold truncate group-hover:text-[#C9A227] transition-colors">
                            {meta?.name ?? displayName(slug)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          size="sm"
                          variant="outline"
                          style={{ borderColor: confColor(team.conference), color: confColor(team.conference) }}
                        >
                          {team.conference}
                        </Badge>
                        <span className="text-xs text-text-muted">
                          {team.record2025}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">
                        {team.postseason2025}
                      </p>
                      {meta?.location && (
                        <p className="text-[10px] text-text-muted mt-1">
                          {meta.location.stadium} &middot; {meta.location.city}, {meta.location.state}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </Container>
        </Section>

        {/* ── TOURNAMENT TIMELINE ────────────────────────────────────────────── */}
        <Section padding="lg" borderTop id="timeline">
          <Container size="md">
            <div className="mb-8 text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-text-primary mb-2">
                Tournament{' '}
                <span className="text-[#C9A227]">Timeline</span>
              </h2>
              <p className="text-sm text-text-muted">
                Key dates on the path from conference tournaments to Omaha.
              </p>
            </div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#C9A227]/40 via-[#C9A227]/20 to-transparent" />

              <div className="space-y-6">
                {TIMELINE.map((item, i) => {
                  const isLeft = i % 2 === 0;
                  return (
                    <div
                      key={item.event}
                      className={`relative flex items-start gap-4 md:gap-0 ${
                        isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                      }`}
                    >
                      {/* Dot */}
                      <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#C9A227] border-2 border-background-primary z-10 mt-1.5" />

                      {/* Content */}
                      <div className={`ml-10 md:ml-0 md:w-1/2 ${isLeft ? 'md:pr-10 md:text-right' : 'md:pl-10'}`}>
                        <div className="bg-surface-light border border-border-subtle rounded-sm p-4 hover:border-[#C9A227]/20 transition-colors">
                          <p className="text-xs font-mono text-[#C9A227] mb-1">{item.date}</p>
                          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-text-primary mb-1">
                            {item.event}
                          </h3>
                          <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Container>
        </Section>

        {/* ── NAV FOOTER ─────────────────────────────────────────────────────── */}
        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-wrap gap-4 text-sm text-text-muted">
              <Link href="/college-baseball" className="hover:text-text-secondary transition-colors">
                &#8592; College Baseball
              </Link>
              <Link href="/college-baseball/rankings" className="hover:text-text-secondary transition-colors">
                Rankings
              </Link>
              <Link href="/college-baseball/standings" className="hover:text-text-secondary transition-colors">
                Standings
              </Link>
              <Link href="/college-baseball/editorial" className="hover:text-text-secondary transition-colors">
                Editorial Hub
              </Link>
            </div>
          </Container>
        </Section>
      </div>
    </>
  );
}
