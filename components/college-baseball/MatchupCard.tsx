'use client';

/* ────────────────────────────────────────────────────────────
   MatchupCard Component
   Current pitcher vs. current batter — side-by-side layout
   ──────────────────────────────────────────────────────────── */

interface PitcherStats {
  era: string;
  wins: number;
  so: number;
}

interface BatterStats {
  avg: string;
  hr: number;
  rbi: number;
}

interface Pitcher {
  name: string;
  stats: PitcherStats;
}

interface Batter {
  name: string;
  stats: BatterStats;
}

interface MatchupCardProps {
  pitcher: Pitcher;
  batter: Batter;
}

export function MatchupCard({ pitcher, batter }: MatchupCardProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-charcoal overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_1fr]">
        {/* ── Pitcher Panel ────────────────────────────────── */}
        <div className="p-4 flex flex-col items-center text-center">
          <span className="font-display text-[10px] uppercase tracking-widest text-burnt-orange mb-2">
            Pitching
          </span>
          <span className="font-display text-sm md:text-base uppercase tracking-wider text-white font-bold mb-3 leading-tight">
            {pitcher.name}
          </span>
          <div className="flex flex-col gap-1.5 w-full">
            <StatRow label="ERA" value={pitcher.stats.era} />
            <StatRow label="W" value={String(pitcher.stats.wins)} />
            <StatRow label="SO" value={String(pitcher.stats.so)} />
          </div>
        </div>

        {/* ── VS Divider ───────────────────────────────────── */}
        <div className="flex flex-col items-center justify-center px-3 border-x border-white/10 bg-midnight/50">
          <span className="font-display text-lg font-bold text-burnt-orange tracking-wider">
            VS
          </span>
        </div>

        {/* ── Batter Panel ─────────────────────────────────── */}
        <div className="p-4 flex flex-col items-center text-center">
          <span className="font-display text-[10px] uppercase tracking-widest text-burnt-orange mb-2">
            Batting
          </span>
          <span className="font-display text-sm md:text-base uppercase tracking-wider text-white font-bold mb-3 leading-tight">
            {batter.name}
          </span>
          <div className="flex flex-col gap-1.5 w-full">
            <StatRow label="AVG" value={batter.stats.avg} />
            <StatRow label="HR" value={String(batter.stats.hr)} />
            <StatRow label="RBI" value={String(batter.stats.rbi)} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stat Row ────────────────────────────────────────────────── */

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-2 py-1 rounded bg-white/[0.03]">
      <span className="font-mono text-[10px] uppercase text-white/40 tracking-wider">
        {label}
      </span>
      <span className="font-mono text-sm font-bold text-white">
        {value}
      </span>
    </div>
  );
}
