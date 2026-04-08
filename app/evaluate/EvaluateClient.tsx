'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { PlayerSearch, type SearchResult } from '@/components/evaluate/PlayerSearch';
import { EvaluationCompare } from '@/components/evaluate/EvaluationCompare';
import { ScrollReveal } from '@/components/cinematic';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EvaluateClient() {
  const router = useRouter();
  const [showCompare, setShowCompare] = useState(false);

  const handlePlayerSelect = (result: SearchResult) => {
    router.push(result.url);
  };

  return (
    <>
      <div>
        {/* Hero */}
        <Section padding="xl" className="pt-8 pb-4">
          <Container>
            <ScrollReveal>
              <div className="text-center max-w-2xl mx-auto">
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wider text-text-primary">
                  Player Evaluation
                </h1>
                <p className="text-text-muted text-sm md:text-base mt-3 font-body max-w-lg mx-auto">
                  Search any player across college baseball, MLB, NFL, and NBA.
                  See where they rank among peers with percentile-based evaluation.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Search */}
        <Section padding="md">
          <Container size="md">
            <ScrollReveal delay={0.1}>
              <Card padding="lg">
                <PlayerSearch
                  onSelect={handlePlayerSelect}
                  autoFocus
                  placeholder="Search any player by name\u2026"
                />
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* How It Works */}
        <Section padding="md">
          <Container>
            <ScrollReveal delay={0.2}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                <Card padding="md" className="text-center">
                  <div className="text-3xl font-display font-bold text-burnt-orange mb-2">1</div>
                  <h3 className="text-sm font-display uppercase tracking-wider text-text-primary mb-1">
                    Search
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    Find any player across four sports with cross-sport search.
                  </p>
                </Card>
                <Card padding="md" className="text-center">
                  <div className="text-3xl font-display font-bold text-burnt-orange mb-2">2</div>
                  <h3 className="text-sm font-display uppercase tracking-wider text-text-primary mb-1">
                    Evaluate
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    See percentile rankings normalized to their sport and position.
                  </p>
                </Card>
                <Card padding="md" className="text-center">
                  <div className="text-3xl font-display font-bold text-burnt-orange mb-2">3</div>
                  <h3 className="text-sm font-display uppercase tracking-wider text-text-primary mb-1">
                    Compare
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    Place any two players side-by-side with mirrored evaluation cards.
                  </p>
                </Card>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Compare Section */}
        <Section padding="lg">
          <Container>
            <ScrollReveal delay={0.3}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg uppercase tracking-wider text-text-primary">
                  Compare Players
                </h2>
                <button
                  onClick={() => setShowCompare(!showCompare)}
                  className="text-xs font-mono text-burnt-orange hover:text-ember transition-colors uppercase tracking-wide"
                >
                  {showCompare ? 'Hide' : 'Show'} Compare Tool
                </button>
              </div>
              {showCompare && <EvaluationCompare />}
            </ScrollReveal>
          </Container>
        </Section>
      </div>
    </>
  );
}
