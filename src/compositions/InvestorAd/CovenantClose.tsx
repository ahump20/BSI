import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BSI_COLORS } from '../../lib/colors';
import { fontFamily } from '../../lib/fonts';

export function CovenantClose(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phase1End = fps * 7;    // Steinbeck quote
  const phase2End = fps * 16;   // Covenant philosophy
  const phase3End = fps * 21;   // CTA

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BSI_COLORS.midnight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {frame < phase1End && (
        <SteinbeckQuote frame={frame} fps={fps} />
      )}
      {frame >= phase1End && frame < phase2End && (
        <CovenantPhilosophy frame={frame - phase1End} fps={fps} />
      )}
      {frame >= phase2End && (
        <LogoLockup frame={frame - phase2End} fps={fps} />
      )}
    </AbsoluteFill>
  );
}

function SteinbeckQuote({ frame, fps }: { frame: number; fps: number }): React.ReactElement {
  const quoteProgress = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 80, mass: 1 },
  });

  const emphasisProgress = spring({
    frame: frame - fps * 2,
    fps,
    config: { damping: 15, stiffness: 150, mass: 0.8 },
  });

  const attributionProgress = spring({
    frame: frame - fps * 4,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 40,
        padding: 80,
        maxWidth: 1000,
      }}
    >
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 36,
          fontWeight: 400,
          fontStyle: 'italic',
          color: BSI_COLORS.white,
          textAlign: 'center',
          lineHeight: 1.6,
          opacity: quoteProgress,
          transform: `translateY(${interpolate(quoteProgress, [0, 1], [20, 0])}px)`,
        }}
      >
        "I have said that Texas is a{' '}
        <span
          style={{
            color: BSI_COLORS.burntOrange,
            fontWeight: 700,
            fontStyle: 'normal',
            opacity: emphasisProgress,
          }}
        >
          state of mind
        </span>
        "
      </span>

      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 18,
          fontWeight: 600,
          color: BSI_COLORS.muted,
          letterSpacing: 2,
          opacity: attributionProgress,
        }}
      >
        — JOHN STEINBECK
      </span>
    </div>
  );
}

function CovenantPhilosophy({ frame, fps }: { frame: number; fps: number }): React.ReactElement {
  const containerProgress = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 80, mass: 1 },
  });

  const lines = [
    { text: 'Texas is how you choose to treat', delay: 0 },
    { text: 'the best and worst of us.', delay: fps * 1.5 },
    { text: 'A covenant with oneself', delay: fps * 3, emphasis: true },
    { text: 'to never stop dreaming beyond the horizon.', delay: fps * 4.5 },
    { text: 'A home. A family. A philosophy.', delay: fps * 6.5, emphasis: true },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        padding: 60,
        maxWidth: 900,
        opacity: containerProgress,
      }}
    >
      {lines.map((line, i) => {
        const lineProgress = spring({
          frame: frame - line.delay,
          fps,
          config: {
            damping: line.emphasis ? 15 : 200,
            stiffness: line.emphasis ? 150 : 100,
            mass: line.emphasis ? 0.6 : 1,
          },
        });

        return (
          <span
            key={i}
            style={{
              fontFamily: fontFamily.inter,
              fontSize: line.emphasis ? 32 : 26,
              fontWeight: line.emphasis ? 700 : 400,
              color: line.emphasis ? BSI_COLORS.burntOrange : BSI_COLORS.white,
              textAlign: 'center',
              lineHeight: 1.4,
              opacity: lineProgress,
              transform: `translateY(${interpolate(lineProgress, [0, 1], [15, 0])}px)`,
            }}
          >
            {line.text}
          </span>
        );
      })}
    </div>
  );
}

function LogoLockup({ frame, fps }: { frame: number; fps: number }): React.ReactElement {
  const logoProgress = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 100, mass: 1 },
  });

  const taglineProgress = spring({
    frame: frame - 15,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  const urlProgress = spring({
    frame: frame - 30,
    fps,
    config: { damping: 15, stiffness: 150, mass: 0.6 },
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 30,
      }}
    >
      <div
        style={{
          opacity: logoProgress,
          transform: `scale(${interpolate(logoProgress, [0, 1], [0.8, 1])})`,
        }}
      >
        <Img
          src={staticFile('images/bsi-logo.png')}
          style={{
            width: 160,
            height: 'auto',
          }}
        />
      </div>

      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 22,
          fontWeight: 600,
          color: BSI_COLORS.muted,
          letterSpacing: 4,
          opacity: taglineProgress,
        }}
      >
        BLAZE SPORTS INTEL
      </span>

      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 16,
          fontWeight: 500,
          color: BSI_COLORS.muted,
          opacity: taglineProgress,
          transform: `translateY(${interpolate(taglineProgress, [0, 1], [10, 0])}px)`,
        }}
      >
        Born to Blaze the Path Less Beaten
      </span>

      <div
        style={{
          marginTop: 20,
          padding: '16px 40px',
          backgroundColor: BSI_COLORS.burntOrange,
          borderRadius: 10,
          opacity: urlProgress,
          transform: `scale(${urlProgress})`,
        }}
      >
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 28,
            fontWeight: 800,
            color: BSI_COLORS.midnight,
          }}
        >
          blazesportsintel.com
        </span>
      </div>
    </div>
  );
}
