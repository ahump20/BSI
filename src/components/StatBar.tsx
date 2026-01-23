import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BSI_COLORS } from '../lib/colors';
import { fontFamily } from '../lib/fonts';

type StatBarProps = {
  label: string;
  homeValue: number;
  awayValue: number;
  startFrame?: number;
  index?: number;
};

export function StatBar({
  label,
  homeValue,
  awayValue,
  startFrame = 0,
  index = 0,
}: StatBarProps): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const staggerDelay = index * 6;
  const relativeFrame = frame - startFrame - staggerDelay;

  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;

  const progress = relativeFrame < 0 ? 0 : spring({
    frame: relativeFrame,
    fps,
    config: {
      damping: 200,
      stiffness: 80,
      mass: 1,
    },
  });

  const homeWidth = interpolate(progress, [0, 1], [0, homePercent], {
    extrapolateRight: 'clamp',
  });
  const awayWidth = interpolate(progress, [0, 1], [0, awayPercent], {
    extrapolateRight: 'clamp',
  });

  const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        opacity,
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: fontFamily.inter,
          fontSize: 24,
          color: BSI_COLORS.muted,
          textTransform: 'uppercase',
          letterSpacing: 2,
        }}
      >
        <span style={{ color: BSI_COLORS.white, fontWeight: 700 }}>{homeValue}</span>
        <span>{label}</span>
        <span style={{ color: BSI_COLORS.white, fontWeight: 700 }}>{awayValue}</span>
      </div>
      <div
        style={{
          display: 'flex',
          height: 12,
          gap: 4,
          borderRadius: 6,
          overflow: 'hidden',
          backgroundColor: BSI_COLORS.charcoal,
        }}
      >
        <div
          style={{
            width: `${homeWidth}%`,
            backgroundColor: BSI_COLORS.burntOrange,
            borderRadius: '6px 0 0 6px',
            transition: 'none',
          }}
        />
        <div
          style={{
            width: `${awayWidth}%`,
            backgroundColor: BSI_COLORS.ember,
            borderRadius: '0 6px 6px 0',
            transition: 'none',
          }}
        />
      </div>
    </div>
  );
}
