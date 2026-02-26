'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

interface LeverageMoment {
  inning: string;
  description: string;
  wpShift: string;
}

interface DecidingStat {
  stat: string;
  value: string;
  context: string;
  source: string;
  timestamp: string;
}

interface GameBriefData {
  slug: string;
  sport: string;
  date: string;
  readTime: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  venue: string;
  headline: string;
  summary: string;
  leverageMoments: LeverageMoment[];
  decidingStats: DecidingStat[];
  wpChartPlaceholder?: boolean;
}

export type { GameBriefData };

/**
 * GameBrief — structured post-game analysis template.
 * Sections: score context, leverage moments, WP chart placeholder, deciding stats.
 */
export function GameBrief({ brief }: { brief: GameBriefData }) {
  const winner = brief.homeScore > brief.awayScore ? brief.homeTeam : brief.awayTeam;
  const isFinal = brief.homeScore !== brief.awayScore;

  return (
    <article className="max-w-3xl">
      {/* Score Context */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant="primary">{brief.sport}</Badge>
          <span className="text-text-muted text-sm">{brief.date}</span>
          <span className="text-text-muted text-sm">{brief.readTime}</span>
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-text-primary mb-3">
          {brief.headline}
        </h1>
        <div className="bg-surface-light border border-border-subtle rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="font-display text-lg font-bold text-text-primary uppercase">{brief.awayTeam}</p>
              <p className="text-3xl font-display text-text-primary mt-1">{brief.awayScore}</p>
            </div>
            <div className="px-4">
              <span className="text-text-muted text-sm font-display uppercase">
                {isFinal ? 'Final' : 'In Progress'}
              </span>
            </div>
            <div className="text-center flex-1">
              <p className="font-display text-lg font-bold text-text-primary uppercase">{brief.homeTeam}</p>
              <p className="text-3xl font-display text-text-primary mt-1">{brief.homeScore}</p>
            </div>
          </div>
          <p className="text-center text-xs text-text-muted mt-3">{brief.venue}</p>
        </div>
        <p className="text-sm text-text-muted leading-relaxed">{brief.summary}</p>
      </div>

      {/* Leverage Moments */}
      {brief.leverageMoments.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-text-primary mb-4">
            Leverage Moments
          </h2>
          <div className="space-y-3">
            {brief.leverageMoments.map((moment, i) => (
              <div
                key={i}
                className="flex gap-4 items-start bg-surface-light border border-border-subtle rounded-lg p-4"
              >
                <div className="shrink-0 w-16">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-burnt-orange">
                    {moment.inning}
                  </span>
                  <p className="text-xs text-text-muted mt-0.5">{moment.wpShift}</p>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">{moment.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Win Probability Chart Placeholder */}
      {brief.wpChartPlaceholder && (
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-text-primary mb-4">
            Win Probability
          </h2>
          <div className="bg-white/[0.02] border border-dashed border-border rounded-xl p-8 text-center">
            <p className="text-sm text-text-muted">
              Win probability chart will render here when the WP model is live.
            </p>
            <Link
              href="/models/win-probability"
              className="text-xs text-burnt-orange hover:text-ember mt-2 inline-block transition-colors"
            >
              Learn about the WP model &#8594;
            </Link>
          </div>
        </section>
      )}

      {/* 3 Stats That Decided It */}
      {brief.decidingStats.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-text-primary mb-4">
            {brief.decidingStats.length} Stats That Decided It
          </h2>
          <div className="space-y-3">
            {brief.decidingStats.map((stat, i) => (
              <div
                key={i}
                className="bg-surface-light border border-border-subtle rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-display text-sm font-bold text-text-primary uppercase">
                      {stat.stat}
                    </span>
                    <span className="text-burnt-orange font-mono text-sm ml-2">{stat.value}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-text-muted">{stat.source}</span>
                    <p className="text-[10px] text-text-muted">{stat.timestamp}</p>
                  </div>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">{stat.context}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Attribution */}
      <div className="border-t border-border pt-4 text-xs text-text-muted">
        {isFinal && <p>Winner: {winner}</p>}
      </div>
    </article>
  );
}
