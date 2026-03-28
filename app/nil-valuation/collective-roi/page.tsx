'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';

// ── Types ──
interface TeamROI {
  team: string;
  conference: string;
  roster_scored: number;
  total_nil_value: number;
  avg_index: number;
  avg_performance: number;
  top_player_value: number;
  market_size: string | null;
  program_tier: string | null;
}

function formatValue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export default function CollectiveROIPage() {
  const [confFilter, setConfFilter] = useState('');
  const [sortKey, setSortKey] = useState<'total_nil_value' | 'avg_index' | 'avg_performance'>('total_nil_value');

  const { data: roiData, loading, error: fetchError } = useSportData<{ data?: TeamROI[] }>('/api/nil/collective-roi');

  const hasAccess = !(fetchError && fetchError.includes('403'));
  const teams = useMemo(() => roiData?.data || [], [roiData]);

  const conferences = useMemo(() => [...new Set(teams.map(t => t.conference).filter(Boolean))].sort(), [teams]);

  const filtered = useMemo(() => {
    const list = confFilter ? teams.filter(t => t.conference === confFilter) : teams;
    return [...list].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
  }, [teams, confFilter, sortKey]);

  const totalMarket = useMemo(() => teams.reduce((sum, t) => sum + (t.total_nil_value || 0), 0), [teams]);
  const avgPerTeam = teams.length > 0 ? totalMarket / teams.length : 0;
  const topTeam = teams[0];

  return (
    <div className="min-h-screen bg-[var(--surface-scoreboard)] text-[var(--bsi-bone)]">
      <Section className="pt-4 pb-0">
        <Container>
          <nav className="flex items-center gap-2 text-sm text-[rgba(196,184,165,0.35)]">
            <Link href="/nil-valuation" className="hover:text-[var(--bsi-primary)] transition-colors">NIL Valuation</Link>
            <span>/</span>
            <span className="text-[var(--bsi-dust)]">Collective ROI</span>
          </nav>
        </Container>
      </Section>

      <Section className="pt-6 pb-12 bg-gradient-to-b from-background-secondary to-[var(--surface-scoreboard)]">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="primary" className="mb-4">Pro Tool</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display uppercase tracking-wide">
                <span className="text-[var(--bsi-primary)]">Collective</span> ROI
              </h1>
              <p className="text-lg text-[var(--bsi-dust)] max-w-2xl mx-auto">
                Which programs get the most production per NIL dollar? Total roster value with conference benchmarks.
              </p>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      <Section className="py-12">
        <Container>
          {!hasAccess ? (
            <ScrollReveal>
              <Card className="max-w-lg mx-auto text-center border-l-4 border-l-burnt-orange">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-[var(--bsi-bone)] mb-3">Pro Access Required</h2>
                  <p className="text-[rgba(196,184,165,0.5)] mb-6">
                    Collective ROI analysis is available on the Pro tier.
                  </p>
                  <Link href="/pricing">
                    <Button size="lg" className="bg-[var(--bsi-primary)]">Upgrade to Pro</Button>
                  </Link>
                </CardContent>
              </Card>
            </ScrollReveal>
          ) : loading ? (
            <div className="text-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-[var(--bsi-primary)] border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-[rgba(196,184,165,0.35)]">Loading collective data...</p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <ScrollReveal>
                  <Card className="text-center">
                    <CardContent className="p-5">
                      <div className="text-2xl font-bold text-[var(--bsi-primary)]">{formatValue(totalMarket)}</div>
                      <div className="text-sm text-[rgba(196,184,165,0.35)] mt-1">Total Market (Scored)</div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
                <ScrollReveal delay={80}>
                  <Card className="text-center">
                    <CardContent className="p-5">
                      <div className="text-2xl font-bold text-[var(--bsi-bone)]">{formatValue(avgPerTeam)}</div>
                      <div className="text-sm text-[rgba(196,184,165,0.35)] mt-1">Avg per Team</div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
                <ScrollReveal delay={160}>
                  <Card className="text-center">
                    <CardContent className="p-5">
                      <div className="text-2xl font-bold text-[var(--bsi-bone)]">{topTeam?.team || '—'}</div>
                      <div className="text-sm text-[rgba(196,184,165,0.35)] mt-1">Highest Valued Roster</div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              </div>

              {/* Filters */}
              <ScrollReveal>
                <div className="flex flex-wrap gap-3 mb-6">
                  <select
                    value={confFilter}
                    onChange={e => setConfFilter(e.target.value)}
                    className="p-2 rounded-sm bg-[var(--surface-dugout)] border border-[var(--border-vintage)] text-[var(--bsi-bone)] text-sm focus:border-[var(--bsi-primary)] focus:outline-none"
                  >
                    <option value="">All Conferences</option>
                    {conferences.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="flex gap-2">
                    {([
                      { key: 'total_nil_value' as const, label: 'Total Value' },
                      { key: 'avg_index' as const, label: 'Avg Index' },
                      { key: 'avg_performance' as const, label: 'Avg Performance' },
                    ]).map(opt => (
                      <button key={opt.key} onClick={() => setSortKey(opt.key)}
                        className={`px-3 py-1.5 rounded-sm border text-xs font-semibold transition-all ${sortKey === opt.key ? 'border-[var(--bsi-primary)] bg-[var(--bsi-primary)]/10 text-[var(--bsi-primary)]' : 'border-border text-[rgba(196,184,165,0.5)] hover:border-text-muted'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Table */}
              <ScrollReveal>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border-vintage)] text-[rgba(196,184,165,0.35)]">
                            <th className="text-left p-4 font-medium">#</th>
                            <th className="text-left p-4 font-medium">Team</th>
                            <th className="text-left p-4 font-medium">Conference</th>
                            <th className="text-right p-4 font-medium">Players</th>
                            <th className="text-right p-4 font-medium">Total Value</th>
                            <th className="text-right p-4 font-medium">Avg Index</th>
                            <th className="text-right p-4 font-medium">Top Player</th>
                            <th className="text-right p-4 font-medium">Market</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((row, i) => (
                            <tr key={row.team} className="border-b border-border/50 hover:bg-[var(--surface-dugout)] transition-colors">
                              <td className="p-4 text-[rgba(196,184,165,0.35)]">{i + 1}</td>
                              <td className="p-4 font-semibold text-[var(--bsi-bone)]">{row.team}</td>
                              <td className="p-4 text-[var(--bsi-dust)]">{row.conference}</td>
                              <td className="p-4 text-right text-[var(--bsi-dust)]">{row.roster_scored}</td>
                              <td className="p-4 text-right text-[var(--bsi-primary)] font-bold">{formatValue(row.total_nil_value)}</td>
                              <td className="p-4 text-right text-[var(--bsi-dust)]">{row.avg_index}</td>
                              <td className="p-4 text-right text-[var(--bsi-dust)]">{formatValue(row.top_player_value)}</td>
                              <td className="p-4 text-right">
                                <Badge variant="secondary" className="text-[10px]">{row.market_size || '—'}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>

              {filtered.length === 0 && (
                <p className="text-center text-[rgba(196,184,165,0.35)] py-12">No data available yet. Data appears after the first NIL compute cycle.</p>
              )}
            </>
          )}
        </Container>
      </Section>

      <Footer />
    </div>
  );
}
