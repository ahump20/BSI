import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { AnimatedCounter } from './AnimatedCounter';
import { BSI_COLORS } from '../lib/colors';
import { fontFamily } from '../lib/fonts';

type MetricCardProps = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  startFrame?: number;
  labelColor?: string;
  valueColor?: string;
  labelSize?: number;
  valueSize?: number;
};

export function MetricCard({
  label,
  value,
  prefix = '',
  suffix = '',
  startFrame = 0,
  labelColor = BSI_COLORS.muted,
  valueColor = BSI_COLORS.burntOrange,
  labelSize = 24,
  valueSize = 72,
}: MetricCardProps): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relativeFrame = frame - startFrame;

  const cardScale = spring({
    frame: relativeFrame,
    fps,
    config: {
      damping: 15,
      stiffness: 200,
      mass: 0.5,
    },
  });

  const labelOpacity = interpolate(
    relativeFrame,
    [0, fps * 0.3],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  if (relativeFrame < 0) {
    return <div style={{ opacity: 0 }} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        transform: `scale(${cardScale})`,
      }}
    >
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: labelSize,
          fontWeight: 600,
          color: labelColor,
          textTransform: 'uppercase',
          letterSpacing: 3,
          opacity: labelOpacity,
        }}
      >
        {label}
      </span>
      <AnimatedCounter
        value={value}
        startFrame={startFrame + 10}
        fontSize={valueSize}
        color={valueColor}
        prefix={prefix}
        suffix={suffix}
      />
    </div>
  );
}
