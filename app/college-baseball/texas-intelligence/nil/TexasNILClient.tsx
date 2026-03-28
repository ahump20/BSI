'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { TexasNILPanel } from '@/components/college-baseball/TexasNILPanel';
import { useSportData } from '@/lib/hooks/useSportData';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';

const TEAM_ID = 'texas';
const ACCENT = '#BF5700';

interface DraftLeveragePlayer {
  player_id: string;
  name: string;
  nil_index: number;
  draft_round_projection: number;
  leverage_quadrant: string;
}

interface DraftLeverageResponse {
  players: DraftLeveragePlayer[];
  meta: { source: string; fetched_at: string };
}

export default function TexasNILClient() {
  const meta = teamMetadata[TEAM_ID];
  const espnId = meta?.espnId || '251';
  const logoUrl = getLogoUrl(espnId, meta?.logoId);

  const { data: draftData, loading: draftLoading, error: draftError } = useSportData<DraftLeverageResponse>(
    '/api/nil/draft-leverage?team=texas',
    { timeout: 10000 },
  );

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-[var(--border-vintage)]">
          <Container>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">College Baseball</Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <Link href="/college-baseball/texas-intelligence" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">Texas Intel</Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <span className="text-[var(--bsi-bone)]">NIL Intelligence</span>
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
                  <span className="heritage-stamp text-[10px]">NIL Intelligence</span>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-[var(--bsi-bone)] mt-1">
                    Texas NIL Valuations
                  </h1>
                  <p className="text-[var(--bsi-dust)] text-sm mt-2 max-w-xl">
                    Player NIL indices, WAR-to-dollar efficiency, and draft leverage analysis.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* NIL Leaderboard */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <TexasNILPanel limit={25} />
            </ScrollReveal>
          </Container>
        </Section>

        {/* Performance vs NIL Quadrant */}
        {draftData?.players && draftData.players.length > 0 && (
          <Section padding="lg" borderTop>
            <Container>
              <ScrollReveal direction="up">
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span>Performance vs NIL Value</span>
                      <Badge variant="secondary" size="sm">Quadrant Map</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-px bg-border-subtle rounded-sm overflow-hidden">
                      {[
                        { label: 'Elite + Paid', desc: 'High performance, high NIL', bg: 'bg-[var(--bsi-success)]/5', check: (p: DraftLeveragePlayer) => p.nil_index >= 60 && p.draft_round_projection <= 5 },
                        { label: 'Undervalued', desc: 'High performance, low NIL', bg: 'bg-[var(--bsi-primary)]/5', check: (p: DraftLeveragePlayer) => p.nil_index >= 60 && p.draft_round_projection > 5 },
                        { label: 'Overvalued', desc: 'Low performance, high NIL', bg: 'bg-[var(--bsi-danger)]/5', check: (p: DraftLeveragePlayer) => p.nil_index < 60 && p.draft_round_projection <= 5 },
                        { label: 'Development', desc: 'Building both', bg: 'bg-[var(--surface-dugout)]', check: (p: DraftLeveragePlayer) => p.nil_index < 60 && p.draft_round_projection > 5 },
                      ].map((q) => (
                        <div key={q.label} className={`${q.bg} p-4`}>
                          <div className="text-[var(--bsi-bone)] text-sm font-medium">{q.label}</div>
                          <div className="text-[rgba(196,184,165,0.35)] text-xs mt-1">{q.desc}</div>
                          <div className="mt-2 space-y-1">
                            {draftData.players
                              .filter(q.check)
                              .slice(0, 3)
                              .map((p) => (
                                <div key={p.player_id} className="text-xs text-[var(--bsi-dust)] font-mono">{p.name}</div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </Container>
          </Section>
        )}

        {/* Draft Leverage */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <Card variant="default" padding="lg" className="border-t-2 border-[var(--bsi-primary)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span>Draft Leverage</span>
                    <Badge variant="secondary" size="sm">NIL vs Draft Projection</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[var(--bsi-dust)] text-sm mb-4">
                    How draft position affects NIL strategy — players projected in early rounds
                    have signing bonus leverage that makes NIL less critical, while later-round
                    projections increase NIL importance for retention.
                  </p>
                  {draftLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-10 bg-[var(--surface-press-box)] rounded-sm animate-pulse" />
                      ))}
                    </div>
                  ) : draftData?.players && draftData.players.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider bg-[var(--surface-press-box)]">
                            <th className="text-left py-2 px-2">Player</th>
                            <th className="text-right py-2 px-2">NIL Index</th>
                            <th className="text-right py-2 px-2">Draft Proj.</th>
                            <th className="text-left py-2 px-2">Quadrant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {draftData.players.map((p) => (
                            <tr key={p.player_id} className="border-t border-[var(--border-vintage)]">
                              <td className="py-2 px-2 text-[var(--bsi-bone)] font-medium">{p.name}</td>
                              <td className="py-2 px-2 text-right font-mono" style={{ color: p.nil_index >= 70 ? ACCENT : undefined }}>
                                {p.nil_index.toFixed(1)}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-[var(--bsi-dust)]">
                                Rd {p.draft_round_projection}
                              </td>
                              <td className="py-2 px-2 text-[rgba(196,184,165,0.35)] text-xs">{p.leverage_quadrant}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-[rgba(196,184,165,0.35)] text-sm text-center py-6">
                      {draftError ? 'Unable to load draft leverage data. Try refreshing.' : 'Draft leverage data not yet available for this season.'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Footer nav */}
        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <DataSourceBadge
                source="BSI Intelligence"
                timestamp={
                  draftData?.meta?.fetched_at
                    ? new Date(draftData.meta.fetched_at).toLocaleString('en-US', {
                        timeZone: 'America/Chicago',
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      }) + ' CT'
                    : 'Live'
                }
              />
              <div className="flex flex-wrap gap-4">
                <Link href="/college-baseball/texas-intelligence" className="text-sm text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] transition-colors">
                  &larr; Back to Hub
                </Link>
                <Link href="/nil-valuation" className="text-sm text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-bone)] transition-colors">
                  Full NIL Valuation Tool &rarr;
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
