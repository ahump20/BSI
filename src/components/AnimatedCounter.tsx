import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BSI_COLORS } from '../lib/colors';
import { fontFamily } from '../lib/fonts';

type AnimatedCounterProps = {
  value: number;
  startFrame?: number;
  fontSize?: number;
  color?: string;
  prefix?: string;
  suffix?: string;
};

export function AnimatedCounter({
  value,
  startFrame = 0,
  fontSize = 120,
  color = BSI_COLORS.white,
  prefix = '',
  suffix = '',
}: AnimatedCounterProps): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relativeFrame = frame - startFrame;
  if (relativeFrame < 0) {
    return <span style={{ opacity: 0 }}>{prefix}0{suffix}</span>;
  }

  const progress = spring({
    frame: relativeFrame,
    fps,
    config: {
      damping: 200,
      stiffness: 100,
      mass: 1,
    },
  });

  const displayValue = Math.round(interpolate(progress, [0, 1], [0, value], {
    extrapolateRight: 'clamp',
  }));

  const scale = spring({
    frame: relativeFrame,
    fps,
    config: {
      damping: 15,
      stiffness: 200,
      mass: 0.5,
    },
  });

  return (
    <span
      style={{
        fontFamily: fontFamily.inter,
        fontSize,
        fontWeight: 800,
        color,
        transform: `scale(${scale})`,
        display: 'inline-block',
      }}
    >
      {prefix}{displayValue}{suffix}
    </span>
  );
}
