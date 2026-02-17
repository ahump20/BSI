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
          <span className="text-white/30 text-sm">{brief.date}</span>
          <span className="text-white/20 text-sm">{brief.readTime}</span>
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-white mb-3">
          {brief.headline}
        </h1>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="font-display text-lg font-bold text-white uppercase">{brief.awayTeam}</p>
              <p className="text-3xl font-display text-white mt-1">{brief.awayScore}</p>
            </div>
            <div className="px-4">
              <span className="text-white/20 text-sm font-display uppercase">
                {isFinal ? 'Final' : 'In Progress'}
              </span>
            </div>
            <div className="text-center flex-1">
              <p className="font-display text-lg font-bold text-white uppercase">{brief.homeTeam}</p>
              <p className="text-3xl font-display text-white mt-1">{brief.homeScore}</p>
            </div>
          </div>
          <p className="text-center text-xs text-white/25 mt-3">{brief.venue}</p>
        </div>
        <p className="text-sm text-white/50 leading-relaxed">{brief.summary}</p>
      </div>

      {/* Leverage Moments */}
      {brief.leverageMoments.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
            Leverage Moments
          </h2>
          <div className="space-y-3">
            {brief.leverageMoments.map((moment, i) => (
              <div
                key={i}
                className="flex gap-4 items-start bg-white/[0.03] border border-white/[0.06] rounded-lg p-4"
              >
                <div className="shrink-0 w-16">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#BF5700]">
                    {moment.inning}
                  </span>
                  <p className="text-xs text-white/20 mt-0.5">{moment.wpShift}</p>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">{moment.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Win Probability Chart Placeholder */}
      {brief.wpChartPlaceholder && (
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
            Win Probability
          </h2>
          <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-xl p-8 text-center">
            <p className="text-sm text-white/30">
              Win probability chart will render here when the WP model is live.
            </p>
            <Link
              href="/models/win-probability"
              className="text-xs text-[#BF5700] hover:text-[#FF6B35] mt-2 inline-block transition-colors"
            >
              Learn about the WP model &#8594;
            </Link>
          </div>
        </section>
      )}

      {/* 3 Stats That Decided It */}
      {brief.decidingStats.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
            {brief.decidingStats.length} Stats That Decided It
          </h2>
          <div className="space-y-3">
            {brief.decidingStats.map((stat, i) => (
              <div
                key={i}
                className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-display text-sm font-bold text-white uppercase">
                      {stat.stat}
                    </span>
                    <span className="text-[#BF5700] font-mono text-sm ml-2">{stat.value}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-white/20">{stat.source}</span>
                    <p className="text-[10px] text-white/15">{stat.timestamp}</p>
                  </div>
                </div>
                <p className="text-sm text-white/40 leading-relaxed">{stat.context}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Attribution */}
      <div className="border-t border-white/10 pt-4 text-xs text-white/20">
        {isFinal && <p>Winner: {winner}</p>}
      </div>
    </article>
  );
}
