import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { BSI_COLORS } from '../../lib/colors';
import { fontFamily } from '../../lib/fonts';

const STACK = [
  { name: 'Workers', purpose: 'Edge compute' },
  { name: 'D1', purpose: 'SQLite' },
  { name: 'KV', purpose: 'Cache' },
  { name: 'R2', purpose: 'Storage' },
  { name: 'AI', purpose: 'Intelligence' },
];

export function TechMoat(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  const cloudflareProgress = spring({
    frame: frame - 15,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.5 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BSI_COLORS.midnight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
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
            fontSize: 20,
            fontWeight: 600,
            color: BSI_COLORS.muted,
            textTransform: 'uppercase',
            letterSpacing: 6,
            opacity: titleProgress,
          }}
        >
          The Technical Moat
        </span>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: fontFamily.inter,
              fontSize: 32,
              fontWeight: 500,
              color: BSI_COLORS.white,
              opacity: titleProgress,
            }}
          >
            100% Serverless on
          </span>
          <span
            style={{
              fontFamily: fontFamily.inter,
              fontSize: 48,
              fontWeight: 800,
              color: '#F6821F',
              opacity: cloudflareProgress,
              transform: `scale(${cloudflareProgress})`,
            }}
          >
            Cloudflare
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 20,
            marginTop: 20,
          }}
        >
          {STACK.map((item, i) => {
            const delay = 40 + i * 8;
            const itemProgress = spring({
              frame: frame - delay,
              fps,
              config: { damping: 15, stiffness: 150, mass: 0.6 },
            });

            return (
              <div
                key={i}
                style={{
                  padding: '16px 24px',
                  backgroundColor: BSI_COLORS.charcoal,
                  borderRadius: 10,
                  border: `1px solid ${BSI_COLORS.muted}33`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  opacity: itemProgress,
                  transform: `scale(${itemProgress})`,
                }}
              >
                <span
                  style={{
                    fontFamily: fontFamily.inter,
                    fontSize: 20,
                    fontWeight: 800,
                    color: BSI_COLORS.burntOrange,
                  }}
                >
                  {item.name}
                </span>
                <span
                  style={{
                    fontFamily: fontFamily.inter,
                    fontSize: 12,
                    fontWeight: 500,
                    color: BSI_COLORS.muted,
                  }}
                >
                  {item.purpose}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}
