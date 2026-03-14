'use client';

const TIER_COLORS = {
  1: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', label: 'Tier 1' },
  2: { bg: 'bg-slate-400/10', border: 'border-slate-400/20', text: 'text-slate-300', label: 'Tier 2' },
  3: { bg: 'bg-amber-700/10', border: 'border-amber-700/20', text: 'text-amber-600', label: 'Tier 3' },
  4: { bg: 'bg-surface-light/5', border: 'border-border-subtle', text: 'text-text-muted', label: 'Tier 4' },
  5: { bg: 'bg-surface-light/5', border: 'border-border-subtle', text: 'text-text-muted', label: 'Tier 5' },
} as const;

const POOL_DANGER: Record<string, { label: string; color: string }> = {
  D: { label: 'POOL OF DEATH', color: 'text-ember bg-ember/10 border-ember/20' },
  C: { label: 'HIGH', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  B: { label: 'MED-HIGH', color: 'text-text-secondary bg-surface-light border-border-subtle' },
  A: { label: 'MEDIUM', color: 'text-text-secondary bg-surface-light border-border-subtle' },
};

interface RankingRow {
  rank: number;
  team: string;
  pool: 'A' | 'B' | 'C' | 'D';
  qfPct: number;
  sfPct: number;
  finalPct: number;
  titlePct: number;
  tier: 1 | 2 | 3 | 4 | 5;
}

const RANKINGS: RankingRow[] = [
  { rank: 1, team: 'Japan', pool: 'C', qfPct: 94, sfPct: 79, finalPct: 55, titlePct: 22.0, tier: 1 },
  { rank: 2, team: 'Dominican Republic', pool: 'D', qfPct: 88, sfPct: 71, finalPct: 46, titlePct: 18.0, tier: 1 },
  { rank: 3, team: 'USA', pool: 'B', qfPct: 85, sfPct: 65, finalPct: 40, titlePct: 15.0, tier: 1 },
  { rank: 4, team: 'Venezuela', pool: 'D', qfPct: 79, sfPct: 55, finalPct: 30, titlePct: 10.0, tier: 2 },
  { rank: 5, team: 'Puerto Rico', pool: 'D', qfPct: 72, sfPct: 44, finalPct: 22, titlePct: 9.0, tier: 2 },
  { rank: 6, team: 'South Korea', pool: 'C', qfPct: 76, sfPct: 48, finalPct: 24, titlePct: 8.0, tier: 2 },
  { rank: 7, team: 'Mexico', pool: 'B', qfPct: 68, sfPct: 35, finalPct: 15, titlePct: 5.0, tier: 2 },
  { rank: 8, team: 'Cuba', pool: 'A', qfPct: 65, sfPct: 30, finalPct: 11, titlePct: 4.0, tier: 3 },
  { rank: 9, team: 'Netherlands', pool: 'A', qfPct: 60, sfPct: 25, finalPct: 9, titlePct: 3.0, tier: 3 },
  { rank: 10, team: 'Canada', pool: 'B', qfPct: 55, sfPct: 20, finalPct: 7, titlePct: 2.0, tier: 3 },
  { rank: 11, team: 'Australia', pool: 'C', qfPct: 48, sfPct: 14, finalPct: 4, titlePct: 1.5, tier: 3 },
  { rank: 12, team: 'Italy', pool: 'A', qfPct: 45, sfPct: 12, finalPct: 3, titlePct: 1.0, tier: 3 },
  { rank: 13, team: 'Colombia', pool: 'B', qfPct: 38, sfPct: 9, finalPct: 2, titlePct: 0.8, tier: 4 },
  { rank: 14, team: 'Chinese Taipei', pool: 'A', qfPct: 35, sfPct: 7, finalPct: 1.5, titlePct: 0.5, tier: 4 },
  { rank: 15, team: 'Panama', pool: 'A', qfPct: 28, sfPct: 5, finalPct: 1, titlePct: 0.4, tier: 4 },
  { rank: 16, team: 'Israel', pool: 'D', qfPct: 22, sfPct: 3, finalPct: 0.5, titlePct: 0.3, tier: 4 },
  { rank: 17, team: 'Czech Republic', pool: 'C', qfPct: 18, sfPct: 2, finalPct: 0.3, titlePct: 0.3, tier: 5 },
  { rank: 18, team: 'Nicaragua', pool: 'D', qfPct: 12, sfPct: 1, finalPct: 0.1, titlePct: 0.1, tier: 5 },
  { rank: 19, team: 'China', pool: 'C', qfPct: 8, sfPct: 0.5, finalPct: 0.1, titlePct: 0.1, tier: 5 },
  { rank: 20, team: 'Great Britain', pool: 'B', qfPct: 5, sfPct: 0.2, finalPct: 0.05, titlePct: 0.1, tier: 5 },
];

function PctBar({ value, max = 100 }: { value: number; max?: number }) {
  const width = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-surface-light rounded-full overflow-hidden">
        <div
          className="h-full bg-burnt-orange rounded-full transition-all"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-right tabular-nums text-sm w-12">{value}%</span>
    </div>
  );
}

export function PowerRankingsTable() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-text-primary">
            Power Rankings
          </h2>
          <p className="text-text-muted text-sm mt-1">BSI probability model · 200K simulations · pre-tournament baseline</p>
        </div>
        <div className="hidden sm:flex gap-2 flex-wrap justify-end">
          {Object.entries(TIER_COLORS).map(([tier, style]) => (
            <span
              key={tier}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm border ${style.bg} ${style.border} ${style.text}`}
            >
              {style.label}
            </span>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full" aria-label="WBC 2026 Power Rankings">
          <thead>
            <tr className="border-b-2 border-burnt-orange">
              <th scope="col" className="text-left p-3 text-text-tertiary font-semibold text-sm w-12">#</th>
              <th scope="col" className="text-left p-3 text-text-tertiary font-semibold text-sm">Team</th>
              <th scope="col" className="text-left p-3 text-text-tertiary font-semibold text-sm">Pool</th>
              <th scope="col" className="text-left p-3 text-text-tertiary font-semibold text-sm min-w-[120px]">QF%</th>
              <th scope="col" className="text-left p-3 text-text-tertiary font-semibold text-sm min-w-[120px]">SF%</th>
              <th scope="col" className="text-left p-3 text-text-tertiary font-semibold text-sm min-w-[120px]">Final%</th>
              <th scope="col" className="text-right p-3 text-text-tertiary font-semibold text-sm">Title%</th>
            </tr>
          </thead>
          <tbody>
            {RANKINGS.map((row) => {
              const tier = TIER_COLORS[row.tier];
              const poolDanger = POOL_DANGER[row.pool];
              return (
                <tr
                  key={row.team}
                  className="border-b border-border-subtle hover:bg-surface-light/30 transition-colors"
                >
                  <td className="p-3">
                    <span className={`font-bold ${tier.text}`}>{row.rank}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary">{row.team}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm border ${tier.bg} ${tier.border} ${tier.text}`}>
                        {tier.label.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-text-secondary font-mono text-sm">Pool {row.pool}</span>
                      {row.pool === 'D' && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm border hidden lg:inline ${poolDanger.color}`}>
                          ☠
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3"><PctBar value={row.qfPct} /></td>
                  <td className="p-3"><PctBar value={row.sfPct} /></td>
                  <td className="p-3"><PctBar value={row.finalPct} /></td>
                  <td className="p-3 text-right">
                    <span className="font-bold text-burnt-orange tabular-nums">{row.titlePct}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {RANKINGS.map((row) => {
          const tier = TIER_COLORS[row.tier];
          return (
            <div
              key={row.team}
              className="flex items-center justify-between p-3 rounded-sm bg-surface-light/20 border border-border-subtle"
            >
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold ${tier.text} w-8 tabular-nums`}>{row.rank}</span>
                <div>
                  <div className="font-semibold text-text-primary text-sm">{row.team}</div>
                  <div className="text-text-muted text-xs">Pool {row.pool}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-burnt-orange font-bold">{row.titlePct}%</div>
                <div className="text-text-muted text-xs">title</div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-text-muted text-xs mt-4 pt-4 border-t border-border-subtle">
        BSI probability model (200K Monte Carlo simulations) · Pre-tournament baseline · March 4, 2026
      </p>
    </div>
  );
}
