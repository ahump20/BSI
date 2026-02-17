'use client';

interface MMIGaugeProps {
  value: number;
  homeTeam?: string;
  awayTeam?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getGaugeColor(value: number): string {
  const absVal = Math.abs(value);
  if (absVal >= 60) return value > 0 ? '#22c55e' : '#ef4444';
  if (absVal >= 30) return value > 0 ? '#BF5700' : '#f97316';
  return '#a3a3a3';
}

function getLabel(value: number): string {
  const absVal = Math.abs(value);
  if (absVal >= 80) return 'Dominant';
  if (absVal >= 60) return 'Strong';
  if (absVal >= 30) return 'Leaning';
  if (absVal >= 10) return 'Slight Edge';
  return 'Even';
}

const SIZE_MAP = { sm: 80, md: 120, lg: 160 };

export function MMIGauge({ value, homeTeam, awayTeam, size = 'md', className = '' }: MMIGaugeProps) {
  const dim = SIZE_MAP[size];
  const radius = dim / 2 - 8;
  const cx = dim / 2;
  const cy = dim / 2;
  const color = getGaugeColor(value);
  const label = getLabel(value);

  // Map −100..+100 to angle −135..+135 (bottom half of circle)
  const angle = ((value + 100) / 200) * 270 - 135;
  const rad = (angle * Math.PI) / 180;
  const needleX = cx + (radius - 10) * Math.cos(rad);
  const needleY = cy + (radius - 10) * Math.sin(rad);

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        {/* Background arc */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4} fill={color} />
        {/* Center value */}
        <text x={cx} y={cy + (size === 'sm' ? 16 : 20)} textAnchor="middle" fill={color} fontSize={size === 'sm' ? 14 : 18} fontWeight={700} fontFamily="JetBrains Mono, monospace">
          {value > 0 ? '+' : ''}{value.toFixed(1)}
        </text>
      </svg>
      <span className="text-[10px] uppercase tracking-wider text-white/40 mt-1">{label}</span>
      {homeTeam && awayTeam && (
        <div className="flex items-center gap-2 text-[10px] mt-1">
          <span className={value < 0 ? 'text-white font-bold' : 'text-white/40'}>{awayTeam}</span>
          <span className="text-white/20">vs</span>
          <span className={value > 0 ? 'text-white font-bold' : 'text-white/40'}>{homeTeam}</span>
        </div>
      )}
    </div>
  );
}
