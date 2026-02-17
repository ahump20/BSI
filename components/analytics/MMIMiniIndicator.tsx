'use client';

interface MMIMiniIndicatorProps {
  value: number;
  className?: string;
}

export function MMIMiniIndicator({ value, className = '' }: MMIMiniIndicatorProps) {
  const arrow = value > 5 ? '\u25B2' : value < -5 ? '\u25BC' : '\u25C6';
  const color = value > 20 ? 'text-green-400' : value < -20 ? 'text-red-400' : 'text-white/40';

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono text-xs tabular-nums ${color} ${className}`}
      title={`MMI: ${value > 0 ? '+' : ''}${value.toFixed(1)}`}
    >
      <span className="text-[9px]">{arrow}</span>
      <span>{Math.abs(value).toFixed(0)}</span>
    </span>
  );
}
