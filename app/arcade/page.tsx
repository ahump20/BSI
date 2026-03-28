'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Footer } from '@/components/layout-ds/Footer';
import { FilterPill } from '@/components/ui/FilterPill';
import { useSportData } from '@/lib/hooks/useSportData';
import { withAlpha } from '@/lib/utils/color';
import {
  ARCADE_GAMES,
  ARCADE_CATEGORIES,
  getGamesByCategory,
  type ArcadeCategory,
} from '@/lib/data/arcade-games';

interface LeaderboardEntry {
  name: string;
  score: number;
  avatar: string;
  game_id: string;
  updated_at: string;
}

export default function ArcadePage() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [category, setCategory] = useState<ArcadeCategory | 'all'>('all');

  const filteredGames = getGamesByCategory(category);

  const {
    data: leaderboardData,
    loading: loadingLeaderboard,
    error: leaderboardError,
    retry: retryLeaderboard,
  } = useSportData<{ leaderboard?: LeaderboardEntry[] }>(
    '/api/multiplayer/leaderboard?limit=15',
    { timeout: 5000 }
  );

  const leaderboard = leaderboardData?.leaderboard || [];

  return (
    <div className="min-h-screen bg-[var(--surface-scoreboard)] pt-6">
      <Section padding="lg" className="pt-8 relative overflow-hidden">
        <Container size="wide">
          {/* Header */}
          <div className="relative mb-10">
            <span className="heritage-stamp block mb-3">Arcade</span>
            <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-[var(--bsi-bone)] mb-3">
              Games Hub
            </h1>
            <p className="text-[var(--bsi-primary)] font-serif italic text-lg leading-relaxed max-w-xl">
              Play sports mini-games, compete for high scores, and climb the leaderboard.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            <FilterPill
              active={category === 'all'}
              onClick={() => setCategory('all')}
              size="sm"
            >
              All Games
            </FilterPill>
            {ARCADE_CATEGORIES.map((cat) => (
              <FilterPill
                key={cat.id}
                active={category === cat.id}
                onClick={() => setCategory(cat.id)}
                size="sm"
              >
                {cat.label}
              </FilterPill>
            ))}
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {filteredGames.map((game) => {
              if (game.comingSoon) {
                return (
                  <div key={game.id} className="opacity-60">
                    <Card variant="hover" padding="lg" className="h-full">
                      <div
                        className="w-14 h-14 rounded-sm flex items-center justify-center text-2xl mb-4"
                        style={{ background: withAlpha(game.color, 0.12) }}
                      >
                        {game.icon}
                      </div>
                      <h3 className="font-display text-lg text-[var(--bsi-bone)] uppercase tracking-wide mb-2">
                        {game.title}
                      </h3>
                      <p className="text-sm text-[rgba(196,184,165,0.5)] leading-relaxed">{game.description}</p>
                      <div className="mt-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-sm bg-[var(--surface-press-box)] text-[rgba(196,184,165,0.35)] uppercase tracking-wider">
                          Coming Soon
                        </span>
                      </div>
                    </Card>
                  </div>
                );
              }

              if (game.external) {
                return (
                  <a
                    key={game.id}
                    href={game.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <Card variant="hover" padding="lg" className="h-full transition-all group-hover:border-[rgba(140,98,57,0.5)]">
                      <div
                        className="w-14 h-14 rounded-sm flex items-center justify-center text-2xl mb-4"
                        style={{ background: withAlpha(game.color, 0.12) }}
                      >
                        {game.icon}
                      </div>
                      <h3 className="font-display text-lg text-[var(--bsi-bone)] uppercase tracking-wide mb-2 group-hover:text-[var(--bsi-primary)] transition-colors">
                        {game.title}
                      </h3>
                      <p className="text-sm text-[rgba(196,184,165,0.5)] leading-relaxed">{game.description}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[var(--bsi-primary)]" />
                        <span className="text-xs text-success">Live</span>
                        <span className="text-xs text-[rgba(196,184,165,0.35)] ml-auto">External</span>
                      </div>
                    </Card>
                  </a>
                );
              }

              return (
                <a
                  key={game.id}
                  href={game.url}
                  className="group block"
                >
                  <Card variant="hover" padding="lg" className="h-full transition-all group-hover:border-[rgba(140,98,57,0.5)]">
                    <div
                      className="w-14 h-14 rounded-sm flex items-center justify-center text-2xl mb-4"
                      style={{ background: withAlpha(game.color, 0.12) }}
                    >
                      {game.icon}
                    </div>
                    <h3 className="font-display text-lg text-[var(--bsi-bone)] uppercase tracking-wide mb-2 group-hover:text-[var(--bsi-primary)] transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-sm text-[rgba(196,184,165,0.5)] leading-relaxed">{game.description}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--bsi-primary)]" />
                      <span className="text-xs text-success">Live</span>
                    </div>
                  </Card>
                </a>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2">
              <Card padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl text-[var(--bsi-bone)] uppercase tracking-wide">Leaderboard</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveGame(null)}
                      className={`px-3 py-1 rounded-sm text-xs font-medium transition-colors ${!activeGame ? 'bg-[var(--bsi-primary)] text-white' : 'bg-[var(--surface-press-box)] text-[rgba(196,184,165,0.5)] hover:text-[var(--bsi-bone)]'}`}
                    >
                      All
                    </button>
                    {ARCADE_GAMES.filter((g) => g.deployed && !g.comingSoon).map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setActiveGame(g.id)}
                        className={`px-3 py-1 rounded-sm text-xs font-medium transition-colors ${activeGame === g.id ? 'bg-[var(--bsi-primary)] text-white' : 'bg-[var(--surface-press-box)] text-[rgba(196,184,165,0.5)] hover:text-[var(--bsi-bone)]'}`}
                      >
                        {g.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingLeaderboard ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-10 bg-[var(--surface-press-box)] rounded-sm animate-pulse" />
                    ))}
                  </div>
                ) : leaderboardError ? (
                  <div className="text-center py-8">
                    <p className="text-[rgba(196,184,165,0.35)] mb-3">Leaderboard unavailable</p>
                    <button
                      onClick={retryLeaderboard}
                      className="px-4 py-2 text-sm bg-[var(--bsi-primary)]/20 text-[var(--bsi-primary)] rounded-sm hover:bg-[var(--bsi-primary)]/30 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <p className="text-center text-[rgba(196,184,165,0.35)] py-8">No scores yet. Be the first to play!</p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard
                      .filter((e) => !activeGame || e.game_id === activeGame)
                      .map((entry, i) => (
                        <div
                          key={`${entry.name}-${entry.game_id}-${i}`}
                          className="flex items-center gap-3 px-3 py-2 rounded-sm bg-[var(--surface-press-box)] hover:bg-[var(--surface-press-box)] transition-colors"
                        >
                          <span className={`w-6 text-center font-bold text-sm ${i < 3 ? 'text-[var(--bsi-primary)]' : 'text-[rgba(196,184,165,0.35)]'}`}>
                            {i + 1}
                          </span>
                          <span className="text-lg">{entry.avatar}</span>
                          <span className="flex-1 text-sm text-[var(--bsi-bone)] font-medium truncate">{entry.name}</span>
                          <span className="text-xs text-[rgba(196,184,165,0.35)] uppercase">{entry.game_id}</span>
                          <span className="text-sm font-bold text-[var(--bsi-primary)] tabular-nums">{entry.score.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                )}
              </Card>
            </div>

            {/* How to Play */}
            <Card padding="lg">
              <h3 className="font-display text-lg text-[var(--bsi-bone)] uppercase tracking-wide mb-4">How It Works</h3>
              <div className="space-y-4">
                <Step num={1} text="Pick a game from the hub above" />
                <Step num={2} text="Play and score points" />
                <Step num={3} text="Your high score posts to the global leaderboard" />
                <Step num={4} text="Compete against other BSI users" />
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--border-vintage)]">
                <p className="text-xs text-[rgba(196,184,165,0.35)]">Scores persist across sessions. Only your highest score per game counts.</p>
              </div>
            </Card>
          </div>
        </Container>
      </Section>
      <Footer />
    </div>
  );
}

function Step({ num, text }: { num: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-[var(--bsi-primary)]/20 text-[var(--bsi-primary)] flex items-center justify-center text-xs font-bold shrink-0">
        {num}
      </span>
      <p className="text-sm text-[rgba(196,184,165,0.5)]">{text}</p>
    </div>
  );
}
