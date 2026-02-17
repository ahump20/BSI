'use client';

interface MomentumGaugeProps {
  mmi: number;
  category: string;
  direction: 'home' | 'away' | 'neutral';
  homeTeam: string;
  awayTeam: string;
  situation?: {
    inning: number;
    half: 'top' | 'bottom';
    outs: number;
    score: string;
  };
  className?: string;
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'Elite Pressure': return 'text-red-400';
    case 'High Difficulty': return 'text-[#BF5700]';
    case 'Moderate': return 'text-yellow-500';
    default: return 'text-white/50';
  }
}

function getBarColor(mmi: number): string {
  if (mmi >= 70) return '#ef4444';
  if (mmi >= 55) return '#BF5700';
  if (mmi >= 40) return '#eab308';
  return '#6b7280';
}

/**
 * MomentumGauge — Real-time momentum visualization for live games.
 * Horizontal bar from 0 to 100 with the MMI value highlighted.
 */
export function MomentumGauge({
  mmi,
  category,
  direction,
  homeTeam,
  awayTeam,
  situation,
  className = '',
}: MomentumGaugeProps) {
  return (
    <div className={`bg-[#0D0D0D] border border-white/[0.06] rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white/40 uppercase tracking-wider">MMI</span>
          <span className={`text-lg font-bold tabular-nums ${getCategoryColor(category)}`}>
            {mmi.toFixed(1)}
          </span>
        </div>
        <span className={`text-xs font-semibold ${getCategoryColor(category)}`}>
          {category}
        </span>
      </div>

      {/* Gauge Bar */}
      <div className="relative h-4 bg-white/5 rounded-full overflow-hidden mb-3">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${mmi}%`,
            backgroundColor: getBarColor(mmi),
          }}
        />
        {/* Tick marks at 40, 55, 70 */}
        <div className="absolute inset-y-0 left-[40%] w-px bg-white/10" />
        <div className="absolute inset-y-0 left-[55%] w-px bg-white/10" />
        <div className="absolute inset-y-0 left-[70%] w-px bg-white/10" />
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-[10px] text-white/20 mb-3">
        <span>Routine</span>
        <span>Moderate</span>
        <span>High</span>
        <span>Elite</span>
      </div>

      {/* Teams + Direction */}
      <div className="flex items-center justify-between text-sm">
        <span className={`font-semibold ${direction === 'away' ? 'text-[#BF5700]' : 'text-white/50'}`}>
          {awayTeam}
        </span>
        <span className="text-white/20 text-xs">
          {direction === 'neutral' ? 'Even' : direction === 'home' ? 'Home advantage' : 'Away advantage'}
        </span>
        <span className={`font-semibold ${direction === 'home' ? 'text-[#BF5700]' : 'text-white/50'}`}>
          {homeTeam}
        </span>
      </div>

      {/* Situation line */}
      {situation && (
        <div className="mt-2 pt-2 border-t border-white/[0.04] text-xs text-white/30 text-center">
          {situation.half === 'top' ? 'Top' : 'Bot'} {situation.inning} · {situation.outs} out{situation.outs !== 1 ? 's' : ''} · {situation.score}
        </div>
      )}
    </div>
  );
}
