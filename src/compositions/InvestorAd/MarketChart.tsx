import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BSI_COLORS } from '../../lib/colors';
import { fontFamily } from '../../lib/fonts';
import type { InvestorAdProps } from '../../types/investor-ad';
import { INVESTOR_AD_DEFAULTS } from '../../types/investor-ad';

type MarketChartProps = Pick<InvestorAdProps, 'marketSize2025' | 'marketSize2034' | 'cagr'>;

export function MarketChart({
  marketSize2025 = INVESTOR_AD_DEFAULTS.marketSize2025,
  marketSize2034 = INVESTOR_AD_DEFAULTS.marketSize2034,
  cagr = INVESTOR_AD_DEFAULTS.cagr,
}: MarketChartProps): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], { extrapolateRight: 'clamp' });

  const barData = [
    { year: '2025', value: marketSize2025, max: marketSize2034 },
    { year: '2034', value: marketSize2034, max: marketSize2034 },
  ];

  const cagrProgress = spring({
    frame: frame - fps * 3,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BSI_COLORS.midnight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 60,
        padding: 80,
      }}
    >
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 24,
          fontWeight: 600,
          color: BSI_COLORS.muted,
          textTransform: 'uppercase',
          letterSpacing: 4,
          opacity: titleOpacity,
        }}
      >
        College Sports Media Market
      </span>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 100,
          height: 400,
        }}
      >
        {barData.map((bar, i) => {
          const barDelay = fps + i * 30;
          const barProgress = spring({
            frame: frame - barDelay,
            fps,
            config: { damping: 200, stiffness: 50, mass: 1 },
          });

          const barHeight = (bar.value / bar.max) * 350 * barProgress;

          const valueProgress = spring({
            frame: frame - barDelay - 20,
            fps,
            config: { damping: 200, stiffness: 100, mass: 1 },
          });

          const displayValue = interpolate(valueProgress, [0, 1], [0, bar.value]);

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <span
                style={{
                  fontFamily: fontFamily.inter,
                  fontSize: 48,
                  fontWeight: 800,
                  color: BSI_COLORS.burntOrange,
                  opacity: valueProgress,
                }}
              >
                ${displayValue.toFixed(1)}B
              </span>
              <div
                style={{
                  width: 120,
                  height: barHeight,
                  background: `linear-gradient(180deg, ${BSI_COLORS.burntOrange} 0%, ${BSI_COLORS.texasSoil} 100%)`,
                  borderRadius: 8,
                }}
              />
              <span
                style={{
                  fontFamily: fontFamily.inter,
                  fontSize: 24,
                  fontWeight: 600,
                  color: BSI_COLORS.white,
                }}
              >
                {bar.year}
              </span>
            </div>
          );
        })}

        <GrowthArrow frame={frame} fps={fps} />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          opacity: cagrProgress,
          transform: `translateY(${interpolate(cagrProgress, [0, 1], [20, 0])}px)`,
        }}
      >
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 64,
            fontWeight: 900,
            color: BSI_COLORS.ember,
          }}
        >
          {cagr}%
        </span>
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 24,
            fontWeight: 600,
            color: BSI_COLORS.muted,
          }}
        >
          CAGR
        </span>
      </div>
    </AbsoluteFill>
  );
}

function GrowthArrow({ frame, fps }: { frame: number; fps: number }): React.ReactElement {
  const arrowProgress = spring({
    frame: frame - fps * 2,
    fps,
    config: { damping: 20, stiffness: 100, mass: 0.8 },
  });

  return (
    <svg
      width="150"
      height="300"
      viewBox="0 0 150 300"
      style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: arrowProgress,
      }}
    >
      <path
        d="M20,280 Q75,150 130,50"
        fill="none"
        stroke={BSI_COLORS.ember}
        strokeWidth="4"
        strokeDasharray="300"
        strokeDashoffset={interpolate(arrowProgress, [0, 1], [300, 0])}
        strokeLinecap="round"
      />
      <polygon
        points="125,40 140,55 120,60"
        fill={BSI_COLORS.ember}
        opacity={arrowProgress}
      />
    </svg>
  );
}
