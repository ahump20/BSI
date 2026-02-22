'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { hexToRgb, isLightColor } from '@/lib/utils/color';
import { getTeamBySlug, CONFERENCE_META } from '@/lib/college-baseball/team-registry';
import type { CollegeBaseballTeam } from '@/lib/college-baseball/team-registry';

// ─── Scouting Grade Computation ───────────────────────────────────────────────

interface ScoutingGrade {
  category: string;
  grade: number;
}

function computeScoutingGrades(team: CollegeBaseballTeam): ScoutingGrade[] {
  const cws = team.cwsAppearances ?? 0;
  const titles = team.nationalTitles ?? 0;
  const capacity = team.venue.capacity;
  const confStrength: Record<string, number> = {
    SEC: 75, ACC: 65, 'Big 12': 60, 'Pac-12': 60, 'Big Ten': 50,
  };

  const clamp = (v: number) => Math.min(80, Math.max(20, Math.round(v / 5) * 5));

  return [
    { category: 'Program Prestige', grade: clamp(30 + cws * 2 + titles * 8) },
    { category: 'Pitching Pipeline', grade: clamp(35 + cws * 1.5 + titles * 5) },
    { category: 'Hitting Culture', grade: clamp(35 + cws * 1.2 + titles * 4) },
    { category: 'Conference Strength', grade: confStrength[team.conference] ?? 50 },
    { category: 'Recruiting Base', grade: clamp(30 + cws * 1.5 + titles * 6) },
    { category: 'Facility Grade', grade: clamp(30 + Math.min(capacity / 300, 25)) },
    { category: 'Coaching Staff', grade: clamp(35 + cws * 1.2 + titles * 4) },
  ];
}

// ─── Season Snapshot (live API data) ──────────────────────────────────────────

interface SeasonStats {
  wins: number;
  losses: number;
  confWins: number;
  confLosses: number;
  rpi: number;
  battingAvg: number;
  era: number;
  streak?: string;
}

function SeasonSnapshot({ teamSlug }: { teamSlug: string }) {
  const [stats, setStats] = useState<SeasonStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/college-baseball/teams/${teamSlug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Record<string, unknown> | null) => {
        if (cancelled || !data) return;
        const nested = data.team as Record<string, unknown> | undefined;
        const s = (nested?.stats ?? data.stats) as SeasonStats | undefined;
        if (s) setStats(s);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [teamSlug]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} variant="default" padding="md" className="text-center animate-pulse">
            <div className="h-8 bg-white/5 rounded mb-2" />
            <div className="h-3 bg-white/5 rounded w-16 mx-auto" />
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card variant="default" padding="lg" className="text-center">
        <p className="text-white/50 text-sm">
          Season stats populate once conference play starts. Check back when the schedule heats up.
        </p>
      </Card>
    );
  }

  const statItems = [
    { label: 'Overall', value: `${stats.wins}-${stats.losses}` },
    { label: 'Conference', value: `${stats.confWins}-${stats.confLosses}` },
    { label: 'RPI', value: `#${stats.rpi}` },
    { label: 'Team AVG', value: stats.battingAvg.toFixed(3) },
    { label: 'Team ERA', value: stats.era.toFixed(2) },
    { label: 'Streak', value: stats.streak ?? '—' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map((item) => (
        <Card key={item.label} variant="default" padding="md" className="text-center">
          <div
            className="font-mono text-xl md:text-2xl font-bold"
            style={{ color: 'var(--team-primary)' }}
          >
            {item.value}
          </div>
          <div className="text-white/30 text-xs mt-1">{item.label}</div>
        </Card>
      ))}
    </div>
  );
}

// ─── Conference Rivals Grid ───────────────────────────────────────────────────

function RivalsGrid({ rivals }: { rivals: string[] }) {
  const rivalTeams = rivals
    .map((slug) => getTeamBySlug(slug))
    .filter((t): t is CollegeBaseballTeam => t !== undefined);

  if (rivalTeams.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {rivalTeams.map((rival) => (
        <Link key={rival.slug} href={`/college-baseball/teams/${rival.slug}`}>
          <Card variant="hover" padding="md" className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2"
              style={{
                borderColor: rival.colors.primary,
                background: `${rival.colors.primary}15`,
              }}
            >
              <span
                className="font-display font-bold text-sm"
                style={{ color: rival.colors.primary }}
              >
                {rival.abbreviation}
              </span>
            </div>
            <div>
              <div className="font-display font-bold text-white text-sm uppercase">
                {rival.name}
              </div>
              <div className="text-white/40 text-xs">{rival.mascot}</div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// ─── Main Template ────────────────────────────────────────────────────────────

export function TeamProfileTemplate({ team }: { team: CollegeBaseballTeam }) {
  const grades = computeScoutingGrades(team);
  const primaryIsLight = isLightColor(team.colors.primary);
  const confMeta = CONFERENCE_META[team.conference];

  // For light primary colors (Iowa gold, Missouri gold, etc.),
  // use secondary for text accents, primary for backgrounds
  const accentColor = primaryIsLight ? team.colors.secondary : team.colors.primary;
  const accentRgb = hexToRgb(accentColor);

  // Check for editorial preview
  const editorialSlugs = [
    'texas', 'texas-am', 'florida', 'lsu', 'arkansas', 'tennessee',
    'vanderbilt', 'kentucky', 'georgia', 'oklahoma', 'south-carolina',
    'alabama', 'ole-miss', 'auburn', 'mississippi-state', 'missouri',
  ];
  const hasEditorial = editorialSlugs.includes(team.slug);

  return (
    <div
      style={{
        '--team-primary': team.colors.primary,
        '--team-secondary': team.colors.secondary,
        '--team-primary-rgb': hexToRgb(team.colors.primary),
        '--team-secondary-rgb': hexToRgb(team.colors.secondary),
        '--team-accent': accentColor,
        '--team-accent-rgb': accentRgb,
      } as React.CSSProperties}
    >
      <main id="main-content">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <Section padding="lg" className="pt-24 relative overflow-hidden">
          {/* Team color gradient mesh */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 60% 50% at 20% 50%, rgba(${hexToRgb(team.colors.primary)}, 0.12) 0%, transparent 70%),
                radial-gradient(ellipse 40% 60% at 80% 20%, rgba(${hexToRgb(team.colors.secondary)}, 0.08) 0%, transparent 70%),
                linear-gradient(180deg, #0D0D0D 0%, #1A1A1A 100%)
              `,
            }}
          />

          <Container>
            <ScrollReveal direction="up">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm mb-8 relative z-10">
                <Link
                  href="/college-baseball"
                  className="text-white/40 hover:text-white/70 transition-colors"
                >
                  College Baseball
                </Link>
                <span className="text-white/20">/</span>
                <Link
                  href="/college-baseball/teams"
                  className="text-white/40 hover:text-white/70 transition-colors"
                >
                  Teams
                </Link>
                <span className="text-white/20">/</span>
                <span className="text-white">{team.name}</span>
              </nav>

              {/* Team Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
                {/* Monogram */}
                <div
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    border: `4px solid ${team.colors.primary}`,
                    background: `rgba(${hexToRgb(team.colors.primary)}, 0.1)`,
                  }}
                >
                  <span
                    className="font-display font-bold text-3xl md:text-4xl"
                    style={{ color: team.colors.primary }}
                  >
                    {team.abbreviation}
                  </span>
                </div>

                {/* Team Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-wide text-white">
                      {team.name}
                    </h1>
                    <Badge
                      variant="secondary"
                      style={{
                        background: `rgba(${hexToRgb(team.colors.primary)}, 0.2)`,
                        color: primaryIsLight ? '#FFFFFF' : team.colors.primary,
                        borderColor: `rgba(${hexToRgb(team.colors.primary)}, 0.3)`,
                      }}
                    >
                      {team.conference}
                    </Badge>
                  </div>

                  <p className="text-lg mb-3" style={{ color: `rgba(${accentRgb}, 0.9)` }}>
                    {team.mascot}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-white/50">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {team.location.city}, {team.location.state}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      {team.venue.name}
                    </span>
                    {team.venue.capacity > 0 && (
                      <span className="text-white/30">
                        {team.venue.capacity.toLocaleString()} capacity
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Quick Facts ──────────────────────────────────────────────── */}
        <Section padding="md" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up" delay={50}>
              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-6">
                The Program
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Conference', value: team.conference },
                  { label: 'Division', value: 'D1' },
                  { label: 'Founded', value: team.founded ? String(team.founded) : '—' },
                  { label: 'CWS Appearances', value: String(team.cwsAppearances ?? 0) },
                  { label: 'National Titles', value: String(team.nationalTitles ?? 0) },
                  {
                    label: 'Venue Capacity',
                    value: team.venue.capacity > 0
                      ? team.venue.capacity.toLocaleString()
                      : '—',
                  },
                ].map((item) => (
                  <Card key={item.label} variant="default" padding="md" className="text-center">
                    <div
                      className="font-mono text-xl md:text-2xl font-bold"
                      style={{ color: 'var(--team-accent)' }}
                    >
                      {item.value}
                    </div>
                    <div className="text-white/30 text-xs mt-1">{item.label}</div>
                  </Card>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Scouting Grades ──────────────────────────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide text-white mb-2">
                Scouting Report
              </h2>
              <p className="text-white/40 mb-8 text-sm">20&ndash;80 scouting scale</p>
            </ScrollReveal>

            <div className="space-y-4 max-w-2xl">
              {grades.map((grade, i) => (
                <ScrollReveal key={grade.category} direction="up" delay={i * 40}>
                  <div className="flex items-center gap-4">
                    <span className="text-white/60 text-sm w-40 flex-shrink-0">
                      {grade.category}
                    </span>
                    <div className="flex-1 bg-white/5 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(grade.grade / 80) * 100}%`,
                          background: `linear-gradient(to right, var(--team-primary), var(--team-secondary))`,
                        }}
                      />
                    </div>
                    <span
                      className="font-mono text-sm font-bold w-8 text-right"
                      style={{ color: 'var(--team-accent)' }}
                    >
                      {grade.grade}
                    </span>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── Season Snapshot ──────────────────────────────────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide text-white mb-6">
                Season Snapshot
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <SeasonSnapshot teamSlug={team.slug} />
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Conference Rivals ─────────────────────────────────────────── */}
        {team.rivals.length > 0 && (
          <Section padding="lg" borderTop>
            <Container>
              <ScrollReveal direction="up">
                <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide text-white mb-6">
                  Conference Rivals
                </h2>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={100}>
                <RivalsGrid rivals={team.rivals} />
              </ScrollReveal>
            </Container>
          </Section>
        )}

        {/* ── Related Links + Attribution ───────────────────────────────── */}
        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <DataSourceBadge
                source="NCAA / ESPN / SportsDataIO"
                timestamp={
                  new Date().toLocaleDateString('en-US', {
                    timeZone: 'America/Chicago',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }) + ' CT'
                }
              />
              <div className="flex gap-4">
                {hasEditorial && (
                  <Link
                    href={`/college-baseball/editorial/${team.slug}-2026`}
                    className="text-sm transition-colors"
                    style={{ color: 'var(--team-accent)' }}
                  >
                    2026 Season Preview &rarr;
                  </Link>
                )}
                <Link
                  href="/college-baseball/teams"
                  className="text-sm text-white/40 hover:text-white transition-colors"
                >
                  All Teams &rarr;
                </Link>
                {confMeta && (
                  <Link
                    href="/college-baseball/teams"
                    className="text-sm text-white/40 hover:text-white transition-colors"
                  >
                    {team.conference} Teams &rarr;
                  </Link>
                )}
              </div>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
