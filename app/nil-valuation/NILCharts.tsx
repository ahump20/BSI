'use client';

import { useRef, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  LabelList,
} from 'recharts';

import {
  NIL_MARKET_GROWTH,
  NIL_SPORT_DISTRIBUTION,
  NIL_GENDER_SPLIT,
  NIL_COLLECTIVE_GROWTH,
  NIL_MARKET_GROWTH_SOURCE,
  NIL_SPORT_SOURCE,
  NIL_GENDER_SOURCE,
  NIL_COLLECTIVE_SOURCE,
  NIL_COLLECTIVE_CONCENTRATION,
} from '@/lib/data/nil-market-data';

/* -- Shared Chart Styles ------------------------------------------------- */

const CHART_COLORS = {
  primary: '#BF5700',
  primaryLight: 'rgba(191, 87, 0, 0.15)',
  secondary: '#FF6B35',
  tertiary: '#8B4513',
  grid: 'rgba(255, 255, 255, 0.06)',
  text: 'rgba(255, 255, 255, 0.5)',
  men: '#BF5700',
  women: '#3B82F6',
} as const;

const AXIS_STYLE = {
  fontSize: 11,
  fontFamily: 'JetBrains Mono, monospace',
  fill: CHART_COLORS.text,
};

const TOOLTIP_STYLE = {
  background: '#1A1A1A',
  border: '1px solid rgba(191, 87, 0, 0.3)',
  borderRadius: 2,
  fontSize: 12,
  fontFamily: 'JetBrains Mono, monospace',
};

function ChartSource({ source }: { source: string }) {
  return (
    <p className="text-[10px] font-mono text-text-muted/40 mt-3 text-right">
      Source: {source}
    </p>
  );
}

/** Animates a number counting up from 0 */
function AnimatedStat({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame: number;
    const duration = 1200;
    const start = performance.now();

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * value;
      el!.textContent = `${prefix}${current.toFixed(decimals)}${suffix}`;
      if (progress < 1) frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, prefix, suffix, decimals]);

  return <span ref={ref} className={className}>{prefix}0{suffix}</span>;
}

/* -- 1. Market Growth Area Chart ----------------------------------------- */

export function MarketGrowthChart() {
  const data = NIL_MARKET_GROWTH.map((d) => ({
    label: d.label,
    value: d.value,
    low: d.low,
    high: d.high,
    projected: d.projected,
  }));

  const latestActual = data.filter((d) => !d.projected).at(-1);
  const yoyGrowth = latestActual
    ? ((latestActual.value - data[data.length - 3]?.value) / data[data.length - 3]?.value * 100)
    : 0;

  return (
    <div>
      <h3 className="font-display text-sm uppercase tracking-wider text-text-secondary mb-1">
        NIL Market Size
      </h3>
      <p className="text-xs text-text-muted mb-3">
        Total market value, Year 1 through Year 5 (projected)
      </p>

      {/* Hero stat callout */}
      <div className="flex items-baseline gap-3 mb-4">
        <AnimatedStat
          value={data.at(-2)?.value ?? 0}
          prefix="$"
          suffix="B"
          decimals={2}
          className="text-2xl font-mono font-bold text-burnt-orange"
        />
        <span className="text-xs font-mono text-[var(--bsi-success)]">
          +{yoyGrowth.toFixed(0)}% YoY
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="nilMarketGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BF5700" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#BF5700" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis dataKey="label" tick={AXIS_STYLE} />
          <YAxis
            tick={AXIS_STYLE}
            tickFormatter={(v: number) => `$${v}B`}
            domain={[0, 3]}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={TOOLTIP_STYLE} className="px-3 py-2">
                  <div className="text-xs text-text-muted mb-1">{d.label}</div>
                  <div className="text-sm font-mono font-bold text-text-primary">
                    ${d.value.toFixed(2)}B
                  </div>
                  {d.projected && (
                    <div className="text-[10px] text-burnt-orange mt-1 font-mono">
                      Projected ({d.low && d.high ? `$${d.low}B - $${d.high}B range` : ''})
                    </div>
                  )}
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={CHART_COLORS.primary}
            fill="url(#nilMarketGrad)"
            strokeWidth={2.5}
            dot={(props: { cx?: number; cy?: number; payload?: { projected?: boolean } }) => {
              const { cx = 0, cy = 0, payload: dotData } = props;
              const isProjected = dotData?.projected;
              return (
                <g key={`dot-${cx}`}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isProjected ? 5 : 4}
                    fill={isProjected ? 'transparent' : CHART_COLORS.primary}
                    stroke={CHART_COLORS.primary}
                    strokeWidth={isProjected ? 2 : 0}
                    strokeDasharray={isProjected ? '3 2' : undefined}
                  />
                  {isProjected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={2}
                      fill={CHART_COLORS.primary}
                      opacity={0.6}
                    />
                  )}
                </g>
              );
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-burnt-orange" />
          <span className="text-[10px] text-text-muted font-mono">Actual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full border border-burnt-orange/60 border-dashed" />
          <span className="text-[10px] text-text-muted font-mono">Projected</span>
        </div>
      </div>
      <ChartSource source={NIL_MARKET_GROWTH_SOURCE} />
    </div>
  );
}

/* -- 2. Sport Distribution Bar Chart ------------------------------------- */

/** Intensity gradient: higher share = more saturated orange */
function getShareColor(share: number, maxShare: number): string {
  const ratio = share / maxShare;
  const alpha = 0.3 + ratio * 0.7;
  return `rgba(191, 87, 0, ${alpha})`;
}

export function SportDistributionChart() {
  const data = [...NIL_SPORT_DISTRIBUTION].sort((a, b) => b.share - a.share);
  const maxShare = data[0]?.share ?? 1;

  return (
    <div>
      <h3 className="font-display text-sm uppercase tracking-wider text-text-secondary mb-1">
        NIL Distribution by Sport
      </h3>
      <p className="text-xs text-text-muted mb-3">
        Share of total NIL activity by sport
      </p>

      {/* Dominance callout */}
      <div className="flex items-baseline gap-2 mb-4">
        <AnimatedStat
          value={data[0]?.share ?? 0}
          suffix="%"
          decimals={1}
          className="text-2xl font-mono font-bold text-burnt-orange"
        />
        <span className="text-xs font-mono text-text-muted">
          Football alone
        </span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 30, bottom: 0, left: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
          <XAxis
            type="number"
            tick={AXIS_STYLE}
            tickFormatter={(v: number) => `${v}%`}
            domain={[0, 50]}
          />
          <YAxis
            type="category"
            dataKey="sport"
            tick={{ ...AXIS_STYLE, fontSize: 10 }}
            width={75}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number) => [`${value}%`, 'Share']}
          />
          <Bar dataKey="share" radius={[0, 4, 4, 0]} animationDuration={1200}>
            {data.map((entry, i) => (
              <Cell key={i} fill={getShareColor(entry.share, maxShare)} />
            ))}
            <LabelList
              dataKey="share"
              position="right"
              formatter={(v: number) => `${v}%`}
              style={{
                fill: 'rgba(255, 255, 255, 0.6)',
                fontSize: 10,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ChartSource source={NIL_SPORT_SOURCE} />
    </div>
  );
}

/* -- 3. Gender Equity Chart ---------------------------------------------- */

export function GenderEquityChart() {
  const data = NIL_GENDER_SPLIT.map((d) => ({
    metric: d.metric,
    Men: d.men,
    Women: d.women,
  }));

  return (
    <div>
      <h3 className="font-display text-sm uppercase tracking-wider text-text-secondary mb-1">
        Gender Equity in NIL
      </h3>
      <p className="text-xs text-text-muted mb-3">
        Deal share by gender — count vs. top-100 representation
      </p>

      {/* Key insight callout */}
      <div className="flex gap-6 mb-4">
        <div>
          <div className="text-lg font-mono font-bold text-[var(--heritage-columbia-blue)]">52%</div>
          <div className="text-[10px] font-mono text-text-muted">Women in Top-100</div>
        </div>
        <div>
          <div className="text-lg font-mono font-bold text-burnt-orange">57%</div>
          <div className="text-[10px] font-mono text-text-muted">Men deal count</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis dataKey="metric" tick={{ ...AXIS_STYLE, fontSize: 10 }} />
          <YAxis
            tick={AXIS_STYLE}
            tickFormatter={(v: number) => `${v}%`}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={TOOLTIP_STYLE} className="px-3 py-2">
                  <div className="text-xs text-text-muted mb-1.5">{d.metric}</div>
                  <div className="flex gap-4">
                    <div>
                      <span className="inline-block w-2 h-2 rounded-sm mr-1.5" style={{ background: CHART_COLORS.men }} />
                      <span className="text-xs font-mono">Men {d.Men}%</span>
                    </div>
                    <div>
                      <span className="inline-block w-2 h-2 rounded-sm mr-1.5" style={{ background: CHART_COLORS.women }} />
                      <span className="text-xs font-mono">Women {d.Women}%</span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="Men" fill={CHART_COLORS.men} radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="Men"
              position="top"
              formatter={(v: number) => `${v}%`}
              style={{
                fill: CHART_COLORS.men,
                fontSize: 10,
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 600,
              }}
            />
          </Bar>
          <Bar dataKey="Women" fill={CHART_COLORS.women} radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="Women"
              position="top"
              formatter={(v: number) => `${v}%`}
              style={{
                fill: CHART_COLORS.women,
                fontSize: 10,
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 600,
              }}
            />
          </Bar>
          <ReferenceLine y={50} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" label={{
            value: 'Parity',
            position: 'right',
            fill: 'rgba(255,255,255,0.25)',
            fontSize: 9,
            fontFamily: 'JetBrains Mono, monospace',
          }} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: CHART_COLORS.men }} />
          <span className="text-[10px] text-text-muted font-mono">Men</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: CHART_COLORS.women }} />
          <span className="text-[10px] text-text-muted font-mono">Women</span>
        </div>
      </div>
      <p className="text-[10px] text-text-muted/60 mt-2 italic">
        Note: Dollar-share data lacks independent audit. Count-based metrics are more reliable.
      </p>
      <ChartSource source={NIL_GENDER_SOURCE} />
    </div>
  );
}

/* -- 4. Collective Ecosystem Chart --------------------------------------- */

export function CollectiveGrowthChart() {
  const data = NIL_COLLECTIVE_GROWTH.map((d) => ({
    year: d.year,
    count: d.count,
    projected: d.projected,
  }));

  const growth = data.length >= 2
    ? Math.round(((data.at(-2)!.count - data[0].count) / data[0].count) * 100)
    : 0;

  return (
    <div>
      <h3 className="font-display text-sm uppercase tracking-wider text-text-secondary mb-1">
        Collective Ecosystem
      </h3>
      <p className="text-xs text-text-muted mb-3">
        Number of active NIL collectives
      </p>

      {/* Growth callout */}
      <div className="flex items-baseline gap-3 mb-4">
        <AnimatedStat
          value={data.at(-2)?.count ?? 0}
          suffix="+"
          decimals={0}
          className="text-2xl font-mono font-bold text-burnt-orange"
        />
        <span className="text-xs font-mono text-[var(--bsi-success)]">
          +{growth}% since {data[0]?.year}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="collectiveAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BF5700" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#BF5700" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis dataKey="year" tick={AXIS_STYLE} />
          <YAxis tick={AXIS_STYLE} domain={[0, 300]} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={TOOLTIP_STYLE} className="px-3 py-2">
                  <div className="text-xs text-text-muted mb-1">{d.year}</div>
                  <div className="text-sm font-mono font-bold text-text-primary">
                    {d.count} collectives
                  </div>
                  {d.projected && (
                    <div className="text-[10px] text-burnt-orange mt-1 font-mono">
                      Projected
                    </div>
                  )}
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke={CHART_COLORS.primary}
            strokeWidth={2.5}
            dot={(props: { cx?: number; cy?: number; payload?: { projected?: boolean } }) => {
              const { cx = 0, cy = 0, payload: dotData } = props;
              const isProjected = dotData?.projected;
              return (
                <g key={`cdot-${cx}`}>
                  {/* Glow ring on each dot */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={8}
                    fill="none"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={1}
                    opacity={0.15}
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isProjected ? 5 : 4}
                    fill={isProjected ? 'transparent' : CHART_COLORS.primary}
                    stroke={CHART_COLORS.primary}
                    strokeWidth={isProjected ? 2 : 0}
                    strokeDasharray={isProjected ? '3 2' : undefined}
                  />
                </g>
              );
            }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-text-muted/60 mt-2">
        {NIL_COLLECTIVE_CONCENTRATION}
      </p>
      <ChartSource source={NIL_COLLECTIVE_SOURCE} />
    </div>
  );
}
