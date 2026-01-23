import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BSIBranding } from '../../components/BSIBranding';
import { BSI_COLORS } from '../../lib/colors';
import { fontFamily } from '../../lib/fonts';

export function Outro(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stampScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 300, mass: 0.8 },
  });

  const stampRotation = interpolate(stampScale, [0, 0.5, 1], [-15, 5, 0], {
    extrapolateRight: 'clamp',
  });

  const fadeOut = interpolate(
    frame,
    [fps * 1.5, fps * 2],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          transform: `scale(${stampScale}) rotate(${stampRotation}deg)`,
          fontFamily: fontFamily.inter,
          fontSize: 100,
          fontWeight: 900,
          color: BSI_COLORS.burntOrange,
          letterSpacing: 8,
          textTransform: 'uppercase',
          border: `6px solid ${BSI_COLORS.burntOrange}`,
          padding: '20px 50px',
          borderRadius: 8,
        }}
      >
        FINAL
      </div>
      <BSIBranding fadeInFrame={fps * 0.5} position="bottom-center" />
    </div>
  );
}
