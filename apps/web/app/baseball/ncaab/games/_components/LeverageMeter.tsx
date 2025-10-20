import type { FC } from 'react';

interface LeverageMeterProps {
  leverageIndex?: number;
  inning?: number;
  half?: 'Top' | 'Bottom';
  status: 'scheduled' | 'live' | 'in_progress' | 'final';
  startsAt: string;
}

const statusCopy: Record<LeverageMeterProps['status'], string> = {
  scheduled: 'First pitch pending',
  live: 'Live',
  in_progress: 'Live',
  final: 'Final'
};

export const LeverageMeter: FC<LeverageMeterProps> = ({ leverageIndex = 0, inning, half, status, startsAt }) => {
  const normalized = Math.max(0, Math.min(100, Math.round(leverageIndex)));
  const inningLabel = inning ? `${half ?? 'Top'} ${inning}` : 'Pre-game';
  const statusLabel = statusCopy[status] ?? 'Live';
  const startTime = new Date(startsAt);
  const formattedStart = Number.isNaN(startTime.getTime()) ? 'TBD' : startTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return (
    <section
      aria-label="Game leverage index"
      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-lg sm:p-5"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalized}
      aria-valuetext={`${normalized} leverage index, ${inningLabel}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-amber-300/80">
          <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-[0.65rem] font-semibold text-emerald-300">{statusLabel}</span>
          <span>{inningLabel}</span>
        </div>
        <p className="text-xs text-slate-400 sm:text-sm">First pitch: {formattedStart}</p>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-800">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500"
          style={{ width: `${normalized}%` }}
        />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Leverage Index</p>
          <p className="text-2xl font-semibold text-slate-100">{normalized}</p>
        </div>
        <p className="text-right text-xs text-slate-400">
          Pressure is calculated from win probability deltas and base-out state. Values above 70 flag high-leverage innings.
        </p>
      </div>
    </section>
  );
};
