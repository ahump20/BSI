'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { TrendingUp, TrendingDown, BarChart3, Zap } from 'lucide-react';
import { getReadApiUrl } from '@/lib/utils/public-api';

/* ── Types ─────────────────────────────────────────────────────────── */

interface PulsePlayer {
  player_id: string;
  player_name: string;
  team: string;
  conference: string | null;
  value: number;
  label: string;
}

interface PulseMovers {
  risers: Array<PulsePlayer & { delta: number }>;
  fallers: Array<PulsePlayer & { delta: number }>;
}

interface ConferenceSnapshot {
  conference: string;
  strength_index: number;
  is_power: number;
  avg_woba: number;
  avg_era: number;
}

interface WeeklyPulseData {
  week: string;
  generated_at: string;
  top_hitters: PulsePlayer[];
  top_pitchers: PulsePlayer[];
  movers_woba: PulseMovers | null;
  movers_fip: PulseMovers | null;
  conference_snapshot: ConferenceSnapshot[];
}

/* ── Helpers ───────────────────────────────────────────────────────── */

function weekLabel(week: string): string {
  // '2026-W13' → 'Week 13, 2026'
  const parts = week.split('-W');
  if (parts.length !== 2) return week;
  return `Week ${parseInt(parts[1], 10)}, ${parts[0]}`;
}

function fmtDelta(delta: number, label: string): string {
  const sign = delta > 0 ? '+' : '';
  if (label === 'wOBA') return `${sign}${delta.toFixed(3)}`;
  return `${sign}${delta.toFixed(2)}`;
}

function fmtValue(value: number, label: string): string {
  if (label === 'wOBA') return value.toFixed(3);
  if (label === 'FIP') return value.toFixed(2);
  if (label === 'wRC+') return value.toFixed(0);
  return value.toFixed(2);
}

/* ── Component ─────────────────────────────────────────────────────── */

export default function WeeklyPulseClient() {
  const [pulse, setPulse] = useState<WeeklyPulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(getReadApiUrl('/api/college-baseball/weekly-pulse'));
        if (!res.ok) throw new Error(`${res.status}`);
        const data = (await res.json()) as WeeklyPulseData;
        setPulse(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      <div>
        <Section padding="lg" className="pt-6">
          <Container>
            {/* Header */}
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-2">
                <Link href="/college-baseball" className="text-bsi-dust hover:text-[var(--bsi-primary)] transition-colors">
                  College Baseball
                </Link>
                <span className="text-bsi-dust">/</span>
                <span className="text-bsi-bone">Weekly Pulse</span>
              </div>

              <div className="mb-8">
                <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-bsi-bone">
                  Weekly <span className="text-[var(--bsi-primary)]">Pulse</span>
                </h1>
                <p className="text-bsi-dust mt-2 max-w-2xl">
                  {pulse ? weekLabel(pulse.week) : 'This week'} in college baseball — top performers, biggest movers, and conference trends.
                  Computed from BSI Savant advanced metrics. No opinions, just numbers.
                </p>
              </div>
            </ScrollReveal>

            {/* Loading */}
            {loading && (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-[var(--bsi-primary)]/30 border-t-[var(--bsi-primary)] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-bsi-dust text-sm">Computing this week&rsquo;s pulse...</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <Card padding="lg" className="text-center">
                <p className="text-bsi-dust">Weekly Pulse data unavailable. The analytics engine may still be computing.</p>
              </Card>
            )}

            {/* Content */}
            {pulse && (
              <div className="space-y-10">
                {/* Top Hitters */}
                <ScrollReveal direction="up" delay={100}>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-[var(--bsi-primary)]" />
                    <h2 className="font-display text-xl font-bold text-bsi-bone uppercase tracking-wide">
                      Top Hitters by wRC+
                    </h2>
                  </div>
                  <div className="grid gap-2">
                    {pulse.top_hitters.map((h, idx) => (
                      <div
                        key={h.player_id}
                        className="flex items-center gap-3 px-4 py-3 bg-surface-dugout rounded border border-border-vintage/20 hover:border-[var(--bsi-primary)]/30 transition-colors"
                      >
                        <span className="text-[var(--bsi-primary)] font-mono font-bold text-sm w-6 text-right">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-bsi-bone font-display font-bold text-sm">
                            {h.player_name}
                          </span>
                          <span className="text-bsi-dust text-xs ml-2">
                            {h.team}{h.conference ? ` · ${h.conference}` : ''}
                          </span>
                        </div>
                        <span className="text-bsi-bone font-mono font-bold text-sm">
                          {fmtValue(h.value, h.label)}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollReveal>

                {/* Top Pitchers */}
                <ScrollReveal direction="up" delay={150}>
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-[var(--bsi-primary)]" />
                    <h2 className="font-display text-xl font-bold text-bsi-bone uppercase tracking-wide">
                      Top Pitchers by FIP
                    </h2>
                  </div>
                  <div className="grid gap-2">
                    {pulse.top_pitchers.map((p, idx) => (
                      <div
                        key={p.player_id}
                        className="flex items-center gap-3 px-4 py-3 bg-surface-dugout rounded border border-border-vintage/20 hover:border-[var(--bsi-primary)]/30 transition-colors"
                      >
                        <span className="text-[var(--bsi-primary)] font-mono font-bold text-sm w-6 text-right">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-bsi-bone font-display font-bold text-sm">
                            {p.player_name}
                          </span>
                          <span className="text-bsi-dust text-xs ml-2">
                            {p.team}{p.conference ? ` · ${p.conference}` : ''}
                          </span>
                        </div>
                        <span className="text-bsi-bone font-mono font-bold text-sm">
                          {fmtValue(p.value, p.label)}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollReveal>

                {/* Movers — wOBA */}
                {pulse.movers_woba && (pulse.movers_woba.risers.length > 0 || pulse.movers_woba.fallers.length > 0) && (
                  <ScrollReveal direction="up" delay={200}>
                    <h2 className="font-display text-xl font-bold text-bsi-bone mb-4 uppercase tracking-wide">
                      Biggest wOBA Movers
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Risers */}
                      {pulse.movers_woba.risers.length > 0 && (
                        <Card padding="md">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 font-display font-bold text-sm uppercase">Rising</span>
                          </div>
                          <div className="space-y-2">
                            {pulse.movers_woba.risers.map(r => (
                              <div key={r.player_id} className="flex items-center justify-between">
                                <div>
                                  <span className="text-bsi-bone text-sm font-bold">{r.player_name}</span>
                                  <span className="text-bsi-dust text-xs ml-2">{r.team}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-bsi-bone font-mono text-sm">{fmtValue(r.value, r.label)}</span>
                                  <span className="text-green-400 font-mono text-xs ml-2">{fmtDelta(r.delta, r.label)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}

                      {/* Fallers */}
                      {pulse.movers_woba.fallers.length > 0 && (
                        <Card padding="md">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingDown className="w-4 h-4 text-red-400" />
                            <span className="text-red-400 font-display font-bold text-sm uppercase">Falling</span>
                          </div>
                          <div className="space-y-2">
                            {pulse.movers_woba.fallers.map(f => (
                              <div key={f.player_id} className="flex items-center justify-between">
                                <div>
                                  <span className="text-bsi-bone text-sm font-bold">{f.player_name}</span>
                                  <span className="text-bsi-dust text-xs ml-2">{f.team}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-bsi-bone font-mono text-sm">{fmtValue(f.value, f.label)}</span>
                                  <span className="text-red-400 font-mono text-xs ml-2">{fmtDelta(f.delta, f.label)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}
                    </div>
                  </ScrollReveal>
                )}

                {/* Movers — FIP */}
                {pulse.movers_fip && (pulse.movers_fip.risers.length > 0 || pulse.movers_fip.fallers.length > 0) && (
                  <ScrollReveal direction="up" delay={250}>
                    <h2 className="font-display text-xl font-bold text-bsi-bone mb-4 uppercase tracking-wide">
                      Biggest FIP Movers
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {pulse.movers_fip.risers.length > 0 && (
                        <Card padding="md">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 font-display font-bold text-sm uppercase">Improving</span>
                          </div>
                          <div className="space-y-2">
                            {pulse.movers_fip.risers.map(r => (
                              <div key={r.player_id} className="flex items-center justify-between">
                                <div>
                                  <span className="text-bsi-bone text-sm font-bold">{r.player_name}</span>
                                  <span className="text-bsi-dust text-xs ml-2">{r.team}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-bsi-bone font-mono text-sm">{fmtValue(r.value, r.label)}</span>
                                  <span className="text-green-400 font-mono text-xs ml-2">{fmtDelta(r.delta, r.label)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}

                      {pulse.movers_fip.fallers.length > 0 && (
                        <Card padding="md">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingDown className="w-4 h-4 text-red-400" />
                            <span className="text-red-400 font-display font-bold text-sm uppercase">Declining</span>
                          </div>
                          <div className="space-y-2">
                            {pulse.movers_fip.fallers.map(f => (
                              <div key={f.player_id} className="flex items-center justify-between">
                                <div>
                                  <span className="text-bsi-bone text-sm font-bold">{f.player_name}</span>
                                  <span className="text-bsi-dust text-xs ml-2">{f.team}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-bsi-bone font-mono text-sm">{fmtValue(f.value, f.label)}</span>
                                  <span className="text-red-400 font-mono text-xs ml-2">{fmtDelta(f.delta, f.label)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}
                    </div>
                  </ScrollReveal>
                )}

                {/* No movers message */}
                {!pulse.movers_woba && !pulse.movers_fip && (
                  <ScrollReveal direction="up" delay={200}>
                    <Card padding="lg" className="text-center">
                      <p className="text-bsi-dust text-sm">
                        Movement tracking starts next week — the system needs two snapshots to calculate who&rsquo;s rising and falling.
                      </p>
                    </Card>
                  </ScrollReveal>
                )}

                {/* Conference Strength */}
                {pulse.conference_snapshot.length > 0 && (
                  <ScrollReveal direction="up" delay={300}>
                    <h2 className="font-display text-xl font-bold text-bsi-bone mb-4 uppercase tracking-wide">
                      Conference Strength This Week
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-surface-press-box text-bsi-dust text-xs uppercase tracking-wider">
                            <th className="text-left px-4 py-3">#</th>
                            <th className="text-left px-3 py-3">Conference</th>
                            <th className="text-center px-3 py-3">BSI Index</th>
                            <th className="text-center px-3 py-3">Avg wOBA</th>
                            <th className="text-center px-3 py-3">Avg ERA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pulse.conference_snapshot.slice(0, 15).map((c, idx) => (
                            <tr key={c.conference} className="border-b border-border-vintage/20 hover:bg-surface-dugout/50 transition-colors">
                              <td className="px-4 py-2 text-bsi-dust font-mono text-xs">{idx + 1}</td>
                              <td className="px-3 py-2">
                                <span className="text-bsi-bone font-display font-bold text-sm">{c.conference}</span>
                                {c.is_power === 1 && (
                                  <span className="text-[10px] uppercase tracking-wider text-[var(--bsi-primary)] border border-[var(--bsi-primary)]/40 px-1 py-0.5 rounded font-bold ml-2">
                                    P5
                                  </span>
                                )}
                              </td>
                              <td className="text-center px-3 py-2 text-[var(--bsi-primary)] font-mono font-bold">{c.strength_index.toFixed(1)}</td>
                              <td className="text-center px-3 py-2 text-bsi-bone font-mono">{c.avg_woba.toFixed(3)}</td>
                              <td className="text-center px-3 py-2 text-bsi-bone font-mono">{c.avg_era.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ScrollReveal>
                )}

                {/* Attribution */}
                <div className="flex justify-center pt-4">
                  <DataAttribution lastUpdated={pulse.generated_at} source="BSI Savant" />
                </div>
              </div>
            )}
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
