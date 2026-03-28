'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

// ── Types ──
type Sport = 'baseball' | 'football' | 'basketball';

// ── Constants ──
const BASE_PER_WAR = 25_000;
const SPORT_CONFIG: Record<Sport, { label: string; multiplier: number; icon: string }> = {
  baseball: { label: 'Baseball', multiplier: 1, icon: '\u26be' },
  football: { label: 'Football', multiplier: 3, icon: '\ud83c\udfc8' },
  basketball: { label: 'Basketball', multiplier: 2.5, icon: '\ud83c\udfc0' },
};

const WAR_TIERS = [
  { min: 0, max: 1, label: 'Replacement', color: 'var(--text-muted)' },
  { min: 1, max: 2.5, label: 'Roster', color: 'var(--bsi-dust)' },
  { min: 2.5, max: 4, label: 'Starter', color: 'var(--heritage-columbia-blue)' },
  { min: 4, max: 6, label: 'All-Star', color: 'var(--bsi-primary)' },
  { min: 6, max: 8, label: 'MVP', color: '#d4a017' },
];

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

function getWarTier(war: number) {
  return WAR_TIERS.find(t => war >= t.min && war < t.max) || WAR_TIERS[WAR_TIERS.length - 1];
}

export default function WARtoNILPage() {
  const [war, setWar] = useState(2.0);
  const [sport, setSport] = useState<Sport>('baseball');

  const estimate = useMemo(() => {
    const mult = SPORT_CONFIG[sport].multiplier;
    const mid = war * BASE_PER_WAR * mult;
    return {
      low: formatCurrency(mid * 0.65),
      mid: formatCurrency(mid),
      high: formatCurrency(mid * 1.45),
      rawMid: mid,
    };
  }, [war, sport]);

  const tier = getWarTier(war);
  const warPct = (war / 8) * 100;

  return (
    <div className="min-h-screen bg-[var(--surface-scoreboard)] text-[var(--bsi-bone)]">
      {/* ═══ Hero ═══ */}
      <Section className="pt-6 pb-12 relative overflow-hidden grain-overlay">
        <div className="absolute inset-0 bg-gradient-to-b from-burnt-orange/8 via-transparent to-transparent pointer-events-none" />
        <Container>
          <Breadcrumb
            items={[
              { label: 'NIL Valuation', href: '/nil-valuation' },
              { label: 'WAR-to-NIL Converter' },
            ]}
            className="mb-6"
          />
          <ScrollReveal>
            <div className="max-w-3xl">
              <span className="heritage-stamp mb-4 inline-block">Free Tool</span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display mb-3"
                  style={{ lineHeight: '1.05' }}>
                <span className="text-[var(--bsi-primary)]">WAR</span>
                <span className="text-[rgba(196,184,165,0.35)] mx-2" style={{ fontSize: '0.6em' }}>to</span>
                <span className="text-[var(--bsi-bone)]">NIL</span>
              </h1>
              <div className="section-rule" />
              <p className="text-[var(--bsi-dust)] max-w-xl" style={{ fontFamily: 'var(--bsi-font-body)' }}>
                Convert on-field production into estimated market value.
                Set the sport and WAR — the model does the rest.
              </p>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* ═══ Instrument Panel ═══ */}
      <Section className="py-12">
        <Container size="md">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* ── Left: Controls (2 cols) ── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Sport Selector */}
              <div>
                <div className="text-xs font-display uppercase tracking-widest text-[rgba(196,184,165,0.35)] mb-3">Sport</div>
                <div className="space-y-2">
                  {(Object.entries(SPORT_CONFIG) as [Sport, typeof SPORT_CONFIG[Sport]][]).map(
                    ([key, { label, multiplier, icon }]) => (
                      <button
                        key={key}
                        onClick={() => setSport(key)}
                        className={`w-full text-left px-4 py-3 transition-all duration-200 ${
                          sport === key
                            ? 'heritage-card border-[var(--bsi-primary)]/60 bg-[var(--bsi-primary)]/8'
                            : 'heritage-card opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{icon}</span>
                            <span className="font-display text-sm uppercase tracking-wider text-[var(--bsi-bone)]">
                              {label}
                            </span>
                          </div>
                          <span className="font-mono text-xs text-[rgba(196,184,165,0.35)]">{multiplier}x</span>
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* WAR Dial */}
              <div className="heritage-card p-5">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-xs font-display uppercase tracking-widest text-[rgba(196,184,165,0.35)]">
                    Wins Above Replacement
                  </span>
                  <span
                    className="font-mono text-3xl font-bold tabular-nums transition-colors duration-300"
                    style={{ color: tier.color }}
                  >
                    {war.toFixed(1)}
                  </span>
                </div>

                {/* Custom slider track with tier zones */}
                <div className="relative mb-2">
                  <div className="h-2 rounded-full overflow-hidden flex">
                    {WAR_TIERS.map((t, i) => {
                      const width = ((t.max - t.min) / 8) * 100;
                      return (
                        <div
                          key={i}
                          className="h-full transition-opacity duration-300"
                          style={{
                            width: `${width}%`,
                            backgroundColor: t.color,
                            opacity: war >= t.min ? 0.6 : 0.15,
                          }}
                        />
                      );
                    })}
                  </div>
                  {/* Slider thumb position indicator */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-background-primary transition-all duration-150"
                    style={{
                      left: `calc(${warPct}% - 6px)`,
                      backgroundColor: tier.color,
                      boxShadow: `0 0 8px ${tier.color}40`,
                    }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={8}
                    step={0.1}
                    value={war}
                    onChange={(e) => setWar(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="WAR value"
                  />
                </div>

                {/* Tier label */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {WAR_TIERS.map((t, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-display uppercase tracking-wider transition-all duration-300"
                        style={{
                          color: war >= t.min && war < t.max ? t.color : 'var(--text-muted)',
                          opacity: war >= t.min && war < t.max ? 1 : 0.4,
                        }}
                      >
                        {t.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right: Valuation Output (3 cols) ── */}
            <div className="lg:col-span-3">
              {/* Primary valuation card */}
              <div className="heritage-card corner-marks grain-overlay p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-burnt-orange/60 to-transparent" />

                <div className="text-xs font-display uppercase tracking-[0.3em] text-[rgba(196,184,165,0.35)] mb-1">
                  BSI Fair Market Value
                </div>
                <div className="heritage-divider mx-auto max-w-[120px]" />

                <div
                  className="font-display font-bold uppercase tracking-wide text-[var(--bsi-primary)] my-4 transition-all duration-300"
                  style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1 }}
                >
                  {estimate.mid}
                </div>

                <div className="heritage-divider mx-auto max-w-[120px]" />

                <div className="flex items-center justify-center gap-2 mt-3">
                  <span
                    className="heritage-stamp text-[9px]"
                    style={{
                      color: tier.color,
                      borderColor: tier.color,
                    }}
                  >
                    {tier.label} Tier
                  </span>
                  <span className="text-xs text-[rgba(196,184,165,0.35)]">
                    {SPORT_CONFIG[sport].label} &middot; {war.toFixed(1)} WAR
                  </span>
                </div>
              </div>

              {/* Range cards */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="heritage-card p-4">
                  <div className="text-[10px] font-display uppercase tracking-widest text-[rgba(196,184,165,0.35)] mb-1">
                    Conservative
                  </div>
                  <div className="font-mono text-xl font-bold text-[var(--bsi-dust)] tabular-nums">
                    {estimate.low}
                  </div>
                  <div className="text-[10px] text-[rgba(196,184,165,0.35)] mt-1 font-mono">-35%</div>
                </div>
                <div className="heritage-card p-4">
                  <div className="text-[10px] font-display uppercase tracking-widest text-[rgba(196,184,165,0.35)] mb-1">
                    Aggressive
                  </div>
                  <div className="font-mono text-xl font-bold text-[var(--bsi-dust)] tabular-nums">
                    {estimate.high}
                  </div>
                  <div className="text-[10px] text-[rgba(196,184,165,0.35)] mt-1 font-mono">+45%</div>
                </div>
              </div>

              {/* Value context strip */}
              <div className="heritage-card mt-3 px-4 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[rgba(196,184,165,0.35)] font-display uppercase tracking-wider">Per-WAR Base</span>
                  <span className="font-mono text-[var(--bsi-dust)]">
                    ${(BASE_PER_WAR * SPORT_CONFIG[sport].multiplier).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1.5">
                  <span className="text-[rgba(196,184,165,0.35)] font-display uppercase tracking-wider">Sport Multiplier</span>
                  <span className="font-mono text-[var(--bsi-dust)]">{SPORT_CONFIG[sport].multiplier}x</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1.5">
                  <span className="text-[rgba(196,184,165,0.35)] font-display uppercase tracking-wider">WAR Input</span>
                  <span className="font-mono text-[var(--bsi-primary)]">{war.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Methodology ── */}
          <div className="heritage-card mt-10 relative overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border-vintage" style={{ background: 'var(--surface-press-box)' }}>
              <span className="text-xs font-display uppercase tracking-widest text-[rgba(196,184,165,0.35)]">Methodology</span>
            </div>
            <div className="p-5">
              <p className="text-sm text-[rgba(196,184,165,0.5)] leading-relaxed" style={{ fontFamily: 'var(--bsi-font-body)' }}>
                Base value of $25,000 per WAR for college baseball, scaled by sport-specific multipliers
                reflecting market size differences. Football carries a 3x multiplier due to larger collective
                budgets; basketball 2.5x. Conservative and aggressive bounds represent -35% / +45% variance
                to account for market, exposure, and program-level factors. These are illustrative estimates —
                actual NIL values depend on social following, market size, and deal structure.
              </p>
              <Link
                href="/nil-valuation/tools"
                className="inline-block mt-3 text-xs font-display uppercase tracking-wider text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)]/80 transition-colors"
              >
                All NIL Tools &rarr;
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <Footer />
    </div>
  );
}
