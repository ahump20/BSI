'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { DataFreshnessIndicator } from '@/components/ui/DataFreshnessIndicator';
import { HeroGlow } from '@/components/ui/HeroGlow';

interface SportHeroProps {
  sport: string;
  leagueName: string;
  tagline: string;
  description: string;

  dataSource: string;
  refreshInterval?: number;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  stats: Array<{ value: string; label: string }>;
}

export function SportHero({
  sport,
  leagueName,
  tagline,
  description,

  dataSource,
  refreshInterval = 30,
  primaryCta,
  secondaryCta,
  stats,
}: SportHeroProps) {
  return (
    <Section padding="lg" className="relative overflow-hidden">
      <HeroGlow shape="70% 60%" position="50% 30%" intensity={0.08} />

      <Container center>
        <ScrollReveal direction="up">
          <span className="section-label block mb-4 text-center">{leagueName}</span>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={100}>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-center uppercase tracking-display text-text-primary mb-4">
            {sport} Intelligence
          </h1>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={120}>
          <DataFreshnessIndicator
            source={dataSource}
            refreshInterval={refreshInterval}
          />
        </ScrollReveal>

        <ScrollReveal direction="up" delay={150}>
          <p className="text-burnt-orange font-serif italic text-lg leading-relaxed text-center mb-4">
            {tagline}
          </p>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={200}>
          <p className="text-text-secondary text-center max-w-2xl mx-auto mb-8">
            {description}
          </p>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={250}>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href={primaryCta.href}>
              <Button variant="primary" size="lg">
                {primaryCta.label}
              </Button>
            </Link>
            <Link href={secondaryCta.href}>
              <Button variant="secondary" size="lg">
                {secondaryCta.label}
              </Button>
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={300}>
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 heritage-card">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-4">
                <div className="font-mono text-3xl font-bold text-burnt-orange">
                  {stat.value}
                </div>
                <div className="text-xs uppercase tracking-wider text-text-tertiary mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}
