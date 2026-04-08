'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { withAlpha } from '@/lib/utils/color';
import { getDeployedGames } from '@/lib/data/arcade-games';

export default function ArcadeGamesPage() {
  const games = getDeployedGames();

  return (
    <div className="min-h-screen bg-midnight pt-6">
      <Section padding="lg" className="pt-8">
        <Container size="wide">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
            <div>
              <span className="section-label block mb-3">BSI Arcade</span>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-text-primary mb-3">
                Mini Games
              </h1>
              <p className="text-text-tertiary max-w-2xl text-sm leading-relaxed">
                Pick a game and compete for the leaderboard. All games run in your browser.
              </p>
            </div>
            <Link
              href="/arcade"
              className="btn-heritage px-5 py-2.5 rounded-sm text-sm font-semibold uppercase tracking-wide self-start"
            >
              Back to Arcade Hub
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {games.map((game) => (
              <a
                key={game.id}
                href={game.url}
                className="group block"
              >
                <Card variant="hover" padding="lg" className="h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="w-12 h-12 rounded-sm flex items-center justify-center text-2xl"
                        style={{ background: withAlpha(game.color, 0.12) }}
                      >
                        {game.icon}
                      </div>
                      <span className="w-2 h-2 rounded-full bg-[var(--bsi-primary)]" />
                    </div>
                    <h2 className="text-lg font-display text-text-primary uppercase tracking-wide mb-2 group-hover:text-burnt-orange transition-colors">
                      {game.title}
                    </h2>
                    <p className="text-sm text-text-tertiary leading-relaxed">{game.description}</p>
                  </div>
                  <div className="mt-5">
                    <span className="btn-heritage-fill inline-flex items-center justify-center rounded-sm px-4 py-2 text-sm font-semibold uppercase tracking-wide w-full">
                      Play Now
                    </span>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </Container>
      </Section>
    </div>
  );
}
