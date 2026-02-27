'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Footer } from '@/components/layout-ds/Footer';
import { PercentileBar } from '@/components/analytics/PercentileBar';
import { MetricGate } from '@/components/analytics/MetricGate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SavantPlayer {
  player_id: string;
  player_name: string;
  team: string;
  conference: string;
  position: string;
  season: number;
  // Traditional
  g: number;
  avg?: number;
  obp?: number;
  slg?: number;
  ops?: number;
  era?: number;
  whip?: number;
  // Free advanced
  k_pct?: number;
  bb_pct?: number;
  iso?: number;
  babip?: number;
  k_9?: number;
  bb_9?: number;
  hr_9?: number;
  // Pro advanced
  woba?: number;
  wrc_plus?: number;
  ops_plus?: number;
  fip?: number;
  x_fip?: number;
  era_minus?: number;
  k_bb?: number;
  lob_pct?: number;
  // Estimated
  e_ba?: number;
  e_slg?: number;
  e_woba?: number;
}

interface SavantPlayerResponse {
  data: SavantPlayer | null;
  meta: { source: string; fetched_at: string; timezone: string };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt3 = (v: number) => v.toFixed(3).replace(/^0/, '');
const fmt2 = (v: number) => v.toFixed(2);
const fmt1 = (v: number) => v.toFixed(1);
const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
const fmtInt = (v: number) => String(Math.round(v));

/** Convert a raw stat value to 0-100 percentile estimate (basic linear mapping). */
function estimatePercentile(
  value: number,
  leagueAvg: number,
  stdDev: number,
  higherIsBetter = true
): number {
  const z = (value - leagueAvg) / stdDev;
  const p = Math.min(Math.max((z + 2) / 4 * 100, 1), 99);
  return higherIsBetter ? p : 100 - p;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SavantPlayerClient() {
  const params = useParams();
  const playerId = params.id as string;
  const [player, setPlayer] = useState<SavantPlayer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/savant/player/${playerId}`);
        if (!res.ok) throw new Error('Not found');
        const json = (await res.json()) as SavantPlayerResponse;
        setPlayer(json.data);
      } catch {
        setPlayer(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [playerId]);

  if (loading) {
    return (
      <div className="pt-6">
        <Section padding="lg">
          <Container>
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
            </div>
          </Container>
        </Section>
      </div>
    );
  }

  if (!player) {
    return (
      <>
        <div className="pt-6">
          <Section padding="lg">
            <Container>
              <Card padding="lg" className="text-center">
                <h2 className="text-xl font-bold text-text-primary mb-2">Player not found</h2>
                <p className="text-text-muted mb-4 text-sm">
                  Advanced metrics may not be available for this player yet.
                </p>
                <Link
                  href="/college-baseball/savant"
                  className="text-burnt-orange hover:text-ember transition-colors"
                >
                  Back to Savant
                </Link>
              </Card>
            </Container>
          </Section>
        </div>
        <Footer />
      </>
    );
  }

  const isBatter = player.avg != null;
  const isPitcher = player.era != null;

  return (
    <>
      <div>
        <Section padding="lg" className="pt-6">
          <Container>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm mb-6">
              <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">
                College Baseball
              </Link>
              <span className="text-text-muted">/</span>
              <Link href="/college-baseball/savant" className="text-text-muted hover:text-burnt-orange transition-colors">
                Savant
              </Link>
              <span className="text-text-muted">/</span>
              <span className="text-text-secondary">{player.player_name}</span>
            </nav>

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                {player.position && <Badge variant="primary">{player.position}</Badge>}
                <Badge variant="secondary">{player.team}</Badge>
                {player.conference && (
                  <span className="text-xs text-text-muted">{player.conference}</span>
                )}
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider text-text-primary">
                {player.player_name}
              </h1>
              <p className="text-text-muted text-sm mt-1">
                {player.season} Season · Advanced Sabermetric Profile
              </p>
            </div>

            {/* Percentile Bars — Free Metrics */}
            <Card padding="none" className="mb-6 overflow-hidden">
              <div className="px-5 py-3 border-b border-border-subtle">
                <h2 className="font-display text-sm uppercase tracking-wider text-text-primary">
                  Percentile Rankings
                </h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                {isBatter && (
                  <>
                    {player.k_pct != null && (
                      <PercentileBar
                        value={estimatePercentile(player.k_pct, 0.22, 0.05, false)}
                        label="K%"
                        higherIsBetter={false}
                      />
                    )}
                    {player.bb_pct != null && (
                      <PercentileBar
                        value={estimatePercentile(player.bb_pct, 0.09, 0.03)}
                        label="BB%"
                      />
                    )}
                    {player.iso != null && (
                      <PercentileBar
                        value={estimatePercentile(player.iso, 0.15, 0.05)}
                        label="ISO"
                      />
                    )}
                    {player.babip != null && (
                      <PercentileBar
                        value={estimatePercentile(player.babip, 0.30, 0.04)}
                        label="BABIP"
                      />
                    )}
                  </>
                )}
                {isPitcher && (
                  <>
                    {player.k_9 != null && (
                      <PercentileBar
                        value={estimatePercentile(player.k_9, 8.5, 2.0)}
                        label="K/9"
                      />
                    )}
                    {player.bb_9 != null && (
                      <PercentileBar
                        value={estimatePercentile(player.bb_9, 3.5, 1.0, false)}
                        label="BB/9"
                        higherIsBetter={false}
                      />
                    )}
                    {player.hr_9 != null && (
                      <PercentileBar
                        value={estimatePercentile(player.hr_9, 0.8, 0.4, false)}
                        label="HR/9"
                        higherIsBetter={false}
                      />
                    )}
                  </>
                )}
              </div>
            </Card>

            {/* Traditional Stats */}
            <Card padding="none" className="mb-6 overflow-hidden">
              <div className="px-5 py-3 border-b border-border-subtle">
                <h2 className="font-display text-sm uppercase tracking-wider text-text-primary">
                  {isBatter ? 'Batting' : 'Pitching'} — Traditional
                </h2>
              </div>
              <div className="px-5 py-4 grid grid-cols-3 sm:grid-cols-5 gap-4">
                {isBatter && (
                  <>
                    <StatCell label="AVG" value={fmt3(player.avg!)} />
                    <StatCell label="OBP" value={fmt3(player.obp!)} />
                    <StatCell label="SLG" value={fmt3(player.slg!)} />
                    <StatCell label="OPS" value={fmt3(player.ops!)} />
                    <StatCell label="G" value={String(player.g)} />
                  </>
                )}
                {isPitcher && (
                  <>
                    <StatCell label="ERA" value={fmt2(player.era!)} />
                    <StatCell label="WHIP" value={fmt2(player.whip!)} />
                    <StatCell label="G" value={String(player.g)} />
                  </>
                )}
              </div>
            </Card>

            {/* Free Advanced */}
            <Card padding="none" className="mb-6 overflow-hidden">
              <div className="px-5 py-3 border-b border-border-subtle">
                <h2 className="font-display text-sm uppercase tracking-wider text-text-primary">
                  Advanced Metrics
                </h2>
              </div>
              <div className="px-5 py-4 grid grid-cols-3 sm:grid-cols-4 gap-4">
                {isBatter && (
                  <>
                    {player.k_pct != null && <StatCell label="K%" value={fmtPct(player.k_pct)} />}
                    {player.bb_pct != null && <StatCell label="BB%" value={fmtPct(player.bb_pct)} />}
                    {player.iso != null && <StatCell label="ISO" value={fmt3(player.iso)} />}
                    {player.babip != null && <StatCell label="BABIP" value={fmt3(player.babip)} />}
                  </>
                )}
                {isPitcher && (
                  <>
                    {player.k_9 != null && <StatCell label="K/9" value={fmt1(player.k_9)} />}
                    {player.bb_9 != null && <StatCell label="BB/9" value={fmt1(player.bb_9)} />}
                    {player.hr_9 != null && <StatCell label="HR/9" value={fmt1(player.hr_9)} />}
                  </>
                )}
              </div>
            </Card>

            {/* Pro Advanced — Gated */}
            <MetricGate
              isPro={false}
              metricName={isBatter ? 'wOBA, wRC+, OPS+' : 'FIP, xFIP, ERA-'}
              className="mb-6"
            >
              <Card padding="none" className="overflow-hidden">
                <div className="px-5 py-3 border-b border-border-subtle">
                  <h2 className="font-display text-sm uppercase tracking-wider text-text-primary">
                    Pro Metrics
                  </h2>
                </div>
                <div className="px-5 py-4 grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {isBatter && (
                    <>
                      {player.woba != null && <StatCell label="wOBA" value={fmt3(player.woba)} />}
                      {player.wrc_plus != null && <StatCell label="wRC+" value={fmtInt(player.wrc_plus)} />}
                      {player.ops_plus != null && <StatCell label="OPS+" value={fmtInt(player.ops_plus)} />}
                    </>
                  )}
                  {isPitcher && (
                    <>
                      {player.fip != null && <StatCell label="FIP" value={fmt2(player.fip)} />}
                      {player.x_fip != null && <StatCell label="xFIP" value={fmt2(player.x_fip)} />}
                      {player.era_minus != null && <StatCell label="ERA-" value={fmtInt(player.era_minus)} />}
                      {player.k_bb != null && <StatCell label="K/BB" value={fmt2(player.k_bb)} />}
                      {player.lob_pct != null && <StatCell label="LOB%" value={fmtPct(player.lob_pct)} />}
                    </>
                  )}
                </div>
              </Card>
            </MetricGate>

            {/* Estimated Stats — Gated */}
            {isBatter && player.e_ba != null && (
              <MetricGate
                isPro={false}
                metricName="eBA, eSLG, ewOBA"
                className="mb-6"
              >
                <Card padding="none" className="overflow-hidden">
                  <div className="px-5 py-3 border-b border-border-subtle">
                    <h2 className="font-display text-sm uppercase tracking-wider text-text-primary">
                      Estimated Stats
                    </h2>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      Regression-based estimates from box-score proxies. Transparently labeled with &quot;e&quot; prefix.
                    </p>
                  </div>
                  <div className="px-5 py-4 grid grid-cols-3 gap-4">
                    {player.e_ba != null && <StatCell label="eBA" value={fmt3(player.e_ba)} />}
                    {player.e_slg != null && <StatCell label="eSLG" value={fmt3(player.e_slg)} />}
                    {player.e_woba != null && <StatCell label="ewOBA" value={fmt3(player.e_woba)} />}
                  </div>
                </Card>
              </MetricGate>
            )}

            {/* Links */}
            <div className="flex items-center gap-6 mt-8">
              <Link
                href={`/college-baseball/players/${playerId}`}
                className="text-xs text-text-muted hover:text-burnt-orange transition-colors uppercase tracking-widest"
              >
                Full Player Profile &rarr;
              </Link>
              <Link
                href="/college-baseball/savant"
                className="text-xs text-text-muted hover:text-burnt-orange transition-colors uppercase tracking-widest"
              >
                Savant Leaderboard &rarr;
              </Link>
            </div>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}

// ---------------------------------------------------------------------------
// Stat cell
// ---------------------------------------------------------------------------

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] text-text-muted font-display uppercase tracking-widest block">
        {label}
      </span>
      <span className="text-sm text-text-primary font-mono tabular-nums">{value}</span>
    </div>
  );
}
