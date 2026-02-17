'use client';

/* ────────────────────────────────────────────────────────────
   Linescore Component
   Baseball linescore table — innings 1-9+, R, H, E
   ──────────────────────────────────────────────────────────── */

interface TeamLine {
  name: string;
  abbreviation: string;
  innings: number[];
  runs: number;
  hits: number;
  errors: number;
}

interface LinescoreProps {
  away: TeamLine;
  home: TeamLine;
  /** Currently active inning (1-indexed). Undefined when game is not live. */
  currentInning?: number;
  /** True if it is the top of the current inning. */
  isTopInning?: boolean;
}

export function Linescore({ away, home, currentInning, isTopInning }: LinescoreProps) {
  const maxInnings = Math.max(away.innings.length, home.innings.length, 9);
  const inningHeaders = Array.from({ length: maxInnings }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 bg-charcoal">
      <table className="w-full min-w-[560px] text-center">
        <thead>
          <tr className="border-b border-white/10">
            {/* Team name column */}
            <th className="sticky left-0 z-10 bg-charcoal px-4 py-2 text-left font-display text-xs uppercase tracking-wider text-white/50">
              Team
            </th>
            {/* Inning columns */}
            {inningHeaders.map((inn) => {
              const isCurrentInning = currentInning === inn;
              return (
                <th
                  key={`inn-${inn}`}
                  className={`px-2 py-2 font-mono text-xs transition-colors ${
                    isCurrentInning
                      ? 'text-burnt-orange font-bold'
                      : 'text-white/50'
                  }`}
                >
                  {inn}
                </th>
              );
            })}
            {/* R H E */}
            <th className="px-3 py-2 font-mono text-xs font-bold text-white/80 border-l border-white/10">
              R
            </th>
            <th className="px-3 py-2 font-mono text-xs font-bold text-white/80">
              H
            </th>
            <th className="px-3 py-2 font-mono text-xs font-bold text-white/80">
              E
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Away row */}
          <LinescoreRow
            team={away}
            inningHeaders={inningHeaders}
            currentInning={currentInning}
            isActive={currentInning !== undefined && isTopInning === true}
          />
          {/* Home row */}
          <LinescoreRow
            team={home}
            inningHeaders={inningHeaders}
            currentInning={currentInning}
            isActive={currentInning !== undefined && isTopInning === false}
          />
        </tbody>
      </table>
    </div>
  );
}

/* ── Individual Row ──────────────────────────────────────────── */

interface LinescoreRowProps {
  team: TeamLine;
  inningHeaders: number[];
  currentInning?: number;
  /** True if this team is currently batting. */
  isActive: boolean;
}

function LinescoreRow({ team, inningHeaders, currentInning, isActive }: LinescoreRowProps) {
  return (
    <tr className="border-b border-white/5 last:border-b-0">
      {/* Team abbreviation */}
      <td className="sticky left-0 z-10 bg-charcoal px-4 py-2.5 text-left">
        <span
          className={`font-display text-sm uppercase tracking-wider ${
            isActive ? 'text-burnt-orange font-bold' : 'text-white'
          }`}
        >
          {team.abbreviation}
        </span>
      </td>

      {/* Inning scores */}
      {inningHeaders.map((inn) => {
        const score = team.innings[inn - 1];
        const isCurrent = currentInning === inn;
        const hasValue = score !== undefined;

        return (
          <td
            key={`${team.abbreviation}-${inn}`}
            className={`px-2 py-2.5 font-mono text-sm transition-colors ${
              isCurrent
                ? 'bg-burnt-orange/10 text-burnt-orange font-bold'
                : hasValue
                  ? 'text-white'
                  : 'text-white/20'
            }`}
          >
            {hasValue ? score : '-'}
          </td>
        );
      })}

      {/* R H E totals */}
      <td className="px-3 py-2.5 font-mono text-sm font-bold text-white border-l border-white/10">
        {team.runs}
      </td>
      <td className="px-3 py-2.5 font-mono text-sm text-white/80">
        {team.hits}
      </td>
      <td className="px-3 py-2.5 font-mono text-sm text-white/80">
        {team.errors}
      </td>
    </tr>
  );
}
