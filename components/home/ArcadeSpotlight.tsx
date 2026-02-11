'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LeaderboardEntry {
  name: string;
  score: number;
  avatar: string;
  game_id: string;
}

const GAMES = [
  {
    id: 'blitz',
    title: 'Blaze Blitz',
    description: 'Call plays and drive downfield in this fast-paced football strategy game.',
    color: '#FF6B35',
    icon: '🏈',
    url: '/games/blitz/',
  },
  {
    id: 'sandlot-sluggers',
    title: 'Sandlot Sluggers',
    description: 'Time your swing to crush pitches. Streak multipliers and home run bonuses.',
    color: '#BF5700',
    icon: '⚾',
    url: '/games/sandlot-sluggers/',
  },
  {
    id: 'downtown-doggies',
    title: 'Downtown Doggies',
    description: '3-point contest. 5 racks, 25 shots. Hit the green zone to drain threes.',
    color: '#FDB913',
    icon: '🏀',
    url: '/games/downtown-doggies/',
  },
  {
    id: 'hotdog-dash',
    title: 'Blaze Hot Dog',
    description: 'Guide your dachshund through the stadium. Dodge obstacles, collect hot dogs.',
    color: '#CD5C5C',
    icon: '🌭',
    url: '/games/hotdog-dash/',
  },
];

export function ArcadeSpotlight() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const featured = GAMES[new Date().getDate() % GAMES.length];

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/multiplayer/leaderboard?limit=50`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { leaderboard?: LeaderboardEntry[] }) => {
        setLeaderboard(data.leaderboard || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const topEntries = leaderboard.filter((e) => e.game_id === featured.id).slice(0, 3);

  return (
    <div className="glass-card-hover p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Featured game */}
        <div className="lg:w-2/5 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-display uppercase tracking-widest bg-[#BF5700]/15 text-[#BF5700] rounded">
              Arcade
            </span>
            <span className="text-xs text-white/30">Featured today</span>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${featured.color}20` }}
            >
              {featured.icon}
            </div>
            <div>
              <h3 className="font-display text-2xl text-white uppercase tracking-wide">
                {featured.title}
              </h3>
              <p className="text-sm text-white/50 mt-1">{featured.description}</p>
            </div>
          </div>

          <a href={featured.url} className="btn-primary px-6 py-3 text-sm rounded-lg mt-2 w-fit">
            PLAY NOW
          </a>
        </div>

        {/* Leaderboard preview */}
        <div className="lg:w-3/5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-display text-sm text-white/60 uppercase tracking-wider">
              Top Players — {featured.title}
            </h4>
            <Link
              href="/arcade"
              className="text-xs text-[#BF5700] hover:text-[#FF6B35] transition-colors"
            >
              View all games
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          ) : topEntries.length === 0 ? (
            <p className="text-sm text-white/30 py-6 text-center">
              No scores yet — be the first!
            </p>
          ) : (
            <div className="space-y-2">
              {topEntries.map((entry, i) => (
                <div
                  key={`${entry.name}-${i}`}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/[0.03] hover:bg-white/5 transition-colors"
                >
                  <span
                    className={`w-6 text-center font-bold text-sm ${
                      i === 0 ? 'text-[#FDB913]' : i === 1 ? 'text-white/50' : 'text-[#CD7F32]'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="text-lg">{entry.avatar}</span>
                  <span className="flex-1 text-sm text-white font-medium truncate">
                    {entry.name}
                  </span>
                  <span className="text-sm font-bold text-[#BF5700] tabular-nums">
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
