'use client';

import { useRef, useEffect, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent } from '@/components/ui/Card';
import {
  MarketGrowthChart,
  SportDistributionChart,
  GenderEquityChart,
  CollectiveGrowthChart,
} from './NILCharts';

/* -- Staggered entrance hook --------------------------------------------- */

function useStaggeredReveal(count: number, delayMs = 150) {
  const [revealed, setRevealed] = useState<boolean[]>(Array(count).fill(false));

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < count; i++) {
      timers.push(
        setTimeout(() => {
          setRevealed((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, i * delayMs)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [count, delayMs]);

  return revealed;
}

/* -- Headline stat pill -------------------------------------------------- */

function HeadlineStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={`text-xl md:text-2xl font-mono font-bold ${
          accent ? 'text-[var(--bsi-primary)]' : 'text-[var(--bsi-bone)]'
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-[rgba(196,184,165,0.35)] mt-0.5">
        {label}
      </div>
    </div>
  );
}

/* -- Component ----------------------------------------------------------- */

export function NILDashboardClient() {
  const revealed = useStaggeredReveal(4, 200);

  return (
    <Section className="py-16">
      <Container>
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display text-[var(--bsi-bone)] mb-4">
            Market Data
          </h2>
          <p className="text-[rgba(196,184,165,0.5)] max-w-2xl mx-auto mb-8">
            Four years of verified NIL market data. Every chart sourced from the research paper.
          </p>

          {/* At-a-glance headline stats */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 py-4 px-6 rounded-sm bg-[var(--surface-press-box)] border border-[var(--border-vintage)] max-w-2xl mx-auto">
            <HeadlineStat label="Year 4 Market" value="$2.26B" accent />
            <div className="w-px bg-border hidden md:block" />
            <HeadlineStat label="Active Collectives" value="200+" />
            <div className="w-px bg-border hidden md:block" />
            <HeadlineStat label="Women Top-100" value="52%" accent />
            <div className="w-px bg-border hidden md:block" />
            <HeadlineStat label="Football Share" value="44.5%" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {[
            <MarketGrowthChart key="growth" />,
            <SportDistributionChart key="sport" />,
            <GenderEquityChart key="gender" />,
            <CollectiveGrowthChart key="collective" />,
          ].map((chart, i) => (
            <Card
              key={i}
              className={`transition-all duration-700 ${
                revealed[i]
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
            >
              <CardContent className="p-6">{chart}</CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
