'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { IntelSignup } from '@/components/home/IntelSignup';
import { Footer } from '@/components/layout-ds/Footer';
import { AdvancedStatsCard } from '@/components/analytics/AdvancedStatsCard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlayerData {
  player: {
    id: number;
    name: string;
    firstName?: string;
    lastName?: string;
    position?: string;
    jerseyNumber?: string;
    height?: string;
    weight?: number;
    dateOfBirth?: string;
    team?: { id: number; name: string; shortName?: string; conference?: { name: string } };
  } | null;
  statistics: {
    batting?: {
      games: number; atBats: number; runs: number; hits: number; doubles: number;
      triples: number; homeRuns: number; rbi: number; walks: number; strikeouts: number;
      stolenBases: number; battingAverage: number; onBasePercentage: number;
      sluggingPercentage: number; ops: number;
    };
    pitching?: {
      games: number; gamesStarted: number; wins: number; losses: number; saves: number;
      inningsPitched: number; hits: number; earnedRuns: number; walks: number;
      strikeouts: number; era: number; whip: number;
    };
  } | null;
}

interface HAVFData {
  player: {
    player_id: string;
    name: string;
    h_score: number;
    a_score: number;
    v_score: number;
    f_score: number;
    havf_composite: number;
    breakdown: string;
  } | null;
}

interface SavantData {
  data: {
    k_pct?: number;
    bb_pct?: number;
    iso?: number;
    babip?: number;
    woba?: number;
    wrc_plus?: number;
    fip?: number;
    era_minus?: number;
    k_9?: number;
    bb_9?: number;
    hr_9?: number;
  } | null;
}

// ---------------------------------------------------------------------------
// HAV-F Bar Component
// ---------------------------------------------------------------------------

function HAVFBar({ label, score, color }: { label: string; score: number; color: string }) {
  const pct = Math.min(score * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-muted uppercase tracking-widest w-8 shrink-0 font-mono">{label}</span>
      <div className="flex-1 h-2 bg-surface-light rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-mono text-text-secondary w-12 text-right">{(score * 100).toFixed(0)}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlayerDetailClient() {
  const params = useParams();
  const playerId = params.playerId as string;
  const [data, setData] = useState<PlayerData | null>(null);
  const [havf, setHavf] = useState<HAVFData | null>(null);
  const [savant, setSavant] = useState<SavantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    async function load() {
      try {
        // Fetch player data, HAV-F, and Savant in parallel
        const [playerRes, havfRes, savantRes] = await Promise.all([
          fetch(`/api/college-baseball/players/${playerId}`),
          fetch(`/api/analytics/havf/player/${playerId}`).catch(() => null),
          fetch(`/api/savant/player/${playerId}`).catch(() => null),
        ]);

        const playerJson = await playerRes.json();
        setData(playerJson as PlayerData);
        setLastUpdated(playerRes.headers.get('X-Last-Updated') || new Date().toISOString());

        if (havfRes?.ok) {
          const havfJson = await havfRes.json();
          setHavf(havfJson as HAVFData);
        }

        if (savantRes?.ok) {
          const savantJson = await savantRes.json();
          setSavant(savantJson as SavantData);
        }
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [playerId]);

  if (loading) {
    return (
      <main id="main-content" className="pt-24">
        <Section padding="lg">
          <Container>
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
            </div>
          </Container>
        </Section>
      </main>
    );
  }

  const player = data?.player;
  const stats = data?.statistics;
  const havfPlayer = havf?.player;

  if (!player) {
    return (
      <main id="main-content" className="pt-24">
        <Section padding="lg">
          <Container>
            <Card padding="lg" className="text-center">
              <h2 className="text-xl font-bold text-text-primary mb-2">Player not found</h2>
              <Link href="/college-baseball/players" className="text-burnt-orange hover:text-ember">
                Back to Players
              </Link>
            </Card>
          </Container>
        </Section>
      </main>
    );
  }

  return (
    <>
      <main id="main-content" className="pt-24">
        <Section padding="lg">
          <Container>
            {/* Breadcrumb */}
            <div className="flex items-center gap-3 mb-2">
              <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">
                College Baseball
              </Link>
              <span className="text-text-muted">/</span>
              <Link href="/college-baseball/players" className="text-text-muted hover:text-burnt-orange transition-colors">
                Players
              </Link>
              <span className="text-text-muted">/</span>
              <span className="text-text-primary">{player.name}</span>
            </div>

            {/* Player Header */}
            <div className="mb-8">
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-text-primary">
                {player.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {player.position && <Badge variant="primary">{player.position}</Badge>}
                {player.jerseyNumber && <Badge variant="secondary">#{player.jerseyNumber}</Badge>}
                {player.team && (
                  <Link href={`/college-baseball/teams/${player.team.id}`} className="text-text-tertiary hover:text-burnt-orange transition-colors text-sm">
                    {player.team.name}
                  </Link>
                )}
              </div>
            </div>

            {/* Bio Card */}
            <Card padding="lg" className="mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {player.height && <div><span className="text-xs text-text-muted block">Height</span><span className="text-text-primary font-medium">{player.height}</span></div>}
                {player.weight && <div><span className="text-xs text-text-muted block">Weight</span><span className="text-text-primary font-medium">{player.weight} lbs</span></div>}
                {player.dateOfBirth && <div><span className="text-xs text-text-muted block">DOB</span><span className="text-text-primary font-medium">{player.dateOfBirth}</span></div>}
                {player.team?.conference?.name && <div><span className="text-xs text-text-muted block">Conference</span><span className="text-text-primary font-medium">{player.team.conference.name}</span></div>}
              </div>
            </Card>

            {/* HAV-F Analytics Section */}
            {havfPlayer && (
              <Card padding="none" className="mb-6 overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-burnt-orange/20 to-transparent border-b border-border">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold text-text-primary uppercase tracking-wide">
                      HAV-F Evaluation
                    </h2>
                    <Link
                      href="/models/havf"
                      className="text-[10px] text-text-muted hover:text-burnt-orange transition-colors uppercase tracking-widest"
                    >
                      Methodology &rarr;
                    </Link>
                  </div>
                </div>
                <div className="p-4 md:p-6">
                  <div className="grid md:grid-cols-[1fr_auto] gap-6">
                    {/* Component bars */}
                    <div className="space-y-3">
                      <HAVFBar label="H" score={havfPlayer.h_score} color="var(--bsi-primary)" />
                      <HAVFBar label="A" score={havfPlayer.a_score} color="var(--bsi-accent)" />
                      <HAVFBar label="V" score={havfPlayer.v_score} color="#FDB913" />
                      <HAVFBar label="F" score={havfPlayer.f_score} color="var(--bsi-texas-soil)" />
                    </div>

                    {/* Composite score */}
                    <div className="flex flex-col items-center justify-center md:border-l md:border-border-subtle md:pl-6">
                      <span className="text-xs text-text-muted uppercase tracking-widest mb-1">Composite</span>
                      <span className="font-display text-4xl md:text-5xl font-bold text-burnt-orange">
                        {(havfPlayer.havf_composite * 100).toFixed(0)}
                      </span>
                      <span className="text-xs text-text-muted mt-1">percentile</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
                    <span className="text-[10px] text-text-muted">
                      Hitting &middot; At-Bat Quality &middot; Velocity &middot; Fielding
                    </span>
                    <Link
                      href="/college-baseball/analytics"
                      className="text-[10px] text-text-muted hover:text-burnt-orange transition-colors"
                    >
                      Full Leaderboard &rarr;
                    </Link>
                  </div>
                </div>
              </Card>
            )}

            {/* Savant Advanced Stats */}
            {savant?.data && (
              <AdvancedStatsCard
                title={stats?.batting ? 'Advanced Batting' : 'Advanced Pitching'}
                profileUrl={`/college-baseball/savant/player/${playerId}`}
                className="mb-6"
                stats={
                  stats?.batting
                    ? [
                        ...(savant.data.k_pct != null ? [{ label: 'K%', value: savant.data.k_pct, format: (v: number) => `${(v * 100).toFixed(1)}%`, higherIsBetter: false }] : []),
                        ...(savant.data.bb_pct != null ? [{ label: 'BB%', value: savant.data.bb_pct, format: (v: number) => `${(v * 100).toFixed(1)}%` }] : []),
                        ...(savant.data.iso != null ? [{ label: 'ISO', value: savant.data.iso, format: (v: number) => v.toFixed(3).replace(/^0/, '') }] : []),
                        ...(savant.data.babip != null ? [{ label: 'BABIP', value: savant.data.babip, format: (v: number) => v.toFixed(3).replace(/^0/, '') }] : []),
                        ...(savant.data.woba != null ? [{ label: 'wOBA', value: savant.data.woba, format: (v: number) => v.toFixed(3).replace(/^0/, ''), pro: true }] : []),
                        ...(savant.data.wrc_plus != null ? [{ label: 'wRC+', value: savant.data.wrc_plus, format: (v: number) => String(Math.round(v)), pro: true }] : []),
                      ]
                    : [
                        ...(savant.data.k_9 != null ? [{ label: 'K/9', value: savant.data.k_9, format: (v: number) => v.toFixed(1) }] : []),
                        ...(savant.data.bb_9 != null ? [{ label: 'BB/9', value: savant.data.bb_9, format: (v: number) => v.toFixed(1), higherIsBetter: false }] : []),
                        ...(savant.data.hr_9 != null ? [{ label: 'HR/9', value: savant.data.hr_9, format: (v: number) => v.toFixed(1), higherIsBetter: false }] : []),
                        ...(savant.data.fip != null ? [{ label: 'FIP', value: savant.data.fip, format: (v: number) => v.toFixed(2), higherIsBetter: false, pro: true }] : []),
                        ...(savant.data.era_minus != null ? [{ label: 'ERA-', value: savant.data.era_minus, format: (v: number) => String(Math.round(v)), higherIsBetter: false, pro: true }] : []),
                      ]
                }
              />
            )}

            {/* Batting Stats */}
            {stats?.batting && (
              <Card padding="none" className="mb-6 overflow-hidden">
                <div className="px-4 py-3 bg-charcoal border-b border-border-strong">
                  <h2 className="font-display text-lg font-bold text-text-primary">Batting Statistics</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-strong">
                        {['G', 'AB', 'R', 'H', '2B', '3B', 'HR', 'RBI', 'BB', 'SO', 'SB', 'AVG', 'OBP', 'SLG', 'OPS'].map((h) => (
                          <th key={h} className="py-3 px-3 text-xs font-semibold text-text-muted uppercase text-center">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="py-3 px-3 text-center text-text-primary">{stats.batting.games}</td>
                        <td className="py-3 px-3 text-center text-text-primary">{stats.batting.atBats}</td>
                        <td className="py-3 px-3 text-center text-text-primary">{stats.batting.runs}</td>
                        <td className="py-3 px-3 text-center text-text-primary">{stats.batting.hits}</td>
                        <td className="py-3 px-3 text-center text-text-primary">{stats.batting.doubles}</td>
                        <td className="py-3 px-3 text-center text-text-primary">{stats.batting.triples}</td>
                        <td className="py-3 px-3 text-center text-burnt-orange font-bold">{stats.batting.homeRuns}</td>
                        <td className="py-3 px-3 text-center text-text-primary">{stats.batting.rbi}</td>
                        <td className="py-3 px-3 text-center text-text-primary">{stats.batting.walks}</td>
                        <td className="py-3 px-3 text-center text-text-primary">{stats.batting.strikeouts}</td>
                        <td className="py-3 px-3 text-center text-text-primary">{stats.batting.stolenBases}</td>
                        <td className="py-3 px-3 text-center text-text-primary font-mono">{stats.batting.battingAverage.toFixed(3)}</td>
                        <td className="py-3 px-3 text-center text-text-primary font-mono">{stats.batting.onBasePercentage.toFixed(3)}</td>
                        <td className="py-3 px-3 text-center text-text-primary font-mono">{stats.batting.sluggingPercentage.toFixed(3)}</td>
                        <td className="py-3 px-3 text-center text-burnt-orange font-bold font-mono">{stats.batting.ops.toFixed(3)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Pitching Stats */}
            {stats?.pitching && (
              <Card padding="none" className="mb-6 overflow-hidden">
                <div className="px-4 py-3 bg-charcoal border-b border-border-strong">
                  <h2 className="font-display text-lg font-bold text-text-primary">Pitching Statistics</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-strong">
                        {['G', 'GS', 'W', 'L', 'SV', 'IP', 'H', 'ER', 'BB', 'SO', 'ERA', 'WHIP'].map((h) => (
                          <th key={h} className="py-3 px-3 text-xs font-semibold text-text-muted uppercase text-center">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="py-3 px-3 text-center text-text-primary">{stats.pitching.games}</td>
                        <td className="py-3 px-3 text-center text-text-primary">{stats.pitching.gamesStarted}</td>
                        <td className="py-3 px-3 text-center text-[#2E7D32] font-bold">{stats.pitching.wins}</td>
                        <td className="py-3 px-3 text-center text-[#C62828] font-bold">{stats.pitching.losses}</td>
                        <td className="py-3 px-3 text-center text-text-primary">{stats.pitching.saves}</td>
                        <td className="py-3 px-3 text-center text-text-primary">{stats.pitching.inningsPitched.toFixed(1)}</td>
                        <td className="py-3 px-3 text-center text-text-primary">{stats.pitching.hits}</td>
                        <td className="py-3 px-3 text-center text-text-primary">{stats.pitching.earnedRuns}</td>
                        <td className="py-3 px-3 text-center text-text-primary">{stats.pitching.walks}</td>
                        <td className="py-3 px-3 text-center text-text-primary">{stats.pitching.strikeouts}</td>
                        <td className="py-3 px-3 text-center text-burnt-orange font-bold font-mono">{stats.pitching.era.toFixed(2)}</td>
                        <td className="py-3 px-3 text-center text-text-primary font-mono">{stats.pitching.whip.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* HAV-F methodology link */}
            <div className="mt-8 mb-2">
              <Link href="/models/havf" className="text-xs text-text-muted hover:text-burnt-orange transition-colors uppercase tracking-widest">
                How BSI evaluates players &rarr;
              </Link>
            </div>

            {lastUpdated && <DataAttribution lastUpdated={lastUpdated} className="mt-6" />}

            {/* Email capture */}
            <div className="mt-8">
              <IntelSignup />
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
