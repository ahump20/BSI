import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BSI_COLORS } from '../../lib/colors';
import { fontFamily } from '../../lib/fonts';

export function HookReveal(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Logo emerges (0-2s)
  const logoProgress = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 100, mass: 1 },
  });

  // Phase 2: Tagline types out (2-5s)
  const taglineStart = fps * 2;
  const tagline = 'Born to Blaze the Path Less Beaten';
  const taglineProgress = interpolate(
    frame - taglineStart,
    [0, fps * 2.5],
    [0, tagline.length],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const visibleTagline = tagline.slice(0, Math.floor(taglineProgress));
  const cursorVisible = frame > taglineStart && taglineProgress < tagline.length && frame % 15 < 8;

  // Phase 3: Site URL fades in (5-7s)
  const urlProgress = spring({
    frame: frame - fps * 5,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  // Phase 4: LIVE indicator pulses (6-8s)
  const liveStart = fps * 6;
  const liveProgress = spring({
    frame: frame - liveStart,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.5 },
  });
  const livePulse = frame > liveStart ? Math.sin((frame - liveStart) * 0.15) * 0.5 + 0.5 : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BSI_COLORS.midnight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
      }}
    >
      {/* Logo */}
      <div
        style={{
          opacity: logoProgress,
          transform: `scale(${interpolate(logoProgress, [0, 1], [0.8, 1])})`,
        }}
      >
        <Img
          src={staticFile('images/bsi-logo.png')}
          style={{
            width: 200,
            height: 'auto',
          }}
        />
      </div>

      {/* Tagline */}
      <div
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 48,
          fontWeight: 600,
          color: BSI_COLORS.white,
          textAlign: 'center',
          minHeight: 60,
          letterSpacing: 1,
        }}
      >
        {visibleTagline}
        {cursorVisible && (
          <span style={{ color: BSI_COLORS.burntOrange }}>|</span>
        )}
      </div>

      {/* Site URL */}
      <div
        style={{
          opacity: urlProgress,
          transform: `translateY(${interpolate(urlProgress, [0, 1], [20, 0])}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 28,
            fontWeight: 500,
            color: BSI_COLORS.muted,
            letterSpacing: 2,
          }}
        >
          blazesportsintel.com
        </span>

        {/* LIVE Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: liveProgress,
            transform: `scale(${liveProgress})`,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#FF3B30',
              boxShadow: `0 0 ${10 + livePulse * 15}px ${5 + livePulse * 10}px rgba(255, 59, 48, ${0.4 + livePulse * 0.4})`,
            }}
          />
          <span
            style={{
              fontFamily: fontFamily.inter,
              fontSize: 18,
              fontWeight: 700,
              color: '#FF3B30',
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}
          >
            Live Now
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}
