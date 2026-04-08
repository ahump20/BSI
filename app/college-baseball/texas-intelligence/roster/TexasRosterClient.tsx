'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { useSportData } from '@/lib/hooks/useSportData';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';
import { fmt3, fmt1, fmt2, fmtPct } from '@/lib/utils/format';

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

// ─── Constants ──────────────────────────────────────────────────────────────

const TEAM_ID = 'texas';
const ACCENT = '#BF5700';

type SortField = 'wrc_plus' | 'woba' | 'iso' | 'kpct' | 'bbpct' | 'pa';
type PitcherSortField = 'fip' | 'k9' | 'bb9' | 'ip';
type PositionFilter = 'all' | 'IF' | 'OF' | 'C' | 'DH' | 'P';

const INFIELD = ['1B', '2B', '3B', 'SS'];
const OUTFIELD = ['LF', 'CF', 'RF', 'OF'];

function matchesPosition(pos: string, filter: PositionFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'IF') return INFIELD.includes(pos);
  if (filter === 'OF') return OUTFIELD.includes(pos) || pos === 'OF';
  if (filter === 'P') return pos === 'P' || pos === 'RHP' || pos === 'LHP' || pos === 'SP' || pos === 'RP';
  return pos === filter;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TexasRosterClient() {
  const meta = teamMetadata[TEAM_ID];
  const espnId = meta?.espnId || '251';
  const logoUrl = getLogoUrl(espnId, meta?.logoId);

  const { data, loading } = useSportData<TeamSabermetrics>(
    `/api/college-baseball/teams/${espnId}/sabermetrics`,
    { timeout: 12000 },
  );

  const [activeTab, setActiveTab] = useState<'all' | 'position' | 'pitchers'>('all');
  const [hitterSort, setHitterSort] = useState<SortField>('wrc_plus');
  const [pitcherSort, setPitcherSort] = useState<PitcherSortField>('fip');
  const [posFilter, setPosFilter] = useState<PositionFilter>('all');

  const lgWoba = data?.league?.woba ?? 0.340;
  const lgFip = data?.league?.fip ?? 4.0;

  const sortedHitters = useMemo(() => {
    if (!data?.all_hitters) return [];
    const filtered = data.all_hitters.filter((h) => matchesPosition(h.position, posFilter));
    return [...filtered].sort((a, b) => {
      if (hitterSort === 'kpct') return a.kpct - b.kpct; // Lower is better
      return (b[hitterSort] as number) - (a[hitterSort] as number);
    });
  }, [data, hitterSort, posFilter]);

  const sortedPitchers = useMemo(() => {
    if (!data?.all_pitchers) return [];
    return [...data.all_pitchers].sort((a, b) => {
      if (pitcherSort === 'fip' || pitcherSort === 'bb9') return a[pitcherSort] - b[pitcherSort];
      return b[pitcherSort] - a[pitcherSort];
    });
  }, [data, pitcherSort]);

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
              <span className="text-text-primary">Roster</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden bg-surface-scoreboard">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: ACCENT }} />
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-4">
                <img src={logoUrl} alt="Texas" className="w-12 h-12 object-contain" loading="eager" />
                <div>
                  <span className="heritage-stamp text-[10px]">Roster Intelligence</span>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-text-primary mt-1">
                    Texas Longhorns Roster
                  </h1>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Tab Bar */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <div className="flex gap-1 bg-surface-press-box rounded-sm p-1 w-fit">
              {(['all', 'position', 'pitchers'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-wider transition-colors ${
                    activeTab === tab
                      ? 'bg-burnt-orange text-white'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab === 'position' ? 'Position Players' : 'Pitchers'}
                </button>
              ))}
            </div>
          </Container>
        </Section>

        <DataErrorBoundary name="Roster Data">
        {/* Hitters */}
        {(activeTab === 'all' || activeTab === 'position') && (
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <Card variant="default" padding="lg" className="border-t-2 border-burnt-orange">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="flex items-center gap-3">
                      <span>Hitters</span>
                      {sortedHitters.length > 0 && (
                        <Badge variant="accent" size="sm">{sortedHitters.length} players</Badge>
                      )}
                    </CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      {(['all', 'IF', 'OF', 'C', 'DH'] as PositionFilter[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => setPosFilter(f)}
                          className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-sm transition-colors ${
                            posFilter === f
                              ? 'bg-burnt-orange text-white'
                              : 'bg-surface-light text-text-muted hover:text-text-primary'
                          }`}
                        >
                          {f === 'all' ? 'All' : f}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-10 bg-surface-light rounded-sm animate-pulse" />
                      ))}
                    </div>
                  ) : sortedHitters.length === 0 ? (
                    <p className="text-text-muted text-sm text-center py-8">No hitter data available for this filter.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-text-muted text-xs uppercase tracking-wider bg-surface-press-box">
                            <th className="text-left py-2 px-2">Name</th>
                            <th className="text-left py-2 px-2">Pos</th>
                            <SortTh label="PA" field="pa" current={hitterSort} onSort={setHitterSort} />
                            <SortTh label="wOBA" field="woba" current={hitterSort} onSort={setHitterSort} />
                            <SortTh label="wRC+" field="wrc_plus" current={hitterSort} onSort={setHitterSort} />
                            <SortTh label="ISO" field="iso" current={hitterSort} onSort={setHitterSort} />
                            <SortTh label="K%" field="kpct" current={hitterSort} onSort={setHitterSort} />
                            <SortTh label="BB%" field="bbpct" current={hitterSort} onSort={setHitterSort} />
                          </tr>
                        </thead>
                        <tbody>
                          {sortedHitters.map((h) => (
                            <tr key={h.espn_id || h.name} className="border-t border-border-subtle">
                              <td className="py-2 px-2 text-text-primary font-medium">{h.name}</td>
                              <td className="py-2 px-2 text-text-muted text-xs">{h.position}</td>
                              <td className="py-2 px-2 text-right font-mono text-text-muted">{h.pa}</td>
                              <td className="py-2 px-2 text-right font-mono" style={{ color: h.woba > lgWoba ? ACCENT : undefined }}>{fmt3(h.woba)}</td>
                              <td className="py-2 px-2 text-right font-mono font-semibold" style={{ color: h.wrc_plus >= 100 ? ACCENT : undefined }}>{Math.round(h.wrc_plus)}</td>
                              <td className="py-2 px-2 text-right font-mono text-text-secondary">{fmt3(h.iso)}</td>
                              <td className="py-2 px-2 text-right font-mono text-text-secondary">{fmtPct(h.kpct)}</td>
                              <td className="py-2 px-2 text-right font-mono text-text-secondary">{fmtPct(h.bbpct)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>
        )}

        {/* Pitchers */}
        {(activeTab === 'all' || activeTab === 'pitchers') && (
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span>Pitchers</span>
                    {sortedPitchers.length > 0 && (
                      <Badge variant="accent" size="sm">{sortedPitchers.length} arms</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-10 bg-surface-light rounded-sm animate-pulse" />
                      ))}
                    </div>
                  ) : sortedPitchers.length === 0 ? (
                    <p className="text-text-muted text-sm text-center py-8">No pitcher data available.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-text-muted text-xs uppercase tracking-wider bg-surface-press-box">
                            <th className="text-left py-2 px-2">Name</th>
                            <th className="text-left py-2 px-2">Pos</th>
                            <PitcherSortTh label="IP" field="ip" current={pitcherSort} onSort={setPitcherSort} />
                            <PitcherSortTh label="FIP" field="fip" current={pitcherSort} onSort={setPitcherSort} />
                            <PitcherSortTh label="K/9" field="k9" current={pitcherSort} onSort={setPitcherSort} />
                            <PitcherSortTh label="BB/9" field="bb9" current={pitcherSort} onSort={setPitcherSort} />
                          </tr>
                        </thead>
                        <tbody>
                          {sortedPitchers.map((p) => (
                            <tr key={p.espn_id || p.name} className="border-t border-border-subtle">
                              <td className="py-2 px-2 text-text-primary font-medium">{p.name}</td>
                              <td className="py-2 px-2 text-text-muted text-xs">{p.position}</td>
                              <td className="py-2 px-2 text-right font-mono text-text-muted">{fmt1(p.ip)}</td>
                              <td className="py-2 px-2 text-right font-mono font-semibold" style={{ color: p.fip <= lgFip ? ACCENT : undefined }}>{fmt2(p.fip)}</td>
                              <td className="py-2 px-2 text-right font-mono text-text-secondary">{fmt1(p.k9)}</td>
                              <td className="py-2 px-2 text-right font-mono text-text-secondary">{fmt1(p.bb9)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>
        )}

        </DataErrorBoundary>
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

// ─── Sort Header Components ─────────────────────────────────────────────────

function SortTh({ label, field, current, onSort }: { label: string; field: SortField; current: SortField; onSort: (f: SortField) => void }) {
  const active = current === field;
  return (
    <th
      className={`text-right py-2 px-2 cursor-pointer hover:text-text-primary transition-colors ${active ? 'text-burnt-orange' : ''}`}
      onClick={() => onSort(field)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSort(field); } }}
      tabIndex={0}
      role="columnheader"
      aria-sort={active ? (field === 'kpct' ? 'ascending' : 'descending') : 'none'}
      aria-label={`Sort by ${label}`}
    >
      {label} {active ? (field === 'kpct' ? '▴' : '▾') : ''}
    </th>
  );
}

function PitcherSortTh({ label, field, current, onSort }: { label: string; field: PitcherSortField; current: PitcherSortField; onSort: (f: PitcherSortField) => void }) {
  const active = current === field;
  const ascending = field === 'fip' || field === 'bb9';
  return (
    <th
      className={`text-right py-2 px-2 cursor-pointer hover:text-text-primary transition-colors ${active ? 'text-burnt-orange' : ''}`}
      onClick={() => onSort(field)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSort(field); } }}
      tabIndex={0}
      role="columnheader"
      aria-sort={active ? (ascending ? 'ascending' : 'descending') : 'none'}
      aria-label={`Sort by ${label}`}
    >
      {label} {active ? (ascending ? '▴' : '▾') : ''}
    </th>
  );
}
