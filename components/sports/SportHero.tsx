'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { DataFreshnessIndicator } from '@/components/ui/DataFreshnessIndicator';
import { HeroBg } from '@/components/ui/HeroBg';
import { HeroGlow } from '@/components/ui/HeroGlow';

/** Sport-specific accent colors for radial glow tinting */
const SPORT_GLOW: Record<string, string> = {
  'college-baseball': 'rgba(107,142,35,0.12)',
  'college baseball': 'rgba(107,142,35,0.12)',
  'mlb': 'rgba(191,87,0,0.12)',
  'nfl': 'rgba(53,94,59,0.12)',
  'nba': 'rgba(226,88,34,0.12)',
  'cfb': 'rgba(139,69,19,0.12)',
  'college football': 'rgba(139,69,19,0.12)',
};

function getSportGlow(sport: string): string {
  return SPORT_GLOW[sport.toLowerCase()] ?? 'rgba(191,87,0,0.1)';
}

interface SportHeroProps {
  sport: string;
  leagueName: string;
  tagline: string;
  description: string;
  icon?: string;

  dataSource: string;
  refreshInterval?: number;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  stats: Array<{ value: string; label: string }>;
  /** Optional R2 background image for Heritage atmosphere. Falls back to HeroGlow. */
  heroBg?: { bucket: 'brand' | 'images'; imagePath: string; opacity?: number };
}

export function SportHero({
  sport,
  leagueName,
  tagline,
  description,
  icon,

  dataSource,
  refreshInterval = 30,
  primaryCta,
  secondaryCta,
  stats,
  heroBg,
}: SportHeroProps) {
  const content = (
    <div className="py-12 md:py-16">
      <Container center>
        <ScrollReveal direction="up">
          <span
            className="block mb-4 text-center text-[10px] font-bold uppercase tracking-[0.15em] font-display text-bsi-primary"
          >
            {leagueName}
          </span>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={100}>
          <h1
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-center uppercase tracking-[0.1em] mb-4"
            style={{ fontFamily: 'var(--font-bebas, var(--font-hero))', color: 'var(--bsi-bone)' }}
          >
            {icon && <span className="opacity-60 mr-2 text-[0.75em]">{icon}</span>}
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
          <p
            className="text-lg leading-relaxed text-center mb-4"
            style={{ fontFamily: 'var(--font-cormorant, serif)', color: 'var(--bsi-dust)', fontStyle: 'italic' }}
          >
            {tagline}
          </p>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={200}>
          <p className="text-center max-w-2xl mx-auto mb-8 text-sm" style={{ color: 'var(--bsi-dust)' }}>
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
          <div
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-sm"
            style={{
              background: 'var(--surface-dugout)',
              border: '1px solid var(--border-vintage)',
            }}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-4">
                <div className="font-mono text-3xl font-bold" style={{ color: 'var(--bsi-primary)' }}>
                  {stat.value}
                </div>
                <div className="text-[10px] uppercase tracking-[0.12em] mt-1" style={{ color: 'var(--bsi-dust)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </Container>
    </div>
  );

  if (heroBg) {
    return (
      <section
        className="relative overflow-hidden"
        style={{ borderBottom: '1px solid var(--border-vintage)' }}
      >
        {/* Hero photography — served from Pages static assets for Worker-independent resilience */}
        <img
          src={`/${heroBg.bucket}/${heroBg.imagePath}`}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: heroBg.opacity ?? 0.22 }}
        />

        {/* Gradient: heavy top/bottom for text, lighter in mid-section to show the photo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(
              to bottom,
              rgba(10,10,10,0.65) 0%,
              rgba(10,10,10,0.35) 35%,
              rgba(10,10,10,0.45) 65%,
              var(--surface-scoreboard) 100%
            )`,
          }}
        />

        {/* Sport-accent radial warmth — each sport gets its own color identity */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 55% 55% at 50% 40%, ${getSportGlow(sport)} 0%, transparent 70%)`,
          }}
        />

        {/* BSI shield watermark — brand presence without words */}
        <img
          src="/brand/bsi-logo-seal-400.png"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="absolute pointer-events-none hidden md:block"
          style={{
            width: '240px',
            height: '240px',
            right: '8%',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.06,
          }}
        />

        {/* Grain texture */}
        <div className="absolute inset-0 pointer-events-none grain-overlay" style={{ opacity: 0.3 }} />

        <div className="relative z-10">{content}</div>
      </section>
    );
  }

  // Fallback: CSS glow when no R2 image is provided
  return (
    <section className="relative overflow-hidden" style={{ borderBottom: '1px solid var(--border-vintage)' }}>
      <HeroGlow shape="70% 60%" position="50% 30%" intensity={0.08} />
      {content}
    </section>
  );
}
