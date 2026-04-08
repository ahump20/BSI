'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { useSportData } from '@/lib/hooks/useSportData';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';
import { fmt2, fmt3, fmtPct } from '@/lib/utils/format';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BattingStats {
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  woba: number;
  wrc_plus: number;
  iso: number;
  babip: number;
  k_pct: number;
  bb_pct: number;
  pa: number;
  hr: number;
  sb: number;
}

interface PitchingStats {
  era: number;
  fip: number;
  whip: number;
  k_9: number;
  bb_9: number;
  ip: number;
  w: number;
  l: number;
  sv: number;
  era_minus: number;
  k_bb: number;
}

interface HavfScores {
  composite: number;
  h: number;
  a: number;
  v: number;
  f: number;
}

interface RadarScores {
  power: number;
  contact: number;
  discipline: number;
  speed: number;
  defense: number;
}

interface GameLogEntry {
  date: string;
  opponent: string | null;
  isHome: boolean;
  result: string | null;
  batting?: {
    ab: number;
    r: number;
    h: number;
    rbi: number;
    hr: number;
    bb: number;
    k: number;
    avg: number;
  };
  pitching?: {
    ip: number;
    h: number;
    er: number;
    so: number;
    bb: number;
    era: number;
  };
}

interface PlayerProfileResponse {
  player: {
    id: string;
    name: string;
    position: string;
    team: string;
    headshot?: string;
  };
  batting: BattingStats | null;
  pitching: PitchingStats | null;
  havf: HavfScores | null;
  gameLog: GameLogEntry[];
  rolling: { avg5: number; avg10: number; era5: number | null };
  radar: RadarScores;
  meta?: { source?: string; fetched_at?: string };
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TEAM_ID = 'texas';
const ACCENT = '#BF5700';

// ─── Formatting Helpers ─────────────────────────────────────────────────────


// ─── Radar Chart ────────────────────────────────────────────────────────────

const RADAR_LABELS = ['Power', 'Contact', 'Discipline', 'Speed', 'Defense'] as const;
const RADAR_KEYS: (keyof RadarScores)[] = ['power', 'contact', 'discipline', 'speed', 'defense'];
const RADAR_SIZE = 200;
const RADAR_CENTER = RADAR_SIZE / 2;
const RADAR_RADIUS = 70;

function polarToCartesian(angle: number, radius: number): { x: number; y: number } {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: RADAR_CENTER + radius * Math.cos(rad),
    y: RADAR_CENTER + radius * Math.sin(rad),
  };
}

function radarPoints(values: number[], maxVal: number): string {
  return values
    .map((v, i) => {
      const angle = (360 / values.length) * i;
      const r = (v / maxVal) * RADAR_RADIUS;
      const { x, y } = polarToCartesian(angle, r);
      return `${x},${y}`;
    })
    .join(' ');
}

function gridPolygon(fraction: number): string {
  return Array.from({ length: 5 })
    .map((_, i) => {
      const angle = (360 / 5) * i;
      const { x, y } = polarToCartesian(angle, RADAR_RADIUS * fraction);
      return `${x},${y}`;
    })
    .join(' ');
}

function RadarChart({ radar }: { radar: RadarScores }) {
  const values = RADAR_KEYS.map((k) => radar[k]);
  const maxVal = 100;

  return (
    <svg
      viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
      className="w-full max-w-[280px] mx-auto"
      role="img"
      aria-label={`Radar chart: Power ${radar.power}, Contact ${radar.contact}, Discipline ${radar.discipline}, Speed ${radar.speed}, Defense ${radar.defense}`}
    >
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={gridPolygon(f)}
          fill="none"
          stroke="rgba(196,184,165,0.2)"
          strokeWidth="0.5"
        />
      ))}

      {/* Axis lines */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (360 / 5) * i;
        const { x, y } = polarToCartesian(angle, RADAR_RADIUS);
        return (
          <line
            key={i}
            x1={RADAR_CENTER}
            y1={RADAR_CENTER}
            x2={x}
            y2={y}
            stroke="rgba(196,184,165,0.15)"
            strokeWidth="0.5"
          />
        );
      })}

      {/* Player polygon */}
      <polygon
        points={radarPoints(values, maxVal)}
        fill={`${ACCENT}4D`}
        stroke={ACCENT}
        strokeWidth="1.5"
      />

      {/* Value dots */}
      {values.map((v, i) => {
        const angle = (360 / 5) * i;
        const r = (v / maxVal) * RADAR_RADIUS;
        const { x, y } = polarToCartesian(angle, r);
        return <circle key={i} cx={x} cy={y} r="3" fill={ACCENT} />;
      })}

      {/* Labels */}
      {RADAR_LABELS.map((label, i) => {
        const angle = (360 / 5) * i;
        const { x, y } = polarToCartesian(angle, RADAR_RADIUS + 18);
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-[var(--bsi-dust)] text-[9px] uppercase tracking-wider"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── HAV-F Bar ──────────────────────────────────────────────────────────────

const HAVF_LABELS: { key: keyof HavfScores; label: string; description: string }[] = [
  { key: 'h', label: 'H', description: 'Hit Tool' },
  { key: 'a', label: 'A', description: 'Approach' },
  { key: 'v', label: 'V', description: 'Value' },
  { key: 'f', label: 'F', description: 'Floor' },
];

function HavfBar({ label, description, value }: { label: string; description: string; value: number }) {
  const pct = Math.min(value, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-text-primary uppercase tracking-wider" style={{ fontFamily: 'Oswald, sans-serif' }}>
          {label} <span className="text-text-muted font-normal normal-case" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{description}</span>
        </span>
        <span className="font-mono text-text-secondary">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-surface-light overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: ACCENT }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function TexasPlayerProfileClient({ playerId }: { playerId: string }) {
  const meta = teamMetadata[TEAM_ID];
  const espnId = meta?.espnId || '251';
  const logoUrl = getLogoUrl(espnId, meta?.logoId);

  const { data, loading, error, retry } = useSportData<PlayerProfileResponse>(
    `/api/college-baseball/texas-intelligence/players/${playerId}`,
    { timeout: 12000 },
  );

  const isPitcher = useMemo(() => {
    if (!data?.player) return false;
    const pos = data.player.position.toUpperCase();
    return pos === 'P' || pos === 'RHP' || pos === 'LHP' || pos === 'SP' || pos === 'RP';
  }, [data]);

  const playerName = data?.player?.name ?? `Player #${playerId}`;

  // ─── Loading State ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <main id="main-content">
          <Section padding="lg" className="bg-surface-scoreboard">
            <Container>
              <div className="space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-surface-light rounded-sm" />
                <div className="h-12 w-72 bg-surface-light rounded-sm" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 bg-surface-light rounded-sm" />
                  ))}
                </div>
              </div>
            </Container>
          </Section>
        </main>
      </>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <>
        <main id="main-content">
          <Section padding="lg" className="bg-surface-scoreboard">
            <Container>
              <div className="text-center py-16">
                <h1 className="font-display text-2xl text-text-primary mb-4">Player Not Found</h1>
                <p className="text-text-muted mb-6">{error ?? 'Unable to load player profile.'}</p>
                <button onClick={retry} className="btn-heritage-fill">
                  Try Again
                </button>
              </div>
            </Container>
          </Section>
        </main>
      </>
    );
  }

  const { player, batting, pitching, havf, gameLog, rolling, radar } = data;

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm flex-wrap">
              <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">College Baseball</Link>
              <span className="text-text-muted">/</span>
              <Link href="/college-baseball/texas-intelligence" className="text-text-muted hover:text-burnt-orange transition-colors">Texas Intel</Link>
              <span className="text-text-muted">/</span>
              <Link href="/college-baseball/texas-intelligence/roster" className="text-text-muted hover:text-burnt-orange transition-colors">Players</Link>
              <span className="text-text-muted">/</span>
              <span className="text-text-primary">{player.name}</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden bg-surface-scoreboard">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: ACCENT }} />
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-4">
                {player.headshot ? (
                  <img
                    src={player.headshot}
                    alt={player.name}
                    className="w-16 h-16 rounded-full object-cover border-2"
                    style={{ borderColor: ACCENT }}
                    loading="eager"
                  />
                ) : (
                  <img src={logoUrl} alt="Texas" className="w-12 h-12 object-contain" loading="eager" />
                )}
                <div>
                  <span className="heritage-stamp text-[10px]">Player Intelligence</span>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-text-primary mt-1">
                    {player.name}
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="accent" size="sm">{player.position}</Badge>
                    <span className="text-text-muted text-sm">{player.team}</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Quick Stats Strip */}
        <Section padding="md" borderTop>
          <Container>
            <ScrollReveal direction="up" delay={0.1}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {isPitcher && pitching ? (
                  <>
                    <QuickStat label="ERA" value={fmt2(pitching.era)} />
                    <QuickStat label="FIP" value={fmt2(pitching.fip)} />
                    <QuickStat label="HAV-F" value={havf ? String(havf.composite) : '--'} />
                    <QuickStat label="5-Game ERA" value={rolling.era5 != null ? fmt2(rolling.era5) : '--'} />
                  </>
                ) : batting ? (
                  <>
                    <QuickStat label="wOBA" value={fmt3(batting.woba)} />
                    <QuickStat label="wRC+" value={String(Math.round(batting.wrc_plus))} />
                    <QuickStat label="HAV-F" value={havf ? String(havf.composite) : '--'} />
                    <QuickStat label="5-Game AVG" value={fmt3(rolling.avg5)} />
                  </>
                ) : (
                  <>
                    <QuickStat label="HAV-F" value={havf ? String(havf.composite) : '--'} />
                    <QuickStat label="5-Game AVG" value={fmt3(rolling.avg5)} />
                    <QuickStat label="10-Game AVG" value={fmt3(rolling.avg10)} />
                    <QuickStat label="Games" value={String(gameLog.length)} />
                  </>
                )}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Radar Chart */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up" delay={0.15}>
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle>Scouting Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadarChart radar={radar} />
                  <div className="grid grid-cols-5 gap-2 mt-4 text-center">
                    {RADAR_KEYS.map((key, i) => (
                      <div key={key}>
                        <div className="font-mono text-sm text-text-primary">{radar[key]}</div>
                        <div className="text-[10px] text-text-muted uppercase tracking-wider" style={{ fontFamily: 'Oswald, sans-serif' }}>{RADAR_LABELS[i]}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Advanced Stats Table */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up" delay={0.2}>
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle>{isPitcher ? 'Pitching Stats' : 'Batting Stats'}</CardTitle>
                </CardHeader>
                <CardContent>
                  {isPitcher && pitching ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-text-muted text-xs uppercase tracking-wider bg-surface-press-box">
                            <th className="text-left py-2 px-2">W</th>
                            <th className="text-left py-2 px-2">L</th>
                            <th className="text-left py-2 px-2">SV</th>
                            <th className="text-right py-2 px-2">IP</th>
                            <th className="text-right py-2 px-2">ERA</th>
                            <th className="text-right py-2 px-2">FIP</th>
                            <th className="text-right py-2 px-2">WHIP</th>
                            <th className="text-right py-2 px-2">K/9</th>
                            <th className="text-right py-2 px-2">BB/9</th>
                            <th className="text-right py-2 px-2">K/BB</th>
                            <th className="text-right py-2 px-2">ERA-</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-border-subtle">
                            <td className="py-2 px-2 font-mono">{pitching.w}</td>
                            <td className="py-2 px-2 font-mono">{pitching.l}</td>
                            <td className="py-2 px-2 font-mono">{pitching.sv}</td>
                            <td className="py-2 px-2 text-right font-mono">{pitching.ip.toFixed(1)}</td>
                            <td className="py-2 px-2 text-right font-mono font-semibold" style={{ color: pitching.era <= 3.5 ? ACCENT : undefined }}>{fmt2(pitching.era)}</td>
                            <td className="py-2 px-2 text-right font-mono font-semibold" style={{ color: pitching.fip <= 3.5 ? ACCENT : undefined }}>{fmt2(pitching.fip)}</td>
                            <td className="py-2 px-2 text-right font-mono">{fmt2(pitching.whip)}</td>
                            <td className="py-2 px-2 text-right font-mono">{pitching.k_9.toFixed(1)}</td>
                            <td className="py-2 px-2 text-right font-mono">{pitching.bb_9.toFixed(1)}</td>
                            <td className="py-2 px-2 text-right font-mono">{fmt2(pitching.k_bb)}</td>
                            <td className="py-2 px-2 text-right font-mono" style={{ color: pitching.era_minus <= 100 ? ACCENT : undefined }}>{Math.round(pitching.era_minus)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : batting ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-text-muted text-xs uppercase tracking-wider bg-surface-press-box">
                            <th className="text-right py-2 px-2">PA</th>
                            <th className="text-right py-2 px-2">AVG</th>
                            <th className="text-right py-2 px-2">OBP</th>
                            <th className="text-right py-2 px-2">SLG</th>
                            <th className="text-right py-2 px-2">OPS</th>
                            <th className="text-right py-2 px-2">wOBA</th>
                            <th className="text-right py-2 px-2">wRC+</th>
                            <th className="text-right py-2 px-2">ISO</th>
                            <th className="text-right py-2 px-2">BABIP</th>
                            <th className="text-right py-2 px-2">K%</th>
                            <th className="text-right py-2 px-2">BB%</th>
                            <th className="text-right py-2 px-2">HR</th>
                            <th className="text-right py-2 px-2">SB</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-border-subtle">
                            <td className="py-2 px-2 text-right font-mono text-text-muted">{batting.pa}</td>
                            <td className="py-2 px-2 text-right font-mono font-semibold">{fmt3(batting.avg)}</td>
                            <td className="py-2 px-2 text-right font-mono">{fmt3(batting.obp)}</td>
                            <td className="py-2 px-2 text-right font-mono">{fmt3(batting.slg)}</td>
                            <td className="py-2 px-2 text-right font-mono font-semibold">{fmt3(batting.ops)}</td>
                            <td className="py-2 px-2 text-right font-mono font-semibold" style={{ color: batting.woba > 0.340 ? ACCENT : undefined }}>{fmt3(batting.woba)}</td>
                            <td className="py-2 px-2 text-right font-mono font-semibold" style={{ color: batting.wrc_plus >= 100 ? ACCENT : undefined }}>{Math.round(batting.wrc_plus)}</td>
                            <td className="py-2 px-2 text-right font-mono">{fmt3(batting.iso)}</td>
                            <td className="py-2 px-2 text-right font-mono">{fmt3(batting.babip)}</td>
                            <td className="py-2 px-2 text-right font-mono">{fmtPct(batting.k_pct)}</td>
                            <td className="py-2 px-2 text-right font-mono">{fmtPct(batting.bb_pct)}</td>
                            <td className="py-2 px-2 text-right font-mono">{batting.hr}</td>
                            <td className="py-2 px-2 text-right font-mono">{batting.sb}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-text-muted text-sm text-center py-8">No advanced stats available for this player.</p>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Game Log */}
        {gameLog.length > 0 && (
          <Section padding="lg" background="charcoal" borderTop>
            <Container>
              <ScrollReveal direction="up" delay={0.25}>
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span>Game Log</span>
                      <Badge variant="accent" size="sm">{gameLog.length} games</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-text-muted text-xs uppercase tracking-wider bg-surface-press-box">
                            <th className="text-left py-2 px-2">Date</th>
                            <th className="text-left py-2 px-2">Opp</th>
                            <th className="text-left py-2 px-2">Result</th>
                            {isPitcher ? (
                              <>
                                <th className="text-right py-2 px-2">IP</th>
                                <th className="text-right py-2 px-2">H</th>
                                <th className="text-right py-2 px-2">ER</th>
                                <th className="text-right py-2 px-2">SO</th>
                                <th className="text-right py-2 px-2">BB</th>
                                <th className="text-right py-2 px-2">ERA</th>
                              </>
                            ) : (
                              <>
                                <th className="text-right py-2 px-2">AB</th>
                                <th className="text-right py-2 px-2">R</th>
                                <th className="text-right py-2 px-2">H</th>
                                <th className="text-right py-2 px-2">RBI</th>
                                <th className="text-right py-2 px-2">HR</th>
                                <th className="text-right py-2 px-2">BB</th>
                                <th className="text-right py-2 px-2">K</th>
                                <th className="text-right py-2 px-2">AVG</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {gameLog.map((g, idx) => (
                            <tr key={`${g.date}-${idx}`} className="border-t border-border-subtle">
                              <td className="py-2 px-2 text-text-muted text-xs whitespace-nowrap">{g.date}</td>
                              <td className="py-2 px-2 text-text-primary font-medium whitespace-nowrap">
                                {g.isHome ? 'vs ' : '@ '}{g.opponent ?? 'TBD'}
                              </td>
                              <td className="py-2 px-2 text-text-secondary text-xs">{g.result ?? '--'}</td>
                              {isPitcher && g.pitching ? (
                                <>
                                  <td className="py-2 px-2 text-right font-mono">{g.pitching.ip.toFixed(1)}</td>
                                  <td className="py-2 px-2 text-right font-mono">{g.pitching.h}</td>
                                  <td className="py-2 px-2 text-right font-mono">{g.pitching.er}</td>
                                  <td className="py-2 px-2 text-right font-mono">{g.pitching.so}</td>
                                  <td className="py-2 px-2 text-right font-mono">{g.pitching.bb}</td>
                                  <td className="py-2 px-2 text-right font-mono font-semibold">{g.pitching.era.toFixed(2)}</td>
                                </>
                              ) : g.batting ? (
                                <>
                                  <td className="py-2 px-2 text-right font-mono">{g.batting.ab}</td>
                                  <td className="py-2 px-2 text-right font-mono">{g.batting.r}</td>
                                  <td className="py-2 px-2 text-right font-mono">{g.batting.h}</td>
                                  <td className="py-2 px-2 text-right font-mono">{g.batting.rbi}</td>
                                  <td className="py-2 px-2 text-right font-mono">{g.batting.hr}</td>
                                  <td className="py-2 px-2 text-right font-mono">{g.batting.bb}</td>
                                  <td className="py-2 px-2 text-right font-mono">{g.batting.k}</td>
                                  <td className="py-2 px-2 text-right font-mono font-semibold">{fmt3(g.batting.avg)}</td>
                                </>
                              ) : (
                                <td colSpan={isPitcher ? 6 : 8} className="py-2 px-2 text-text-muted text-center">--</td>
                              )}
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

        {/* HAV-F Breakdown */}
        {havf && (
          <Section padding="lg" borderTop>
            <Container>
              <ScrollReveal direction="up" delay={0.3}>
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span>HAV-F Evaluation</span>
                      <Badge variant="accent" size="sm">Composite: {havf.composite}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-w-lg">
                      {HAVF_LABELS.map(({ key, label, description }) => (
                        <HavfBar key={key} label={label} description={description} value={havf[key]} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </Container>
          </Section>
        )}

        {/* Attribution + Back */}
        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <DataSourceBadge
                source={data.meta?.source ?? 'BSI Intelligence'}
                timestamp={
                  data.meta?.fetched_at
                    ? new Date(data.meta.fetched_at).toLocaleString('en-US', {
                        timeZone: 'America/Chicago',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      }) + ' CT'
                    : 'Live'
                }
              />
              <Link
                href="/college-baseball/texas-intelligence"
                className="text-sm text-burnt-orange hover:text-ember transition-colors"
              >
                &larr; Back to Hub
              </Link>
            </div>
          </Container>
        </Section>
      </main>
    </>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="heritage-card p-4 text-center">
      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
        {label}
      </div>
      <div className="text-2xl font-bold font-mono text-text-primary">{value}</div>
    </div>
  );
}
