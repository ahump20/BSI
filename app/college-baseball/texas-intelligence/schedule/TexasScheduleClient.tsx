'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Game {
  id: string;
  date: string;
  opponent: string;
  isHome: boolean;
  status: string;
  detail: string;
  score: { home: number; away: number } | null;
  result: string | null;
}

interface ScheduleResponse {
  schedule: Game[];
  meta?: { source?: string; fetched_at?: string };
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TEAM_ID = 'texas';
const ACCENT = '#BF5700';
const ESPN_ID = '251';

type ViewMode = 'all' | 'completed' | 'upcoming';

export default function TexasScheduleClient() {
  const meta = teamMetadata[TEAM_ID];
  const espnId = meta?.espnId || ESPN_ID;
  const logoUrl = getLogoUrl(espnId, meta?.logoId);

  const { data, loading, error } = useSportData<ScheduleResponse>(
    `/api/college-baseball/teams/${TEAM_ID}/schedule`,
    { timeout: 10000 },
  );

  const [view, setView] = useState<ViewMode>('all');

  const games = useMemo(() => data?.schedule ?? [], [data]);

  const completed = useMemo(() => games.filter((g) => g.result), [games]);
  const upcoming = useMemo(() => games.filter((g) => !g.result), [games]);

  const displayGames = useMemo(() => {
    if (view === 'completed') return completed;
    if (view === 'upcoming') return upcoming;
    return games;
  }, [view, games, completed, upcoming]);

  const record = useMemo(() => {
    let w = 0, l = 0;
    for (const g of completed) {
      if (g.result === 'W') w++;
      else if (g.result === 'L') l++;
    }
    return { w, l };
  }, [completed]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        timeZone: 'America/Chicago',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

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
              <span className="text-text-primary">Schedule</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden bg-[var(--surface-scoreboard)]">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: ACCENT }} />
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-4 mb-4">
                <img src={logoUrl} alt="" className="w-12 h-12 object-contain" loading="lazy" />
                <div>
                  <Badge variant="primary" size="sm">{new Date().getFullYear()} Season</Badge>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-text-primary mt-1">
                    Schedule <span className="text-gradient-blaze">& Results</span>
                  </h1>
                </div>
              </div>
            </ScrollReveal>

            {/* Record Summary */}
            {completed.length > 0 && (
              <ScrollReveal direction="up" delay={100}>
                <div className="grid grid-cols-3 gap-4 mt-6 max-w-md">
                  <Card variant="default" padding="sm" className="text-center">
                    <div className="font-mono text-2xl font-bold" style={{ color: ACCENT }}>{record.w}-{record.l}</div>
                    <div className="text-text-muted text-xs uppercase tracking-wide mt-1">Record</div>
                  </Card>
                  <Card variant="default" padding="sm" className="text-center">
                    <div className="font-mono text-2xl font-bold text-text-primary">{completed.length}</div>
                    <div className="text-text-muted text-xs uppercase tracking-wide mt-1">Played</div>
                  </Card>
                  <Card variant="default" padding="sm" className="text-center">
                    <div className="font-mono text-2xl font-bold text-text-primary">{upcoming.length}</div>
                    <div className="text-text-muted text-xs uppercase tracking-wide mt-1">Remaining</div>
                  </Card>
                </div>
              </ScrollReveal>
            )}
          </Container>
        </Section>

        {/* View Toggle */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <div className="flex gap-2">
              {(['all', 'completed', 'upcoming'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setView(mode)}
                  className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                    view === mode
                      ? 'bg-burnt-orange/15 text-burnt-orange border border-burnt-orange/30'
                      : 'text-text-muted hover:text-text-primary border border-transparent'
                  }`}
                >
                  {mode === 'all' ? `All (${games.length})` : mode === 'completed' ? `Results (${completed.length})` : `Upcoming (${upcoming.length})`}
                </button>
              ))}
            </div>
          </Container>
        </Section>

        {/* Loading */}
        {loading && (
          <Section padding="lg">
            <Container>
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-14 bg-surface-light rounded animate-pulse" />
                ))}
              </div>
            </Container>
          </Section>
        )}

        {/* Error */}
        {error && !loading && (
          <Section padding="lg">
            <Container>
              <Card padding="lg" className="text-center">
                <p className="text-text-muted">Unable to load schedule. Try refreshing.</p>
              </Card>
            </Container>
          </Section>
        )}

        {/* Games List */}
        {!loading && displayGames.length > 0 && (
          <Section padding="lg">
            <Container>
              <div className="space-y-2">
                {displayGames.map((game) => {
                  const isWin = game.result === 'W';
                  const isLoss = game.result === 'L';
                  const isDone = !!game.result;

                  return (
                    <ScrollReveal key={game.id} direction="up">
                      <Card variant="default" padding="sm" className="relative overflow-hidden">
                        {isDone && (
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1"
                            style={{ backgroundColor: isWin ? '#16a34a' : isLoss ? '#dc2626' : 'var(--border)' }}
                          />
                        )}
                        <CardContent>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="text-text-muted text-xs font-mono w-20 shrink-0">
                                {formatDate(game.date)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-text-primary text-sm font-medium truncate">
                                  {game.isHome ? 'vs' : '@'} {game.opponent}
                                </div>
                                {game.detail && (
                                  <div className="text-text-muted text-xs truncate">{game.detail}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {isDone && game.score && (
                                <span className="font-mono text-sm text-text-primary">
                                  {game.score.home}-{game.score.away}
                                </span>
                              )}
                              {isDone && (
                                <Badge
                                  variant={isWin ? 'accent' : 'secondary'}
                                  size="sm"
                                >
                                  {game.result}
                                </Badge>
                              )}
                              {!isDone && (
                                <span className="text-text-muted text-xs font-mono">
                                  {game.status === 'pre' ? 'Scheduled' : game.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  );
                })}
              </div>
              {data?.meta && <DataSourceBadge source={data.meta.source} timestamp={data.meta.fetched_at} />}
            </Container>
          </Section>
        )}
      </main>
      <Footer />
    </>
  );
}
