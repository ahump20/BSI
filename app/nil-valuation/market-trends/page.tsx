'use client';

import { useMemo } from 'react';
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
interface ConferenceTrend {
  conference: string;
  player_count: number;
  avg_index: number;
  avg_performance: number;
  avg_value: number;
  top_value: number;
  elite_count: number;
  high_count: number;
}

// ── Static market overview (always visible) ──
const MARKET_OVERVIEW = [
  { label: 'Total NIL Market', value: '$2.4B', change: '+18% YoY' },
  { label: 'Avg Football Deal', value: '$145K', change: '+12% YoY' },
  { label: 'Avg Baseball Deal', value: '$28K', change: '+22% YoY' },
  { label: 'Active Collectives', value: '250+', change: '+40% YoY' },
];

const SPORT_BREAKDOWN = [
  { sport: 'Football', share: '62%', avg: '$145K', growth: '+12%' },
  { sport: "Men's Basketball", share: '18%', avg: '$98K', growth: '+15%' },
  { sport: "Women's Basketball", share: '10%', avg: '$72K', growth: '+28%' },
  { sport: 'Baseball', share: '5%', avg: '$28K', growth: '+22%' },
  { sport: 'Other', share: '5%', avg: '$12K', growth: '+8%' },
];

function formatValue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export default function MarketTrendsPage() {
  const { data: trendsData, loading, error: fetchError } = useSportData<{ data?: ConferenceTrend[] }>('/api/nil/trends?group_by=conference');

  const hasAccess = !(fetchError && fetchError.includes('403'));
  const trends = useMemo(() => trendsData?.data || [], [trendsData]);

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      {/* Breadcrumb */}
      <Section className="pt-4 pb-0">
        <Container>
          <nav className="flex items-center gap-2 text-sm text-text-muted">
            <Link href="/nil-valuation" className="hover:text-burnt-orange transition-colors">NIL Valuation</Link>
            <span>/</span>
            <span className="text-text-secondary">Market Trends</span>
          </nav>
        </Container>
      </Section>

      {/* Hero */}
      <Section className="pt-6 pb-12 bg-gradient-to-b from-background-secondary to-background-primary">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="primary" className="mb-4">Free / Pro</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                <span className="text-burnt-orange">Market</span> Trends
              </h1>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Track how the NIL market is moving — by sport, conference, and over time.
              </p>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Static Market Overview — always visible */}
      <Section className="py-12">
        <Container>
          <ScrollReveal>
            <h2 className="text-2xl font-bold text-text-primary mb-6">Market Overview</h2>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {MARKET_OVERVIEW.map((item, i) => (
              <ScrollReveal key={item.label} delay={i * 80}>
                <Card className="text-center">
                  <CardContent className="p-5">
                    <div className="text-2xl md:text-3xl font-bold text-burnt-orange">{item.value}</div>
                    <div className="text-sm text-text-secondary mt-1">{item.label}</div>
                    <div className="text-xs text-green-400 mt-2">{item.change}</div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>

          {/* Sport breakdown */}
          <ScrollReveal delay={200}>
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>NIL Market Share by Sport</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-text-muted">
                        <th className="text-left p-4 font-medium">Sport</th>
                        <th className="text-right p-4 font-medium">Market Share</th>
                        <th className="text-right p-4 font-medium">Avg Deal</th>
                        <th className="text-right p-4 font-medium">YoY Growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SPORT_BREAKDOWN.map(row => (
                        <tr key={row.sport} className="border-b border-border/50 hover:bg-background-secondary transition-colors">
                          <td className="p-4 font-semibold text-text-primary">{row.sport}</td>
                          <td className="p-4 text-right text-text-secondary">{row.share}</td>
                          <td className="p-4 text-right text-text-secondary">{row.avg}</td>
                          <td className="p-4 text-right text-green-400">{row.growth}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          <p className="text-center text-xs text-text-muted mt-4">
            Market overview based on public reporting and industry estimates. Updated quarterly.
          </p>
        </Container>
      </Section>

      {/* Live Conference Trends — Pro only */}
      <Section className="py-12 bg-background-secondary">
        <Container>
          <ScrollReveal>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Conference NIL Trends</h2>
            <p className="text-text-muted mb-6">Live data from BSI Savant compute. Updated every 6 hours.</p>
          </ScrollReveal>

          {!hasAccess ? (
            <ScrollReveal>
              <Card className="max-w-lg mx-auto text-center border-l-4 border-l-burnt-orange">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-text-primary mb-3">Pro Access Required</h3>
                  <p className="text-text-tertiary mb-6">
                    Live conference-level NIL trend data is available on the Pro tier.
                  </p>
                  <Link href="/pricing">
                    <Button size="lg" className="bg-burnt-orange">Upgrade to Pro</Button>
                  </Link>
                </CardContent>
              </Card>
            </ScrollReveal>
          ) : loading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-8 h-8 border-2 border-burnt-orange border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-text-muted">Loading conference trends...</p>
            </div>
          ) : trends.length === 0 ? (
            <p className="text-center text-text-muted py-12">No trend data available yet. Trends appear after the first NIL compute cycle.</p>
          ) : (
            <ScrollReveal>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-text-muted">
                          <th className="text-left p-4 font-medium">Conference</th>
                          <th className="text-right p-4 font-medium">Players</th>
                          <th className="text-right p-4 font-medium">Avg Index</th>
                          <th className="text-right p-4 font-medium">Avg Value</th>
                          <th className="text-right p-4 font-medium">Top Value</th>
                          <th className="text-right p-4 font-medium">Elite</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trends.map(row => (
                          <tr key={row.conference} className="border-b border-border/50 hover:bg-background-primary transition-colors">
                            <td className="p-4 font-semibold text-text-primary">{row.conference}</td>
                            <td className="p-4 text-right text-text-secondary">{row.player_count}</td>
                            <td className="p-4 text-right text-text-secondary">{row.avg_index}</td>
                            <td className="p-4 text-right text-burnt-orange font-semibold">{formatValue(row.avg_value)}</td>
                            <td className="p-4 text-right text-text-secondary">{formatValue(row.top_value)}</td>
                            <td className="p-4 text-right">
                              <span className="text-green-400 font-semibold">{row.elite_count}</span>
                              <span className="text-text-muted"> / {row.high_count}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          )}
        </Container>
      </Section>

      <Footer />
    </div>
  );
}
