'use client';

interface ConferenceRow {
  conference: string;
  strength_index: number;
  avg_era: number;
  avg_ops: number;
  avg_woba: number;
  is_power: number;
}

interface ConferenceStrengthChartProps {
  data: ConferenceRow[];
  isPro?: boolean;
  className?: string;
}

/**
 * ConferenceStrengthChart — ranked bar visualization for conference comparison.
 * Uses inline CSS bars instead of Recharts for zero-bundle-cost rendering.
 * Conference strength index 0-100 displayed as horizontal bars.
 */
function strengthColor(index: number): string {
  if (index >= 75) return '#BF5700';
  if (index >= 60) return '#d4775c';
  if (index >= 45) return '#aaaaaa';
  return 'rgba(255,255,255,0.25)';
}

export function ConferenceStrengthChart({
  data,
  isPro = false,
  className = '',
}: ConferenceStrengthChartProps) {
  const sorted = [...data].sort((a, b) => b.strength_index - a.strength_index);
  const displayData = isPro ? sorted : sorted.slice(0, 5);

  return (
    <div className={`bg-[#0D0D0D] border border-white/[0.06] rounded-xl overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-white/[0.04]">
        <h3 className="font-display text-base uppercase tracking-wider text-white">
          Conference Strength Index
        </h3>
        <p className="text-[10px] text-white/30 mt-1 font-mono">
          Composite of inter-conference record, RPI, offense, and pitching
        </p>
      </div>

      <div className="px-5 py-4 space-y-3">
        {displayData.map((conf, i) => (
          <div key={conf.conference} className="flex items-center gap-3">
            <span className={`text-xs font-mono w-4 tabular-nums ${
              i < 3 ? 'text-[#BF5700] font-bold' : 'text-white/20'
            }`}>
              {i + 1}
            </span>
            <span className="text-sm text-white w-24 shrink-0 truncate">
              {conf.conference}
            </span>
            <div className="flex-1 h-[10px] rounded-full bg-white/[0.04] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${conf.strength_index}%`,
                  backgroundColor: strengthColor(conf.strength_index),
                }}
              />
            </div>
            <span
              className="text-xs font-mono font-bold tabular-nums w-8 text-right"
              style={{ color: strengthColor(conf.strength_index) }}
            >
              {conf.strength_index.toFixed(0)}
            </span>
            {conf.is_power === 1 && (
              <span className="text-[8px] text-[#BF5700] font-mono uppercase tracking-wider">
                P5
              </span>
            )}
          </div>
        ))}
      </div>

      {isPro && displayData.length > 0 && (
        <div className="px-5 py-3 border-t border-white/[0.04]">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-[10px] text-white/30 font-display uppercase tracking-widest block">Avg ERA</span>
              <span className="text-sm text-white font-mono">{(displayData.reduce((s, c) => s + c.avg_era, 0) / displayData.length).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-white/30 font-display uppercase tracking-widest block">Avg wOBA</span>
              <span className="text-sm text-white font-mono">{(displayData.reduce((s, c) => s + c.avg_woba, 0) / displayData.length).toFixed(3)}</span>
            </div>
            <div>
              <span className="text-[10px] text-white/30 font-display uppercase tracking-widest block">Avg OPS</span>
              <span className="text-sm text-white font-mono">{(displayData.reduce((s, c) => s + c.avg_ops, 0) / displayData.length).toFixed(3)}</span>
            </div>
          </div>
        </div>
      )}

      {!isPro && data.length > 5 && (
        <div className="px-5 py-3 border-t border-white/[0.04] text-center">
          <a
            href="/pricing"
            className="text-xs text-[#BF5700] hover:text-[#FF6B35] font-medium transition-colors"
          >
            Upgrade to Pro for all {data.length} conferences
          </a>
        </div>
      )}
    </div>
  );
}
