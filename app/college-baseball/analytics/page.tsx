'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { HAVFCard } from '@/components/analytics/HAVFCard';

interface HAVFPlayer {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  overall: number;
  components: {
    hits: number;
    atBats: number;
    velocity: number;
    fielding: number;
  };
  percentile: number;
}

export default function CollegeBaseballAnalyticsPage() {
  const [leaders, setLeaders] = useState<HAVFPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posFilter, setPosFilter] = useState('All');

  useEffect(() => {
    async function fetchHAVF() {
      setLoading(true);
      try {
        const params = posFilter !== 'All' ? `?position=${posFilter}` : '';
        const res = await fetch(`/api/college-baseball/havf${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { players?: HAVFPlayer[] };
        setLeaders(data.players || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    fetchHAVF();
  }, [posFilter]);

  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="primary">BSI Proprietary</Badge>
                <Link href="/college-baseball" className="text-xs text-white/40 hover:text-burnt-orange transition-colors">
                  ← College Baseball
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display text-gradient-blaze">
                HAV-F Analytics
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary mt-4 text-lg max-w-2xl">
                Hits. At-Bats. Velocity. Fielding. A proprietary composite metric that evaluates
                every D1 player on four dimensions — scaled 0 to 100, where 50 is D1 average.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {/* Methodology overview */}
            <ScrollReveal direction="up">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                  { key: 'H', label: 'Hits', desc: 'Contact quality — BABIP, ISO, line drives' },
                  { key: 'A', label: 'At-Bats', desc: 'Plate discipline — BB%, K%, selectivity' },
                  { key: 'V', label: 'Velocity', desc: 'Power impact — exit velo proxy via ISO/SLG' },
                  { key: 'F', label: 'Fielding', desc: 'Defense — fielding pct, range, assists' },
                ].map((comp) => (
                  <Card key={comp.key} variant="default" padding="md">
                    <div className="text-2xl font-display font-bold text-[#BF5700] mb-1">{comp.key}</div>
                    <div className="text-sm font-semibold text-white">{comp.label}</div>
                    <div className="text-xs text-white/40 mt-1">{comp.desc}</div>
                  </Card>
                ))}
              </div>
            </ScrollReveal>

            {/* Position filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {['All', 'C', '1B', '2B', '3B', 'SS', 'OF', 'DH', 'P'].map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPosFilter(pos)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    posFilter === pos
                      ? 'bg-[#BF5700] text-white'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>

            {/* Leaders grid */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-6 animate-pulse h-64" />
                ))}
              </div>
            ) : error ? (
              <Card variant="default" padding="lg" className="bg-red-500/10 border-red-500/30">
                <p className="text-red-400 font-semibold">Analytics data unavailable</p>
                <p className="text-white/60 text-sm mt-1">{error}</p>
                <p className="text-white/30 text-sm mt-3">
                  HAV-F analytics requires live player stats. Data becomes available once the season begins.
                </p>
              </Card>
            ) : leaders.length === 0 ? (
              <Card variant="default" padding="lg">
                <div className="text-center py-8">
                  <p className="text-white/60">No HAV-F data available yet.</p>
                  <p className="text-white/30 text-sm mt-2">
                    Analytics populate as the season progresses and player stats are collected.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {leaders.slice(0, 12).map((player) => (
                  <HAVFCard
                    key={player.playerId}
                    playerName={player.playerName}
                    position={player.position}
                    team={player.team}
                    overall={player.overall}
                    components={player.components}
                    percentile={player.percentile}
                  />
                ))}
              </div>
            )}
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
