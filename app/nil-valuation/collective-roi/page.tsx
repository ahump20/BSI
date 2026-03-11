'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

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
  const [teams, setTeams] = useState<TeamROI[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);
  const [confFilter, setConfFilter] = useState('');
  const [sortKey, setSortKey] = useState<'total_nil_value' | 'avg_index' | 'avg_performance'>('total_nil_value');

  useEffect(() => {
    fetch('/api/nil/collective-roi')
      .then(r => {
        if (r.status === 403) { setHasAccess(false); setLoading(false); return null; }
        return r.json();
      })
      .then((d: { data?: TeamROI[] } | null) => { if (d) { setTeams(d.data || []); setLoading(false); } })
      .catch(() => setLoading(false));
  }, []);

  const conferences = useMemo(() => [...new Set(teams.map(t => t.conference).filter(Boolean))].sort(), [teams]);

  const filtered = useMemo(() => {
    const list = confFilter ? teams.filter(t => t.conference === confFilter) : teams;
    return [...list].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
  }, [teams, confFilter, sortKey]);

  const totalMarket = useMemo(() => teams.reduce((sum, t) => sum + (t.total_nil_value || 0), 0), [teams]);
  const avgPerTeam = teams.length > 0 ? totalMarket / teams.length : 0;
  const topTeam = teams[0];

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <Section className="pt-4 pb-0">
        <Container>
          <nav className="flex items-center gap-2 text-sm text-text-muted">
            <Link href="/nil-valuation" className="hover:text-burnt-orange transition-colors">NIL Valuation</Link>
            <span>/</span>
            <span className="text-text-secondary">Collective ROI</span>
          </nav>
        </Container>
      </Section>

      <Section className="pt-6 pb-12 bg-gradient-to-b from-background-secondary to-background-primary">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="primary" className="mb-4">Pro Tool</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                <span className="text-burnt-orange">Collective</span> ROI
              </h1>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
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
                  <h2 className="text-2xl font-bold text-text-primary mb-3">Pro Access Required</h2>
                  <p className="text-text-tertiary mb-6">
                    Collective ROI analysis is available on the Pro tier.
                  </p>
                  <Link href="/pricing">
                    <Button size="lg" className="bg-burnt-orange">Upgrade to Pro</Button>
                  </Link>
                </CardContent>
              </Card>
            </ScrollReveal>
          ) : loading ? (
            <div className="text-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-burnt-orange border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-text-muted">Loading collective data...</p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <ScrollReveal>
                  <Card className="text-center">
                    <CardContent className="p-5">
                      <div className="text-2xl font-bold text-burnt-orange">{formatValue(totalMarket)}</div>
                      <div className="text-sm text-text-muted mt-1">Total Market (Scored)</div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
                <ScrollReveal delay={80}>
                  <Card className="text-center">
                    <CardContent className="p-5">
                      <div className="text-2xl font-bold text-text-primary">{formatValue(avgPerTeam)}</div>
                      <div className="text-sm text-text-muted mt-1">Avg per Team</div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
                <ScrollReveal delay={160}>
                  <Card className="text-center">
                    <CardContent className="p-5">
                      <div className="text-2xl font-bold text-text-primary">{topTeam?.team || '—'}</div>
                      <div className="text-sm text-text-muted mt-1">Highest Valued Roster</div>
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
                    className="p-2 rounded-lg bg-background-secondary border border-border text-text-primary text-sm focus:border-burnt-orange focus:outline-none"
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
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${sortKey === opt.key ? 'border-burnt-orange bg-burnt-orange/10 text-burnt-orange' : 'border-border text-text-tertiary hover:border-text-muted'}`}>
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
                          <tr className="border-b border-border text-text-muted">
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
                            <tr key={row.team} className="border-b border-border/50 hover:bg-background-secondary transition-colors">
                              <td className="p-4 text-text-muted">{i + 1}</td>
                              <td className="p-4 font-semibold text-text-primary">{row.team}</td>
                              <td className="p-4 text-text-secondary">{row.conference}</td>
                              <td className="p-4 text-right text-text-secondary">{row.roster_scored}</td>
                              <td className="p-4 text-right text-burnt-orange font-bold">{formatValue(row.total_nil_value)}</td>
                              <td className="p-4 text-right text-text-secondary">{row.avg_index}</td>
                              <td className="p-4 text-right text-text-secondary">{formatValue(row.top_player_value)}</td>
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
                <p className="text-center text-text-muted py-12">No data available yet. Data appears after the first NIL compute cycle.</p>
              )}
            </>
          )}
        </Container>
      </Section>

      <Footer />
    </div>
  );
}
