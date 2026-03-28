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
  return 'text-[var(--bsi-dust)]';
}

export default function UndervaluedPage() {
  const { data: undervaluedData, loading, error } = useSportData<{ data?: UndervaluedPlayer[] }>('/api/nil/undervalued');

  const hasAccess = !(error && error.includes('403'));
  const players = useMemo(() => undervaluedData?.data || [], [undervaluedData]);

  const sorted = [...players].sort(
    (a, b) => (b.performance_score - b.index_score) - (a.performance_score - a.index_score)
  );

  return (
    <div className="min-h-screen bg-[var(--surface-scoreboard)] text-[var(--bsi-bone)]">
      {/* Breadcrumb */}
      <Section className="pt-4 pb-0">
        <Container>
          <nav className="flex items-center gap-2 text-sm text-[rgba(196,184,165,0.35)]">
            <Link href="/nil-valuation" className="hover:text-[var(--bsi-primary)] transition-colors">NIL Valuation</Link>
            <span>/</span>
            <span className="text-[var(--bsi-dust)]">Undervalued Discovery</span>
          </nav>
        </Container>
      </Section>

      {/* Hero */}
      <Section className="pt-6 pb-12 bg-gradient-to-b from-background-secondary to-[var(--surface-scoreboard)]">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="primary" className="mb-4">Pro Tool</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display uppercase tracking-wide">
                <span className="text-[var(--bsi-primary)]">Undervalued</span> Discovery
              </h1>
              <p className="text-lg text-[var(--bsi-dust)] max-w-2xl mx-auto">
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
                  <h2 className="text-2xl font-bold text-[var(--bsi-bone)] mb-3">Pro Access Required</h2>
                  <p className="text-[rgba(196,184,165,0.5)] mb-6">
                    Undervalued discovery is available on the Pro tier. Upgrade to find market inefficiencies before your competition.
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
              <p className="text-[rgba(196,184,165,0.35)]">Scanning for undervalued players...</p>
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
                    <h2 className="text-lg font-bold text-[var(--bsi-bone)] mb-2">How This Works</h2>
                    <p className="text-[rgba(196,184,165,0.5)] text-sm">
                      The <strong className="text-[var(--bsi-dust)]">Value Gap</strong> is the difference between
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
                      <Card className="h-full hover:border-[var(--bsi-primary)]/30 transition-colors">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <span className="text-xs font-bold text-[var(--bsi-primary)]">#{i + 1}</span>
                              <h3 className="text-lg font-semibold text-[var(--bsi-bone)]">{player.player_name}</h3>
                              <p className="text-sm text-[rgba(196,184,165,0.35)]">{player.team} &middot; {player.conference}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">{player.tier}</Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-3 mt-4">
                            <div className="text-center">
                              <div className="text-xl font-bold text-[var(--bsi-bone)]">{player.performance_score.toFixed(1)}</div>
                              <div className="text-xs text-[rgba(196,184,165,0.35)]">Performance</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-[var(--bsi-dust)]">{player.index_score.toFixed(1)}</div>
                              <div className="text-xs text-[rgba(196,184,165,0.35)]">NIL Index</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-xl font-bold ${gapColor(gap)}`}>+{gap.toFixed(1)}</div>
                              <div className="text-xs text-[rgba(196,184,165,0.35)]">Value Gap</div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[var(--border-vintage)] flex items-center justify-between">
                            <span className="text-sm text-[rgba(196,184,165,0.35)]">Est. Value</span>
                            <span className="text-lg font-bold text-[var(--bsi-primary)]">{formatValue(player.estimated_mid)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  );
                })}
              </div>

              {sorted.length === 0 && (
                <p className="text-center text-[rgba(196,184,165,0.35)] py-12">No undervalued players found.</p>
              )}
            </>
          )}
        </Container>
      </Section>

      <Footer />
    </div>
  );
}
