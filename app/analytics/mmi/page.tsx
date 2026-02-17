'use client';

import { useState, useEffect } from 'react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Footer } from '@/components/layout-ds/Footer';
import { MMIGauge } from '@/components/analytics/MMIGauge';
import Link from 'next/link';

interface TrendingGame {
  game_id: string;
  sport: string;
  home_team: string;
  away_team: string;
  final_mmi: number;
  max_mmi: number;
  min_mmi: number;
  momentum_swings: number;
  biggest_swing: number;
  game_date: string;
}

const FORMULA_PARTS = [
  { label: 'SD', name: 'Score Differential', weight: '40%', desc: 'Run lead weighted by innings remaining — a 3-run lead in the 9th is worth more than in the 2nd' },
  { label: 'RS', name: 'Recent Scoring', weight: '30%', desc: 'Net runs scored in the last 2 innings — captures who has the hot hand right now' },
  { label: 'GP', name: 'Game Phase', weight: '15%', desc: 'Late-game multiplier — momentum crystallizes as the game progresses (extras = max urgency)' },
  { label: 'BS', name: 'Base Situation', weight: '15%', desc: 'Baserunner leverage — bases loaded with 0 outs is maximum pressure' },
];

export default function MMIPage() {
  const [trending, setTrending] = useState<TrendingGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch('/api/analytics/mmi/trending?limit=10');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { data?: TrendingGame[] };
        setTrending(data.data ?? []);
      } catch {
        // Silent — trending is optional, page still shows methodology
      } finally {
        setLoading(false);
      }
    }
    fetchTrending();
  }, []);

  return (
    <>
      <Section className="pt-24 pb-12">
        <Container>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/analytics" className="text-white/40 hover:text-white/60 text-sm transition-colors">
              Analytics
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white text-sm font-semibold">Momentum Index</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white font-heading uppercase tracking-tight mb-4">
            Momentum <span className="text-[#BF5700]">Magnitude Index</span>
          </h1>
          <p className="text-white/60 max-w-2xl mb-8">
            Real-time game momentum on a &minus;100 to +100 scale. Positive means home team advantage.
            Updated every 15 seconds during live games via WebSocket.
          </p>

          {/* Formula breakdown */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white/5 border border-white/[0.06] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">How MMI Works</h2>
              <div className="space-y-4">
                {FORMULA_PARTS.map((p) => (
                  <div key={p.label} className="flex gap-3">
                    <span className="text-[#BF5700] font-bold font-mono w-8">{p.label}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-sm">{p.name}</span>
                        <span className="text-[10px] text-white/30 font-mono">{p.weight}</span>
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/[0.06] rounded-xl p-6 flex flex-col items-center justify-center gap-4">
              <MMIGauge value={42.5} homeTeam="Texas" awayTeam="LSU" size="lg" />
              <p className="text-xs text-white/30 text-center">Example: Texas leads LSU late with recent scoring — strong home momentum</p>
            </div>
          </div>

          {/* Trending games */}
          <div className="bg-white/5 border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white">Trending Momentum Games</h2>
              <p className="text-xs text-white/40 mt-1">Games with the biggest momentum swings today</p>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : trending.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-8">
                  No games with MMI data today. MMI is computed during live games — check back during game time.
                </p>
              ) : (
                <div className="space-y-3">
                  {trending.map((game) => (
                    <div key={game.game_id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold text-sm">
                          {game.away_team} @ {game.home_team}
                        </p>
                        <p className="text-xs text-white/40">
                          {game.momentum_swings} swings &middot; biggest: {game.biggest_swing.toFixed(1)}
                        </p>
                      </div>
                      <MMIGauge value={game.final_mmi} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>
      <Footer />
    </>
  );
}
