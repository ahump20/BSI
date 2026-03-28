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

// ─── Types ──────────────────────────────────────────────────────────────────

interface TeamBatting {
  avg: number; obp: number; slg: number; ops: number;
  woba: number; wrc_plus: number; iso: number;
  k_pct: number; bb_pct: number;
}
interface TeamPitching { era: number; fip: number; whip: number; k_9: number; bb_9: number }
interface TopHitter { player_name: string; position: string; woba: number; wrc_plus: number; hr: number; avg: number; iso: number }
interface TopPitcher { player_name: string; position: string; era: number; fip: number; k_9: number; bb_9: number; ip: number; w: number; l: number }
interface H2HGame { date: string; homeTeam: string; awayTeam: string; homeScore: number; awayScore: number; texasIsHome: boolean }

interface MatchupResponse {
  texas: { batting: TeamBatting; pitching: TeamPitching; topHitters: TopHitter[]; topPitchers: TopPitcher[] };
  opponent: { id: string; batting: TeamBatting; pitching: TeamPitching; topHitters: TopHitter[]; topPitchers: TopPitcher[] };
  headToHead: { texasWins: number; opponentWins: number; games: H2HGame[] };
  meta?: { source?: string; fetched_at?: string };
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ACCENT = '#BF5700';
const TEXAS_ID = 'texas';

function formatName(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function MatchupTheaterClient({ opponentId }: { opponentId: string }) {
  const texasMeta = teamMetadata[TEXAS_ID];
  const texasLogo = getLogoUrl(texasMeta?.espnId || '251', texasMeta?.logoId);

  const oppMeta = teamMetadata[opponentId];
  const oppName = oppMeta?.name ?? formatName(opponentId);
  const oppLogo = oppMeta
    ? getLogoUrl(oppMeta.espnId, oppMeta.logoId, oppMeta.localLogo)
    : `https://a.espncdn.com/i/teamlogos/ncaa/500/${opponentId}.png`;

  const oppEspnId = oppMeta?.espnId ?? opponentId;
  const { data, loading, error } = useSportData<MatchupResponse>(
    `/api/college-baseball/texas-intelligence/matchup/${oppEspnId}`,
    { timeout: 15000 },
  );

  const texas = data?.texas;
  const opp = data?.opponent;
  const h2h = data?.headToHead;

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm flex-wrap">
              <Link href="/college-baseball" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">College Baseball</Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <Link href="/college-baseball/texas-intelligence" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">Texas Intel</Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <span className="text-[var(--bsi-bone)]">vs {oppName}</span>
            </nav>
          </Container>
        </Section>

        {/* Hero — Split Matchup Header */}
        <Section padding="lg" className="relative overflow-hidden bg-[var(--surface-scoreboard)]">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: ACCENT }} />
          <Container>
            <ScrollReveal direction="up">
              <span className="heritage-stamp text-[10px] block mb-4">Matchup Theater</span>
              <div className="flex items-center justify-center gap-6 sm:gap-10">
                <div className="text-center">
                  <img src={texasLogo} alt="Texas" className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto" loading="eager" />
                  <div className="font-display text-lg sm:text-xl font-bold uppercase tracking-wide text-[var(--bsi-bone)] mt-2">Texas</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-3xl sm:text-4xl font-bold text-[rgba(196,184,165,0.35)]">VS</div>
                  {h2h && (
                    <div className="font-mono text-xs text-[rgba(196,184,165,0.35)] mt-1">
                      H2H: {h2h.texasWins}–{h2h.opponentWins}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <img src={oppLogo} alt={oppName} className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto" loading="eager" />
                  <div className="font-display text-lg sm:text-xl font-bold uppercase tracking-wide text-[var(--bsi-bone)] mt-2">{oppName}</div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {loading ? (
          <Section padding="lg" borderTop>
            <Container>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-[var(--surface-press-box)] rounded-sm animate-pulse" />
                ))}
              </div>
            </Container>
          </Section>
        ) : error || !data ? (
          <Section padding="lg" borderTop>
            <Container>
              <Card padding="lg" className="text-center">
                <p className="text-[rgba(196,184,165,0.35)] text-sm">Matchup data is not available for this opponent right now.</p>
              </Card>
            </Container>
          </Section>
        ) : (
          <>
            {/* Batting Comparison */}
            {texas?.batting && opp?.batting && (
              <Section padding="lg" borderTop>
                <Container>
                  <ScrollReveal direction="up">
                    <Card variant="default" padding="lg">
                      <CardHeader>
                        <CardTitle>Batting Comparison</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider bg-[var(--surface-press-box)]">
                                <th className="text-right py-2 px-2" style={{ color: ACCENT }}>Texas</th>
                                <th className="text-center py-2 px-2 w-20">Stat</th>
                                <th className="text-left py-2 px-2">{oppName.split(' ').pop()}</th>
                              </tr>
                            </thead>
                            <tbody>
                              <CompareRow stat="AVG" texas={fmt3(texas.batting.avg)} opp={fmt3(opp.batting.avg)} texasVal={texas.batting.avg} oppVal={opp.batting.avg} higher />
                              <CompareRow stat="wOBA" texas={fmt3(texas.batting.woba)} opp={fmt3(opp.batting.woba)} texasVal={texas.batting.woba} oppVal={opp.batting.woba} higher />
                              <CompareRow stat="wRC+" texas={Math.round(texas.batting.wrc_plus).toString()} opp={Math.round(opp.batting.wrc_plus).toString()} texasVal={texas.batting.wrc_plus} oppVal={opp.batting.wrc_plus} higher />
                              <CompareRow stat="ISO" texas={fmt3(texas.batting.iso)} opp={fmt3(opp.batting.iso)} texasVal={texas.batting.iso} oppVal={opp.batting.iso} higher />
                              <CompareRow stat="K%" texas={fmtPct(texas.batting.k_pct)} opp={fmtPct(opp.batting.k_pct)} texasVal={texas.batting.k_pct} oppVal={opp.batting.k_pct} higher={false} />
                              <CompareRow stat="BB%" texas={fmtPct(texas.batting.bb_pct)} opp={fmtPct(opp.batting.bb_pct)} texasVal={texas.batting.bb_pct} oppVal={opp.batting.bb_pct} higher />
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                </Container>
              </Section>
            )}

            {/* Pitching Comparison */}
            {texas?.pitching && opp?.pitching && (
              <Section padding="lg" background="charcoal" borderTop>
                <Container>
                  <ScrollReveal direction="up">
                    <Card variant="default" padding="lg">
                      <CardHeader>
                        <CardTitle>Pitching Comparison</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider bg-[var(--surface-press-box)]">
                                <th className="text-right py-2 px-2" style={{ color: ACCENT }}>Texas</th>
                                <th className="text-center py-2 px-2 w-20">Stat</th>
                                <th className="text-left py-2 px-2">{oppName.split(' ').pop()}</th>
                              </tr>
                            </thead>
                            <tbody>
                              <CompareRow stat="ERA" texas={fmt2(texas.pitching.era)} opp={fmt2(opp.pitching.era)} texasVal={texas.pitching.era} oppVal={opp.pitching.era} higher={false} />
                              <CompareRow stat="FIP" texas={fmt2(texas.pitching.fip)} opp={fmt2(opp.pitching.fip)} texasVal={texas.pitching.fip} oppVal={opp.pitching.fip} higher={false} />
                              <CompareRow stat="WHIP" texas={fmt2(texas.pitching.whip)} opp={fmt2(opp.pitching.whip)} texasVal={texas.pitching.whip} oppVal={opp.pitching.whip} higher={false} />
                              <CompareRow stat="K/9" texas={fmt1(texas.pitching.k_9)} opp={fmt1(opp.pitching.k_9)} texasVal={texas.pitching.k_9} oppVal={opp.pitching.k_9} higher />
                              <CompareRow stat="BB/9" texas={fmt1(texas.pitching.bb_9)} opp={fmt1(opp.pitching.bb_9)} texasVal={texas.pitching.bb_9} oppVal={opp.pitching.bb_9} higher={false} />
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                </Container>
              </Section>
            )}

            {/* Matchup Grid — Texas Pitchers vs Opponent Hitters */}
            {texas && opp && texas.topPitchers.length > 0 && opp.topHitters.length > 0 && (
              <Section padding="lg" borderTop>
                <Container>
                  <ScrollReveal direction="up">
                    <Card variant="default" padding="lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <span>Matchup Grid</span>
                          <Badge variant="secondary" size="sm">Pitchers vs Hitters</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-[rgba(196,184,165,0.35)] text-xs mb-4">
                          Projected advantage based on pitcher FIP and hitter wRC+. Green favors Texas pitching; red favors opponent bats.
                        </p>
                        <div className="overflow-x-auto">
                          <table className="text-xs">
                            <thead>
                              <tr>
                                <th className="py-2 px-2 text-left text-[rgba(196,184,165,0.35)] uppercase tracking-wider bg-[var(--surface-press-box)] min-w-[100px]">
                                  Pitcher
                                </th>
                                {opp.topHitters.map((h, hi) => (
                                  <th
                                    key={`${h.player_name}-${hi}`}
                                    className="py-2 px-2 text-center text-[rgba(196,184,165,0.35)] uppercase tracking-wider bg-[var(--surface-press-box)] min-w-[80px]"
                                  >
                                    <div className="truncate max-w-[80px]" title={h.player_name}>
                                      {h.player_name.split(' ').pop()}
                                    </div>
                                    <div className="text-[9px] font-normal normal-case tracking-normal text-[rgba(196,184,165,0.35)]">
                                      {Math.round(h.wrc_plus)} wRC+
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {texas.topPitchers.map((p, pi) => (
                                <tr key={`${p.player_name}-${pi}`} className="border-t border-[var(--border-vintage)]">
                                  <td className="py-2 px-2 text-[var(--bsi-bone)] font-medium whitespace-nowrap">
                                    <div>{p.player_name}</div>
                                    <div className="text-[9px] text-[rgba(196,184,165,0.35)] font-normal">
                                      {p.fip.toFixed(2)} FIP
                                    </div>
                                  </td>
                                  {opp.topHitters.map((h, hi) => {
                                    const pitcherStrong = p.fip < 3.5;
                                    const hitterWeak = h.wrc_plus < 100;
                                    const pitcherWeak = p.fip > 4.0;
                                    const hitterStrong = h.wrc_plus > 120;
                                    const advantage: 'texas' | 'opponent' | 'neutral' =
                                      pitcherStrong && hitterWeak ? 'texas'
                                      : pitcherWeak && hitterStrong ? 'opponent'
                                      : 'neutral';
                                    const cellBg =
                                      advantage === 'texas' ? 'bg-[var(--bsi-success)]/15'
                                      : advantage === 'opponent' ? 'bg-[var(--bsi-danger)]/15'
                                      : 'bg-[var(--surface-press-box)]/20';
                                    const cellBorder =
                                      advantage === 'texas' ? 'border-[var(--bsi-success)]/30'
                                      : advantage === 'opponent' ? 'border-[var(--bsi-danger)]/30'
                                      : 'border-[var(--border-vintage)]';
                                    return (
                                      <td
                                        key={`${p.player_name}-${hi}`}
                                        className={`py-2 px-2 text-center border ${cellBorder} ${cellBg}`}
                                      >
                                        <span className={`text-[10px] font-semibold uppercase ${
                                          advantage === 'texas' ? 'text-[var(--bsi-success)]'
                                          : advantage === 'opponent' ? 'text-[var(--bsi-danger)]'
                                          : 'text-[rgba(196,184,165,0.35)]'
                                        }`}>
                                          {advantage === 'texas' ? 'TX' : advantage === 'opponent' ? 'OPP' : '—'}
                                        </span>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex items-center gap-4 mt-4 text-[10px] text-[rgba(196,184,165,0.35)]">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-[var(--bsi-success)]/15 border border-[var(--bsi-success)]/30" />
                            Texas advantage
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-[var(--bsi-danger)]/15 border border-[var(--bsi-danger)]/30" />
                            Opponent advantage
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-[var(--surface-press-box)]/20 border border-[var(--border-vintage)]" />
                            Neutral
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                </Container>
              </Section>
            )}

            {/* Key Players — Side by Side */}
            <Section padding="lg" borderTop>
              <Container>
                <ScrollReveal direction="up">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Texas Top Hitters */}
                    {texas && texas.topHitters.length > 0 && (
                      <Card variant="default" padding="lg">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <img src={texasLogo} alt="" className="w-5 h-5 object-contain" loading="lazy" />
                            <span>Texas Top Hitters</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {texas.topHitters.map((h, i) => (
                              <div key={`${h.player_name}-${i}`} className="flex items-center justify-between py-1.5 border-b border-[var(--border-vintage)] last:border-0">
                                <div>
                                  <span className="text-[var(--bsi-bone)] text-sm font-medium">{h.player_name}</span>
                                  <span className="text-[rgba(196,184,165,0.35)] text-xs ml-2">{h.position}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-xs text-[var(--bsi-dust)]">{fmt3(h.woba)} wOBA</span>
                                  <span className="font-mono text-sm font-bold" style={{ color: h.wrc_plus >= 100 ? ACCENT : undefined }}>
                                    {Math.round(h.wrc_plus)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Opponent Top Hitters */}
                    {opp && opp.topHitters.length > 0 && (
                      <Card variant="default" padding="lg">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <img src={oppLogo} alt="" className="w-5 h-5 object-contain" loading="lazy" />
                            <span>{oppName} Top Hitters</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {opp.topHitters.map((h, i) => (
                              <div key={`${h.player_name}-${i}`} className="flex items-center justify-between py-1.5 border-b border-[var(--border-vintage)] last:border-0">
                                <div>
                                  <span className="text-[var(--bsi-bone)] text-sm font-medium">{h.player_name}</span>
                                  <span className="text-[rgba(196,184,165,0.35)] text-xs ml-2">{h.position}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-xs text-[var(--bsi-dust)]">{fmt3(h.woba)} wOBA</span>
                                  <span className="font-mono text-sm font-bold" style={{ color: h.wrc_plus >= 100 ? ACCENT : undefined }}>
                                    {Math.round(h.wrc_plus)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollReveal>
              </Container>
            </Section>

            {/* Head-to-Head History */}
            {h2h && h2h.games.length > 0 && (
              <Section padding="lg" background="charcoal" borderTop>
                <Container>
                  <ScrollReveal direction="up">
                    <Card variant="default" padding="lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <span>Head-to-Head History</span>
                          <Badge variant="accent" size="sm">Texas {h2h.texasWins}–{h2h.opponentWins}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {h2h.games.map((g, i) => {
                            const texasScore = g.texasIsHome ? g.homeScore : g.awayScore;
                            const oppScore = g.texasIsHome ? g.awayScore : g.homeScore;
                            const texasWon = texasScore > oppScore;
                            return (
                              <div key={`${g.date}-${i}`} className="flex items-center justify-between rounded-sm bg-[var(--surface-press-box)] p-3">
                                <div className="text-[rgba(196,184,165,0.35)] text-xs">{g.date}</div>
                                <div className="flex items-center gap-3">
                                  <span className={`font-mono text-sm font-bold ${texasWon ? 'text-[var(--bsi-bone)]' : 'text-[rgba(196,184,165,0.35)]'}`}>
                                    TX {texasScore}
                                  </span>
                                  <span className="text-[rgba(196,184,165,0.35)] text-xs">–</span>
                                  <span className={`font-mono text-sm font-bold ${!texasWon ? 'text-[var(--bsi-bone)]' : 'text-[rgba(196,184,165,0.35)]'}`}>
                                    {oppScore} {oppName.split(' ').pop()}
                                  </span>
                                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm ${
                                    texasWon ? 'bg-[var(--bsi-success)]/10 text-[var(--bsi-success)]' : 'bg-[var(--bsi-danger)]/10 text-[var(--bsi-danger)]'
                                  }`}>
                                    {texasWon ? 'W' : 'L'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                </Container>
              </Section>
            )}
          </>
        )}

        {/* Attribution */}
        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <DataSourceBadge
                source={data?.meta?.source ?? 'BSI Intelligence'}
                timestamp={
                  data?.meta?.fetched_at
                    ? new Date(data.meta.fetched_at).toLocaleString('en-US', {
                        timeZone: 'America/Chicago',
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      }) + ' CT'
                    : 'Live'
                }
              />
              <Link
                href="/college-baseball/texas-intelligence"
                className="text-sm text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] transition-colors"
              >
                &larr; Back to Hub
              </Link>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}

// ─── Comparison Row ─────────────────────────────────────────────────────────

function CompareRow({ stat, texas, opp, texasVal, oppVal, higher }: {
  stat: string; texas: string; opp: string; texasVal: number; oppVal: number; higher: boolean;
}) {
  const texasWins = higher ? texasVal > oppVal : texasVal < oppVal;
  const oppWins = higher ? oppVal > texasVal : oppVal < texasVal;
  return (
    <tr className="border-t border-[var(--border-vintage)]">
      <td className="py-2.5 px-2 text-right font-mono font-semibold" style={{ color: texasWins ? ACCENT : undefined }}>
        {texas}
      </td>
      <td className="py-2.5 px-2 text-center text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider">{stat}</td>
      <td className="py-2.5 px-2 text-left font-mono font-semibold" style={{ color: oppWins ? '#4B9CD3' : undefined }}>
        {opp}
      </td>
    </tr>
  );
}
