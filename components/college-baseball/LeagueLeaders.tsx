'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { ScrollReveal } from '@/components/cinematic';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Leader {
  name: string;
  id?: string;
  team: string;
  teamId?: string;
  headshot?: string;
  value: string;
  stat: string;
}

interface LeaderCategory {
  name: string;
  abbreviation: string;
  leaders: Leader[];
}

interface LeadersResponse {
  categories: LeaderCategory[];
  meta?: { lastUpdated?: string; dataSource?: string };
  error?: string;
}

// Human-friendly abbreviation labels
const STAT_LABELS: Record<string, string> = {
  battingAverage: 'AVG',
  homeRuns: 'HR',
  RBIs: 'RBI',
  earnedRunAverage: 'ERA',
  strikeouts: 'K',
  stolenBases: 'SB',
  hits: 'H',
  runs: 'R',
  wins: 'W',
  saves: 'SV',
  onBasePercentage: 'OBP',
  sluggingPercentage: 'SLG',
};

function getStatLabel(cat: LeaderCategory): string {
  return STAT_LABELS[cat.abbreviation] || cat.abbreviation || cat.name.split(' ').map(w => w[0]).join('').toUpperCase();
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkeletonLeaderCard() {
  return (
    <Card variant="default" padding="md" className="animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-white/10 rounded" />
        <div className="h-5 w-10 bg-white/10 rounded" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-white/8 rounded" />
              <div className="h-3 w-28 bg-white/8 rounded" />
            </div>
            <div className="h-3 w-10 bg-white/8 rounded" />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// LeagueLeaders
// ---------------------------------------------------------------------------

export function LeagueLeaders() {
  const { data, loading, error: _error } = useSportData<LeadersResponse>(
    '/api/college-baseball/leaders',
    { refreshInterval: 300000 }, // 5 min
  );

  const categories = useMemo(() => {
    if (!data?.categories?.length) return [];
    // Take first 6 categories (batting avg, HR, RBI, ERA, K, SB typically)
    return data.categories.slice(0, 6);
  }, [data]);

  const hasData = categories.length > 0;
  const isEmpty = !loading && !hasData;

  return (
    <Section padding="lg" background="charcoal" borderTop>
      <Container>
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-burnt-orange/15 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
                <path d="M18 20V10M12 20V4M6 20V14" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white uppercase tracking-wide">League Leaders</h2>
              <p className="text-white/40 text-xs mt-0.5">Top performers across D1 baseball</p>
            </div>
          </div>
        </ScrollReveal>

        {loading && !hasData ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonLeaderCard key={i} />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { cat: 'Batting Average', label: 'AVG' },
              { cat: 'Home Runs', label: 'HR' },
              { cat: 'RBI', label: 'RBI' },
              { cat: 'ERA', label: 'ERA' },
              { cat: 'Strikeouts', label: 'K' },
              { cat: 'Stolen Bases', label: 'SB' },
            ].map((stat) => (
              <Card key={stat.label} variant="default" padding="md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-burnt-orange font-semibold text-sm">{stat.cat}</span>
                  <Badge variant="secondary">{stat.label}</Badge>
                </div>
                <p className="text-white/30 text-xs">Stats available once season games are final.</p>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <ScrollReveal key={cat.abbreviation || cat.name}>
                <Card variant="default" padding="md" className="h-full">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-burnt-orange font-semibold text-sm">{cat.name}</span>
                    <Badge variant="secondary">{getStatLabel(cat)}</Badge>
                  </div>
                  <div className="space-y-2">
                    {cat.leaders.slice(0, 5).map((leader, idx) => (
                      <div
                        key={leader.id || `${leader.name}-${idx}`}
                        className="flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`text-xs font-bold tabular-nums w-4 text-right ${
                            idx === 0 ? 'text-burnt-orange' : 'text-white/30'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="text-sm text-white font-medium truncate block">
                              {leader.name}
                            </span>
                            <span className="text-[10px] text-white/30 uppercase tracking-wider">
                              {leader.team}
                            </span>
                          </div>
                        </div>
                        <span className={`text-sm font-mono font-bold tabular-nums ml-2 ${
                          idx === 0 ? 'text-burnt-orange' : 'text-white/70'
                        }`}>
                          {leader.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/college-baseball/players">
            <Button variant="secondary" size="sm">Full Player Statistics →</Button>
          </Link>
        </div>
      </Container>
    </Section>
  );
}
