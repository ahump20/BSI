'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';

// ── Types ──
interface LeveragePlayer {
  player_id: string;
  player_name: string;
  team: string;
  conference: string;
  position: string;
  index_score: number;
  performance_score: number;
  estimated_mid: number;
  quadrant: string;
}

interface QuadrantInfo {
  key: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  borderColor: string;
}

const QUADRANTS: QuadrantInfo[] = [
  {
    key: 'high-nil-high-draft',
    title: 'Premier Assets',
    subtitle: 'High NIL + High Draft',
    description: 'Top-tier talent with both market value and pro potential. These players command premium deals and have clear paths to the next level.',
    color: 'text-green-400',
    borderColor: 'border-l-green-400',
  },
  {
    key: 'low-nil-high-draft',
    title: 'Hidden Gems',
    subtitle: 'Low NIL + High Draft',
    description: 'Elite on-field producers whose NIL value hasn\'t caught up to their talent. The market inefficiency window is closing.',
    color: 'text-blue-400',
    borderColor: 'border-l-blue-400',
  },
  {
    key: 'high-nil-low-draft',
    title: 'Marketing Stars',
    subtitle: 'High NIL + Low Draft',
    description: 'Strong brand value driven by market and exposure rather than draft-caliber performance. Value comes from influence, not pro projection.',
    color: 'text-yellow-400',
    borderColor: 'border-l-yellow-400',
  },
  {
    key: 'low-nil-low-draft',
    title: 'Development',
    subtitle: 'Low NIL + Low Draft',
    description: 'Early-career or niche players building both their game and their brand. Highest upside for long-term investments.',
    color: 'text-text-muted',
    borderColor: 'border-l-border',
  },
];

function formatValue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export default function DraftLeveragePage() {
  const { data: leverageData, loading, error: fetchError } = useSportData<{ data?: LeveragePlayer[] }>('/api/nil/draft-leverage');

  const hasAccess = !(fetchError && fetchError.includes('403'));
  const players = useMemo(() => leverageData?.data || [], [leverageData]);

  const grouped = useMemo(() => {
    const map: Record<string, LeveragePlayer[]> = {};
    for (const q of QUADRANTS) map[q.key] = [];
    for (const p of players) {
      if (map[p.quadrant]) map[p.quadrant].push(p);
    }
    return map;
  }, [players]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const q of QUADRANTS) c[q.key] = grouped[q.key]?.length || 0;
    return c;
  }, [grouped]);

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <Section className="pt-4 pb-0">
        <Container>
          <nav className="flex items-center gap-2 text-sm text-text-muted">
            <Link href="/nil-valuation" className="hover:text-burnt-orange transition-colors">NIL Valuation</Link>
            <span>/</span>
            <span className="text-text-secondary">Draft Leverage</span>
          </nav>
        </Container>
      </Section>

      <Section className="pt-6 pb-12 bg-gradient-to-b from-background-secondary to-background-primary">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="primary" className="mb-4">Pro Tool</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display uppercase tracking-wide">
                <span className="text-burnt-orange">Draft</span> Leverage
              </h1>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                How NIL value maps against draft projection. Four quadrants reveal where the smart money moves.
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
                    Draft leverage analysis is available on the Pro tier.
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
              <p className="text-text-muted">Loading draft leverage data...</p>
            </div>
          ) : (
            <>
              {/* Quadrant counts summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {QUADRANTS.map((q, i) => (
                  <ScrollReveal key={q.key} delay={i * 80}>
                    <Card className={`text-center border-l-4 ${q.borderColor}`}>
                      <CardContent className="p-4">
                        <div className={`text-3xl font-bold ${q.color}`}>{counts[q.key]}</div>
                        <div className="text-sm font-semibold text-text-primary mt-1">{q.title}</div>
                        <div className="text-xs text-text-muted">{q.subtitle}</div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>

              {/* Quadrant details */}
              <div className="grid md:grid-cols-2 gap-8">
                {QUADRANTS.map((q, qi) => (
                  <ScrollReveal key={q.key} delay={qi * 100}>
                    <Card className={`border-l-4 ${q.borderColor}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className={`text-xl font-bold ${q.color}`}>{q.title}</h2>
                          <Badge variant="secondary" className="text-[10px]">{counts[q.key]} players</Badge>
                        </div>
                        <p className="text-sm text-text-tertiary mb-4">{q.description}</p>

                        {(grouped[q.key] || []).length > 0 ? (
                          <div className="space-y-2">
                            {(grouped[q.key] || []).slice(0, 8).map(p => (
                              <div key={p.player_id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                                <div>
                                  <span className="text-sm font-semibold text-text-primary">{p.player_name}</span>
                                  <span className="text-xs text-text-muted ml-2">{p.team}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-bold text-burnt-orange">{formatValue(p.estimated_mid)}</span>
                                  <span className="text-xs text-text-muted ml-2">Perf: {p.performance_score}</span>
                                </div>
                              </div>
                            ))}
                            {(grouped[q.key] || []).length > 8 && (
                              <p className="text-xs text-text-muted text-center pt-2">
                                +{(grouped[q.key] || []).length - 8} more
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-text-muted">No players in this quadrant yet.</p>
                        )}
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            </>
          )}
        </Container>
      </Section>

      <Footer />
    </div>
  );
}
