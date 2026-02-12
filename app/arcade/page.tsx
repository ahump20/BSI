'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Footer } from '@/components/layout-ds/Footer';

interface LeaderboardEntry {
  name: string;
  score: number;
  avatar: string;
  game_id: string;
  updated_at: string;
}

const GAMES = [
  {
    id: 'blitz',
    title: 'Blaze Blitz',
    description: 'Call plays and drive downfield in this fast-paced football strategy game.',
    color: '#FF6B35',
    icon: '🏈',
    url: '/games/blitz/',
    deployed: true,
  },
  {
    id: 'sandlot-sluggers',
    title: 'Sandlot Sluggers',
    description: 'Time your swing to crush pitches. Streak multipliers and home run bonuses.',
    color: '#BF5700',
    icon: '⚾',
    url: '/games/sandlot-sluggers/',
    deployed: true,
  },
  {
    id: 'downtown-doggies',
    title: 'Downtown Doggies',
    description: '3-point contest. 5 racks, 25 shots. Hit the green zone to drain threes.',
    color: '#FDB913',
    icon: '🏀',
    url: '/games/downtown-doggies/',
    deployed: true,
  },
  {
    id: 'hotdog-dash',
    title: 'Blaze Hot Dog',
    description: 'Guide your dachshund through the stadium. Dodge obstacles, collect hot dogs.',
    color: '#CD5C5C',
    icon: '🌭',
    url: '/games/hotdog-dash/',
    deployed: true,
  },
  {
    id: 'leadership-capital',
    title: 'Leadership Capital Index',
    description: '23 intangible leadership metrics mapped to 5 academic frameworks. Quantify the It Factor.',
    color: '#BF5700',
    icon: '📊',
    url: '/games/leadership-capital/',
    deployed: true,
  },
];

export default function ArcadePage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    fetch('/api/multiplayer/leaderboard?limit=15')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { leaderboard?: LeaderboardEntry[] }) => {
        setLeaderboard(data.leaderboard || []);
      })
      .catch(() => {})
      .finally(() => setLoadingLeaderboard(false));
  }, []);

  return (
    <main id="main-content" className="min-h-screen bg-midnight pt-24 md:pt-28">
      <Section padding="lg" className="pt-8">
        <Container size="wide">
          {/* Header */}
          <div className="mb-10">
            <span className="inline-block mb-3 px-3 py-1 rounded text-xs font-display uppercase tracking-widest bg-[#BF5700]/15 text-[#BF5700]">
              Arcade
            </span>
            <h1 className="text-4xl md:text-5xl font-display text-white uppercase tracking-tight mb-3">
              Games Hub
            </h1>
            <p className="text-white/60 max-w-xl">
              Play sports mini-games, compete for high scores, and climb the leaderboard.
            </p>
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {GAMES.map((game) => (
              <a
                key={game.id}
                href={game.url}
                className="group block"
              >
                <Card variant="hover" padding="lg" className="h-full transition-all group-hover:border-white/20">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4"
                    style={{ background: `${game.color}20` }}
                  >
                    {game.icon}
                  </div>
                  <h3 className="font-display text-lg text-white uppercase tracking-wide mb-2 group-hover:text-[#BF5700] transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed">{game.description}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs text-green-400/80">Live</span>
                  </div>
                </Card>
              </a>
            ))}
          </div>

          {/* Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2">
              <Card padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl text-white uppercase tracking-wide">Leaderboard</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveGame(null)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${!activeGame ? 'bg-[#BF5700] text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}
                    >
                      All
                    </button>
                    {GAMES.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setActiveGame(g.id)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${activeGame === g.id ? 'bg-[#BF5700] text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}
                      >
                        {g.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingLeaderboard ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
                    ))}
                  </div>
                ) : leaderboard.length === 0 ? (
                  <p className="text-center text-white/40 py-8">No scores yet. Be the first to play!</p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard
                      .filter((e) => !activeGame || e.game_id === activeGame)
                      .map((entry, i) => (
                        <div
                          key={`${entry.name}-${entry.game_id}-${i}`}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/5 transition-colors"
                        >
                          <span className={`w-6 text-center font-bold text-sm ${i < 3 ? 'text-[#BF5700]' : 'text-white/30'}`}>
                            {i + 1}
                          </span>
                          <span className="text-lg">{entry.avatar}</span>
                          <span className="flex-1 text-sm text-white font-medium truncate">{entry.name}</span>
                          <span className="text-xs text-white/30 uppercase">{entry.game_id}</span>
                          <span className="text-sm font-bold text-[#BF5700] tabular-nums">{entry.score.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                )}
              </Card>
            </div>

            {/* How to Play */}
            <Card padding="lg">
              <h3 className="font-display text-lg text-white uppercase tracking-wide mb-4">How It Works</h3>
              <div className="space-y-4">
                <Step num={1} text="Pick a game from the hub above" />
                <Step num={2} text="Play and score points" />
                <Step num={3} text="Your high score posts to the global leaderboard" />
                <Step num={4} text="Compete against other BSI users" />
              </div>
              <div className="mt-6 pt-4 border-t border-white/5">
                <p className="text-xs text-white/30">Scores persist across sessions. Only your highest score per game counts.</p>
              </div>
            </Card>
          </div>
        </Container>
      </Section>
      <Footer />
    </main>
  );
}

function Step({ num, text }: { num: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-[#BF5700]/20 text-[#BF5700] flex items-center justify-center text-xs font-bold shrink-0">
        {num}
      </span>
      <p className="text-sm text-white/60">{text}</p>
    </div>
  );
}
