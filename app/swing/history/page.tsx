'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SPORT_MODELS, type SwingSport } from '@/lib/swing/sport-models';
import { getHistoryLimit, FREE_HISTORY_LIMIT } from '@/lib/swing/usage-gate';

interface SwingHistoryEntry {
  swingId: string;
  sport: SwingSport;
  overallScore: number;
  createdAt: string;
  metrics: { key: string; value: number; score: number; label: string }[];
}

export default function SwingHistoryPage() {
  const [history, setHistory] = useState<SwingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const bsiKey = localStorage.getItem('bsi-api-key');
        const headers: Record<string, string> = {};
        if (bsiKey) headers['X-BSI-Key'] = bsiKey;

        const [historyRes, usageRes] = await Promise.all([
          fetch('/api/swing/history', { headers }),
          fetch('/api/swing/usage', { headers }),
        ]);

        if (historyRes.ok) {
          const data = (await historyRes.json()) as { swings: SwingHistoryEntry[] };
          setHistory(data.swings || []);
        }
        if (usageRes.ok) {
          const usage = (await usageRes.json()) as { isPro: boolean };
          setIsPro(usage.isPro);
        }
      } catch {
        // Not critical
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="bsi-theme-baseball">
      <Section padding="lg">
        <Container>
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="heritage-stamp text-xs mb-2 block">Swing Intelligence</span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-bsi-bone">
                Swing History
              </h1>
            </div>
            <Link href="/swing/analyze">
              <Button variant="primary" size="sm">New Analysis</Button>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-sm bg-surface-dugout border border-border-subtle p-6 animate-pulse">
                  <div className="h-5 bg-white/[0.06] rounded-sm w-48 mb-3" />
                  <div className="h-3 bg-white/[0.04] rounded-sm w-32" />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <Card variant="default" padding="lg">
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-sm bg-burnt-orange/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-8 h-8 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold uppercase text-bsi-bone mb-2">
                    No Swings Yet
                  </h3>
                  <p className="text-xs text-bsi-dust mb-6">
                    Record and analyze your first swing to start tracking progress.
                  </p>
                  <Link href="/swing/analyze">
                    <Button variant="primary">Analyze Your First Swing</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {history.map((entry, i) => {
                const model = SPORT_MODELS[entry.sport];
                const limit = getHistoryLimit(isPro);
                const isLocked = limit !== undefined && i >= limit;

                return (
                  <motion.div
                    key={entry.swingId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative"
                  >
                    <Card variant="hover" padding="md">
                      <CardContent>
                        <div className={`flex items-center justify-between ${isLocked ? 'blur-sm select-none' : ''}`}>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="heritage-stamp text-[9px]">{model.displayName}</span>
                              <span className="text-[10px] text-text-muted font-mono">
                                {new Date(entry.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              {entry.metrics.slice(0, 4).map((m) => (
                                <span key={m.key} className="text-[10px] text-text-muted">
                                  {m.label}: <strong className="text-bsi-dust">{m.value}</strong>
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-2xl font-bold font-display ${
                                entry.overallScore >= 80
                                  ? 'text-[var(--bsi-success)]'
                                  : entry.overallScore >= 50
                                    ? 'text-[var(--bsi-warning)]'
                                    : 'text-[var(--bsi-danger)]'
                              }`}
                            >
                              {entry.overallScore}
                            </div>
                            <span className="text-[9px] text-text-muted font-mono uppercase">Score</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-sm bg-surface-scoreboard/60">
                        <div className="text-center">
                          <svg viewBox="0 0 24 24" className="w-5 h-5 text-text-muted mx-auto mb-1" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          <a href="/pricing" className="text-[10px] text-burnt-orange hover:text-ember font-mono uppercase tracking-wider transition-colors">
                            Upgrade for full history
                          </a>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {!isPro && history.length > FREE_HISTORY_LIMIT && (
                <div className="text-center py-4">
                  <p className="text-xs text-text-muted mb-2">
                    Showing {FREE_HISTORY_LIMIT} of {history.length} swings
                  </p>
                  <a href="/pricing" className="text-xs text-burnt-orange hover:text-ember font-mono uppercase tracking-wider transition-colors">
                    Upgrade to Pro for full history →
                  </a>
                </div>
              )}
            </div>
          )}
        </Container>
      </Section>
    </div>
  );
}
