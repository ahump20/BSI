'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import type {
  DailyBundle,
  UpcomingGame,
  PriorNightResult,
} from '@/lib/types/daily-bundle';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function teamDisplay(team: { team: string; rank?: string | null }) {
  return team.rank ? `#${team.rank} ${team.team}` : team.team;
}

function oddsText(game: UpcomingGame): string | null {
  const { betting_odds } = game;
  if (!betting_odds.book) return null;
  const { away, home } = betting_odds.moneyline;
  if (away == null && home == null) return null;
  const fmt = (n: number | null) => (n == null ? '—' : n > 0 ? `+${n}` : `${n}`);
  return `${fmt(away)} / ${fmt(home)}`;
}

// ---------------------------------------------------------------------------
// Narrative section — renders plain text with paragraph breaks
// ---------------------------------------------------------------------------

function NarrativeSection({ text, heading }: { text: string | null | undefined; heading?: string }) {
  if (!text) return null;
  const paragraphs = text.split('\n\n').filter(Boolean);
  return (
    <Section padding="lg" borderTop>
      <Container>
        <ScrollReveal direction="up">
          {heading && (
            <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-text-primary">{heading}</h2>
          )}
          <div className="max-w-3xl space-y-4">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-text-secondary leading-relaxed font-body text-base">{p}</p>
            ))}
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Upcoming game card
// ---------------------------------------------------------------------------

function UpcomingGameCard({ game }: { game: UpcomingGame }) {
  const isRanked = game.away.rank || game.home.rank;
  const odds = oddsText(game);

  return (
    <Card variant="default" padding="md" className={isRanked ? 'border-burnt-orange/30 bg-burnt-orange/5' : ''}>
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Time + Broadcast */}
        <div className="md:w-24 flex-shrink-0 text-center">
          <div className="font-mono text-lg font-bold text-burnt-orange">{game.start_time_local}</div>
          {game.broadcast && <div className="text-text-muted text-xs mt-1">{game.broadcast}</div>}
        </div>

        {/* Matchup */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display text-lg font-bold text-text-primary uppercase">{teamDisplay(game.away)}</span>
            <span className="text-text-muted text-sm">at</span>
            <span className="font-display text-lg font-bold text-text-primary uppercase">{teamDisplay(game.home)}</span>
          </div>
          {game.venue && <div className="text-text-muted text-xs">{game.venue}</div>}
          {(game.away.probable_pitcher.player || game.home.probable_pitcher.player) && (
            <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
              {game.away.probable_pitcher.player && (
                <span>{game.away.team}: {game.away.probable_pitcher.player}{game.away.probable_pitcher.hand && ` (${game.away.probable_pitcher.hand})`}</span>
              )}
              {game.home.probable_pitcher.player && (
                <span>{game.home.team}: {game.home.probable_pitcher.player}{game.home.probable_pitcher.hand && ` (${game.home.probable_pitcher.hand})`}</span>
              )}
            </div>
          )}
          {game.matchup_notes.travel_or_rest_if_verified.length > 0 && (
            <div className="mt-2">
              {game.matchup_notes.travel_or_rest_if_verified.map((note, i) => (
                <div key={i} className="text-yellow-400/60 text-xs italic">{note}</div>
              ))}
            </div>
          )}
        </div>

        {/* Odds */}
        <div className="md:w-32 flex-shrink-0 text-right">
          {odds ? (
            <div>
              <div className="text-text-tertiary text-xs uppercase mb-1">Moneyline</div>
              <div className="font-mono text-sm text-text-primary">{odds}</div>
              <div className="text-text-muted text-[10px] mt-1">{game.betting_odds.book}</div>
            </div>
          ) : (
            <div className="text-text-muted text-xs">Odds N/A</div>
          )}
        </div>
      </div>

      {game.matchup_notes.data_quality_flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border-subtle">
          {game.matchup_notes.data_quality_flags.map((flag) => (
            <Badge key={flag} variant="secondary" size="sm">{flag.replace(/_/g, ' ')}</Badge>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Prior-night result card
// ---------------------------------------------------------------------------

function ResultCard({ result }: { result: PriorNightResult }) {
  return (
    <Card variant="default" padding="md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-bold text-text-primary uppercase">{result.final.away}</span>
            <span className="font-mono text-2xl font-bold text-text-muted">{result.final.score_away}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-display text-lg font-bold text-text-primary uppercase">{result.final.home}</span>
            <span className="font-mono text-2xl font-bold text-burnt-orange">{result.final.score_home}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="grid grid-cols-3 gap-4 text-xs text-text-muted mb-1">
            <span>R</span><span>H</span><span>E</span>
          </div>
          <div className="grid grid-cols-3 gap-4 font-mono text-sm text-text-tertiary">
            <span>{result.rhe.away.r}</span><span>{result.rhe.away.h}</span><span>{result.rhe.away.e}</span>
          </div>
          <div className="grid grid-cols-3 gap-4 font-mono text-sm text-text-primary mt-1">
            <span>{result.rhe.home.r}</span><span>{result.rhe.home.h}</span><span>{result.rhe.home.e}</span>
          </div>
        </div>
      </div>

      {result.key_events_verified.length > 0 && (
        <div className="pt-3 border-t border-border-subtle space-y-2">
          {result.key_events_verified.map((evt, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              {evt.inning && <Badge variant="secondary" size="sm">{evt.inning}</Badge>}
              <span className="text-text-tertiary">{evt.description}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export function DailyClient({ date }: { date: string }) {
  const [data, setData] = useState<DailyBundle | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/college-baseball/daily/${date}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((d) => { setData(d as DailyBundle); setLoading(false); })
      .catch((e) => { if (e.name !== 'AbortError') { setErr(e.message); setLoading(false); } });
    return () => controller.abort();
  }, [date]);

  if (loading) {
    return (
      <>
        <div className="pt-6">
          <Section padding="lg">
            <Container>
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-surface-medium rounded w-1/3" />
                <div className="h-4 bg-surface-light rounded w-2/3" />
                <div className="h-64 bg-surface-light rounded" />
              </div>
            </Container>
          </Section>
        </div>
        <Footer />
      </>
    );
  }

  if (err || !data) {
    return (
      <>
        <div className="pt-6">
          <Section padding="lg">
            <Container>
              <h1 className="font-display text-3xl font-bold uppercase text-text-primary mb-4">Daily Report Unavailable</h1>
              <p className="text-text-tertiary">
                No daily bundle is available for {formatDate(date)}.{' '}
                {err && <span className="text-error">Error: {err}</span>}
              </p>
              <Link href="/college-baseball" className="text-burnt-orange hover:text-ember transition-colors mt-4 inline-block">
                Back to College Baseball
              </Link>
            </Container>
          </Section>
        </div>
        <Footer />
      </>
    );
  }

  const { upcoming_games, prior_night_results, sources_used, search_queries_used } = data;
  const rankedUpcoming = upcoming_games.filter(g => g.away.rank || g.home.rank);

  return (
    <>
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">College Baseball</Link>
              <span className="text-text-muted">/</span>
              <Link href="/college-baseball/editorial" className="text-text-muted hover:text-burnt-orange transition-colors">Editorial</Link>
              <span className="text-text-muted">/</span>
              <span className="text-text-primary">Daily Report</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/8 via-transparent to-[#C9A227]/5 pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="primary">Daily Report</Badge>
                  <span className="text-text-muted text-sm">{formatDate(data.run_date_local)}</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide mb-6">
                  NCAA Baseball <span className="text-gradient-blaze">Daily</span>
                </h1>
                <p className="text-text-tertiary text-lg leading-relaxed">
                  {upcoming_games.length} games on today&apos;s slate.{' '}
                  {rankedUpcoming.length > 0 && `${rankedUpcoming.length} featuring ranked teams. `}
                  {prior_night_results.length > 0 && `${prior_night_results.length} results from last night.`}
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Pregame Narrative */}
        <NarrativeSection text={data.narrative_pregame} heading="Today's Preview" />

        {/* Today's Slate */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2 text-text-primary">Today&apos;s Slate</h2>
              <p className="text-text-muted mb-8">{formatDate(data.run_date_local)} — {data.timezone}</p>
            </ScrollReveal>
            <div className="space-y-4">
              {upcoming_games.map((game) => (
                <ScrollReveal key={game.game_key} direction="up">
                  <UpcomingGameCard game={game} />
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* Recap Narrative */}
        <NarrativeSection text={data.narrative_recap} heading="Last Night's Analysis" />

        {/* Last Night's Results */}
        {prior_night_results.length > 0 && (
          <Section padding="lg" borderTop>
            <Container>
              <ScrollReveal direction="up">
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2 text-text-primary">Last Night</h2>
                <p className="text-text-muted mb-8">{formatDate(data.lookback_date_local)} Results</p>
              </ScrollReveal>
              <div className="space-y-4">
                {prior_night_results.map((result) => (
                  <ScrollReveal key={result.game_key} direction="up">
                    <ResultCard result={result} />
                  </ScrollReveal>
                ))}
              </div>
            </Container>
          </Section>
        )}

        {/* Data Sources & Queries */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 text-text-primary" data-testid="data-sources">
                Data Sources &amp; Queries
              </h2>
            </ScrollReveal>

            <div className="mb-8">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-text-muted mb-4">
                Sources Used ({sources_used.length})
              </h3>
              <div className="space-y-2">
                {sources_used.map((src, i) => (
                  <div key={i} className="bg-surface-light border border-border-subtle rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" size="sm">{src.source_type}</Badge>
                      <span className="text-text-muted text-xs">{src.used_for.join(', ')}</span>
                    </div>
                    <a href={src.url} target="_blank" rel="noopener noreferrer"
                      className="text-burnt-orange hover:text-ember text-xs break-all transition-colors">
                      {src.url}
                    </a>
                    <p className="text-text-muted text-xs mt-1">{src.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-text-muted mb-4">
                Search Queries ({search_queries_used.length})
              </h3>
              <div className="space-y-1">
                {search_queries_used.map((q, i) => (
                  <div key={i} className="font-mono text-xs text-text-muted bg-surface-light px-3 py-1.5 rounded">{q}</div>
                ))}
              </div>
            </div>
          </Container>
        </Section>

        {/* Data Quality Notes */}
        {data.data_quality_notes && (
          <Section padding="md" borderTop>
            <Container>
              <details className="text-xs text-text-muted">
                <summary className="cursor-pointer hover:text-text-secondary transition-colors font-display uppercase tracking-wider">
                  Data Quality Notes
                </summary>
                <pre className="mt-2 bg-surface-light rounded p-3 overflow-x-auto font-mono text-[11px] leading-relaxed">
                  {JSON.stringify(data.data_quality_notes, null, 2)}
                </pre>
              </details>
            </Container>
          </Section>
        )}

        {/* Footer Attribution */}
        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <DataSourceBadge source="Verified Daily Bundle" timestamp={`${data.run_date_local} CT`} />
              <div className="flex gap-4">
                <Link href="/college-baseball/editorial" className="text-sm text-burnt-orange hover:text-ember transition-colors">More Editorial</Link>
                <Link href="/college-baseball/scores" className="text-sm text-text-muted hover:text-text-primary transition-colors">Live Scores</Link>
              </div>
            </div>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
