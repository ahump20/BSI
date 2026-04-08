'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ScrollReveal } from '@/components/cinematic';

// ── Types ──
type PositionType = 'skill' | 'power' | 'speed';
type Personality = 'leader' | 'quiet' | 'showman';
type SocialPresence = 'high' | 'medium' | 'low';
type MarketPref = 'national' | 'regional' | 'local';

interface FormState {
  sport: string;
  position: PositionType | '';
  personality: Personality | '';
  social: SocialPresence | '';
  market: MarketPref | '';
}

interface BrandResult {
  category: string;
  match: number;
  reason: string;
}

// ── Brand Matching Logic ──
const BRAND_CATEGORIES = [
  'Athletic Wear',
  'Energy/Nutrition',
  'Tech/Gaming',
  'Automotive',
  'Finance',
  'Local Business',
  'Media/Entertainment',
  'Food/Beverage',
] as const;

function computeMatches(form: FormState): BrandResult[] {
  const scores: Record<string, number> = {};
  BRAND_CATEGORIES.forEach((c) => { scores[c] = 30; });

  // Sport affinity
  if (form.sport === 'football') {
    scores['Athletic Wear'] += 20;
    scores['Automotive'] += 15;
    scores['Energy/Nutrition'] += 10;
  } else if (form.sport === 'basketball') {
    scores['Athletic Wear'] += 25;
    scores['Tech/Gaming'] += 15;
    scores['Media/Entertainment'] += 10;
  } else if (form.sport === 'baseball') {
    scores['Food/Beverage'] += 15;
    scores['Local Business'] += 15;
    scores['Athletic Wear'] += 10;
  }

  // Position type
  if (form.position === 'skill') {
    scores['Tech/Gaming'] += 15;
    scores['Media/Entertainment'] += 10;
  } else if (form.position === 'power') {
    scores['Energy/Nutrition'] += 20;
    scores['Automotive'] += 10;
  } else if (form.position === 'speed') {
    scores['Athletic Wear'] += 15;
    scores['Energy/Nutrition'] += 10;
  }

  // Personality
  if (form.personality === 'leader') {
    scores['Finance'] += 20;
    scores['Automotive'] += 10;
  } else if (form.personality === 'showman') {
    scores['Media/Entertainment'] += 20;
    scores['Food/Beverage'] += 10;
  } else if (form.personality === 'quiet') {
    scores['Local Business'] += 15;
    scores['Finance'] += 10;
  }

  // Social presence
  if (form.social === 'high') {
    scores['Athletic Wear'] += 15;
    scores['Tech/Gaming'] += 15;
    scores['Media/Entertainment'] += 10;
  } else if (form.social === 'medium') {
    scores['Energy/Nutrition'] += 10;
    scores['Food/Beverage'] += 10;
  } else if (form.social === 'low') {
    scores['Local Business'] += 20;
    scores['Finance'] += 5;
  }

  // Market preference
  if (form.market === 'national') {
    scores['Athletic Wear'] += 15;
    scores['Automotive'] += 10;
  } else if (form.market === 'regional') {
    scores['Food/Beverage'] += 15;
    scores['Energy/Nutrition'] += 10;
  } else if (form.market === 'local') {
    scores['Local Business'] += 25;
  }

  const max = Math.max(...Object.values(scores));
  const reasons: Record<string, string> = {
    'Athletic Wear': 'Strong fit based on sport visibility and social reach',
    'Energy/Nutrition': 'Performance-driven brands seek your athlete archetype',
    'Tech/Gaming': 'Digital-native audiences align with your profile',
    'Automotive': 'Leadership presence appeals to premium automotive brands',
    'Finance': 'Trustworthy image matches financial services positioning',
    'Local Business': 'Community connection drives high local brand affinity',
    'Media/Entertainment': 'Personality and platform make you a content natural',
    'Food/Beverage': 'Broad appeal and relatability are key for F&B partnerships',
  };

  return Object.entries(scores)
    .map(([category, score]) => ({
      category,
      match: Math.round((score / max) * 100),
      reason: reasons[category] ?? '',
    }))
    .sort((a, b) => b.match - a.match);
}

// ── Reusable selector ──
function OptionGrid<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | '';
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-text-secondary mb-2">{label}</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`p-2.5 rounded-sm border text-sm font-medium transition-all ${
              value === opt.value
                ? 'border-burnt-orange bg-burnt-orange/10 text-burnt-orange'
                : 'border-border text-text-tertiary hover:border-text-muted'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BrandMatchPage() {
  const [form, setForm] = useState<FormState>({
    sport: '',
    position: '',
    personality: '',
    social: '',
    market: '',
  });
  const [results, setResults] = useState<BrandResult[] | null>(null);

  const isComplete = form.sport && form.position && form.personality && form.social && form.market;

  const handleSubmit = () => {
    if (!isComplete) return;
    setResults(computeMatches(form));
  };

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <Section className="pt-6 pb-16 bg-gradient-to-b from-background-secondary to-background-primary">
        <Container>
          <Breadcrumb
            items={[
              { label: 'NIL Valuation', href: '/nil-valuation' },
              { label: 'Brand Match Finder' },
            ]}
            className="mb-6"
          />
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="primary" className="mb-4">Free Tool</Badge>
              <h1 className="text-4xl md:text-5xl font-display uppercase tracking-wide font-bold mb-4">
                <span className="text-burnt-orange">Brand Match</span> Finder
              </h1>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Answer five questions about your athlete profile and discover which brand categories
                are the strongest fit for NIL partnerships.
              </p>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      <Section className="py-16">
        <Container size="md">
          {!results ? (
            <ScrollReveal>
              <Card>
                <CardHeader>
                  <CardTitle>Athlete Profile</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <OptionGrid
                    label="1. Sport"
                    options={[
                      { value: 'football', label: 'Football' },
                      { value: 'basketball', label: 'Basketball' },
                      { value: 'baseball', label: 'Baseball' },
                    ]}
                    value={form.sport}
                    onChange={(v) => setForm((p) => ({ ...p, sport: v }))}
                  />
                  <OptionGrid<PositionType>
                    label="2. Position Type"
                    options={[
                      { value: 'skill', label: 'Skill' },
                      { value: 'power', label: 'Power' },
                      { value: 'speed', label: 'Speed' },
                    ]}
                    value={form.position}
                    onChange={(v) => setForm((p) => ({ ...p, position: v }))}
                  />
                  <OptionGrid<Personality>
                    label="3. Personality"
                    options={[
                      { value: 'leader', label: 'Leader' },
                      { value: 'quiet', label: 'Quiet Worker' },
                      { value: 'showman', label: 'Showman' },
                    ]}
                    value={form.personality}
                    onChange={(v) => setForm((p) => ({ ...p, personality: v }))}
                  />
                  <OptionGrid<SocialPresence>
                    label="4. Social Presence"
                    options={[
                      { value: 'high', label: 'High (50K+)' },
                      { value: 'medium', label: 'Medium (5-50K)' },
                      { value: 'low', label: 'Low (<5K)' },
                    ]}
                    value={form.social}
                    onChange={(v) => setForm((p) => ({ ...p, social: v }))}
                  />
                  <OptionGrid<MarketPref>
                    label="5. Market Preference"
                    options={[
                      { value: 'national', label: 'National' },
                      { value: 'regional', label: 'Regional' },
                      { value: 'local', label: 'Local' },
                    ]}
                    value={form.market}
                    onChange={(v) => setForm((p) => ({ ...p, market: v }))}
                  />

                  <Button
                    size="lg"
                    className={`w-full mt-4 ${isComplete ? 'bg-burnt-orange' : 'opacity-50 cursor-not-allowed'}`}
                    onClick={handleSubmit}
                    disabled={!isComplete}
                  >
                    Find Brand Matches
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>
          ) : (
            <>
              <ScrollReveal>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display uppercase tracking-wide font-bold">Your Matches</h2>
                  <Button variant="outline" size="sm" onClick={() => setResults(null)}>
                    Start Over
                  </Button>
                </div>
              </ScrollReveal>

              <div className="space-y-3">
                {results.map((r, i) => (
                  <ScrollReveal key={r.category} delay={i * 60}>
                    <Card>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex-shrink-0 w-14 text-center">
                          <div className={`text-xl font-bold ${r.match >= 80 ? 'text-burnt-orange' : 'text-text-secondary'}`}>
                            {r.match}%
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-text-primary">{r.category}</div>
                          <div className="text-sm text-text-tertiary">{r.reason}</div>
                        </div>
                        <div className="flex-shrink-0 w-24 h-2 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full bg-burnt-orange transition-all duration-500"
                            style={{ width: `${r.match}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            </>
          )}
        </Container>
      </Section>

    </div>
  );
}
