'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';
import { fmt3, fmt2, fmt1, fmtPct } from '@/lib/utils/format';

// ─── Constants ──────────────────────────────────────────────────────────────

const ACCENT = '#BF5700';
const TEXAS_ESPN_ID = '251';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TeamBatting {
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  woba: number;
  k_pct: number;
  bb_pct: number;
  iso: number;
  babip: number;
}

interface TeamPitching {
  era: number;
  fip: number;
  whip: number;
  k_9: number;
  bb_9: number;
}

interface TopHitter {
  player_name: string;
  position: string;
  pa: number;
  avg: number;
  woba: number;
  wrc_plus: number;
  hr: number;
}

interface TopPitcher {
  player_name: string;
  position: string;
  ip: number;
  era: number;
  fip: number;
  k_9: number;
  bb_9: number;
}

interface ScoutingResponse {
  opponent: {
    id: string;
    name: string;
    conference: string;
    teamBatting: TeamBatting;
    teamPitching: TeamPitching;
  };
  topHitters: TopHitter[];
  topPitchers: TopPitcher[];
  conferenceStrength: {
    conference: string;
    strength_index: number;
    avg_woba: number;
    avg_era: number;
  } | null;
  brief: {
    overview: string;
    offense_analysis: string;
    pitching_analysis: string;
    key_matchups: string;
    game_plan: string;
  } | null;
  meta?: { source?: string; fetched_at?: string };
}

interface TexasSabermetrics {
  batting: { woba: number; wrc_plus: number; babip: number; iso: number; k_pct: number; bb_pct: number };
  pitching: { fip: number; k_per_9: number; bb_per_9: number };
  meta?: { source?: string; fetched_at?: string };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatOpponentName(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getOpponentLogo(opponentId: string): string {
  const meta = teamMetadata[opponentId];
  if (meta) return getLogoUrl(meta.espnId, meta.logoId, meta.localLogo);
  return `https://a.espncdn.com/i/teamlogos/ncaa/500/${opponentId}.png`;
}

function getOpponentConference(opponentId: string): string | undefined {
  return teamMetadata[opponentId]?.conference;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TexasScoutingClient({ opponentId }: { opponentId: string }) {
  const opponentMeta = teamMetadata[opponentId];
  const opponentEspnId = opponentMeta?.espnId ?? opponentId;

  const opponentName = useMemo(() => {
    return opponentMeta ? opponentMeta.name : formatOpponentName(opponentId);
  }, [opponentId, opponentMeta]);

  const opponentLogo = useMemo(() => getOpponentLogo(opponentId), [opponentId]);
  const conference = useMemo(() => getOpponentConference(opponentId), [opponentId]);

  const { data: scouting, loading: scoutLoading, error: scoutError } = useSportData<ScoutingResponse>(
    `/api/college-baseball/texas-intelligence/scouting/${opponentEspnId}`,
    { timeout: 15000 },
  );

  const { data: texasData, loading: texasLoading } = useSportData<TexasSabermetrics>(
    `/api/college-baseball/teams/${TEXAS_ESPN_ID}/sabermetrics`,
    { timeout: 12000 },
  );

  const loading = scoutLoading || texasLoading;

  const opponent = scouting?.opponent;
  const brief = scouting?.brief;
  const topHitters = scouting?.topHitters ?? [];
  const topPitchers = scouting?.topPitchers ?? [];
  const confStrength = scouting?.conferenceStrength;

  return (
    <>
      <main id="main-content">
        {/* ── Breadcrumb ──────────────────────────────────────────── */}
        <Section padding="sm" className="border-b border-[var(--border-vintage)]">
          <Container>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm flex-wrap">
              <Link href="/college-baseball" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">
                College Baseball
              </Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <Link href="/college-baseball/texas-intelligence" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">
                Texas Intel
              </Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <span className="text-[rgba(196,184,165,0.35)]">Scouting</span>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <span className="text-[var(--bsi-bone)]">{opponentName}</span>
            </nav>
          </Container>
        </Section>

        {/* ── Hero ────────────────────────────────────────────────── */}
        <Section padding="lg" className="relative overflow-hidden bg-[var(--surface-scoreboard)]">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: ACCENT }} />
          <Container>
            <ScrollReveal direction="up">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <div className="w-16 h-16 flex-shrink-0 rounded-sm bg-[var(--surface-press-box)]/50 flex items-center justify-center overflow-hidden">
                  <img
                    src={opponentLogo}
                    alt={opponentName}
                    className="w-11 h-11 object-contain"
                    loading="eager"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="heritage-stamp text-[10px]">Scouting Report</span>
                    {(conference || opponent?.conference) && (
                      <Badge variant="secondary" size="sm">
                        {opponent?.conference ?? conference}
                      </Badge>
                    )}
                  </div>
                  <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-wide text-[var(--bsi-bone)]">
                    Texas vs {opponent?.name ?? opponentName}
                  </h1>
                  <p className="text-[var(--bsi-dust)] text-sm mt-2 max-w-xl">
                    Pre-series intelligence brief &mdash; offense, pitching, key matchups, and game plan.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── Quick Brief (3-point summary) ─────────────────────── */}
        {!loading && brief && (
          <Section padding="md" className="bg-[var(--surface-dugout)] border-y border-[var(--border-vintage)]">
            <Container>
              <ScrollReveal direction="up">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card variant="default" padding="md" className="border-t-2 border-[var(--bsi-primary)]">
                    <CardContent>
                      <span className="heritage-stamp text-[10px] block mb-2">Recent Form</span>
                      <p className="text-[var(--bsi-dust)] text-xs leading-relaxed">{brief.overview.slice(0, 200)}{brief.overview.length > 200 ? '...' : ''}</p>
                    </CardContent>
                  </Card>
                  <Card variant="default" padding="md" className="border-t-2 border-[var(--heritage-columbia-blue)]">
                    <CardContent>
                      <span className="heritage-stamp text-[10px] block mb-2">Key Matchup</span>
                      <p className="text-[var(--bsi-dust)] text-xs leading-relaxed">{brief.key_matchups.slice(0, 200)}{brief.key_matchups.length > 200 ? '...' : ''}</p>
                    </CardContent>
                  </Card>
                  <Card variant="default" padding="md" className="border-t-2 border-[var(--bsi-dust)]">
                    <CardContent>
                      <span className="heritage-stamp text-[10px] block mb-2">Texas Edge</span>
                      <p className="text-[var(--bsi-dust)] text-xs leading-relaxed">{brief.game_plan.slice(0, 200)}{brief.game_plan.length > 200 ? '...' : ''}</p>
                    </CardContent>
                  </Card>
                </div>
              </ScrollReveal>
            </Container>
          </Section>
        )}

        {/* ── AI Brief ───────────────────────────────────────────── */}
        {loading ? (
          <Section padding="lg" borderTop>
            <Container>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-24 bg-[var(--surface-press-box)] rounded-sm animate-pulse" />
                ))}
              </div>
            </Container>
          </Section>
        ) : scoutError ? (
          <Section padding="lg" borderTop>
            <Container>
              <Card padding="lg" className="text-center">
                <p className="text-[rgba(196,184,165,0.35)] text-sm">
                  Unable to load scouting data for this opponent. Try refreshing the page.
                </p>
              </Card>
            </Container>
          </Section>
        ) : (
          <>
            {/* AI Brief Sections */}
            {brief && (
              <Section padding="lg" borderTop>
                <Container>
                  <ScrollReveal direction="up">
                    <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-[var(--bsi-bone)]">
                      Intelligence Brief
                    </h2>
                  </ScrollReveal>
                  <div className="space-y-4">
                    <BriefCard title="Overview" content={brief.overview} />
                    <BriefCard title="Offense Analysis" content={brief.offense_analysis} />
                    <BriefCard title="Pitching Analysis" content={brief.pitching_analysis} />
                    <BriefCard title="Key Matchups" content={brief.key_matchups} />
                    <BriefCard title="Game Plan" content={brief.game_plan} accent />
                  </div>
                </Container>
              </Section>
            )}

            {/* ── Top Hitters Table ──────────────────────────────── */}
            {topHitters.length > 0 && (
              <Section padding="lg" background="charcoal" borderTop>
                <Container>
                  <ScrollReveal direction="up">
                    <Card variant="default" padding="lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <span>Top Hitters</span>
                          <Badge variant="accent" size="sm">{topHitters.length} players</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider bg-[var(--surface-press-box)]">
                                <th className="text-left py-2 px-2">Name</th>
                                <th className="text-left py-2 px-2">Pos</th>
                                <th className="text-right py-2 px-2">PA</th>
                                <th className="text-right py-2 px-2">AVG</th>
                                <th className="text-right py-2 px-2">wOBA</th>
                                <th className="text-right py-2 px-2">wRC+</th>
                                <th className="text-right py-2 px-2">HR</th>
                              </tr>
                            </thead>
                            <tbody>
                              {topHitters.map((h, idx) => (
                                <tr key={`${h.player_name}-${idx}`} className="border-t border-[var(--border-vintage)]">
                                  <td className="py-2 px-2 text-[var(--bsi-bone)] font-medium">{h.player_name}</td>
                                  <td className="py-2 px-2 text-[rgba(196,184,165,0.35)] text-xs">{h.position}</td>
                                  <td className="py-2 px-2 text-right font-mono text-[rgba(196,184,165,0.35)]">{h.pa}</td>
                                  <td className="py-2 px-2 text-right font-mono text-[var(--bsi-dust)]">{fmt3(h.avg)}</td>
                                  <td className="py-2 px-2 text-right font-mono" style={{ color: h.woba > 0.370 ? ACCENT : undefined }}>
                                    {fmt3(h.woba)}
                                  </td>
                                  <td className="py-2 px-2 text-right font-mono font-semibold" style={{ color: h.wrc_plus >= 100 ? ACCENT : undefined }}>
                                    {Math.round(h.wrc_plus)}
                                  </td>
                                  <td className="py-2 px-2 text-right font-mono text-[var(--bsi-dust)]">{h.hr}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                </Container>
              </Section>
            )}

            {/* ── Top Pitchers Table ─────────────────────────────── */}
            {topPitchers.length > 0 && (
              <Section padding="lg" borderTop>
                <Container>
                  <ScrollReveal direction="up">
                    <Card variant="default" padding="lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <span>Top Pitchers</span>
                          <Badge variant="accent" size="sm">{topPitchers.length} arms</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider bg-[var(--surface-press-box)]">
                                <th className="text-left py-2 px-2">Name</th>
                                <th className="text-left py-2 px-2">Pos</th>
                                <th className="text-right py-2 px-2">IP</th>
                                <th className="text-right py-2 px-2">ERA</th>
                                <th className="text-right py-2 px-2">FIP</th>
                                <th className="text-right py-2 px-2">K/9</th>
                                <th className="text-right py-2 px-2">BB/9</th>
                              </tr>
                            </thead>
                            <tbody>
                              {topPitchers.map((p, idx) => (
                                <tr key={`${p.player_name}-${idx}`} className="border-t border-[var(--border-vintage)]">
                                  <td className="py-2 px-2 text-[var(--bsi-bone)] font-medium">{p.player_name}</td>
                                  <td className="py-2 px-2 text-[rgba(196,184,165,0.35)] text-xs">{p.position}</td>
                                  <td className="py-2 px-2 text-right font-mono text-[rgba(196,184,165,0.35)]">{fmt1(p.ip)}</td>
                                  <td className="py-2 px-2 text-right font-mono font-semibold" style={{ color: p.era <= 3.50 ? ACCENT : undefined }}>
                                    {fmt2(p.era)}
                                  </td>
                                  <td className="py-2 px-2 text-right font-mono" style={{ color: p.fip <= 3.50 ? ACCENT : undefined }}>
                                    {fmt2(p.fip)}
                                  </td>
                                  <td className="py-2 px-2 text-right font-mono text-[var(--bsi-dust)]">{fmt1(p.k_9)}</td>
                                  <td className="py-2 px-2 text-right font-mono text-[var(--bsi-dust)]">{fmt1(p.bb_9)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                </Container>
              </Section>
            )}

            {/* ── Team Stats Comparison ──────────────────────────── */}
            {opponent && (
              <Section padding="lg" background="charcoal" borderTop>
                <Container>
                  <ScrollReveal direction="up">
                    <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-[var(--bsi-bone)]">
                      Team Comparison
                    </h2>
                  </ScrollReveal>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Batting Comparison */}
                    <ScrollReveal direction="up">
                      <Card variant="default" padding="lg">
                        <CardHeader>
                          <CardTitle className="text-sm">Batting</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider bg-[var(--surface-press-box)]">
                                  <th className="text-left py-2 px-2">Stat</th>
                                  <th className="text-right py-2 px-2" style={{ color: ACCENT }}>Texas</th>
                                  <th className="text-right py-2 px-2">{opponent.name.split(' ').pop()}</th>
                                </tr>
                              </thead>
                              <tbody>
                                <ComparisonRow
                                  label="AVG"
                                  texas={texasData ? null : null}
                                  opponent={fmt3(opponent.teamBatting.avg)}
                                  texasRaw={null}
                                  opponentRaw={opponent.teamBatting.avg}
                                  higherIsBetter
                                />
                                <ComparisonRow
                                  label="wOBA"
                                  texas={texasData?.batting ? fmt3(texasData.batting.woba) : null}
                                  opponent={fmt3(opponent.teamBatting.woba)}
                                  texasRaw={texasData?.batting?.woba ?? null}
                                  opponentRaw={opponent.teamBatting.woba}
                                  higherIsBetter
                                />
                                <ComparisonRow
                                  label="OPS"
                                  texas={null}
                                  opponent={fmt3(opponent.teamBatting.ops)}
                                  texasRaw={null}
                                  opponentRaw={opponent.teamBatting.ops}
                                  higherIsBetter
                                />
                                <ComparisonRow
                                  label="ISO"
                                  texas={texasData?.batting ? fmt3(texasData.batting.iso) : null}
                                  opponent={fmt3(opponent.teamBatting.iso)}
                                  texasRaw={texasData?.batting?.iso ?? null}
                                  opponentRaw={opponent.teamBatting.iso}
                                  higherIsBetter
                                />
                                <ComparisonRow
                                  label="K%"
                                  texas={texasData?.batting ? fmtPct(texasData.batting.k_pct) : null}
                                  opponent={fmtPct(opponent.teamBatting.k_pct)}
                                  texasRaw={texasData?.batting?.k_pct ?? null}
                                  opponentRaw={opponent.teamBatting.k_pct}
                                  higherIsBetter={false}
                                />
                                <ComparisonRow
                                  label="BB%"
                                  texas={texasData?.batting ? fmtPct(texasData.batting.bb_pct) : null}
                                  opponent={fmtPct(opponent.teamBatting.bb_pct)}
                                  texasRaw={texasData?.batting?.bb_pct ?? null}
                                  opponentRaw={opponent.teamBatting.bb_pct}
                                  higherIsBetter
                                />
                                <ComparisonRow
                                  label="BABIP"
                                  texas={texasData?.batting ? fmt3(texasData.batting.babip) : null}
                                  opponent={fmt3(opponent.teamBatting.babip)}
                                  texasRaw={texasData?.batting?.babip ?? null}
                                  opponentRaw={opponent.teamBatting.babip}
                                  higherIsBetter
                                />
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollReveal>

                    {/* Pitching Comparison */}
                    <ScrollReveal direction="up">
                      <Card variant="default" padding="lg">
                        <CardHeader>
                          <CardTitle className="text-sm">Pitching</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider bg-[var(--surface-press-box)]">
                                  <th className="text-left py-2 px-2">Stat</th>
                                  <th className="text-right py-2 px-2" style={{ color: ACCENT }}>Texas</th>
                                  <th className="text-right py-2 px-2">{opponent.name.split(' ').pop()}</th>
                                </tr>
                              </thead>
                              <tbody>
                                <ComparisonRow
                                  label="ERA"
                                  texas={null}
                                  opponent={fmt2(opponent.teamPitching.era)}
                                  texasRaw={null}
                                  opponentRaw={opponent.teamPitching.era}
                                  higherIsBetter={false}
                                />
                                <ComparisonRow
                                  label="FIP"
                                  texas={texasData?.pitching ? fmt2(texasData.pitching.fip) : null}
                                  opponent={fmt2(opponent.teamPitching.fip)}
                                  texasRaw={texasData?.pitching?.fip ?? null}
                                  opponentRaw={opponent.teamPitching.fip}
                                  higherIsBetter={false}
                                />
                                <ComparisonRow
                                  label="WHIP"
                                  texas={null}
                                  opponent={fmt2(opponent.teamPitching.whip)}
                                  texasRaw={null}
                                  opponentRaw={opponent.teamPitching.whip}
                                  higherIsBetter={false}
                                />
                                <ComparisonRow
                                  label="K/9"
                                  texas={texasData?.pitching ? fmt1(texasData.pitching.k_per_9) : null}
                                  opponent={fmt1(opponent.teamPitching.k_9)}
                                  texasRaw={texasData?.pitching?.k_per_9 ?? null}
                                  opponentRaw={opponent.teamPitching.k_9}
                                  higherIsBetter
                                />
                                <ComparisonRow
                                  label="BB/9"
                                  texas={texasData?.pitching ? fmt1(texasData.pitching.bb_per_9) : null}
                                  opponent={fmt1(opponent.teamPitching.bb_9)}
                                  texasRaw={texasData?.pitching?.bb_per_9 ?? null}
                                  opponentRaw={opponent.teamPitching.bb_9}
                                  higherIsBetter={false}
                                />
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  </div>
                </Container>
              </Section>
            )}

            {/* ── Conference Strength ────────────────────────────── */}
            {confStrength && (
              <Section padding="lg" borderTop>
                <Container>
                  <ScrollReveal direction="up">
                    <Card variant="default" padding="lg" className="max-w-md">
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--bsi-primary)]" />
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <span>Conference Strength</span>
                          <Badge variant="secondary" size="sm">{confStrength.conference}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="font-mono text-xl font-bold" style={{ color: ACCENT }}>
                              {confStrength.strength_index.toFixed(1)}
                            </div>
                            <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">Strength Index</div>
                          </div>
                          <div>
                            <div className="font-mono text-xl font-bold text-[var(--bsi-bone)]">
                              {fmt3(confStrength.avg_woba)}
                            </div>
                            <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">Avg wOBA</div>
                          </div>
                          <div>
                            <div className="font-mono text-xl font-bold text-[var(--bsi-bone)]">
                              {fmt2(confStrength.avg_era)}
                            </div>
                            <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">Avg ERA</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                </Container>
              </Section>
            )}
          </>
        )}

        {/* ── Footer Navigation ──────────────────────────────────── */}
        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <DataSourceBadge
                source={scouting?.meta?.source ?? 'BSI Intelligence'}
                timestamp={
                  scouting?.meta?.fetched_at
                    ? new Date(scouting.meta.fetched_at).toLocaleString('en-US', {
                        timeZone: 'America/Chicago',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      }) + ' CT'
                    : 'Live'
                }
              />
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/college-baseball/texas-intelligence"
                  className="text-sm text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] transition-colors"
                >
                  &larr; Back to Hub
                </Link>
                <Link
                  href="/college-baseball/texas-intelligence/roster"
                  className="text-sm text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-bone)] transition-colors"
                >
                  Texas Roster &rarr;
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function BriefCard({
  title,
  content,
  accent,
}: {
  title: string;
  content: string;
  accent?: boolean;
}) {
  return (
    <ScrollReveal direction="up">
      <Card variant="default" padding="lg" className="relative overflow-hidden">
        {accent && <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--bsi-primary)]" />}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>{title}</span>
            {accent && <Badge variant="accent" size="sm">Recommended</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[var(--bsi-dust)] text-sm leading-relaxed" style={{ fontFamily: 'var(--font-body, "Cormorant Garamond", serif)' }}>
            {content}
          </p>
        </CardContent>
      </Card>
    </ScrollReveal>
  );
}

function ComparisonRow({
  label,
  texas,
  opponent,
  texasRaw,
  opponentRaw,
  higherIsBetter,
}: {
  label: string;
  texas: string | null;
  opponent: string;
  texasRaw: number | null;
  opponentRaw: number;
  higherIsBetter: boolean;
}) {
  let texasWins = false;
  if (texasRaw !== null) {
    texasWins = higherIsBetter ? texasRaw > opponentRaw : texasRaw < opponentRaw;
  }

  return (
    <tr className="border-t border-[var(--border-vintage)]">
      <td className="py-2 px-2 text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider">{label}</td>
      <td
        className="py-2 px-2 text-right font-mono font-semibold"
        style={{ color: texas && texasWins ? ACCENT : undefined }}
      >
        {texas ?? '—'}
      </td>
      <td
        className="py-2 px-2 text-right font-mono font-semibold"
        style={{ color: texas && !texasWins ? ACCENT : undefined }}
      >
        {opponent}
      </td>
    </tr>
  );
}
