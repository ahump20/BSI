'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

// ── Types ──
type Sport = 'baseball' | 'football' | 'basketball';

interface Estimate {
  low: string;
  mid: string;
  high: string;
}

// ── Constants ──
const BASE_PER_WAR = 25_000;
const SPORT_MULTIPLIERS: Record<Sport, { label: string; multiplier: number }> = {
  baseball: { label: 'Baseball', multiplier: 1 },
  football: { label: 'Football', multiplier: 3 },
  basketball: { label: 'Basketball', multiplier: 2.5 },
};

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

function calculateEstimate(war: number, sport: Sport): Estimate {
  const mult = SPORT_MULTIPLIERS[sport].multiplier;
  const mid = war * BASE_PER_WAR * mult;
  return {
    low: formatCurrency(mid * 0.65),
    mid: formatCurrency(mid),
    high: formatCurrency(mid * 1.45),
  };
}

export default function WARtoNILPage() {
  const [war, setWar] = useState(2.0);
  const [sport, setSport] = useState<Sport>('baseball');

  const estimate = calculateEstimate(war, sport);

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <Section className="pt-6 pb-16 bg-gradient-to-b from-background-secondary to-background-primary">
        <Container>
          <Breadcrumb
            items={[
              { label: 'NIL Valuation', href: '/nil-valuation' },
              { label: 'WAR-to-NIL Converter' },
            ]}
            className="mb-6"
          />
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="primary" className="mb-4">Free Tool</Badge>
              <h1 className="text-4xl md:text-5xl font-display uppercase tracking-wide font-bold mb-4">
                <span className="text-burnt-orange">WAR-to-NIL</span> Converter
              </h1>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Estimate an athlete&apos;s NIL value from their Wins Above Replacement.
                Adjust sport and WAR to see projected deal ranges.
              </p>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      <Section className="py-16">
        <Container size="md">
          <ScrollReveal>
            <Card>
              <CardHeader>
                <CardTitle>Configure Estimate</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Sport Selector */}
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-3">Sport</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(Object.entries(SPORT_MULTIPLIERS) as [Sport, { label: string; multiplier: number }][]).map(
                      ([key, { label, multiplier }]) => (
                        <button
                          key={key}
                          onClick={() => setSport(key)}
                          className={`p-3 rounded-lg border text-sm font-semibold transition-all ${
                            sport === key
                              ? 'border-burnt-orange bg-burnt-orange/10 text-burnt-orange'
                              : 'border-border text-text-tertiary hover:border-text-muted'
                          }`}
                        >
                          {label}
                          <span className="block text-xs font-normal mt-1 text-text-muted">{multiplier}x multiplier</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* WAR Slider */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-text-secondary">WAR Value</label>
                    <span className="text-2xl font-bold text-burnt-orange">{war.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={8}
                    step={0.1}
                    value={war}
                    onChange={(e) => setWar(parseFloat(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none bg-border accent-burnt-orange cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>0.0 — Replacement</span>
                    <span>4.0 — All-Star</span>
                    <span>8.0 — MVP</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Results */}
          <ScrollReveal delay={150}>
            <div className="grid grid-cols-3 gap-4 mt-8">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-xs uppercase tracking-wide text-text-muted mb-2">Low Estimate</div>
                  <div className="text-2xl font-bold text-text-secondary">{estimate.low}</div>
                </CardContent>
              </Card>
              <Card className="text-center border-burnt-orange/40">
                <CardContent className="p-6">
                  <div className="text-xs uppercase tracking-wide text-burnt-orange mb-2">Fair Market Value</div>
                  <div className="text-3xl font-bold text-burnt-orange">{estimate.mid}</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-xs uppercase tracking-wide text-text-muted mb-2">High Estimate</div>
                  <div className="text-2xl font-bold text-text-secondary">{estimate.high}</div>
                </CardContent>
              </Card>
            </div>
          </ScrollReveal>

          {/* Methodology Note */}
          <ScrollReveal delay={250}>
            <Card className="mt-8 border-l-4 border-l-burnt-orange">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-text-primary mb-2">Methodology</h3>
                <p className="text-sm text-text-tertiary leading-relaxed">
                  This converter uses a base value of $25,000 per WAR for college baseball, scaled by
                  sport-specific multipliers reflecting market size differences. Football carries a 3x
                  multiplier due to larger collective budgets; basketball 2.5x. The low and high bounds
                  represent a &plusmn;35-45% range to account for market, exposure, and program-level
                  variance. These are illustrative estimates — actual NIL values depend on social following,
                  market size, and deal structure.
                </p>
                <Link
                  href="/nil-valuation/methodology"
                  className="inline-block mt-3 text-sm text-burnt-orange hover:underline"
                >
                  Read Full Methodology →
                </Link>
              </CardContent>
            </Card>
          </ScrollReveal>
        </Container>
      </Section>

      <Footer />
    </div>
  );
}
