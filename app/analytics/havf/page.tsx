'use client';

import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Footer } from '@/components/layout-ds/Footer';
import { HAVFLeaderboard } from '@/components/analytics/HAVFLeaderboard';
import { HAVFRadar } from '@/components/analytics/HAVFRadar';
import Link from 'next/link';

const WEIGHTS = [
  { dim: 'H', label: 'Hitting', weight: '35%', desc: 'AVG, OBP, SLG, wOBA, ISO — percentile-ranked against league peers' },
  { dim: 'A', label: 'At-Bat Quality', weight: '25%', desc: 'Walk rate, contact rate (inverse K%), BABIP, HR rate' },
  { dim: 'V', label: 'Velocity Proxy', weight: '25%', desc: 'ISO, SLG, HR rate — power indicators (Statcast exit velo unavailable via current APIs)' },
  { dim: 'F', label: 'Fielding', weight: '15%', desc: 'Fielding %, range factor, assists per game' },
];

export default function HAVFPage() {
  return (
    <>
      <Section className="pt-24 pb-12">
        <Container>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/analytics" className="text-white/40 hover:text-white/60 text-sm transition-colors">
              Analytics
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white text-sm font-semibold">HAV-F Score</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white font-heading uppercase tracking-tight mb-4">
            HAV-F <span className="text-[#BF5700]">Player Metric</span>
          </h1>
          <p className="text-white/60 max-w-2xl mb-8">
            BSI&apos;s proprietary composite evaluation. Each player is scored 0–100 across four dimensions,
            percentile-ranked against every peer in their league and season.
          </p>

          {/* Methodology */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white/5 border border-white/[0.06] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Methodology</h2>
              <div className="space-y-4">
                {WEIGHTS.map((w) => (
                  <div key={w.dim} className="flex gap-3">
                    <span className="text-[#BF5700] font-bold font-mono w-8">{w.dim}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-sm">{w.label}</span>
                        <span className="text-[10px] text-white/30 font-mono">{w.weight}</span>
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">{w.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/[0.06] rounded-xl p-6 flex items-center justify-center">
              <HAVFRadar hScore={72} aScore={65} vScore={80} fScore={58} playerName="Example Player" />
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white/5 border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white">Leaderboard</h2>
              <p className="text-xs text-white/40 mt-1">Top HAV-F scores across college baseball</p>
            </div>
            <HAVFLeaderboard league="college-baseball" limit={50} className="p-4" />
          </div>
        </Container>
      </Section>
      <Footer />
    </>
  );
}
