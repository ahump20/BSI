'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { useSportData } from '@/lib/hooks/useSportData';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PitcherStats {
  era: number;
  whip: number;
  w: number;
  l: number;
  sv: number;
  ip: number;
  ha: number;
  ra: number;
  er: number;
  pitchBB: number;
  so: number;
  hra: number;
  gpPitch: number;
}

interface RosterPlayer {
  id: string;
  name: string;
  position: string;
  source: string;
  stats: PitcherStats;
}

interface TeamResponse {
  team: {
    id: string;
    name: string;
    roster: RosterPlayer[];
    stats: { pitching: Record<string, number> };
  };
  teamStats: { pitching: Record<string, number> };
  meta?: { source?: string; fetched_at?: string };
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TEAM_ID = 'texas';
const ACCENT = 'var(--bsi-primary)';
const ESPN_ID = '251';

type SortField = 'era' | 'whip' | 'ip' | 'so' | 'sv';

export default function TexasPitchingClient() {
  const meta = teamMetadata[TEAM_ID];
  const espnId = meta?.espnId || ESPN_ID;
  const logoUrl = getLogoUrl(espnId, meta?.logoId);

  const { data, loading, error } = useSportData<TeamResponse>(
    `/api/college-baseball/teams/${TEAM_ID}`,
    { timeout: 10000 },
  );

  const [sortField, setSortField] = useState<SortField>('era');

  const pitchers = useMemo(() => {
    if (!data?.team?.roster) return [];
    return data.team.roster.filter((p) => p.position === 'P');
  }, [data]);

  const starters = useMemo(
    () => pitchers.filter((p) => p.stats.ip >= 5 && p.stats.gpPitch <= 5).sort((a, b) => a.stats.era - b.stats.era),
    [pitchers],
  );

  const relievers = useMemo(
    () => pitchers.filter((p) => !starters.includes(p)).sort((a, b) => a.stats.era - b.stats.era),
    [pitchers, starters],
  );

  const sortedPitchers = useMemo(() => {
    const all = [...pitchers];
    return all.sort((a, b) => {
      const aVal = a.stats[sortField] ?? 0;
      const bVal = b.stats[sortField] ?? 0;
      if (sortField === 'era' || sortField === 'whip') return aVal - bVal;
      return bVal - aVal;
    });
  }, [pitchers, sortField]);

  const teamPitching = data?.teamStats?.pitching ?? data?.team?.stats?.pitching;

  const fmt = (n: number, d = 2) => (typeof n === 'number' && !isNaN(n) ? n.toFixed(d) : '-');

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">College Baseball</Link>
              <span className="text-text-muted">/</span>
              <Link href="/college-baseball/texas-intelligence" className="text-text-muted hover:text-burnt-orange transition-colors">Texas Intel</Link>
              <span className="text-text-muted">/</span>
              <span className="text-text-primary">Pitching Staff</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden bg-surface-scoreboard">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: ACCENT }} />
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-4 mb-4">
                <img src={logoUrl} alt="" className="w-12 h-12 object-contain" loading="lazy" />
                <div>
                  <span className="heritage-stamp text-[10px]">Pitching Staff</span>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-text-primary mt-1">
                    Texas Pitching Staff
                  </h1>
                </div>
              </div>
            </ScrollReveal>

            {/* Team Pitching Summary */}
            {teamPitching && (
              <ScrollReveal direction="up" delay={100}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  {[
                    { label: 'Team ERA', value: fmt(teamPitching.era) },
                    { label: 'WHIP', value: fmt(teamPitching.whip) },
                    { label: 'K', value: String(Math.round(teamPitching.strikeouts || teamPitching.so || 0)) },
                    { label: 'IP', value: fmt(teamPitching.inningsPitched || teamPitching.ip || 0, 1) },
                  ].map((s) => (
                    <Card key={s.label} variant="default" padding="sm" className="text-center">
                      <div className="font-mono text-xl font-bold" style={{ color: ACCENT }}>{s.value}</div>
                      <div className="text-text-muted text-xs uppercase tracking-wide mt-1">{s.label}</div>
                    </Card>
                  ))}
                </div>
              </ScrollReveal>
            )}
          </Container>
        </Section>

        <DataErrorBoundary name="Pitching Data">
        {/* Loading */}
        {loading && (
          <Section padding="lg">
            <Container>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-surface-light rounded-sm animate-pulse" />
                ))}
              </div>
            </Container>
          </Section>
        )}

        {/* Error */}
        {error && !loading && (
          <Section padding="lg">
            <Container>
              <Card padding="lg" className="text-center">
                <p className="text-text-muted">Unable to load pitching data. Try refreshing.</p>
              </Card>
            </Container>
          </Section>
        )}

        {/* Rotation */}
        {!loading && starters.length > 0 && (
          <Section padding="lg" borderTop>
            <Container>
              <ScrollReveal direction="up">
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-4 text-text-primary">
                  Starting Rotation
                </h2>
              </ScrollReveal>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {starters.map((p) => (
                  <ScrollReveal key={p.id} direction="up">
                    <Card variant="default" padding="md">
                      <CardContent>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-display font-bold text-text-primary uppercase text-sm">{p.name}</h3>
                            <span className="text-text-muted text-xs">{p.stats.w}-{p.stats.l} · {fmt(p.stats.ip, 1)} IP</span>
                          </div>
                          <div className="font-mono text-2xl font-bold" style={{ color: ACCENT }}>
                            {fmt(p.stats.era)}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="font-mono text-sm text-text-primary">{fmt(p.stats.whip)}</div>
                            <div className="text-text-muted text-[10px] uppercase">WHIP</div>
                          </div>
                          <div>
                            <div className="font-mono text-sm text-text-primary">{p.stats.so}</div>
                            <div className="text-text-muted text-[10px] uppercase">K</div>
                          </div>
                          <div>
                            <div className="font-mono text-sm text-text-primary">{p.stats.pitchBB}</div>
                            <div className="text-text-muted text-[10px] uppercase">BB</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            </Container>
          </Section>
        )}

        {/* Bullpen */}
        {!loading && relievers.length > 0 && (
          <Section padding="lg" background="charcoal" borderTop>
            <Container>
              <ScrollReveal direction="up">
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-4 text-text-primary">
                  Bullpen
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {relievers.map((p) => (
                    <Card key={p.id} variant="default" padding="sm" className="border-t-2 border-burnt-orange">
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-text-primary text-sm font-medium">{p.name}</div>
                            <div className="text-text-muted text-xs">
                              {fmt(p.stats.ip, 1)} IP · {p.stats.sv > 0 ? `${p.stats.sv} SV` : `${p.stats.w}-${p.stats.l}`}
                            </div>
                          </div>
                          <div className="font-mono text-lg font-bold" style={{ color: p.stats.era <= 3.0 ? ACCENT : undefined }}>
                            {fmt(p.stats.era)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollReveal>
            </Container>
          </Section>
        )}

        {/* Season Workload */}
        {!loading && sortedPitchers.length > 0 && (
          <Section padding="lg" borderTop>
            <Container>
              <ScrollReveal direction="up">
                <div className="mb-4">
                  <span className="heritage-stamp text-[10px]">Workload Tracker</span>
                  <h2 className="font-display text-xl font-bold uppercase tracking-wide text-text-primary mt-1">
                    Season Workload
                  </h2>
                </div>
                {(() => {
                  const workloadPitchers = sortedPitchers.filter((p) => p.stats.ip >= 5).slice(0, 8);
                  const maxIP = Math.max(...workloadPitchers.map((x) => x.stats.ip), 1);
                  return workloadPitchers.map((p) => {
                    const pct = (p.stats.ip / maxIP) * 100;
                    return (
                      <div key={p.id} className="flex items-center gap-3 mb-2">
                        <div className="w-28 text-xs text-text-primary font-medium truncate">{p.name}</div>
                        <div className="flex-1 bg-surface-light rounded-full h-3">
                          <div
                            className="h-3 rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: ACCENT }}
                          />
                        </div>
                        <div className="w-12 text-right font-mono text-xs text-text-muted">{fmt(p.stats.ip, 1)}</div>
                      </div>
                    );
                  });
                })()}
              </ScrollReveal>
            </Container>
          </Section>
        )}

        {/* Full Staff Table */}
        {!loading && sortedPitchers.length > 0 && (
          <Section padding="lg" borderTop>
            <Container>
              <ScrollReveal direction="up">
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-4 text-text-primary">
                  Full Staff
                </h2>
              </ScrollReveal>
              <Card variant="default" padding="none" className="overflow-x-auto border-t-2 border-burnt-orange">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-light">
                      <th className="text-left py-2 px-3 text-xs text-text-muted font-semibold">Pitcher</th>
                      <SortTh label="ERA" field="era" current={sortField} onSort={setSortField} />
                      <SortTh label="WHIP" field="whip" current={sortField} onSort={setSortField} />
                      <SortTh label="IP" field="ip" current={sortField} onSort={setSortField} />
                      <SortTh label="K" field="so" current={sortField} onSort={setSortField} />
                      <SortTh label="SV" field="sv" current={sortField} onSort={setSortField} />
                      <th className="text-right py-2 px-2 text-xs text-text-muted">W-L</th>
                      <th className="text-right py-2 px-2 text-xs text-text-muted">BB</th>
                      <th className="text-right py-2 px-2 text-xs text-text-muted">H</th>
                      <th className="text-right py-2 px-2 text-xs text-text-muted">HR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPitchers.map((p) => (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-surface-light/50 transition-colors">
                        <td className="py-2 px-3 font-medium text-text-primary">{p.name}</td>
                        <td className="text-right py-2 px-2 font-mono text-text-secondary">{fmt(p.stats.era)}</td>
                        <td className="text-right py-2 px-2 font-mono text-text-secondary">{fmt(p.stats.whip)}</td>
                        <td className="text-right py-2 px-2 font-mono text-text-secondary">{fmt(p.stats.ip, 1)}</td>
                        <td className="text-right py-2 px-2 font-mono text-text-secondary">{p.stats.so}</td>
                        <td className="text-right py-2 px-2 font-mono text-text-secondary">{p.stats.sv || '-'}</td>
                        <td className="text-right py-2 px-2 font-mono text-text-muted">{p.stats.w}-{p.stats.l}</td>
                        <td className="text-right py-2 px-2 font-mono text-text-muted">{p.stats.pitchBB}</td>
                        <td className="text-right py-2 px-2 font-mono text-text-muted">{p.stats.ha}</td>
                        <td className="text-right py-2 px-2 font-mono text-text-muted">{p.stats.hra}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
              {data?.meta && <DataSourceBadge source={data.meta.source} timestamp={data.meta.fetched_at} />}
            </Container>
          </Section>
        )}
        </DataErrorBoundary>
      </main>
    </>
  );
}

function SortTh({ label, field, current, onSort }: { label: string; field: SortField; current: SortField; onSort: (f: SortField) => void }) {
  const active = current === field;
  return (
    <th
      className={`text-right py-2 px-2 cursor-pointer hover:text-text-primary transition-colors text-xs ${active ? 'text-burnt-orange' : 'text-text-muted'}`}
      onClick={() => onSort(field)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSort(field); } }}
      tabIndex={0}
      role="columnheader"
      aria-sort={active ? 'descending' : 'none'}
      aria-label={`Sort by ${label}`}
    >
      {label} {active ? '▾' : ''}
    </th>
  );
}
