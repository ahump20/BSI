'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { useSportData } from '@/lib/hooks/useSportData';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';
import { fmt3 } from '@/lib/utils/format';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Hitter {
  espn_id: string;
  name: string;
  position: string;
  games: number;
  ab: number;
  pa: number;
  babip: number;
  iso: number;
  kpct: number;
  bbpct: number;
  woba: number;
  wrc_plus: number;
}

interface Pitcher {
  espn_id: string;
  name: string;
  position: string;
  games: number;
  ip: number;
  fip: number;
  k9: number;
  bb9: number;
}

interface TeamSabermetrics {
  teamId: string;
  season: number;
  batting: { woba: number; wrc_plus: number; babip: number; iso: number; k_pct: number; bb_pct: number };
  pitching: { fip: number; k_per_9: number; bb_per_9: number };
  league: { woba: number; fip: number; babip: number; k_pct: number; bb_pct: number };
  all_hitters?: Hitter[];
  all_pitchers?: Pitcher[];
  meta?: { source?: string; fetched_at?: string };
}

type Player = (Hitter | Pitcher) & { type: 'hitter' | 'pitcher' };

// ─── Constants ──────────────────────────────────────────────────────────────

const TEAM_ID = 'texas';
const ACCENT = '#BF5700';
const COMPARE_COLOR = '#4B9CD3';

// ─── Radar Chart ────────────────────────────────────────────────────────────

function RadarChart({
  labels,
  valuesA,
  valuesB,
  nameA,
  nameB,
}: {
  labels: string[];
  valuesA: number[];
  valuesB: number[];
  nameA: string;
  nameB: string;
}) {
  const cx = 120;
  const cy = 120;
  const r = 90;
  const n = labels.length;

  const toPoint = (idx: number, val: number) => {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    const dist = r * Math.min(val, 1);
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];

  const polyA = valuesA.map((v, i) => toPoint(i, v)).map((p) => `${p.x},${p.y}`).join(' ');
  const polyB = valuesB.map((v, i) => toPoint(i, v)).map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 240 240" className="w-full max-w-[280px]" aria-hidden="true">
        {/* Grid */}
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={Array.from({ length: n }, (_, i) => toPoint(i, level)).map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="var(--border-subtle, rgba(255,255,255,0.08))"
            strokeWidth="0.5"
          />
        ))}
        {/* Axes */}
        {labels.map((_, i) => {
          const p = toPoint(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border-subtle, rgba(255,255,255,0.08))" strokeWidth="0.5" />;
        })}
        {/* Player A */}
        <polygon points={polyA} fill={`${ACCENT}20`} stroke={ACCENT} strokeWidth="2" />
        {/* Player B */}
        <polygon points={polyB} fill={`${COMPARE_COLOR}20`} stroke={COMPARE_COLOR} strokeWidth="2" />
        {/* Labels */}
        {labels.map((label, i) => {
          const p = toPoint(i, 1.18);
          return (
            <text key={label} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" className="fill-text-muted text-[9px] font-mono">
              {label}
            </text>
          );
        })}
      </svg>
      <div className="flex items-center gap-6 mt-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: ACCENT }} />
          <span className="text-[rgba(196,184,165,0.35)]">{nameA}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: COMPARE_COLOR }} />
          <span className="text-[rgba(196,184,165,0.35)]">{nameB}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TexasCompareClient() {
  const meta = teamMetadata[TEAM_ID];
  const espnId = meta?.espnId || '251';
  const logoUrl = getLogoUrl(espnId, meta?.logoId);

  const { data, loading } = useSportData<TeamSabermetrics>(
    `/api/college-baseball/teams/${espnId}/sabermetrics`,
    { timeout: 12000 },
  );

  const [playerA, setPlayerA] = useState<string>('');
  const [playerB, setPlayerB] = useState<string>('');

  const allPlayers = useMemo<Player[]>(() => {
    const hitters: Player[] = (data?.all_hitters ?? []).map((h) => ({ ...h, type: 'hitter' as const }));
    const pitchers: Player[] = (data?.all_pitchers ?? []).map((p) => ({ ...p, type: 'pitcher' as const }));
    return [...hitters, ...pitchers];
  }, [data]);

  const selectedA = allPlayers.find((p) => p.espn_id === playerA || p.name === playerA);
  const selectedB = allPlayers.find((p) => p.espn_id === playerB || p.name === playerB);

  const canCompare = selectedA && selectedB && selectedA !== selectedB;

  // Normalize stat values to 0-1 range for radar chart
  const getRadarData = (player: Player) => {
    if (player.type === 'hitter') {
      const h = player as Hitter;
      return {
        labels: ['wOBA', 'wRC+', 'ISO', 'BB%', 'Contact', 'BABIP'],
        values: [
          h.woba / 0.500,
          h.wrc_plus / 200,
          h.iso / 0.350,
          h.bbpct / 0.20,
          1 - h.kpct / 0.40,
          h.babip / 0.450,
        ],
      };
    }
    const p = player as Pitcher;
    return {
      labels: ['FIP (inv)', 'K/9', 'BB/9 (inv)', 'IP', 'Games', 'Efficiency'],
      values: [
        1 - p.fip / 8,
        p.k9 / 15,
        1 - p.bb9 / 6,
        p.ip / 80,
        p.games / 25,
        p.k9 > 0 ? Math.min(p.k9 / (p.bb9 || 1) / 5, 1) : 0,
      ],
    };
  };

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">College Baseball</Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <Link href="/college-baseball/texas-intelligence" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">Texas Intel</Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <span className="text-[var(--bsi-bone)]">Compare</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden bg-[var(--surface-scoreboard)]">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: ACCENT }} />
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-4">
                <img src={logoUrl} alt="Texas" className="w-12 h-12 object-contain" loading="eager" />
                <div>
                  <span className="heritage-stamp text-[10px]">Player Comparison</span>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-[var(--bsi-bone)] mt-1">
                    Compare Players
                  </h1>
                  <p className="text-[var(--bsi-dust)] text-sm mt-2 max-w-xl">
                    Side-by-side comparison of any two Texas Longhorns. Select players to see sabermetric overlays.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Player Selectors */}
        <Section padding="md" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider mb-2">Player A</label>
                  <select
                    value={playerA}
                    onChange={(e) => setPlayerA(e.target.value)}
                    className="w-full bg-[var(--surface-dugout)] border border-border rounded-sm px-3 py-2.5 text-sm text-[var(--bsi-bone)] focus:outline-none focus:border-[var(--bsi-primary)] transition-colors"
                    aria-label="Select first player"
                  >
                    <option value="">Select a player...</option>
                    {allPlayers.map((p) => (
                      <option key={p.espn_id || p.name} value={p.espn_id || p.name}>
                        {p.name} ({p.position}) — {p.type === 'hitter' ? 'Hitter' : 'Pitcher'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider mb-2">Player B</label>
                  <select
                    value={playerB}
                    onChange={(e) => setPlayerB(e.target.value)}
                    className="w-full bg-[var(--surface-dugout)] border border-border rounded-sm px-3 py-2.5 text-sm text-[var(--bsi-bone)] focus:outline-none focus:border-[var(--bsi-primary)] transition-colors"
                    aria-label="Select second player"
                  >
                    <option value="">Select a player...</option>
                    {allPlayers.map((p) => (
                      <option key={p.espn_id || p.name} value={p.espn_id || p.name}>
                        {p.name} ({p.position}) — {p.type === 'hitter' ? 'Hitter' : 'Pitcher'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Loading */}
        {loading && (
          <Section padding="lg">
            <Container>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-[var(--surface-press-box)] rounded-sm animate-pulse" />
                ))}
              </div>
            </Container>
          </Section>
        )}

        {/* Comparison Results */}
        {canCompare && (
          <>
            {/* Radar Chart */}
            {selectedA.type === selectedB.type && (
              <Section padding="lg" borderTop>
                <Container>
                  <ScrollReveal direction="up">
                    <Card variant="default" padding="lg" className="border-t-2 border-[var(--bsi-primary)]">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <span>Profile Overlay</span>
                          <Badge variant="secondary" size="sm">
                            {selectedA.type === 'hitter' ? 'Hitters' : 'Pitchers'}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadarChart
                          labels={getRadarData(selectedA).labels}
                          valuesA={getRadarData(selectedA).values}
                          valuesB={getRadarData(selectedB).values}
                          nameA={selectedA.name}
                          nameB={selectedB.name}
                        />
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                </Container>
              </Section>
            )}

            {/* Stat-by-Stat */}
            <Section padding="lg" background="charcoal" borderTop>
              <Container>
                <ScrollReveal direction="up">
                  <Card variant="default" padding="lg">
                    <CardHeader>
                      <CardTitle>Stat Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider bg-[var(--surface-press-box)]">
                              <th className="text-right py-2 px-2" style={{ color: ACCENT }}>{selectedA.name}</th>
                              <th className="text-center py-2 px-2 w-20">Stat</th>
                              <th className="text-left py-2 px-2" style={{ color: COMPARE_COLOR }}>{selectedB.name}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-[var(--border-vintage)]">
                              <td className="py-2 px-2 text-right font-mono text-[var(--bsi-dust)]">{selectedA.position}</td>
                              <td className="py-2 px-2 text-center text-[rgba(196,184,165,0.35)] text-xs uppercase">Position</td>
                              <td className="py-2 px-2 font-mono text-[var(--bsi-dust)]">{selectedB.position}</td>
                            </tr>
                            <tr className="border-t border-[var(--border-vintage)]">
                              <td className="py-2 px-2 text-right font-mono text-[var(--bsi-dust)]">{selectedA.games}</td>
                              <td className="py-2 px-2 text-center text-[rgba(196,184,165,0.35)] text-xs uppercase">Games</td>
                              <td className="py-2 px-2 font-mono text-[var(--bsi-dust)]">{selectedB.games}</td>
                            </tr>
                            {selectedA.type === 'hitter' && selectedB.type === 'hitter' && (
                              <>
                                <CompRow stat="wOBA" a={fmt3((selectedA as Hitter).woba)} b={fmt3((selectedB as Hitter).woba)} aVal={(selectedA as Hitter).woba} bVal={(selectedB as Hitter).woba} higher />
                                <CompRow stat="wRC+" a={Math.round((selectedA as Hitter).wrc_plus).toString()} b={Math.round((selectedB as Hitter).wrc_plus).toString()} aVal={(selectedA as Hitter).wrc_plus} bVal={(selectedB as Hitter).wrc_plus} higher />
                                <CompRow stat="ISO" a={fmt3((selectedA as Hitter).iso)} b={fmt3((selectedB as Hitter).iso)} aVal={(selectedA as Hitter).iso} bVal={(selectedB as Hitter).iso} higher />
                                <CompRow stat="K%" a={`${((selectedA as Hitter).kpct * 100).toFixed(1)}%`} b={`${((selectedB as Hitter).kpct * 100).toFixed(1)}%`} aVal={(selectedA as Hitter).kpct} bVal={(selectedB as Hitter).kpct} higher={false} />
                                <CompRow stat="BB%" a={`${((selectedA as Hitter).bbpct * 100).toFixed(1)}%`} b={`${((selectedB as Hitter).bbpct * 100).toFixed(1)}%`} aVal={(selectedA as Hitter).bbpct} bVal={(selectedB as Hitter).bbpct} higher />
                                <CompRow stat="BABIP" a={fmt3((selectedA as Hitter).babip)} b={fmt3((selectedB as Hitter).babip)} aVal={(selectedA as Hitter).babip} bVal={(selectedB as Hitter).babip} higher />
                              </>
                            )}
                            {selectedA.type === 'pitcher' && selectedB.type === 'pitcher' && (
                              <>
                                <CompRow stat="FIP" a={(selectedA as Pitcher).fip.toFixed(2)} b={(selectedB as Pitcher).fip.toFixed(2)} aVal={(selectedA as Pitcher).fip} bVal={(selectedB as Pitcher).fip} higher={false} />
                                <CompRow stat="K/9" a={(selectedA as Pitcher).k9.toFixed(1)} b={(selectedB as Pitcher).k9.toFixed(1)} aVal={(selectedA as Pitcher).k9} bVal={(selectedB as Pitcher).k9} higher />
                                <CompRow stat="BB/9" a={(selectedA as Pitcher).bb9.toFixed(1)} b={(selectedB as Pitcher).bb9.toFixed(1)} aVal={(selectedA as Pitcher).bb9} bVal={(selectedB as Pitcher).bb9} higher={false} />
                                <CompRow stat="IP" a={(selectedA as Pitcher).ip.toFixed(1)} b={(selectedB as Pitcher).ip.toFixed(1)} aVal={(selectedA as Pitcher).ip} bVal={(selectedB as Pitcher).ip} higher />
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              </Container>
            </Section>
          </>
        )}

        {/* Empty State */}
        {!loading && !canCompare && allPlayers.length > 0 && (
          <Section padding="lg" borderTop>
            <Container>
              <Card padding="lg" className="text-center">
                <p className="text-[rgba(196,184,165,0.35)] text-sm">
                  {!playerA && !playerB
                    ? 'Select two players above to compare their sabermetric profiles.'
                    : 'Select a different player for the second slot to begin comparison.'}
                </p>
              </Card>
            </Container>
          </Section>
        )}

        {/* Attribution */}
        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <DataSourceBadge
                source="BSI Sabermetrics"
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

function CompRow({
  stat,
  a,
  b,
  aVal,
  bVal,
  higher,
}: {
  stat: string;
  a: string;
  b: string;
  aVal: number;
  bVal: number;
  higher: boolean;
}) {
  const aWins = higher ? aVal > bVal : aVal < bVal;
  const bWins = higher ? bVal > aVal : bVal < aVal;
  return (
    <tr className="border-t border-[var(--border-vintage)]">
      <td className="py-2 px-2 text-right font-mono font-semibold" style={{ color: aWins ? ACCENT : undefined }}>
        {a}
      </td>
      <td className="py-2 px-2 text-center text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider">{stat}</td>
      <td className="py-2 px-2 font-mono font-semibold" style={{ color: bWins ? COMPARE_COLOR : undefined }}>
        {b}
      </td>
    </tr>
  );
}
