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

// ─── Types ──────────────────────────────────────────────────────────────────

interface PortalMove {
  name: string;
  position: string;
  fromTeam?: string;
  toTeam?: string;
  direction: 'incoming' | 'departing';
  status?: string;
  date?: string;
}

interface RosterPlayer {
  id: string;
  name: string;
  position: string;
  headshot: string | null;
  havfComposite: number | null;
}

interface PortalResponse {
  portalMoves: PortalMove[];
  currentRoster: RosterPlayer[];
  rosterCount: number;
  meta?: { source?: string; fetched_at?: string };
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TEAM_ID = 'texas';
const ACCENT = '#BF5700';

type DirectionFilter = 'all' | 'incoming' | 'departing';
type ViewMode = 'list' | 'split';

// ─── Component ──────────────────────────────────────────────────────────────

export default function TexasPortalClient() {
  const meta = teamMetadata[TEAM_ID];
  const espnId = meta?.espnId || '251';
  const logoUrl = getLogoUrl(espnId, meta?.logoId);

  const { data, loading, error } = useSportData<PortalResponse>(
    '/api/college-baseball/texas-intelligence/portal',
    { timeout: 12000 },
  );

  const [dirFilter, setDirFilter] = useState<DirectionFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const portalMoves = useMemo(() => {
    const moves = (data?.portalMoves ?? []) as PortalMove[];
    if (dirFilter === 'all') return moves;
    return moves.filter((m) => m.direction === dirFilter);
  }, [data, dirFilter]);

  const incoming = useMemo(
    () => ((data?.portalMoves ?? []) as PortalMove[]).filter((m) => m.direction === 'incoming'),
    [data],
  );
  const departing = useMemo(
    () => ((data?.portalMoves ?? []) as PortalMove[]).filter((m) => m.direction === 'departing'),
    [data],
  );

  const rosterByHavf = useMemo(() => {
    if (!data?.currentRoster) return [];
    return [...data.currentRoster].sort((a, b) => (b.havfComposite ?? 0) - (a.havfComposite ?? 0));
  }, [data]);

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
              <span className="text-[var(--bsi-bone)]">Transfer Portal</span>
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
                  <span className="heritage-stamp text-[10px]">Portal Intelligence</span>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-[var(--bsi-bone)] mt-1">
                    Transfer Portal
                  </h1>
                </div>
              </div>
              <p className="text-[var(--bsi-dust)] text-sm mt-4 max-w-2xl">
                Incoming targets, departures, and roster impact analysis for Texas Longhorns baseball.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        <DataErrorBoundary name="Portal Data">
        {/* Summary Cards */}
        {!loading && data && (
          <Section padding="md" borderTop>
            <Container>
              <ScrollReveal direction="up">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)] p-4 text-center">
                    <div className="font-mono text-2xl font-bold text-[var(--bsi-bone)]">{data.rosterCount}</div>
                    <div className="text-[10px] uppercase tracking-wider text-[rgba(196,184,165,0.35)] mt-1">Active Roster</div>
                  </div>
                  <div className="rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)] p-4 text-center">
                    <div className="font-mono text-2xl font-bold" style={{ color: incoming.length > 0 ? 'var(--bsi-success)' : undefined }}>
                      {incoming.length}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-[rgba(196,184,165,0.35)] mt-1">Incoming</div>
                  </div>
                  <div className="rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)] p-4 text-center">
                    <div className="font-mono text-2xl font-bold" style={{ color: departing.length > 0 ? '#ef4444' : undefined }}>
                      {departing.length}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-[rgba(196,184,165,0.35)] mt-1">Departing</div>
                  </div>
                </div>
              </ScrollReveal>
            </Container>
          </Section>
        )}

        {/* Portal Activity */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              {/* Net Talent Indicator */}
              {!loading && !error && (incoming.length > 0 || departing.length > 0) && (
                <div className="rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)] p-3 mb-4 flex items-center justify-center gap-3">
                  <span className="text-[10px] uppercase tracking-wider text-[rgba(196,184,165,0.35)]">Net Talent</span>
                  <span
                    className="font-mono text-lg font-bold"
                    style={{
                      color: incoming.length - departing.length > 0 ? 'var(--bsi-success)'
                        : incoming.length - departing.length < 0 ? 'var(--bsi-error)'
                        : undefined,
                    }}
                  >
                    {incoming.length - departing.length > 0 ? '+' : ''}{incoming.length - departing.length}
                  </span>
                  <span className="text-[rgba(196,184,165,0.35)] text-xs">
                    ({incoming.length} in / {departing.length} out)
                  </span>
                </div>
              )}

              <Card variant="default" padding="lg" className="border-t-2 border-[var(--bsi-primary)]">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="flex items-center gap-3">
                      <span>Portal Activity</span>
                      {portalMoves.length > 0 && (
                        <Badge variant="accent" size="sm">{portalMoves.length} moves</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      {/* View mode toggle */}
                      <div className="flex gap-1 border border-[var(--border-vintage)] rounded-sm overflow-hidden">
                        {(['list', 'split'] as ViewMode[]).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                              viewMode === mode
                                ? 'bg-[var(--bsi-primary)] text-white'
                                : 'bg-transparent text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-bone)]'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                      {/* Direction filter (list view only) */}
                      {viewMode === 'list' && (
                        <div className="flex gap-2">
                          {(['all', 'incoming', 'departing'] as DirectionFilter[]).map((f) => (
                            <button
                              key={f}
                              onClick={() => setDirFilter(f)}
                              className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-sm transition-colors ${
                                dirFilter === f
                                  ? 'bg-[var(--bsi-primary)] text-white'
                                  : 'bg-[var(--surface-press-box)] text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-bone)]'
                              }`}
                            >
                              {f === 'all' ? 'All' : f}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 bg-[var(--surface-press-box)] rounded-sm animate-pulse" />
                      ))}
                    </div>
                  ) : error ? (
                    <p className="text-[rgba(196,184,165,0.35)] text-sm text-center py-8">Portal data is not available right now.</p>
                  ) : viewMode === 'split' ? (
                    /* Split View — Incoming / Departing side by side */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full bg-[var(--bsi-success)]" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--bsi-success)]">
                            Incoming ({incoming.length})
                          </span>
                        </div>
                        {incoming.length === 0 ? (
                          <p className="text-[rgba(196,184,165,0.35)] text-xs text-center py-4">No incoming transfers</p>
                        ) : (
                          <div className="space-y-2">
                            {incoming.map((move, i) => (
                              <PortalMoveRow key={`in-${move.name}-${i}`} move={move} />
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full bg-[var(--bsi-danger)]" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--bsi-danger)]">
                            Departing ({departing.length})
                          </span>
                        </div>
                        {departing.length === 0 ? (
                          <p className="text-[rgba(196,184,165,0.35)] text-xs text-center py-4">No departing transfers</p>
                        ) : (
                          <div className="space-y-2">
                            {departing.map((move, i) => (
                              <PortalMoveRow key={`out-${move.name}-${i}`} move={move} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : portalMoves.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-[rgba(196,184,165,0.35)] text-sm">No portal activity recorded yet this cycle.</p>
                      <p className="text-[rgba(196,184,165,0.35)] text-xs mt-2">Portal activity will appear here as moves are announced.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {portalMoves.map((move, i) => (
                        <PortalMoveRow key={`${move.name}-${i}`} move={move} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Current Roster Impact */}
        {!loading && rosterByHavf.length > 0 && (
          <Section padding="lg" borderTop>
            <Container>
              <ScrollReveal direction="up">
                <div className="mb-6">
                  <span className="heritage-stamp text-[10px]">Roster Composition</span>
                  <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide text-[var(--bsi-bone)] mt-1">
                    Current Roster by HAV-F
                  </h2>
                  <p className="text-[var(--bsi-dust)] text-xs mt-2">
                    Higher HAV-F scores indicate more valuable roster spots — departures of high-HAV-F players create the biggest gaps to fill.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[rgba(196,184,165,0.35)] text-xs uppercase tracking-wider bg-[var(--surface-press-box)]">
                        <th className="text-left py-2 px-2 w-8">#</th>
                        <th className="text-left py-2 px-2">Player</th>
                        <th className="text-left py-2 px-2">Pos</th>
                        <th className="text-right py-2 px-2">HAV-F</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rosterByHavf.map((p, idx) => (
                        <tr key={p.id || p.name} className="border-t border-[var(--border-vintage)]">
                          <td className="py-2 px-2 text-[rgba(196,184,165,0.35)] font-mono text-xs">{idx + 1}</td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-2">
                              {p.headshot && (
                                <img
                                  src={p.headshot}
                                  alt=""
                                  className="w-6 h-6 rounded-full object-cover bg-[var(--surface-press-box)]"
                                  loading="lazy"
                                />
                              )}
                              <span className="text-[var(--bsi-bone)] font-medium">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-[rgba(196,184,165,0.35)] text-xs">{p.position}</td>
                          <td className="py-2 px-2 text-right font-mono font-semibold" style={{ color: (p.havfComposite ?? 0) >= 65 ? ACCENT : undefined }}>
                            {p.havfComposite != null ? p.havfComposite.toFixed(0) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                source="BSI Portal Sync"
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
                className="text-sm text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] transition-colors"
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

// ─── Sub-components ────────────────────────────────────────────────────────

function PortalMoveRow({ move }: { move: PortalMove }) {
  return (
    <div className="flex items-center gap-3 rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-press-box)] p-3">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
        move.direction === 'incoming' ? 'bg-[var(--bsi-success)]' : 'bg-[var(--bsi-danger)]'
      }`} />
      <div className="flex-1 min-w-0">
        <div className="text-[var(--bsi-bone)] text-sm font-medium">{move.name}</div>
        <div className="text-[rgba(196,184,165,0.35)] text-xs">
          {move.position}
          {move.fromTeam && ` · from ${move.fromTeam}`}
          {move.toTeam && ` · to ${move.toTeam}`}
        </div>
      </div>
      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm ${
        move.direction === 'incoming'
          ? 'bg-[var(--bsi-success)]/10 text-[var(--bsi-success)]'
          : 'bg-[var(--bsi-danger)]/10 text-[var(--bsi-danger)]'
      }`}>
        {move.direction}
      </span>
    </div>
  );
}
