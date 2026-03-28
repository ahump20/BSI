'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

// ── Types ──
interface DealInput {
  playerName: string;
  dealAmount: number;
  durationMonths: number;
  guaranteedPct: number;
  performanceBonus: number;
  sport: 'baseball' | 'football' | 'basketball';
  marketSize: 'large' | 'medium' | 'small';
}

interface DealResult {
  fairValueLow: number;
  fairValueMid: number;
  fairValueHigh: number;
  rating: 'strong-underpay' | 'underpay' | 'fair' | 'overpay' | 'strong-overpay';
  ratingLabel: string;
  ratingColor: string;
  annualized: number;
  guaranteedAmount: number;
  riskFactors: string[];
}

// ── Helpers ──
function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

function analyzeDeal(input: DealInput): DealResult {
  // Simple FMNV estimate based on sport and market
  const sportBase: Record<string, number> = { baseball: 28000, football: 145000, basketball: 98000 };
  const marketMult: Record<string, number> = { large: 1.4, medium: 1.0, small: 0.7 };

  const base = sportBase[input.sport] || 28000;
  const mkt = marketMult[input.marketSize] || 1.0;
  const fairMid = base * mkt;
  const fairLow = fairMid * 0.6;
  const fairHigh = fairMid * 1.5;

  const annualized = input.durationMonths > 0 ? (input.dealAmount / input.durationMonths) * 12 : input.dealAmount;
  const guaranteedAmount = input.dealAmount * (input.guaranteedPct / 100);
  const totalValue = input.dealAmount + input.performanceBonus;

  // Rating
  const ratio = annualized / fairMid;
  let rating: DealResult['rating'];
  let ratingLabel: string;
  let ratingColor: string;
  if (ratio < 0.5) { rating = 'strong-underpay'; ratingLabel = 'Strong Underpay'; ratingColor = 'text-[var(--bsi-danger)]'; }
  else if (ratio < 0.85) { rating = 'underpay'; ratingLabel = 'Below Market'; ratingColor = 'text-[var(--bsi-warning)]'; }
  else if (ratio <= 1.2) { rating = 'fair'; ratingLabel = 'Fair Value'; ratingColor = 'text-[var(--bsi-success)]'; }
  else if (ratio <= 1.6) { rating = 'overpay'; ratingLabel = 'Above Market'; ratingColor = 'text-[var(--bsi-warning)]'; }
  else { rating = 'strong-overpay'; ratingLabel = 'Significant Overpay'; ratingColor = 'text-[var(--bsi-danger)]'; }

  // Risk factors
  const riskFactors: string[] = [];
  if (input.guaranteedPct < 50) riskFactors.push('Low guaranteed percentage — athlete carries most of the risk');
  if (input.durationMonths > 24) riskFactors.push('Long duration — market conditions may shift significantly');
  if (input.durationMonths < 6) riskFactors.push('Short duration — limited time to build brand partnership value');
  if (input.performanceBonus > input.dealAmount * 0.5) riskFactors.push('Heavy performance bonus weighting — actual payout may vary widely');
  if (ratio > 1.6) riskFactors.push('Deal significantly exceeds estimated fair market value');
  if (ratio < 0.5) riskFactors.push('Deal substantially below market — athlete may seek better offers');
  if (totalValue > 100000 && input.sport === 'baseball') riskFactors.push('High-value baseball deal — smaller market means fewer comparable data points');

  return { fairValueLow: fairLow, fairValueMid: fairMid, fairValueHigh: fairHigh, rating, ratingLabel, ratingColor, annualized, guaranteedAmount, riskFactors };
}

const DEFAULT_INPUT: DealInput = {
  playerName: '', dealAmount: 25000, durationMonths: 12, guaranteedPct: 75,
  performanceBonus: 5000, sport: 'baseball', marketSize: 'medium',
};

export default function DealAnalyzerPage() {
  const [input, setInput] = useState<DealInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<DealResult | null>(null);

  const handleAnalyze = () => { setResult(analyzeDeal(input)); };
  const update = (partial: Partial<DealInput>) => setInput(prev => ({ ...prev, ...partial }));

  return (
    <div className="min-h-screen bg-[var(--surface-scoreboard)] text-[var(--bsi-bone)]">
      <Section className="pt-4 pb-0">
        <Container>
          <nav className="flex items-center gap-2 text-sm text-[rgba(196,184,165,0.35)]">
            <Link href="/nil-valuation" className="hover:text-[var(--bsi-primary)] transition-colors">NIL Valuation</Link>
            <span>/</span>
            <span className="text-[var(--bsi-dust)]">Deal Analyzer</span>
          </nav>
        </Container>
      </Section>

      <Section className="pt-6 pb-12 bg-gradient-to-b from-background-secondary to-[var(--surface-scoreboard)]">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="primary" className="mb-4">Pro Tool</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display uppercase tracking-wide">
                <span className="text-[var(--bsi-primary)]">Deal</span> Analyzer
              </h1>
              <p className="text-lg text-[var(--bsi-dust)] max-w-2xl mx-auto">
                Input deal terms and compare against BSI fair market estimates. Know if a deal is fair before you sign.
              </p>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      <Section className="py-12">
        <Container size="md">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Form */}
            <ScrollReveal>
              <Card>
                <CardHeader><CardTitle>Deal Terms</CardTitle></CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--bsi-dust)] mb-1">Player Name</label>
                    <input type="text" value={input.playerName} onChange={e => update({ playerName: e.target.value })}
                      placeholder="e.g. John Smith" className="w-full p-2.5 rounded-sm bg-[var(--surface-dugout)] border border-[var(--border-vintage)] text-[var(--bsi-bone)] text-sm focus:border-[var(--bsi-primary)] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--bsi-dust)] mb-1">Sport</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['baseball', 'football', 'basketball'] as const).map(s => (
                        <button key={s} onClick={() => update({ sport: s })}
                          className={`p-2 rounded-sm border text-xs font-semibold capitalize transition-all ${input.sport === s ? 'border-[var(--bsi-primary)] bg-[var(--bsi-primary)]/10 text-[var(--bsi-primary)]' : 'border-border text-[rgba(196,184,165,0.5)] hover:border-text-muted'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--bsi-dust)] mb-1">Market Size</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['large', 'medium', 'small'] as const).map(m => (
                        <button key={m} onClick={() => update({ marketSize: m })}
                          className={`p-2 rounded-sm border text-xs font-semibold capitalize transition-all ${input.marketSize === m ? 'border-[var(--bsi-primary)] bg-[var(--bsi-primary)]/10 text-[var(--bsi-primary)]' : 'border-border text-[rgba(196,184,165,0.5)] hover:border-text-muted'}`}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--bsi-dust)] mb-1">Deal Amount ($)</label>
                      <input type="number" value={input.dealAmount} onChange={e => update({ dealAmount: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-sm bg-[var(--surface-dugout)] border border-[var(--border-vintage)] text-[var(--bsi-bone)] text-sm focus:border-[var(--bsi-primary)] focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--bsi-dust)] mb-1">Duration (months)</label>
                      <input type="number" value={input.durationMonths} onChange={e => update({ durationMonths: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-sm bg-[var(--surface-dugout)] border border-[var(--border-vintage)] text-[var(--bsi-bone)] text-sm focus:border-[var(--bsi-primary)] focus:outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--bsi-dust)] mb-1">Guaranteed (%)</label>
                      <input type="number" min={0} max={100} value={input.guaranteedPct} onChange={e => update({ guaranteedPct: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-sm bg-[var(--surface-dugout)] border border-[var(--border-vintage)] text-[var(--bsi-bone)] text-sm focus:border-[var(--bsi-primary)] focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--bsi-dust)] mb-1">Performance Bonus ($)</label>
                      <input type="number" value={input.performanceBonus} onChange={e => update({ performanceBonus: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-sm bg-[var(--surface-dugout)] border border-[var(--border-vintage)] text-[var(--bsi-bone)] text-sm focus:border-[var(--bsi-primary)] focus:outline-none" />
                    </div>
                  </div>
                  <Button variant="primary" className="w-full bg-[var(--bsi-primary)]" onClick={handleAnalyze}>
                    Analyze Deal
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Results */}
            <ScrollReveal delay={150}>
              {result ? (
                <div className="space-y-4">
                  <Card className="border-l-4 border-l-burnt-orange">
                    <CardContent className="p-6 text-center">
                      <div className="text-sm text-[rgba(196,184,165,0.35)] uppercase tracking-wide mb-1">Deal Rating</div>
                      <div className={`text-3xl font-bold ${result.ratingColor}`}>{result.ratingLabel}</div>
                      {input.playerName && <p className="text-[rgba(196,184,165,0.35)] text-sm mt-2">for {input.playerName}</p>}
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-3 gap-3">
                    <Card className="text-center"><CardContent className="p-4">
                      <div className="text-xs text-[rgba(196,184,165,0.35)] mb-1">Fair Low</div>
                      <div className="text-lg font-bold text-[var(--bsi-dust)]">{formatCurrency(result.fairValueLow)}</div>
                    </CardContent></Card>
                    <Card className="text-center border-[var(--bsi-primary)]/40"><CardContent className="p-4">
                      <div className="text-xs text-[var(--bsi-primary)] mb-1">Fair Market</div>
                      <div className="text-xl font-bold text-[var(--bsi-primary)]">{formatCurrency(result.fairValueMid)}</div>
                    </CardContent></Card>
                    <Card className="text-center"><CardContent className="p-4">
                      <div className="text-xs text-[rgba(196,184,165,0.35)] mb-1">Fair High</div>
                      <div className="text-lg font-bold text-[var(--bsi-dust)]">{formatCurrency(result.fairValueHigh)}</div>
                    </CardContent></Card>
                  </div>

                  <Card>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-[rgba(196,184,165,0.35)]">Annualized Value</span>
                        <span className="font-semibold text-[var(--bsi-bone)]">{formatCurrency(result.annualized)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[rgba(196,184,165,0.35)]">Guaranteed Amount</span>
                        <span className="font-semibold text-[var(--bsi-bone)]">{formatCurrency(result.guaranteedAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[rgba(196,184,165,0.35)]">Total w/ Bonus</span>
                        <span className="font-semibold text-[var(--bsi-bone)]">{formatCurrency(input.dealAmount + input.performanceBonus)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {result.riskFactors.length > 0 && (
                    <Card className="border-l-4 border-l-yellow-500">
                      <CardContent className="p-5">
                        <h3 className="text-sm font-bold text-[var(--bsi-bone)] mb-3">Risk Factors</h3>
                        <ul className="space-y-2">
                          {result.riskFactors.map((rf, i) => (
                            <li key={i} className="text-sm text-[rgba(196,184,165,0.5)] flex gap-2">
                              <span className="text-[var(--bsi-warning)] shrink-0">!</span>
                              {rf}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="h-full flex items-center justify-center min-h-[300px]">
                  <CardContent className="text-center p-8">
                    <div className="text-4xl mb-4 opacity-20">$</div>
                    <p className="text-[rgba(196,184,165,0.35)]">Enter deal terms and click Analyze to see the breakdown.</p>
                  </CardContent>
                </Card>
              )}
            </ScrollReveal>
          </div>
        </Container>
      </Section>

      <Footer />
    </div>
  );
}
