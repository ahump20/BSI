'use client';

interface WinProbGaugeProps {
  probability: number;
  label?: string;
  size?: number;
}

export function WinProbGauge({ probability, label, size = 80 }: WinProbGaugeProps) {
  const r = (size - 8) / 2;
  const C = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Math.round(probability)));
  const offset = C - (pct / 100) * C;

  return (
    <svg width={size} height={size} className="mx-auto">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="4"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--bsi-intel-accent, var(--bsi-primary, #BF5700))"
        strokeWidth="4"
        strokeDasharray={C}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x="50%"
        y="46%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--bsi-gold, #FDB913)"
        fontFamily="var(--bsi-font-mono)"
        fontSize="14"
        fontWeight="700"
      >
        {pct}%
      </text>
      {label && (
        <text
          x="50%"
          y="66%"
          textAnchor="middle"
          fill="white"
          fontFamily="var(--bsi-font-mono)"
          fontSize="8"
          opacity="0.4"
        >
          {label}
        </text>
      )}
    </svg>
  );
}
