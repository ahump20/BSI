import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BSI_COLORS } from '../../lib/colors';
import { fontFamily } from '../../lib/fonts';
import { AnimatedCounter } from '../../components/AnimatedCounter';

export function ProblemStatement(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phase1End = fps * 3;   // Empty scoreboards
  const phase2End = fps * 6;   // Stats
  const phase3End = fps * 10;  // Gap statement

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
        <EmptyScoreboards frame={frame} fps={fps} />
      )}
      {frame >= phase1End && frame < phase2End && (
        <TheNumbers frame={frame - phase1End} fps={fps} />
      )}
      {frame >= phase2End && (
        <TheGap frame={frame - phase2End} fps={fps} />
      )}
    </AbsoluteFill>
  );
}

function EmptyScoreboards({ frame, fps }: { frame: number; fps: number }): React.ReactElement {
  const containerProgress = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  // Glitch effect
  const glitchOffset = Math.sin(frame * 0.5) * 2;
  const showGlitch = frame % 8 < 2;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 30,
        opacity: containerProgress,
      }}
    >
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 16,
          fontWeight: 600,
          color: BSI_COLORS.muted,
          textTransform: 'uppercase',
          letterSpacing: 4,
        }}
      >
        College Sports Coverage Today
      </span>

      {/* Empty scoreboard grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}
      >
        {[...Array(6)].map((_, i) => {
          const delay = 10 + i * 4;
          const cardProgress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 15, stiffness: 150, mass: 0.6 },
          });

          return (
            <div
              key={i}
              style={{
                width: 200,
                height: 100,
                backgroundColor: '#1a1a1a',
                borderRadius: 8,
                border: '1px solid #333',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: cardProgress,
                transform: `translateX(${showGlitch ? glitchOffset : 0}px)`,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 4,
                  backgroundColor: '#2a2a2a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 20, color: '#444' }}>?</span>
              </div>
              <span
                style={{
                  fontFamily: fontFamily.inter,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#FF3B30',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                NO SIGNAL
              </span>
            </div>
          );
        })}
      </div>

      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 14,
          fontWeight: 500,
          color: '#FF3B30',
          opacity: interpolate(frame, [fps * 1.5, fps * 2], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        Fragmented. Incomplete. Frustrating.
      </span>
    </div>
  );
}

function TheNumbers({ frame, fps }: { frame: number; fps: number }): React.ReactElement {
  const stats = [
    { value: 300, suffix: '+', label: 'D1 Programs' },
    { value: 7, suffix: 'M+', label: 'Fans Underserved' },
    { value: 0, suffix: '', label: 'Unified Platforms', isZero: true },
  ];

  const titleProgress = spring({
    frame,
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
      }}
    >
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 18,
          fontWeight: 600,
          color: BSI_COLORS.muted,
          textTransform: 'uppercase',
          letterSpacing: 6,
          opacity: titleProgress,
        }}
      >
        The Market Gap
      </span>

      <div
        style={{
          display: 'flex',
          gap: 60,
        }}
      >
        {stats.map((stat, i) => {
          const delay = 8 + i * 12;
          const statProgress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 15, stiffness: 150, mass: 0.8 },
          });

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                opacity: statProgress,
                transform: `scale(${statProgress})`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                {stat.isZero ? (
                  <span
                    style={{
                      fontFamily: fontFamily.inter,
                      fontSize: 64,
                      fontWeight: 800,
                      color: '#FF3B30',
                    }}
                  >
                    0
                  </span>
                ) : (
                  <>
                    <AnimatedCounter
                      value={stat.value}
                      startFrame={delay}
                      fontSize={64}
                      color={BSI_COLORS.burntOrange}
                    />
                    <span
                      style={{
                        fontFamily: fontFamily.inter,
                        fontSize: 36,
                        fontWeight: 800,
                        color: BSI_COLORS.burntOrange,
                      }}
                    >
                      {stat.suffix}
                    </span>
                  </>
                )}
              </div>
              <span
                style={{
                  fontFamily: fontFamily.inter,
                  fontSize: 14,
                  fontWeight: 600,
                  color: stat.isZero ? '#FF3B30' : BSI_COLORS.muted,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                }}
              >
                {stat.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TheGap({ frame, fps }: { frame: number; fps: number }): React.ReactElement {
  const textProgress = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  const emphasisProgress = spring({
    frame: frame - fps * 1.5,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.5 },
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
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 36,
          fontWeight: 500,
          color: BSI_COLORS.white,
          opacity: textProgress,
          textAlign: 'center',
        }}
      >
        No unified platform for college sports data
      </span>
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 72,
          fontWeight: 800,
          color: BSI_COLORS.burntOrange,
          opacity: emphasisProgress,
          transform: `scale(${emphasisProgress})`,
        }}
      >
        Until now.
      </span>
    </div>
  );
}
