'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import {
  ProbabilityCalculator,
  ProbabilityDisplay,
  MethodologySection,
  type GameState,
  type ProbabilityResult,
} from '@/components/win-probability';

export default function WinProbabilityPage() {
  const [result, setResult] = useState<ProbabilityResult | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  return (
    <main id="main-content">
      {/* Hero */}
      <Section padding="lg" className="relative overflow-hidden pt-24">
        <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

        <Container>
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Win Probability' }]} />

          <Badge variant="primary" className="mb-4">
            Analytics Tool
          </Badge>

          <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-6">
            Win Probability Calculator
          </h1>

          <p className="text-xl text-text-secondary max-w-3xl leading-relaxed">
            Calculate real-time win probability for any game scenario across CFB, NFL, MLB, and
            college baseball. Built on historical play-by-play data and adjusted power ratings.
          </p>
        </Container>
      </Section>

      {/* Calculator */}
      <Section padding="md" borderTop>
        <Container>
          <div className="grid lg:grid-cols-2 gap-8">
            <ProbabilityCalculator onCalculate={setResult} onGameStateChange={setGameState} />
            <ProbabilityDisplay result={result} gameState={gameState} />
          </div>
        </Container>
      </Section>

      {/* Methodology */}
      <Section padding="lg" background="charcoal" borderTop>
        <Container>
          <h2 className="text-3xl font-display font-bold text-white mb-2">
            Methodology & Data Sources
          </h2>
          <p className="text-text-secondary mb-6 max-w-2xl">
            Transparency matters. Here&apos;s exactly how we calculate win probability.
          </p>
          <MethodologySection />
        </Container>
      </Section>

      {/* CTA */}
      <Section padding="lg" borderTop>
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-display font-bold text-white mb-4">
              Want Live In-Game Probabilities?
            </h2>
            <p className="text-text-secondary mb-8">
              BSI Pro subscribers get real-time win probability updates during live games, plus
              historical trends and advanced situational analysis.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/pricing"
                className="px-6 py-3 bg-burnt-orange text-white rounded-lg font-semibold hover:bg-burnt-orange/90 transition-colors"
              >
                View Pro Features
              </Link>
              <Link
                href="/methodology"
                className="px-6 py-3 border border-burnt-orange text-burnt-orange rounded-lg font-semibold hover:bg-burnt-orange hover:text-white transition-colors"
              >
                Read Full Methodology
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
