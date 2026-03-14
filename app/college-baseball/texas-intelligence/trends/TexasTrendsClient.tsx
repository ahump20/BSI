'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';
import { fmt3 } from '@/lib/utils/format';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SparklinePoint {
  date: string;
  hits: number;
  abs: number;
  avg: number;
}

interface TrendPlayer {
  playerId: string;
  name: string;
  position: string;
  seasonStats: { avg: number; woba: number; wrc_plus: number; pa: number };
  rolling: { avg5: number; avg10: number };
  status: 'hot' | 'cold' | 'neutral';
  sparkline: SparklinePoint[];
}

interface TrendsResponse {
  players: TrendPlayer[];
  teamMomentum: {
    last5RunDifferential: number;
    hotPlayers: number;
    coldPlayers: number;
  };
  meta?: { source?: string; fetched_at?: string };
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TEAM_ID = 'texas';
const ACCENT = '#BF5700';

type StatusFilter = 'all' | 'hot' | 'cold' | 'neutral';

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  hot: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-500', label: 'Hot' },
  cold: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-500', label: 'Cold' },
  neutral: { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-500', label: 'Neutral' },
};

// ─── Sparkline Component ────────────────────────────────────────────────────

function MiniSparkline({ data, status }: { data: SparklinePoint[]; status: string }) {
  if (data.length < 2) return null;

  const maxAvg = Math.max(...data.map((d) => d.avg), 0.001);
  const width = 80;
  const height = 24;
  const stepX = width / (data.length - 1);

  const points = data.map((d, i) => `${i * stepX},${height - (d.avg / maxAvg) * height}`).join(' ');
  const color = status === 'hot' ? '#f97316' : status === 'cold' ? '#3b82f6' : '#6b7280';

  return (
    <svg width={width} height={height} className="inline-block" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dot on the last point */}
      {data.length > 0 && (
        <circle
          cx={(data.length - 1) * stepX}
          cy={height - (data[data.length - 1].avg / maxAvg) * height}
          r="2.5"
          fill={color}
        />
      )}
    </svg>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TexasTrendsClient() {
  const meta = teamMetadata[TEAM_ID];
  const espnId = meta?.espnId || '251';
  const logoUrl = getLogoUrl(espnId, meta?.logoId);

  const { data, loading, error } = useSportData<TrendsResponse>(
    '/api/college-baseball/texas-intelligence/trends',
    { timeout: 12000 },
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filtered = useMemo(() => {
    if (!data?.players) return [];
    if (statusFilter === 'all') return data.players;
    return data.players.filter((p) => p.status === statusFilter);
  }, [data, statusFilter]);

  const momentum = data?.teamMomentum;

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
              <span className="text-text-primary">Trends</span>
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
                  <span className="heritage-stamp text-[10px]">Performance Trends</span>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-text-primary mt-1">
                    Hot & Cold Tracker
                  </h1>
                </div>
              </div>
              <p className="text-text-secondary text-sm mt-4 max-w-2xl">
                Rolling averages and momentum metrics — who is carrying the team right now and who is pressing.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Team Momentum Strip */}
        {!loading && momentum && (
          <Section padding="md" borderTop>
            <Container>
              <ScrollReveal direction="up">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border-subtle bg-[var(--surface-dugout)] p-4 text-center">
                    <div
                      className="font-mono text-2xl font-bold"
                      style={{
                        color: momentum.last5RunDifferential > 0 ? '#22c55e'
                          : momentum.last5RunDifferential < 0 ? '#ef4444'
                          : undefined,
                      }}
                    >
                      {momentum.last5RunDifferential > 0 ? '+' : ''}{momentum.last5RunDifferential}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-text-muted mt-1">Run Diff (L5)</div>
                  </div>
                  <div className="rounded-lg border border-border-subtle bg-[var(--surface-dugout)] p-4 text-center">
                    <div className="font-mono text-2xl font-bold text-orange-400">{momentum.hotPlayers}</div>
                    <div className="text-[10px] uppercase tracking-wider text-text-muted mt-1">Hot Bats</div>
                  </div>
                  <div className="rounded-lg border border-border-subtle bg-[var(--surface-dugout)] p-4 text-center">
                    <div className="font-mono text-2xl font-bold text-blue-400">{momentum.coldPlayers}</div>
                    <div className="text-[10px] uppercase tracking-wider text-text-muted mt-1">Cold Bats</div>
                  </div>
                </div>
              </ScrollReveal>
            </Container>
          </Section>
        )}

        {/* Trends Table */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <Card variant="default" padding="lg">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="flex items-center gap-3">
                      <span>Player Trends</span>
                      {filtered.length > 0 && (
                        <Badge variant="accent" size="sm">{filtered.length} players</Badge>
                      )}
                    </CardTitle>
                    <div className="flex gap-2">
                      {(['all', 'hot', 'cold', 'neutral'] as StatusFilter[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => setStatusFilter(f)}
                          className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded transition-colors ${
                            statusFilter === f
                              ? f === 'hot' ? 'bg-orange-500 text-white'
                                : f === 'cold' ? 'bg-blue-500 text-white'
                                : 'bg-burnt-orange text-white'
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
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-12 bg-surface-light rounded animate-pulse" />
                      ))}
                    </div>
                  ) : error || !data?.players ? (
                    <p className="text-text-muted text-sm text-center py-8">Trend data is not available right now.</p>
                  ) : filtered.length === 0 ? (
                    <p className="text-text-muted text-sm text-center py-8">No players match this filter.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-text-muted text-xs uppercase tracking-wider bg-[var(--surface-press-box)]">
                            <th className="text-left py-2 px-2">Player</th>
                            <th className="text-left py-2 px-2">Pos</th>
                            <th className="text-center py-2 px-2">Status</th>
                            <th className="text-right py-2 px-2">AVG</th>
                            <th className="text-right py-2 px-2">L5 AVG</th>
                            <th className="text-right py-2 px-2">L10 AVG</th>
                            <th className="text-right py-2 px-2">wOBA</th>
                            <th className="text-right py-2 px-2">wRC+</th>
                            <th className="text-center py-2 px-2">L10 Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((p) => {
                            const s = STATUS_STYLES[p.status];
                            const avgDelta = p.rolling.avg5 - p.seasonStats.avg;
                            return (
                              <tr key={p.playerId || p.name} className="border-t border-border-subtle hover:bg-surface-light/30 transition-colors">
                                <td className="py-2.5 px-2 text-text-primary font-medium">{p.name}</td>
                                <td className="py-2.5 px-2 text-text-muted text-xs">{p.position}</td>
                                <td className="py-2.5 px-2 text-center">
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded ${s.bg}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${s.text}`}>{s.label}</span>
                                  </span>
                                </td>
                                <td className="py-2.5 px-2 text-right font-mono text-text-secondary">
                                  {fmt3(p.seasonStats.avg)}
                                </td>
                                <td className="py-2.5 px-2 text-right font-mono font-semibold" style={{ color: avgDelta > 0.03 ? '#f97316' : avgDelta < -0.03 ? '#3b82f6' : undefined }}>
                                  {fmt3(p.rolling.avg5)}
                                </td>
                                <td className="py-2.5 px-2 text-right font-mono text-text-secondary">
                                  {fmt3(p.rolling.avg10)}
                                </td>
                                <td className="py-2.5 px-2 text-right font-mono" style={{ color: p.seasonStats.woba > 0.340 ? ACCENT : undefined }}>
                                  {fmt3(p.seasonStats.woba)}
                                </td>
                                <td className="py-2.5 px-2 text-right font-mono" style={{ color: p.seasonStats.wrc_plus >= 100 ? ACCENT : undefined }}>
                                  {Math.round(p.seasonStats.wrc_plus)}
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                  <MiniSparkline data={p.sparkline} status={p.status} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Explainer */}
        <Section padding="md" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="rounded-lg bg-[var(--surface-dugout)] border border-border-subtle p-4">
                <span className="heritage-stamp text-[10px] block mb-2">How This Works</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-text-secondary">
                  <div>
                    <span className="inline-flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-text-primary font-semibold">Hot</span>
                    </span>
                    <p>Last-5-game average is 50+ points above season average. The bat is alive.</p>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-text-primary font-semibold">Cold</span>
                    </span>
                    <p>Last-5-game average is 50+ points below season average. Pressing or fatigued.</p>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-gray-500" />
                      <span className="text-text-primary font-semibold">Neutral</span>
                    </span>
                    <p>Performing within normal range of season averages. Steady contributor.</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

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
      <Footer />
    </>
  );
}
