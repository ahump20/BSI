'use client';

import Link from 'next/link';

interface ArcadeGame {
  id: string;
  title: string;
  description: string;
  url: string;
  color: string;
  icon: string;
}

const ARCADE_GAMES: ArcadeGame[] = [
  {
    id: 'blitz',
    title: 'Blaze Blitz Football',
    description: 'Arcade football with fast drives, jukes, and explosive plays.',
    url: '/games/blitz/',
    color: 'var(--bsi-accent)',
    icon: '\uD83C\uDFC8',
  },
  {
    id: 'sandlot-sluggers',
    title: 'Sandlot Sluggers',
    description: 'Step into the batter\'s box for timing-based baseball action.',
    url: '/games/sandlot-sluggers/',
    color: 'var(--bsi-primary)',
    icon: '\u26BE',
  },
  {
    id: 'downtown-doggies',
    title: 'Downtown Doggies',
    description: '3-point shooting contest. 5 racks, hit the timing window to score.',
    url: '/games/downtown-doggies/',
    color: '#FDB913',
    icon: '\uD83C\uDFC0',
  },
  {
    id: 'hotdog-dash',
    title: 'Blaze Hot Dog',
    description: 'Dodge and dash through stadium lanes. Collect hot dogs, grow your chonk.',
    url: '/games/hotdog-dash/',
    color: '#CD5C5C',
    icon: '\uD83C\uDF2D',
  },
];

export default function ArcadeGamesPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-scoreboard)] pt-6 pb-16">
      <section className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span
              className="inline-block mb-4 px-3 py-1 rounded-sm text-xs font-display uppercase tracking-widest bg-[var(--bsi-primary)]/20 text-[var(--bsi-primary)]"
            >
              BSI Arcade
            </span>
            <h1 className="text-4xl md:text-5xl font-display text-[var(--bsi-bone)] uppercase tracking-wide">
              Mini Games
            </h1>
            <p className="text-[var(--bsi-dust)] mt-4 max-w-2xl">
              Pick a game and compete for the leaderboard. All games run in your browser.
            </p>
          </div>
          <Link
            href="/arcade"
            className="btn-secondary px-6 py-3 rounded-sm text-sm font-semibold uppercase tracking-wide"
          >
            Back to Arcade
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-12">
          {ARCADE_GAMES.map((game) => (
            <a
              key={game.id}
              href={game.url}
              className="heritage-card rounded-sm p-6 flex flex-col justify-between group hover:border-[rgba(140,98,57,0.5)] transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{game.icon}</span>
                  <span className="w-2 h-2 rounded-full bg-[var(--bsi-primary)]" />
                </div>
                <h2 className="text-lg font-display text-[var(--bsi-bone)] uppercase tracking-wide mb-2 group-hover:text-[var(--bsi-primary)] transition-colors">
                  {game.title}
                </h2>
                <p className="text-sm text-[rgba(196,184,165,0.5)]">{game.description}</p>
              </div>
              <div className="mt-6">
                <span
                  className="inline-flex items-center justify-center rounded-sm px-4 py-2 text-sm font-semibold uppercase tracking-wide w-full"
                  style={{ background: game.color, color: '#0D0D12' }}
                >
                  Play Now
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
