import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { BSI_COLORS } from '../lib/colors';
import { fontFamily } from '../lib/fonts';

type BSIBrandingProps = {
  fadeInFrame?: number;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
};

export function BSIBranding({
  fadeInFrame = 0,
  position = 'bottom-right',
}: BSIBrandingProps): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relativeFrame = frame - fadeInFrame;
  const opacity = relativeFrame < 0 ? 0 : interpolate(
    relativeFrame,
    [0, fps * 0.5],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  const positionStyles: Record<string, React.CSSProperties> = {
    'bottom-right': { right: 40, bottom: 40 },
    'bottom-left': { left: 40, bottom: 40 },
    'bottom-center': { left: '50%', bottom: 40, transform: 'translateX(-50%)' },
  };

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyles[position],
        opacity,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 20,
          fontWeight: 700,
          color: BSI_COLORS.muted,
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}
      >
        BSI
      </span>
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 14,
          color: BSI_COLORS.muted,
        }}
      >
        Blaze Sports Intel
      </span>
    </div>
  );
}
