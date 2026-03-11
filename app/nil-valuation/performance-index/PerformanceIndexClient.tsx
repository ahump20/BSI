'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MetricGate } from '@/components/analytics/MetricGate';
import { useSportData } from '@/lib/hooks/useSportData';
import { computeNILIndex, formatNILDollar, type NILIndexResult } from '@/lib/nil/performance-index';

/* -- Types --------------------------------------------------------------- */

interface LeaderboardResponse {
  data: PlayerRow[];
  meta: { source: string; fetched_at: string; timezone: string };
}

interface PlayerRow {
  player_name: string;
  team: string;
  conference: string;
  woba: number;
  wrc_plus: number;
  ops_plus?: number;
  fip?: number;
  era_minus?: number;
  pa?: number;
  ip?: number;
  [key: string]: unknown;
}

/* -- Tier visual system -------------------------------------------------- */

const TIER_COLORS: Record<string, string> = {
  Elite: 'text-burnt-orange',
  High: 'text-amber-400',
  'Above Average': 'text-emerald-400',
  Average: 'text-text-secondary',
  Developing: 'text-text-muted',
};

const TIER_BG: Record<string, string> = {
  Elite: 'bg-burnt-orange/20 border-burnt-orange/40',
  High: 'bg-amber-400/10 border-amber-400/30',
  'Above Average': 'bg-emerald-400/10 border-emerald-400/30',
  Average: 'bg-white/5 border-white/10',
  Developing: 'bg-white/5 border-white/10',
};

const TIER_GLOW: Record<string, string> = {
  Elite: 'shadow-[0_0_20px_rgba(191,87,0,0.25)]',
  High: 'shadow-[0_0_16px_rgba(251,191,36,0.15)]',
  'Above Average': 'shadow-[0_0_12px_rgba(52,211,153,0.1)]',
  Average: '',
  Developing: '',
};

/* -- Component ----------------------------------------------------------- */

export function PerformanceIndexClient() {
  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRow | null>(null);
  const [result, setResult] = useState<NILIndexResult | null>(null);

  const { data: battingRes, loading: bLoad } =
    useSportData<LeaderboardResponse>('/api/savant/batting/leaderboard?limit=200');
  const { data: pitchingRes, loading: pLoad } =
    useSportData<LeaderboardResponse>('/api/savant/pitching/leaderboard?limit=200');

  const loading = bLoad || pLoad;

  const allPlayers = useMemo(() => {
    const players: PlayerRow[] = [];
    const seen = new Set<string>();

    for (const row of battingRes?.data ?? []) {
      const key = `${row.player_name}|${row.team}`;
      if (!seen.has(key)) {
        seen.add(key);
        players.push(row);
      }
    }
    for (const row of pitchingRes?.data ?? []) {
      const key = `${row.player_name}|${row.team}`;
      if (!seen.has(key)) {
        seen.add(key);
        players.push(row);
      }
    }
    return players;
  }, [battingRes, pitchingRes]);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allPlayers
      .filter(
        (p) =>
          p.player_name?.toLowerCase().includes(q) ||
          p.team?.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [search, allPlayers]);

  function selectPlayer(player: PlayerRow) {
    setSelectedPlayer(player);
    setSearch('');

    const isPitcher =
      player.ip && Number(player.ip) > 0 && (!player.pa || Number(player.pa) < 10);

    const indexResult = computeNILIndex({
      woba: isPitcher ? undefined : player.woba,
      wrc_plus: isPitcher ? undefined : player.wrc_plus,
      fip: isPitcher ? player.fip : undefined,
      era_minus: isPitcher ? player.era_minus : undefined,
      conference: player.conference ?? '',
    });

    setResult(indexResult);
  }

  // Derive tier from API response — worker sets _tier_gated on free-tier rows
  const isPro = useMemo(() => {
    const firstRow = battingRes?.data?.[0] ?? pitchingRes?.data?.[0];
    return firstRow ? (firstRow as Record<string, unknown>)._tier_gated !== true : false;
  }, [battingRes, pitchingRes]);

  return (
    <Section padding="lg" className="bg-background-secondary border-t border-border">
      <Container>
        <div className="max-w-3xl mx-auto">
          {/* Search */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
                Search Player
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    loading
                      ? 'Loading player data...'
                      : 'Type a player name or team...'
                  }
                  disabled={loading}
                  className="w-full bg-background-primary border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-burnt-orange/50 transition-colors font-serif"
                />
                {loading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Search Results Dropdown */}
              {filtered.length > 0 && (
                <div className="mt-2 border border-border rounded-lg overflow-hidden bg-background-primary">
                  {filtered.map((player, i) => (
                    <button
                      key={`${player.player_name}-${player.team}-${i}`}
                      onClick={() => selectPlayer(player)}
                      className="w-full text-left px-4 py-3 hover:bg-burnt-orange/10 transition-colors border-b border-border last:border-b-0 cursor-pointer"
                    >
                      <span className="font-semibold text-text-primary">
                        {player.player_name}
                      </span>
                      <span className="text-text-muted text-sm ml-2">
                        {player.team}
                      </span>
                      {player.conference && (
                        <span className="text-text-muted/50 text-xs ml-2">
                          ({player.conference})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {search.trim() && filtered.length === 0 && !loading && (
                <p className="mt-2 text-sm text-text-muted">
                  No players found. Try a different name or team.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Result Display */}
          {selectedPlayer && result && (
            <div className="space-y-6 animate-[fadeSlideUp_0.4s_ease-out]">
              {/* Player Header with Score Gauge */}
              <Card className={TIER_GLOW[result.tier]}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="font-display text-2xl font-bold uppercase text-text-primary">
                        {selectedPlayer.player_name}
                      </h2>
                      <p className="text-text-muted text-sm">
                        {selectedPlayer.team}
                        {selectedPlayer.conference &&
                          ` · ${selectedPlayer.conference}`}
                      </p>
                      <p className="text-xs text-text-muted/60 font-mono mt-1">
                        {'BSI Estimate · '}
                        {result.isPitcher ? 'Pitcher' : 'Position Player'} Profile
                      </p>
                    </div>

                    {/* Score gauge */}
                    <ScoreGauge score={result.index} tier={result.tier} />
                  </div>

                  {/* Tier context bar */}
                  <div className="mt-5 pt-4 border-t border-border">
                    <TierScale activeTier={result.tier} />
                  </div>
                </CardContent>
              </Card>

              {/* FMNV Breakdown */}
              <MetricGate isPro={isPro} metricName="NIL breakdown details">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-display text-sm uppercase tracking-wider text-text-secondary mb-4">
                      FMNV Breakdown
                    </h3>
                    <div className="space-y-4 mb-6">
                      <BreakdownBar
                        label="Performance"
                        value={result.breakdown.performance}
                        weight="40%"
                        color="#BF5700"
                        delay={0}
                      />
                      <BreakdownBar
                        label="Exposure"
                        value={result.breakdown.exposure}
                        weight="30%"
                        color="#F59E0B"
                        delay={200}
                      />
                      <BreakdownBar
                        label="Market"
                        value={result.breakdown.market}
                        weight="30%"
                        color="#10B981"
                        delay={400}
                      />
                    </div>

                    {/* Dollar Range Bar */}
                    <div className="border-t border-border pt-4">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">
                        Estimated NIL Range
                      </h4>
                      <DollarRangeBar
                        low={result.estimatedRange[0]}
                        high={result.estimatedRange[1]}
                        index={result.index}
                      />
                      <p className="text-[10px] text-text-muted/50 mt-3">
                        Based on Brook (2025) WAR-to-NIL baseline ($7.5M/WAR) adjusted for
                        college baseball market. This is a model estimate, not a market quote.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </MetricGate>

              {/* Methodology Link */}
              <div className="text-center">
                <Link href="/nil-valuation/methodology">
                  <Button variant="outline" size="sm">
                    How is this calculated?
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!selectedPlayer && !loading && (
            <div className="text-center py-12">
              <p className="text-text-muted text-sm">
                Search for a player above to calculate their NIL Performance Index.
              </p>
              <p className="text-text-muted/50 text-xs mt-2">
                {allPlayers.length > 0
                  ? `${allPlayers.length} players available from BSI Savant`
                  : 'Player data loading...'}
              </p>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}

/* -- Score Gauge (SVG arc) ----------------------------------------------- */

function ScoreGauge({ score, tier }: { score: number; tier: string }) {
  const ref = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const circumference = 2 * Math.PI * 36;
    const target = (score / 100) * circumference;
    el.style.strokeDashoffset = String(circumference);

    requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
      el.style.strokeDashoffset = String(circumference - target);
    });
  }, [score]);

  const circumference = 2 * Math.PI * 36;

  return (
    <div className="relative w-[88px] h-[88px] shrink-0">
      <svg width="88" height="88" viewBox="0 0 88 88">
        {/* Track */}
        <circle
          cx="44"
          cy="44"
          r="36"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="5"
        />
        {/* Progress arc */}
        <circle
          ref={ref}
          cx="44"
          cy="44"
          r="36"
          fill="none"
          stroke="#BF5700"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          transform="rotate(-90 44 44)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-mono font-bold text-text-primary leading-none">
          {score}
        </span>
        <span
          className={`text-[9px] font-display uppercase tracking-wider mt-0.5 ${TIER_COLORS[tier]}`}
        >
          {tier}
        </span>
      </div>
    </div>
  );
}

/* -- Tier Scale ---------------------------------------------------------- */

function TierScale({ activeTier }: { activeTier: string }) {
  const tiers = [
    { name: 'Developing', min: 0 },
    { name: 'Average', min: 40 },
    { name: 'Above Average', min: 55 },
    { name: 'High', min: 70 },
    { name: 'Elite', min: 85 },
  ];

  return (
    <div className="flex gap-1">
      {tiers.map((t) => (
        <div key={t.name} className="flex-1 text-center">
          <div
            className={`h-1.5 rounded-full mb-1 transition-all duration-500 ${
              t.name === activeTier
                ? 'bg-burnt-orange shadow-[0_0_8px_rgba(191,87,0,0.4)]'
                : 'bg-white/8'
            }`}
          />
          <span
            className={`text-[8px] font-mono uppercase tracking-wider ${
              t.name === activeTier ? 'text-burnt-orange' : 'text-text-muted/40'
            }`}
          >
            {t.name === 'Above Average' ? 'Above' : t.name}
          </span>
        </div>
      ))}
    </div>
  );
}

/* -- Breakdown Bar ------------------------------------------------------- */

function BreakdownBar({
  label,
  value,
  weight,
  color,
  delay = 0,
}: {
  label: string;
  value: number;
  weight: string;
  color: string;
  delay?: number;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;

    el.style.width = '0%';
    const timer = setTimeout(() => {
      el.style.transition = 'width 1s cubic-bezier(0.4, 0, 0.2, 1)';
      el.style.width = `${value}%`;
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <div className="flex items-baseline gap-2">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ background: color }}
          />
          <span className="text-xs text-text-secondary">{label}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-mono font-bold text-text-primary">
            {value}
          </span>
          <span className="text-[10px] font-mono text-text-muted">{weight}</span>
        </div>
      </div>
      <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-full"
          style={{ background: color, width: 0 }}
        />
      </div>
    </div>
  );
}

/* -- Dollar Range Bar ---------------------------------------------------- */

function DollarRangeBar({
  low,
  high,
  index,
}: {
  low: number;
  high: number;
  index: number;
}) {
  const maxScale = high * 1.2;
  const lowPct = (low / maxScale) * 100;
  const highPct = (high / maxScale) * 100;
  const midPct = ((low + high) / 2 / maxScale) * 100;

  return (
    <div>
      <div className="relative h-8 bg-white/5 rounded-lg overflow-hidden">
        {/* Range band */}
        <div
          className="absolute top-1 bottom-1 rounded bg-burnt-orange/20 border border-burnt-orange/30"
          style={{
            left: `${lowPct}%`,
            width: `${highPct - lowPct}%`,
          }}
        />
        {/* Midpoint marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-burnt-orange"
          style={{ left: `${midPct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-sm font-mono font-bold text-burnt-orange">
          {formatNILDollar(low)}
        </span>
        <span className="text-[10px] font-mono text-text-muted self-center">
          estimated range
        </span>
        <span className="text-sm font-mono font-bold text-burnt-orange">
          {formatNILDollar(high)}
        </span>
      </div>
    </div>
  );
}
