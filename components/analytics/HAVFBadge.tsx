'use client';

interface HAVFBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400 border-green-500/30 bg-green-500/10';
  if (score >= 60) return 'text-[#BF5700] border-[#BF5700]/30 bg-[#BF5700]/10';
  if (score >= 40) return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
  return 'text-red-400 border-red-500/30 bg-red-500/10';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Elite';
  if (score >= 75) return 'Above Avg';
  if (score >= 50) return 'Average';
  if (score >= 25) return 'Below Avg';
  return 'Developing';
}

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5 font-bold',
};

export function HAVFBadge({ score, size = 'md', className = '' }: HAVFBadgeProps) {
  const colorClass = getScoreColor(score);
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono tabular-nums ${colorClass} ${sizeClass} ${className}`}
      title={`HAV-F: ${score} (${getScoreLabel(score)})`}
    >
      <span className="font-bold">{score.toFixed(1)}</span>
      {size !== 'sm' && <span className="text-[0.7em] opacity-60">HAV-F</span>}
    </span>
  );
}
