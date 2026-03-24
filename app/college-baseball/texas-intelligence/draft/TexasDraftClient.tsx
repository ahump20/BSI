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
import { fmt3, fmt2 } from '@/lib/utils/format';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DraftPlayer {
  playerId: string;
  name: string;
  position: string;
  havf: { composite: number; h: number; a: number; v: number; f: number };
  batting: { avg: number; obp: number; slg: number; woba: number; wrc_plus: number; hr: number; sb: number; pa: number } | null;
  pitching: { era: number; fip: number; ip: number; k_9: number; w: number; l: number; sv: number } | null;
  draftTier: string;
}

interface DraftBoardResponse {
  players: DraftPlayer[];
  total: number;
  meta?: { source?: string; fetched_at?: string };
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TEAM_ID = 'texas';
const ACCENT = '#BF5700';

type SortField = 'havf' | 'woba' | 'wrc_plus' | 'era' | 'fip';
type TierFilter = 'all' | 'Top 3 Rounds' | 'Rounds 4-10' | 'Day 3' | 'Development';

const TIER_COLORS: Record<string, string> = {
  'Top 3 Rounds': 'bg-burnt-orange text-white',
  'Rounds 4-10': 'bg-[var(--heritage-columbia-blue)] text-white',
  'Day 3': 'bg-[var(--bsi-dust)]/20 text-[var(--bsi-dust)]',
  'Development': 'bg-surface-light text-text-muted',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function TexasDraftClient() {
  const meta = teamMetadata[TEAM_ID];
  const espnId = meta?.espnId || '251';
  const logoUrl = getLogoUrl(espnId, meta?.logoId);

  const { data, loading, error } = useSportData<DraftBoardResponse>(
    '/api/college-baseball/texas-intelligence/draft',
    { timeout: 12000 },
  );

  const [sort, setSort] = useState<SortField>('havf');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');

  const sorted = useMemo(() => {
    if (!data?.players) return [];
    const filtered = tierFilter === 'all'
      ? data.players
      : data.players.filter((p) => p.draftTier === tierFilter);
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'havf': return b.havf.composite - a.havf.composite;
        case 'woba': return (b.batting?.woba ?? 0) - (a.batting?.woba ?? 0);
        case 'wrc_plus': return (b.batting?.wrc_plus ?? 0) - (a.batting?.wrc_plus ?? 0);
        case 'era': return (a.pitching?.era ?? 99) - (b.pitching?.era ?? 99);
        case 'fip': return (a.pitching?.fip ?? 99) - (b.pitching?.fip ?? 99);
        default: return 0;
      }
    });
  }, [data, sort, tierFilter]);

  const tierCounts = useMemo(() => {
    if (!data?.players) return {};
    const counts: Record<string, number> = {};
    for (const p of data.players) {
      counts[p.draftTier] = (counts[p.draftTier] ?? 0) + 1;
    }
    return counts;
  }, [data]);

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
              <span className="text-text-primary">Draft Board</span>
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
                  <span className="heritage-stamp text-[10px]">Draft Intelligence</span>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-text-primary mt-1">
                    Draft Board & Pro Pipeline
                  </h1>
                </div>
              </div>
              <p className="text-text-secondary text-sm mt-4 max-w-2xl">
                Texas Longhorns ranked by HAV-F composite — the four-dimension scouting score measuring Hit tool, Approach, Velocity/Velo, and Fielding.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        <DataErrorBoundary name="Draft Board">
        {/* Tier Summary */}
        {!loading && data?.players && data.players.length > 0 && (
          <Section padding="md" borderTop>
            <Container>
              <ScrollReveal direction="up">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['Top 3 Rounds', 'Rounds 4-10', 'Day 3', 'Development'] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setTierFilter(tierFilter === tier ? 'all' : tier)}
                      className={`rounded-sm border p-4 text-center transition-all ${
                        tierFilter === tier
                          ? 'border-burnt-orange bg-burnt-orange/10'
                          : 'border-border-subtle bg-[var(--surface-dugout)] hover:border-burnt-orange/30'
                      }`}
                    >
                      <div className="font-mono text-2xl font-bold text-text-primary">
                        {tierCounts[tier] ?? 0}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-text-muted mt-1">{tier}</div>
                    </button>
                  ))}
                </div>
              </ScrollReveal>
            </Container>
          </Section>
        )}

        {/* Draft Board Table */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <Card variant="default" padding="lg" className="border-t-2 border-burnt-orange">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="flex items-center gap-3">
                      <span>Prospect Rankings</span>
                      {sorted.length > 0 && (
                        <Badge variant="accent" size="sm">{sorted.length} players</Badge>
                      )}
                    </CardTitle>
                    {tierFilter !== 'all' && (
                      <button
                        onClick={() => setTierFilter('all')}
                        className="text-xs text-burnt-orange hover:text-ember transition-colors"
                      >
                        Clear filter &times;
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-10 bg-surface-light rounded-sm animate-pulse" />
                      ))}
                    </div>
                  ) : error || !data?.players ? (
                    <p className="text-text-muted text-sm text-center py-8">Draft board data is not available right now.</p>
                  ) : sorted.length === 0 ? (
                    <p className="text-text-muted text-sm text-center py-8">No players match this filter.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-text-muted text-xs uppercase tracking-wider bg-[var(--surface-press-box)]">
                            <th className="text-left py-2 px-2 w-8">#</th>
                            <th className="text-left py-2 px-2">Name</th>
                            <th className="text-left py-2 px-2">Pos</th>
                            <th className="text-left py-2 px-2">Tier</th>
                            <DraftSortTh label="HAV-F" field="havf" current={sort} onSort={setSort} />
                            <DraftSortTh label="wOBA" field="woba" current={sort} onSort={setSort} />
                            <DraftSortTh label="wRC+" field="wrc_plus" current={sort} onSort={setSort} />
                            <DraftSortTh label="ERA" field="era" current={sort} onSort={setSort} />
                            <DraftSortTh label="FIP" field="fip" current={sort} onSort={setSort} />
                          </tr>
                        </thead>
                        <tbody>
                          {sorted.map((p, idx) => (
                            <tr key={p.playerId || p.name} className="border-t border-border-subtle hover:bg-surface-light/30 transition-colors">
                              <td className="py-2.5 px-2 text-text-muted font-mono text-xs">{idx + 1}</td>
                              <td className="py-2.5 px-2 text-text-primary font-medium">{p.name}</td>
                              <td className="py-2.5 px-2 text-text-muted text-xs">{p.position}</td>
                              <td className="py-2.5 px-2">
                                <span className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider ${TIER_COLORS[p.draftTier] ?? ''}`}>
                                  {p.draftTier}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono font-bold" style={{ color: p.havf.composite >= 65 ? ACCENT : undefined }}>
                                {p.havf.composite.toFixed(0)}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono text-text-secondary">
                                {p.batting ? fmt3(p.batting.woba) : '—'}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono text-text-secondary">
                                {p.batting ? Math.round(p.batting.wrc_plus).toString() : '—'}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono text-text-secondary">
                                {p.pitching ? fmt2(p.pitching.era) : '—'}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono text-text-secondary">
                                {p.pitching ? fmt2(p.pitching.fip) : '—'}
                              </td>
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

        {/* HAV-F Breakdown (top 5 only) */}
        {!loading && sorted.length > 0 && (
          <Section padding="lg" borderTop>
            <Container>
              <ScrollReveal direction="up">
                <div className="mb-6">
                  <span className="heritage-stamp text-[10px]">HAV-F Breakdown</span>
                  <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide text-text-primary mt-1">
                    Top Prospects — Dimension Scores
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sorted.slice(0, 6).map((p) => (
                    <Card key={p.playerId || p.name} variant="default" padding="md">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-text-primary font-medium text-sm">{p.name}</div>
                          <div className="text-text-muted text-xs">{p.position}</div>
                        </div>
                        <div className="font-mono text-lg font-bold" style={{ color: p.havf.composite >= 65 ? ACCENT : undefined }}>
                          {p.havf.composite.toFixed(0)}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {([
                          { key: 'h', label: 'Hit', val: p.havf.h },
                          { key: 'a', label: 'Approach', val: p.havf.a },
                          { key: 'v', label: 'Velo', val: p.havf.v },
                          { key: 'f', label: 'Field', val: p.havf.f },
                        ] as const).map((dim) => (
                          <div key={dim.key} className="text-center">
                            <div className="w-full bg-surface-light rounded-full h-1.5 mb-1">
                              <div
                                className="h-1.5 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(dim.val, 100)}%`,
                                  backgroundColor: dim.val >= 70 ? ACCENT : 'var(--bsi-dust)',
                                }}
                              />
                            </div>
                            <div className="text-[10px] text-text-muted">{dim.label}</div>
                            <div className="font-mono text-xs text-text-secondary">{dim.val.toFixed(0)}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border-subtle">
                        <div className="text-[10px] text-text-muted uppercase tracking-wider">Projected Range</div>
                        <div className="text-xs text-text-primary font-mono mt-1">
                          {p.draftTier === 'Top 3 Rounds' ? 'Rounds 1-3' : p.draftTier === 'Rounds 4-10' ? 'Rounds 4-10' : p.draftTier === 'Day 3' ? 'Rounds 11-20' : 'UDFA / Development'}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
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
                source="BSI HAV-F Model"
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
      <Footer />
    </>
  );
}

// ─── Sort Header ────────────────────────────────────────────────────────────

function DraftSortTh({ label, field, current, onSort }: { label: string; field: SortField; current: SortField; onSort: (f: SortField) => void }) {
  const active = current === field;
  return (
    <th className="text-right py-2 px-2">
      <button
        onClick={() => onSort(field)}
        className={`hover:text-burnt-orange transition-colors ${active ? 'text-burnt-orange font-bold' : ''}`}
        aria-label={`Sort by ${label}`}
        role="columnheader"
        aria-sort={active ? 'descending' : 'none'}
      >
        {label} {active && '▾'}
      </button>
    </th>
  );
}
