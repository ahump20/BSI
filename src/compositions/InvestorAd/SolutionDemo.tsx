import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BSI_COLORS } from '../../lib/colors';
import { fontFamily } from '../../lib/fonts';

export function SolutionDemo(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phase1End = fps * 4;  // Logo reveal
  const phase2End = fps * 8;  // Browser mockup

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
        <ProductIntro frame={frame} fps={fps} />
      )}
      {frame >= phase1End && (
        <BrowserMockup frame={frame - phase1End} fps={fps} />
      )}
    </AbsoluteFill>
  );
}

function ProductIntro({ frame, fps }: { frame: number; fps: number }): React.ReactElement {
  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  const logoProgress = spring({
    frame: frame - 10,
    fps,
    config: { damping: 20, stiffness: 100, mass: 1 },
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
          fontSize: 20,
          fontWeight: 600,
          color: BSI_COLORS.muted,
          textTransform: 'uppercase',
          letterSpacing: 6,
          opacity: titleProgress,
        }}
      >
        The Solution
      </span>

      <div
        style={{
          opacity: logoProgress,
          transform: `scale(${interpolate(logoProgress, [0, 1], [0.8, 1])})`,
        }}
      >
        <Img
          src={staticFile('images/bsi-logo.png')}
          style={{
            width: 140,
            height: 'auto',
          }}
        />
      </div>

      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 36,
          fontWeight: 700,
          color: BSI_COLORS.white,
          opacity: logoProgress,
        }}
      >
        Blaze Sports Intel
      </span>
    </div>
  );
}

function BrowserMockup({ frame, fps }: { frame: number; fps: number }): React.ReactElement {
  const containerProgress = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 100, mass: 1 },
  });

  const PORTAL_STATS = [
    { label: 'TOTAL ENTRIES', value: 847, change: '+12 today' },
    { label: 'IN PORTAL', value: 423, change: '+8 today' },
    { label: 'COMMITTED', value: 312, change: '+3 today' },
    { label: 'WITHDRAWN', value: 112, change: '+1 today' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        opacity: containerProgress,
        transform: `scale(${interpolate(containerProgress, [0, 1], [0.9, 1])})`,
      }}
    >
      {/* Browser Chrome */}
      <div
        style={{
          width: 1100,
          backgroundColor: '#1a1a1a',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Browser Tab Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: '#0d0d0d',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#ff5f57' }} />
            <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#febc2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#28c840' }} />
          </div>
          <div
            style={{
              flex: 1,
              marginLeft: 16,
              padding: '8px 16px',
              backgroundColor: '#2a2a2a',
              borderRadius: 6,
              fontFamily: fontFamily.inter,
              fontSize: 13,
              color: BSI_COLORS.muted,
            }}
          >
            blazesportsintel.com/transfer-portal
          </div>
        </div>

        {/* Browser Content */}
        <div style={{ padding: 40, backgroundColor: BSI_COLORS.midnight }}>
          {/* Nav Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 40,
              gap: 32,
            }}
          >
            <span
              style={{
                fontFamily: fontFamily.inter,
                fontSize: 18,
                fontWeight: 800,
                color: BSI_COLORS.burntOrange,
              }}
            >
              BLAZE
              <span style={{ color: BSI_COLORS.muted }}>SPORTSINTEL</span>
            </span>
            {['Transfer Portal', 'MLB', 'NFL', 'NBA', 'Dashboard'].map((item, i) => (
              <span
                key={i}
                style={{
                  fontFamily: fontFamily.inter,
                  fontSize: 14,
                  fontWeight: 500,
                  color: i === 0 ? BSI_COLORS.burntOrange : BSI_COLORS.muted,
                }}
              >
                {item}
                {i === 0 && (
                  <span
                    style={{
                      marginLeft: 6,
                      padding: '2px 6px',
                      backgroundColor: '#22c55e',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    LIVE
                  </span>
                )}
              </span>
            ))}
          </div>

          {/* Portal Badge */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <span
              style={{
                padding: '8px 20px',
                backgroundColor: `${BSI_COLORS.burntOrange}20`,
                border: `1px solid ${BSI_COLORS.burntOrange}`,
                borderRadius: 20,
                fontFamily: fontFamily.inter,
                fontSize: 12,
                fontWeight: 600,
                color: BSI_COLORS.burntOrange,
              }}
            >
              Winter 2025 Portal Window
            </span>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1
              style={{
                fontFamily: fontFamily.inter,
                fontSize: 42,
                fontWeight: 800,
                color: BSI_COLORS.white,
                margin: 0,
                marginBottom: 8,
              }}
            >
              NCAA TRANSFER PORTAL
            </h1>
            <h2
              style={{
                fontFamily: fontFamily.inter,
                fontSize: 32,
                fontWeight: 800,
                color: BSI_COLORS.burntOrange,
                margin: 0,
              }}
            >
              INTELLIGENCE HUB
            </h2>
          </div>

          {/* Stats Grid */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 20,
            }}
          >
            {PORTAL_STATS.map((stat, i) => {
              const delay = 30 + i * 10;
              const statProgress = spring({
                frame: frame - delay,
                fps,
                config: { damping: 15, stiffness: 150, mass: 0.6 },
              });

              // Animate the value counting up
              const countProgress = interpolate(
                frame - delay,
                [0, fps * 1.5],
                [0, 1],
                { extrapolateRight: 'clamp' }
              );
              const displayValue = Math.round(stat.value * countProgress);

              return (
                <div
                  key={i}
                  style={{
                    padding: '20px 32px',
                    backgroundColor: BSI_COLORS.charcoal,
                    borderRadius: 12,
                    border: `1px solid ${BSI_COLORS.muted}33`,
                    opacity: statProgress,
                    transform: `translateY(${interpolate(statProgress, [0, 1], [20, 0])}px)`,
                    minWidth: 140,
                  }}
                >
                  <span
                    style={{
                      fontFamily: fontFamily.inter,
                      fontSize: 11,
                      fontWeight: 600,
                      color: BSI_COLORS.muted,
                      letterSpacing: 1,
                      display: 'block',
                      marginBottom: 8,
                    }}
                  >
                    {stat.label}
                  </span>
                  <span
                    style={{
                      fontFamily: fontFamily.inter,
                      fontSize: 36,
                      fontWeight: 800,
                      color: BSI_COLORS.white,
                      display: 'block',
                    }}
                  >
                    {displayValue}
                  </span>
                  <span
                    style={{
                      fontFamily: fontFamily.inter,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#22c55e',
                      display: 'block',
                      marginTop: 4,
                    }}
                  >
                    {stat.change}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tagline below browser */}
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 20,
          fontWeight: 500,
          color: BSI_COLORS.muted,
          opacity: interpolate(frame, [fps * 2, fps * 3], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        Real-time tracking of every D1 transfer. The coverage fans deserve.
      </span>
    </div>
  );
}
