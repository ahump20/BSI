'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { DataFreshnessIndicator } from '@/components/ui/DataFreshnessIndicator';

interface SportHeroProps {
  sport: string;
  leagueName: string;
  tagline: string;
  description: string;
  accentColor?: string;
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
  accentColor,
  dataSource,
  refreshInterval = 30,
  primaryCta,
  secondaryCta,
  stats,
}: SportHeroProps) {
  const gradientStyle = accentColor
    ? `from-[${accentColor}]/20 via-transparent to-transparent`
    : 'from-burnt-orange/15 via-transparent to-transparent';

  return (
    <Section padding="lg" className="relative overflow-hidden">
      <div
        className={`absolute inset-0 bg-gradient-radial ${gradientStyle} pointer-events-none`}
      />

      <Container center>
        <ScrollReveal direction="up">
          <Badge variant="success" className="mb-4">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
            {leagueName}
          </Badge>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={100}>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-center uppercase tracking-display mb-4">
            {sport} <span className="text-gradient-blaze">Intelligence</span>
          </h1>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={120}>
          <DataFreshnessIndicator
            source={dataSource}
            refreshInterval={refreshInterval}
          />
        </ScrollReveal>

        <ScrollReveal direction="up" delay={150}>
          <p className="text-gold font-semibold text-lg tracking-wide text-center mb-4">
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
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 glass-card rounded-2xl">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-4">
                <div className="font-display text-3xl font-bold text-burnt-orange">
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
