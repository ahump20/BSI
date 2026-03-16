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
interface UndervaluedPlayer {
  player_id: string;
  player_name: string;
  team: string;
  conference: string;
  performance_score: number;
  index_score: number;
  estimated_mid: number;
  tier: string;
}

// ── Helpers ──
function formatValue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function gapColor(gap: number): string {
  if (gap >= 30) return 'text-[var(--bsi-success)]';
  if (gap >= 15) return 'text-[var(--heritage-columbia-blue)]';
  return 'text-text-secondary';
}

export default function UndervaluedPage() {
  const { data: undervaluedData, loading, error } = useSportData<{ data?: UndervaluedPlayer[] }>('/api/nil/undervalued');

  const hasAccess = !(error && error.includes('403'));
  const players = useMemo(() => undervaluedData?.data || [], [undervaluedData]);

  const sorted = [...players].sort(
    (a, b) => (b.performance_score - b.index_score) - (a.performance_score - a.index_score)
  );

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      {/* Breadcrumb */}
      <Section className="pt-4 pb-0">
        <Container>
          <nav className="flex items-center gap-2 text-sm text-text-muted">
            <Link href="/nil-valuation" className="hover:text-burnt-orange transition-colors">NIL Valuation</Link>
            <span>/</span>
            <span className="text-text-secondary">Undervalued Discovery</span>
          </nav>
        </Container>
      </Section>

      {/* Hero */}
      <Section className="pt-6 pb-12 bg-gradient-to-b from-background-secondary to-background-primary">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="primary" className="mb-4">Pro Tool</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display uppercase tracking-wide">
                <span className="text-burnt-orange">Undervalued</span> Discovery
              </h1>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Players whose on-field production significantly outpaces their current NIL valuation. The value gap is where opportunity lives.
              </p>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Content */}
      <Section className="py-12">
        <Container>
          {!hasAccess ? (
            <ScrollReveal>
              <Card className="max-w-lg mx-auto text-center border-l-4 border-l-burnt-orange">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-text-primary mb-3">Pro Access Required</h2>
                  <p className="text-text-tertiary mb-6">
                    Undervalued discovery is available on the Pro tier. Upgrade to find market inefficiencies before your competition.
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
              <p className="text-text-muted">Scanning for undervalued players...</p>
            </div>
          ) : error ? (
            <Card className="max-w-lg mx-auto text-center">
              <CardContent className="p-8">
                <p className="text-[var(--bsi-danger)] mb-4">Failed to load: {error}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Explanation */}
              <ScrollReveal>
                <Card className="mb-8 border-l-4 border-l-burnt-orange max-w-3xl mx-auto">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-bold text-text-primary mb-2">How This Works</h2>
                    <p className="text-text-tertiary text-sm">
                      The <strong className="text-text-secondary">Value Gap</strong> is the difference between
                      a player&apos;s on-field performance score and their NIL index score. A higher gap means
                      the market hasn&apos;t caught up to what the player is doing on the field. These are the
                      athletes whose NIL value is most likely to rise.
                    </p>
                  </CardContent>
                </Card>
              </ScrollReveal>

              {/* Player Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {sorted.map((player, i) => {
                  const gap = player.performance_score - player.index_score;
                  return (
                    <ScrollReveal key={player.player_id} delay={Math.min(i * 50, 300)}>
                      <Card className="h-full hover:border-burnt-orange/30 transition-colors">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <span className="text-xs font-bold text-burnt-orange">#{i + 1}</span>
                              <h3 className="text-lg font-semibold text-text-primary">{player.player_name}</h3>
                              <p className="text-sm text-text-muted">{player.team} &middot; {player.conference}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">{player.tier}</Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-3 mt-4">
                            <div className="text-center">
                              <div className="text-xl font-bold text-text-primary">{player.performance_score.toFixed(1)}</div>
                              <div className="text-xs text-text-muted">Performance</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-text-secondary">{player.index_score.toFixed(1)}</div>
                              <div className="text-xs text-text-muted">NIL Index</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-xl font-bold ${gapColor(gap)}`}>+{gap.toFixed(1)}</div>
                              <div className="text-xs text-text-muted">Value Gap</div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                            <span className="text-sm text-text-muted">Est. Value</span>
                            <span className="text-lg font-bold text-burnt-orange">{formatValue(player.estimated_mid)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  );
                })}
              </div>

              {sorted.length === 0 && (
                <p className="text-center text-text-muted py-12">No undervalued players found.</p>
              )}
            </>
          )}
        </Container>
      </Section>

      <Footer />
    </div>
  );
}
