'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ScrollReveal } from '@/components/cinematic';
import { useSportData } from '@/lib/hooks/useSportData';
import { fmt3, fmtInt } from '@/lib/utils/format';
import {
  type Editorial,
  type EditorialListResponse,
  getEditorialHref,
  readTime,
} from '@/lib/editorial';

interface LeaderboardRow {
  player_name?: string;
  name?: string;
  team?: string;
  woba?: number | null;
  wrc_plus?: number | null;
  obp?: number | null;
}

interface LeaderboardResponse {
  data: LeaderboardRow[];
  meta?: { source?: string; fetched_at?: string; timezone?: string };
}

const PROOF_POINTS = [
  'Every D1 team gets the same treatment as the blue-bloods.',
  'Park factors, conference strength, and run-value metrics live in the same product surface.',
  'Scores, standings, editorial, and scouting context stay connected instead of scattered across tabs.',
];

const FALLBACK_EDITORIAL: Editorial = {
  id: 1,
  slug: 'texas-week-6-recap',
  date: '2026-03-24',
  title: 'Texas Week 6: Punched, Then Answered',
  preview:
    'The Longhorns took the hit, settled the game back down, and looked like a club built for the long run of conference play.',
  teams: ['Texas'],
  wordCount: 1850,
  createdAt: '2026-03-24',
};

export function FlagshipProof() {
  const { data: savantData } = useSportData<LeaderboardResponse>(
    '/api/savant/batting/leaderboard?limit=4&sort=woba&dir=desc',
    { refreshInterval: 300_000 }
  );
  const { data: editorialData } = useSportData<EditorialListResponse>(
    '/api/college-baseball/editorial/list',
    { refreshInterval: 300_000 }
  );

  const leaders = useMemo(() => savantData?.data?.slice(0, 3) ?? [], [savantData]);
  const featuredArticle = editorialData?.editorials?.[0] ?? FALLBACK_EDITORIAL;

  return (
    <section data-home-flagship className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <ScrollReveal direction="up">
            <div className="max-w-xl">
              <span className="heritage-stamp">Flagship Surface</span>
              <h2
                className="mt-4 font-display text-3xl font-bold uppercase tracking-[0.04em] sm:text-4xl"
                style={{ color: 'var(--bsi-bone)' }}
              >
                College Baseball Leads The Product
              </h2>
              <p className="mt-5 font-serif text-base leading-relaxed sm:text-lg" style={{ color: 'var(--bsi-dust)' }}>
                The clearest way to understand BSI is to start with the flagship. Savant gives the numbers.
                Editorial gives the read. The route ties both together so you can move from raw production to actual baseball meaning.
              </p>

              <div className="mt-8 space-y-4 border-t border-[rgba(245,240,235,0.08)] pt-6">
                {PROOF_POINTS.map((point) => (
                  <div key={point} className="flex gap-3">
                    <span className="mt-1 text-[11px]" style={{ color: 'var(--bsi-primary)' }}>
                      &#9670;
                    </span>
                    <p className="font-serif text-sm leading-relaxed sm:text-base" style={{ color: 'var(--bsi-bone)' }}>
                      {point}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="border-t border-[rgba(245,240,235,0.12)] pt-3">
                  <p className="led-stat text-3xl font-bold">330</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
                    D1 Teams
                  </p>
                </div>
                <div className="border-t border-[rgba(245,240,235,0.12)] pt-3">
                  <p className="led-stat text-3xl font-bold">6h</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
                    Recompute Cadence
                  </p>
                </div>
                <div className="border-t border-[rgba(245,240,235,0.12)] pt-3">
                  <p className="led-stat text-3xl font-bold">24/7</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
                    Editorial Context
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/college-baseball/savant" className="btn-heritage-fill px-5 py-3 text-sm">
                  Open BSI Savant
                </Link>
                <Link href="/college-baseball/editorial" className="btn-heritage px-5 py-3 text-sm">
                  Read Editorial
                </Link>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={120}>
            <div className="space-y-5">
              <div className="heritage-card overflow-hidden p-6 sm:p-7" style={{ borderTop: '2px solid var(--bsi-primary)' }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="heritage-stamp">Savant Snapshot</span>
                    <h3 className="mt-3 font-display text-xl font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--bsi-bone)' }}>
                      Current Batting Leaders
                    </h3>
                  </div>
                  <Link
                    href="/college-baseball/savant"
                    className="text-xs font-semibold uppercase tracking-[0.18em]"
                    style={{ color: 'var(--heritage-columbia-blue)' }}
                  >
                    Full Leaderboard
                  </Link>
                </div>

                <div className="mt-6 space-y-4">
                  {leaders.length > 0 ? (
                    leaders.map((player, index) => {
                      const playerName = player.player_name || player.name || 'Player';
                      return (
                        <div
                          key={`${playerName}-${index}`}
                          className="grid items-center gap-3 border-b border-[rgba(245,240,235,0.08)] pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[44px_minmax(0,1fr)_84px_72px]"
                        >
                          <div className="led-stat text-2xl font-bold">{index + 1}</div>
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--bsi-bone)' }}>
                              {playerName}
                            </p>
                            <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
                              {player.team || 'College Baseball'}
                            </p>
                          </div>
                          <div className="sm:text-right">
                            <p className="led-stat text-xl font-bold">{fmt3(player.woba ?? player.obp ?? 0)}</p>
                            <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
                              wOBA
                            </p>
                          </div>
                          <div className="sm:text-right">
                            <p className="led-stat text-xl font-bold">{fmtInt(player.wrc_plus ?? 0)}</p>
                            <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
                              wRC+
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="border-t border-[rgba(245,240,235,0.1)] pt-3">
                        <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--bsi-primary)', fontFamily: 'var(--bsi-font-data)' }}>
                          Reach Base
                        </p>
                        <p className="mt-2 font-serif text-sm leading-relaxed" style={{ color: 'var(--bsi-bone)' }}>
                          OBP, walk rate, and contact quality show who actually controls an at-bat.
                        </p>
                      </div>
                      <div className="border-t border-[rgba(245,240,235,0.1)] pt-3">
                        <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--bsi-primary)', fontFamily: 'var(--bsi-font-data)' }}>
                          Create Runs
                        </p>
                        <p className="mt-2 font-serif text-sm leading-relaxed" style={{ color: 'var(--bsi-bone)' }}>
                          wOBA and wRC+ separate real offensive value from empty batting average noise.
                        </p>
                      </div>
                      <div className="border-t border-[rgba(245,240,235,0.1)] pt-3">
                        <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--bsi-primary)', fontFamily: 'var(--bsi-font-data)' }}>
                          Adjust Context
                        </p>
                        <p className="mt-2 font-serif text-sm leading-relaxed" style={{ color: 'var(--bsi-bone)' }}>
                          Park effects and conference strength keep the leaderboard honest.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <p className="mt-5 text-[10px]" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
                  Source: {savantData?.meta?.source || 'BSI Savant'}
                  {savantData?.meta?.fetched_at && (
                    <>
                      {' '}
                      · Updated{' '}
                      {new Date(savantData.meta.fetched_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZone: 'America/Chicago',
                      })}{' '}
                      CT
                    </>
                  )}
                </p>
              </div>

              <Link href={getEditorialHref(featuredArticle)} className="group block">
                <article className="heritage-card p-6 sm:p-7 transition-transform duration-300 group-hover:-translate-y-1">
                  <span className="heritage-stamp">Featured Read</span>
                  <h3 className="mt-3 font-display text-xl font-bold uppercase leading-snug tracking-[0.06em] text-[var(--bsi-bone)] transition-colors group-hover:text-burnt-orange">
                    {featuredArticle.title}
                  </h3>
                  <p className="mt-3 font-serif text-sm leading-relaxed sm:text-base" style={{ color: 'var(--bsi-dust)' }}>
                    {featuredArticle.preview}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
                    <span>{featuredArticle.date}</span>
                    <span>&#9670;</span>
                    <span>{readTime(featuredArticle.wordCount)}</span>
                    <span>&#9670;</span>
                    <span>{featuredArticle.teams?.[0] || 'National'}</span>
                  </div>
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--heritage-columbia-blue)' }}>
                    Read The Story &rarr;
                  </p>
                </article>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
