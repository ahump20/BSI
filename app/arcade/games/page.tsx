'use client';

import Link from 'next/link';

interface ArcadeGame {
  id: string;
  title: string;
  description: string;
  route: string;
  externalUrl: string;
  status: string;
}

const ARCADE_GAMES: ArcadeGame[] = [
  {
    id: 'blitz',
    title: 'Blaze Blitz Football',
    description: 'Arcade football with fast drives, jukes, and explosive plays.',
    route: '/arcade/games/blitz',
    externalUrl: 'https://blazecraft.app/mini-games/games/blitz',
    status: 'Live',
  },
  {
    id: 'hotdog-dash',
    title: 'Hotdog Dash',
    description: 'Outrun the pack in a quick sprint built for mobile reflexes.',
    route: '/arcade/games/hotdog-dash',
    externalUrl: 'https://blazecraft.app/mini-games/games/hotdog-dash',
    status: 'Live',
  },
  {
    id: 'sandlot-sluggers',
    title: 'Sandlot Sluggers',
    description: 'Step into the batter’s box for rapid-fire baseball action.',
    route: '/arcade/games/sandlot-sluggers',
    externalUrl: 'https://blazecraft.app/mini-games/games/sandlot-sluggers',
    status: 'Live',
  },
];

export default function ArcadeGamesPage() {
  return (
    <main className="min-h-screen bg-midnight pt-24 md:pt-28 pb-16">
      <section className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span
              className="inline-block mb-4 px-3 py-1 rounded text-xs font-display uppercase tracking-widest"
              style={{ background: 'rgba(255, 107, 53, 0.2)', color: '#FF6B35' }}
            >
              BlazeCraft Arcade
            </span>
            <h1 className="text-4xl md:text-5xl font-display text-white uppercase tracking-wide">
              Mini Game Routes
            </h1>
            <p className="text-white/60 mt-4 max-w-2xl">
              Select a game to launch the embedded experience or open the full BlazeCraft arcade.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/arcade"
              className="btn-secondary px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wide"
            >
              Back to Arcade
            </Link>
            <a
              href="https://blazecraft.app?source=bsi-arcade"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wide"
              style={{ background: '#FDB913', color: '#0D0D12' }}
            >
              Launch BlazeCraft
            </a>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mt-12">
          {ARCADE_GAMES.map((game) => (
            <div
              key={game.id}
              className="glass-elevated rounded-xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-display text-white">{game.title}</h2>
                  <span className="text-xs uppercase tracking-widest text-white/60">
                    {game.status}
                  </span>
                </div>
                <p className="text-white/60">{game.description}</p>
              </div>
              <div className="flex flex-col gap-3 mt-6">
                <Link
                  href={game.route}
                  className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold uppercase tracking-wide"
                  style={{ background: 'rgba(255,255,255,0.12)', color: '#FFFFFF' }}
                >
                  Play Embedded
                </Link>
                <a
                  href={`${game.externalUrl}?source=bsi-arcade`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold uppercase tracking-wide"
                  style={{ background: '#FF6B35', color: '#0D0D12' }}
                >
                  Open Fullscreen
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
