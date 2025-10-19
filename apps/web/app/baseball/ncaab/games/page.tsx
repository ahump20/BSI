import type { Metadata } from 'next';
import Link from 'next/link';

import { getLiveGames } from '../../../../lib/baseball/games';
import { recordRuntimeEvent } from '../../../../lib/observability/datadog-runtime';
import { InningTabs } from './_components/InningTabs';
import { LeverageMeter } from './_components/LeverageMeter';
import { LiveGamesHeader } from './_components/LiveGamesHeader';
import { PlayByPlayList } from './_components/PlayByPlayList';

export const revalidate = 60;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://blazesportsintel.com';

export const metadata: Metadata = {
  title: 'NCAA Baseball Live Games — Diamond Insights',
  description:
    'Mobile-first live NCAA baseball scoreboard tracking leverage index, inning state, and play-by-play for Division I matchups.',
  openGraph: {
    title: 'NCAA Baseball Live Games — Diamond Insights',
    description:
      'Track leverage swings, inning-by-inning momentum, and play-by-play from NCAA Division I baseball matchups in real time.',
    url: `${siteUrl}/baseball/ncaab/games`,
    siteName: 'Diamond Insights',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og/baseball-live-games.png`,
        width: 1200,
        height: 630,
        alt: 'Diamond Insights NCAA Baseball Live Game Center',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NCAA Baseball Live Games — Diamond Insights',
    description:
      'Follow leverage moments and play-by-play from every active Division I baseball game across the Deep South.',
    images: [`${siteUrl}/og/baseball-live-games.png`],
  },
};

function buildScoreboardJsonLd(games: Awaited<ReturnType<typeof getLiveGames>>) {
  const events = games.map((game) => ({
    '@type': 'SportsEvent',
    name: `${game.away.name} at ${game.home.name}`,
    startDate: game.startsAt,
    endDate: game.status === 'final' ? game.updatedAt : undefined,
    eventStatus:
      game.status === 'final'
        ? 'https://schema.org/EventCompleted'
        : game.status === 'scheduled'
          ? 'https://schema.org/EventScheduled'
          : 'https://schema.org/EventInProgress',
    location: game.venue
      ? {
          '@type': 'Place',
          name: game.venue,
        }
      : undefined,
    competitor: [
      {
        '@type': 'SportsTeam',
        name: game.away.name,
        sport: 'Baseball',
        memberOf: 'NCAA Division I',
      },
      {
        '@type': 'SportsTeam',
        name: game.home.name,
        sport: 'Baseball',
        memberOf: 'NCAA Division I',
      },
    ],
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name: 'Diamond Insights NCAA Baseball Live',
    url: `${siteUrl}/baseball/ncaab/games`,
    sport: 'Baseball',
    memberOf: 'NCAA Division I',
    event: events,
  };
}

function createInningTabs(game: Awaited<ReturnType<typeof getLiveGames>>[number]) {
  if (game.plays.length === 0) {
    return [
      {
        inning: game.inning ?? 1,
        half: game.half ?? 'Top',
        targetId: `${game.slug || game.id}-plays-empty`,
        isCurrent: true,
      } as const,
    ];
  }

  const uniqueKeys = Array.from(new Set(game.plays.map((play) => `${play.inning}-${play.half}`)));
  const sortedKeys = [...uniqueKeys].sort((a, b) => {
    const [inningA, halfA] = a.split('-');
    const [inningB, halfB] = b.split('-');
    const inningDiff = Number(inningA) - Number(inningB);
    if (inningDiff !== 0) {
      return inningDiff;
    }
    if (halfA === halfB) {
      return 0;
    }
    return halfA === 'Top' ? -1 : 1;
  });

  return sortedKeys.map((key) => {
    const [inning, half] = key.split('-');
    const isCurrent =
      Number(inning) === game.inning && (game.half ?? 'Top').toLowerCase() === half.toLowerCase();
    return {
      inning: Number(inning) || 0,
      half: (half === 'Bottom' ? 'Bottom' : 'Top') as 'Top' | 'Bottom',
      targetId: `plays-inning-${inning}-${half.toLowerCase()}`,
      isCurrent,
    };
  });
}

export default async function BaseballGamesPage() {
  const games = await getLiveGames();
  const scoreboardJsonLd = buildScoreboardJsonLd(games);

  void recordRuntimeEvent(
    'route_render',
    {
      route: '/baseball/ncaab/games',
      sport: 'baseball',
      league: 'ncaab',
    },
    {
      gameCount: games.length,
    },
  );

  return (
    <div className="di-shell">
      <main className="di-container gap-8">
        <LiveGamesHeader gameCount={games.length} />

        <section className="flex flex-col gap-6">
          <h2 className="sr-only">Live game cards</h2>

          {games.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/50 p-8 text-center text-sm text-slate-300">
              Live slate is quiet right now. Highlightly ingestion refreshes every 60 seconds—check back for leverage alerts.
            </div>
          ) : (
            <ul className="flex flex-col gap-8" aria-label="Live NCAA baseball games">
              {games.map((game) => {
                const inningTabs = createInningTabs(game);
                const detailHref = game.slug ? `/baseball/ncaab/games/${game.slug}` : undefined;

                return (
                  <li
                    key={game.id}
                    className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl ring-1 ring-black/40"
                  >
                    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                      <article className="flex flex-col gap-6" aria-labelledby={`${game.id}-scorecard`}>
                        <header className="flex flex-col gap-4" id={`${game.id}-scorecard`}>
                          <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-slate-900/80 p-4">
                            <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 sm:gap-6">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex flex-col">
                                  <span className="text-xs uppercase tracking-[0.4em] text-amber-300/80">Away</span>
                                  <span className="text-lg font-semibold text-slate-100">{game.away.name}</span>
                                  {game.away.record ? (
                                    <span className="text-xs text-slate-400">{game.away.record}</span>
                                  ) : null}
                                </div>
                                <span className="text-3xl font-bold text-slate-100 sm:text-4xl">{game.away.score}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex flex-col">
                                  <span className="text-xs uppercase tracking-[0.4em] text-amber-300/80">Home</span>
                                  <span className="text-lg font-semibold text-slate-100">{game.home.name}</span>
                                  {game.home.record ? (
                                    <span className="text-xs text-slate-400">{game.home.record}</span>
                                  ) : null}
                                </div>
                                <span className="text-3xl font-bold text-slate-100 sm:text-4xl">{game.home.score}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                              <span className="rounded-full border border-emerald-400/60 bg-emerald-400/10 px-3 py-1 font-semibold uppercase tracking-wide text-emerald-300">
                                {game.status === 'final'
                                  ? 'Final'
                                  : game.status === 'scheduled'
                                    ? 'Scheduled'
                                    : `Live · ${(game.half ?? 'Top') + ' ' + (game.inning ?? 1)}`}
                              </span>
                              {game.venue ? <span>{game.venue}</span> : null}
                              <span>Updated {new Date(game.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                              {detailHref ? (
                                <Link
                                  className="inline-flex items-center gap-2 rounded-full border border-amber-400/60 px-3 py-1 text-amber-200 transition hover:bg-amber-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                                  href={detailHref}
                                >
                                  View detail
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        </header>

                        <div className="flex flex-col gap-4">
                          <LeverageMeter
                            half={game.half}
                            inning={game.inning}
                            leverageIndex={game.leverageIndex}
                            startsAt={game.startsAt}
                            status={game.status}
                          />
                          <InningTabs innings={inningTabs} />
                          <PlayByPlayList gameSlug={game.slug || game.id} plays={game.plays} />
                        </div>
                      </article>

                      <aside className="flex flex-col justify-between gap-4 rounded-2xl border border-white/5 bg-slate-900/60 p-5">
                        <div className="flex flex-col gap-3">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-300/90">Momentum Signals</h3>
                          <p className="text-sm text-slate-300">
                            Win probability shifts update every minute. Staff alerts trigger when leverage crosses 70 or a tying run is on base.
                          </p>
                        </div>
                        <div className="grid gap-3 text-sm text-slate-300">
                          <div className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2">
                            <span className="text-xs uppercase tracking-wide text-slate-400">Current leverage</span>
                            <span className="text-lg font-semibold text-amber-200">
                              {Math.max(0, Math.round(game.leverageIndex ?? 0))}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2">
                            <span className="text-xs uppercase tracking-wide text-slate-400">Next refresh</span>
                            <span className="text-sm text-slate-200">≤ 60s</span>
                          </div>
                          <div className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2">
                            <span className="text-xs uppercase tracking-wide text-slate-400">Last updated</span>
                            <span className="text-sm text-slate-200">
                              {new Date(game.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </aside>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(scoreboardJsonLd) }}
          type="application/ld+json"
        />
      </main>
    </div>
  );
}
