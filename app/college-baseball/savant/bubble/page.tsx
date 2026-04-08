'use client';

/**
 * Bubble Watch — NCAA Tournament Projection
 * Derives tournament field from rankings data, cross-referenced with
 * sabermetric leaderboards for per-team wOBA and FIP aggregates.
 * Ported from BSI Labs — adapted for Next.js static export.
 */
import { useMemo } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { fmt3, fmt2 } from '@/lib/analytics/viz';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RankingTeam {
  rank: number;
  team: string;
  conference?: string;
  record?: string;
  previousRank?: number;
}

interface LeaderboardEntry {
  player_name: string;
  team: string;
  woba?: number;
  fip?: number;
  era?: number;
  k_9?: number;
  [key: string]: unknown;
}

interface LeaderboardResponse {
  data: LeaderboardEntry[];
  meta: { source: string; fetched_at: string; timezone: string };
}

interface RankingsResponse {
  data: RankingTeam[];
  meta: { source: string; fetched_at: string; timezone: string };
}

// ---------------------------------------------------------------------------
// Bubble Zone Configuration
// ---------------------------------------------------------------------------

const ZONES = [
  { key: 'locks', label: 'Tournament Locks', range: [1, 12] as const, color: 'var(--bsi-success)', description: 'Virtually guaranteed selection' },
  { key: 'bubble', label: 'Bubble Watch', range: [13, 20] as const, color: 'var(--bsi-warning)', description: 'On the edge — wins matter most' },
  { key: 'hosts', label: 'Projected Hosts', range: [1, 16] as const, color: 'var(--heritage-columbia-blue)', description: 'Top 16 nationals seeds' },
] as const;

// ---------------------------------------------------------------------------
// Team Row
// ---------------------------------------------------------------------------

function TeamRow({ team, woba, fip, color }: {
  team: RankingTeam;
  woba: number | null;
  fip: number | null;
  color: string;
}) {
  const movement = team.previousRank != null ? team.previousRank - team.rank : 0;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[rgba(196,184,165,0.04)] border-l-2 group"
      style={{ borderColor: color }}
    >
      {/* Rank badge */}
      <span
        className="w-7 h-7 flex items-center justify-center rounded-sm text-xs font-mono font-bold shrink-0"
        style={{ background: 'rgba(196,184,165,0.06)', color: 'var(--bsi-bone)' }}
      >
        {team.rank}
      </span>

      {/* Team info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/college-baseball/teams/${encodeURIComponent(team.team.toLowerCase().replace(/\s+/g, '-'))}/`}
          className="text-sm font-medium hover:underline truncate block"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-bone)' }}
        >
          {team.team}
        </Link>
        <div className="flex items-center gap-2 mt-0.5">
          {team.conference && (
            <span className="text-[10px] font-mono text-bsi-dust">
              {team.conference}
            </span>
          )}
          {team.record && (
            <span className="text-[10px] font-mono text-bsi-dust">
              {team.record}
            </span>
          )}
        </div>
      </div>

      {/* Movement */}
      {movement !== 0 && (
        <span
          className="text-[10px] font-mono font-bold"
          style={{ color: movement > 0 ? 'var(--bsi-success)' : 'var(--heritage-oiler-red)' }}
        >
          {movement > 0 ? `▲${movement}` : `▼${Math.abs(movement)}`}
        </span>
      )}

      {/* Stat pills */}
      {woba != null && (
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
          style={{
            background: woba >= 0.370 ? 'rgba(16,185,129,0.12)' : 'rgba(196,184,165,0.06)',
            color: woba >= 0.370 ? 'var(--bsi-success)' : 'var(--bsi-dust)',
          }}
        >
          wOBA {fmt3(woba)}
        </span>
      )}
      {fip != null && (
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
          style={{
            background: fip <= 3.50 ? 'rgba(59,130,246,0.12)' : 'rgba(196,184,165,0.06)',
            color: fip <= 3.50 ? 'var(--heritage-columbia-blue)' : 'var(--bsi-dust)',
          }}
        >
          FIP {fmt2(fip)}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BubbleWatchPage() {
  const { data: rankingsRes, loading: rankingsLoading } =
    useSportData<RankingsResponse>('/api/college-baseball/rankings');
  const { data: battingRes } =
    useSportData<LeaderboardResponse>('/api/savant/batting/leaderboard?limit=200');
  const { data: pitchingRes } =
    useSportData<LeaderboardResponse>('/api/savant/pitching/leaderboard?limit=200');

  // Build team aggregate stats from individual leaderboards
  const teamStats = useMemo(() => {
    const map = new Map<string, { wobaSum: number; wobaCount: number; fipSum: number; fipCount: number }>();

    if (battingRes?.data) {
      for (const p of battingRes.data) {
        if (!p.team || p.woba == null) continue;
        const key = p.team.toLowerCase();
        const entry = map.get(key) ?? { wobaSum: 0, wobaCount: 0, fipSum: 0, fipCount: 0 };
        entry.wobaSum += p.woba;
        entry.wobaCount++;
        map.set(key, entry);
      }
    }

    if (pitchingRes?.data) {
      for (const p of pitchingRes.data) {
        if (!p.team || p.fip == null) continue;
        const key = p.team.toLowerCase();
        const entry = map.get(key) ?? { wobaSum: 0, wobaCount: 0, fipSum: 0, fipCount: 0 };
        entry.fipSum += p.fip;
        entry.fipCount++;
        map.set(key, entry);
      }
    }

    return map;
  }, [battingRes, pitchingRes]);

  function getTeamWoba(teamName: string): number | null {
    const entry = teamStats.get(teamName.toLowerCase());
    if (!entry || entry.wobaCount === 0) return null;
    return entry.wobaSum / entry.wobaCount;
  }

  function getTeamFip(teamName: string): number | null {
    const entry = teamStats.get(teamName.toLowerCase());
    if (!entry || entry.fipCount === 0) return null;
    return entry.fipSum / entry.fipCount;
  }

  const rankings = rankingsRes?.data ?? [];

  const zones = useMemo(() => ({
    locks: rankings.filter(t => t.rank >= 1 && t.rank <= 12),
    bubble: rankings.filter(t => t.rank >= 13 && t.rank <= 20),
    hosts: rankings.filter(t => t.rank >= 1 && t.rank <= 16),
  }), [rankings]);

  return (
    <>
      <div>
        <Section padding="lg" className="pt-6">
          <Container size="wide">
            {/* Breadcrumb */}
            <ScrollReveal direction="up">
              <nav className="flex items-center gap-2 text-xs mb-6" style={{ fontFamily: 'var(--bsi-font-data)', color: 'var(--bsi-dust)' }}>
                <Link href="/" className="transition-colors hover:text-[var(--bsi-bone)]">Home</Link>
                <span>/</span>
                <Link href="/college-baseball" className="transition-colors hover:text-[var(--bsi-bone)]">College Baseball</Link>
                <span>/</span>
                <Link href="/college-baseball/savant" className="transition-colors hover:text-[var(--bsi-bone)]">Savant</Link>
                <span>/</span>
                <span className="text-bsi-primary">Bubble Watch</span>
              </nav>
            </ScrollReveal>

            {/* Hero */}
            <ScrollReveal direction="up" delay={50}>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="accent">POSTSEASON</Badge>
                </div>
                <h1
                  className="text-3xl md:text-4xl font-bold uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-hero)', color: 'var(--bsi-bone)' }}
                >
                  Bubble Watch
                </h1>
                <p className="text-sm mt-2 max-w-2xl text-bsi-dust">
                  NCAA Tournament field projection derived from national rankings, cross-referenced with
                  team-level batting (wOBA) and pitching (FIP) aggregates from BSI Savant.
                </p>
              </div>
            </ScrollReveal>

            {/* Loading state */}
            {rankingsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map(i => (
                  <Card key={i} padding="lg" className="animate-pulse">
                    <div className="h-4 w-32 rounded bg-surface-press-box" />
                    <div className="mt-4 space-y-3">
                      {[1, 2, 3, 4].map(j => (
                        <div key={j} className="h-12 rounded bg-surface-press-box" />
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Zone cards */}
            {!rankingsLoading && rankings.length > 0 && (
              <ScrollReveal direction="up" delay={100}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Locks */}
                  <Card padding="none">
                    <div className="px-5 py-4 border-b border-border-vintage">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: 'var(--bsi-success)' }} />
                        <h2 className="text-sm uppercase tracking-wider font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-bone)' }}>
                          Tournament Locks
                        </h2>
                        <span className="ml-auto text-[10px] font-mono text-bsi-dust">
                          Ranks 1–12
                        </span>
                      </div>
                      <p className="text-[10px] mt-1 text-bsi-dust">
                        Virtually guaranteed selection
                      </p>
                    </div>
                    <div className="divide-y" style={{ borderColor: 'rgba(196,184,165,0.06)' }}>
                      {zones.locks.map(team => (
                        <TeamRow
                          key={team.rank}
                          team={team}
                          woba={getTeamWoba(team.team)}
                          fip={getTeamFip(team.team)}
                          color="var(--bsi-success)"
                        />
                      ))}
                    </div>
                  </Card>

                  {/* Bubble */}
                  <Card padding="none">
                    <div className="px-5 py-4 border-b border-border-vintage">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: 'var(--bsi-warning)' }} />
                        <h2 className="text-sm uppercase tracking-wider font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--bsi-bone)' }}>
                          Bubble Watch
                        </h2>
                        <span className="ml-auto text-[10px] font-mono text-bsi-dust">
                          Ranks 13–20
                        </span>
                      </div>
                      <p className="text-[10px] mt-1 text-bsi-dust">
                        On the edge — every series matters
                      </p>
                    </div>
                    <div className="divide-y" style={{ borderColor: 'rgba(196,184,165,0.06)' }}>
                      {zones.bubble.map(team => (
                        <TeamRow
                          key={team.rank}
                          team={team}
                          woba={getTeamWoba(team.team)}
                          fip={getTeamFip(team.team)}
                          color="var(--bsi-warning)"
                        />
                      ))}
                    </div>
                  </Card>
                </div>
              </ScrollReveal>
            )}

            {/* No data state */}
            {!rankingsLoading && rankings.length === 0 && (
              <Card padding="lg" className="text-center">
                <p className="text-sm text-bsi-dust">
                  Rankings data not available yet. Check back during the season.
                </p>
              </Card>
            )}

            {/* Attribution */}
            <div className="mt-8 text-center text-xs text-bsi-dust">
              <p>
                Data: BSI College Baseball Savant + National Rankings ·{' '}
                <Link
                  href="/college-baseball/savant"
                  className="hover:underline transition-colors text-bsi-primary"
                >
                  Back to Leaderboards
                </Link>
                {' · '}
                <Link
                  href="/college-baseball/savant/visuals/"
                  className="hover:underline transition-colors text-heritage-columbia"
                >
                  Visualization Tools
                </Link>
              </p>
            </div>
          </Container>
        </Section>
      </div>

    </>
  );
}
