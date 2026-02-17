'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';
import { getSeasonPhase } from '@/lib/season';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RankingsTeam {
  rank?: number;
  name?: string;
  team?: string;
  conference?: string;
  record?: string;
  wins?: number;
  losses?: number;
}

interface RankingsResponse {
  rankings: RankingsTeam[];
  meta?: { source: string; fetched_at: string };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type BubbleZone = 'Lock' | 'Bubble' | 'Work to Do';

function classifyBubbleZone(rank: number | undefined): BubbleZone {
  if (!rank) return 'Work to Do';
  if (rank <= 40) return 'Lock';
  if (rank <= 64) return 'Bubble';
  return 'Work to Do';
}

const zoneStyles: Record<BubbleZone, string> = {
  Lock: 'text-green-400/70 border-green-500/20 bg-green-500/5',
  Bubble: 'text-yellow-400/70 border-yellow-500/20 bg-yellow-500/5',
  'Work to Do': 'text-red-400/70 border-red-500/20 bg-red-500/5',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BubbleWatchPage() {
  const season = getSeasonPhase('ncaa');
  const isTournamentWindow = season.phase === 'postseason' || season.phase === 'regular';

  const { data, loading, error, lastUpdated, retry } =
    useSportData<RankingsResponse>('/api/college-baseball/rankings', {
      refreshInterval: isTournamentWindow ? 120_000 : 0,
    });

  // Bubble zone: teams ranked 30-80 (the realistic bubble)
  const bubbleTeams = data?.rankings
    ?.filter((t) => (t.rank || 0) >= 30 && (t.rank || 0) <= 80)
    || [];

  const hasBubbleData = bubbleTeams.length > 0;

  return (
    <>
      <main id="main-content">
        <Section padding="sm" className="border-b border-white/10">
          <Container>
            <Breadcrumb
              items={[
                { label: 'College Baseball', href: '/college-baseball' },
                { label: 'Tournament HQ', href: '/college-baseball/tournament' },
                { label: 'Bubble Watch' },
              ]}
            />
          </Container>
        </Section>

        <Section padding="lg">
          <Container size="narrow">
            <Badge variant="warning" className="mb-4">
              {isTournamentWindow ? 'Live Rankings' : 'Coming May 2026'}
            </Badge>
            <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-white mb-4">
              Bubble Watch
            </h1>
            <p className="text-white/50 text-lg leading-relaxed mb-8">
              Tracking the NCAA tournament field of 64 — who&#39;s locked in, who&#39;s out, and
              who needs a strong conference tournament to punch their ticket.
            </p>

            {loading && !hasBubbleData && (
              <div className="space-y-3 mb-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-14 bg-white/[0.03] rounded-lg animate-pulse" />
                ))}
              </div>
            )}

            {error && !hasBubbleData && (
              <div className="mb-8 text-xs text-white/30 flex items-center gap-3">
                <span>Could not load rankings data</span>
                <button onClick={retry} className="text-[#BF5700] hover:text-[#FF6B35] transition-colors">
                  Retry
                </button>
              </div>
            )}

            {hasBubbleData ? (
              <div className="space-y-2">
                {bubbleTeams.map((team) => {
                  const zone = classifyBubbleZone(team.rank);
                  const style = zoneStyles[zone];
                  return (
                    <div
                      key={team.name || team.team}
                      className={`flex items-center justify-between gap-4 border rounded-lg p-3 ${style}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono w-8 shrink-0 text-white/30">
                          #{team.rank}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm text-white/70 font-medium truncate">
                            {team.name || team.team}
                          </p>
                          <p className="text-[10px] text-white/25">{team.conference}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {team.record && (
                          <span className="text-xs font-mono text-white/30">{team.record}</span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-current">
                          {zone}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {lastUpdated && (
                  <p className="text-[10px] text-white/15 pt-3">
                    Rankings updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                )}
              </div>
            ) : !loading && (
              <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-xl p-8 text-center">
                <p className="text-sm text-white/30 mb-2">
                  Bubble data populates when conference tournaments begin in late May.
                </p>
                <p className="text-xs text-white/20">
                  RPI, strength of schedule, and selection committee criteria will drive the bubble
                  rankings once the dataset is available.
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-white/30">
              <Link href="/college-baseball/tournament" className="hover:text-white/60 transition-colors">
                &#8592; Tournament HQ
              </Link>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
