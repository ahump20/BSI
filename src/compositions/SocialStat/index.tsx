import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { TeamLogo } from '../../components/TeamLogo';
import { AnimatedCounter } from '../../components/AnimatedCounter';
import { BSIBranding } from '../../components/BSIBranding';
import { BSI_COLORS } from '../../lib/colors';
import { fontFamily } from '../../lib/fonts';
import type { SocialStatProps } from '../../types/sports';
import { ASPECT_RATIOS } from '../../types/sports';

export function SocialStat({
  statLabel,
  statValue,
  statUnit = '',
  playerName,
  teamLogo,
  backgroundColor = BSI_COLORS.midnight,
  aspectRatio = 'square',
}: SocialStatProps): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const dimensions = ASPECT_RATIOS[aspectRatio];

  const typewriterProgress = interpolate(
    frame,
    [0, fps * 1.5],
    [0, statLabel.length],
    { extrapolateRight: 'clamp' }
  );

  const visibleLabel = statLabel.slice(0, Math.floor(typewriterProgress));
  const cursorOpacity = frame % 15 < 8 && typewriterProgress < statLabel.length ? 1 : 0;

  const valueAppear = spring({
    frame: frame - fps * 1.5,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  const brandingFadeIn = fps * 4;

  const isNumericValue = typeof statValue === 'number';

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        width: dimensions.width,
        height: dimensions.height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
      }}
    >
      {teamLogo && (
        <div style={{ marginBottom: 40, opacity: interpolate(frame, [0, fps * 0.5], [0, 0.3], { extrapolateRight: 'clamp' }) }}>
          <TeamLogo logo={teamLogo} abbreviation="" size={100} />
        </div>
      )}

      <div
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 36,
          fontWeight: 600,
          color: BSI_COLORS.muted,
          textTransform: 'uppercase',
          letterSpacing: 4,
          marginBottom: 30,
          minHeight: 50,
        }}
      >
        {visibleLabel}
        <span style={{ opacity: cursorOpacity, color: BSI_COLORS.burntOrange }}>|</span>
      </div>

      <div
        style={{
          opacity: valueAppear,
          transform: `scale(${valueAppear})`,
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
        }}
      >
        {isNumericValue ? (
          <AnimatedCounter
            value={statValue as number}
            startFrame={fps * 1.5}
            fontSize={160}
            color={BSI_COLORS.burntOrange}
          />
        ) : (
          <span
            style={{
              fontFamily: fontFamily.inter,
              fontSize: 120,
              fontWeight: 800,
              color: BSI_COLORS.burntOrange,
            }}
          >
            {statValue}
          </span>
        )}
        {statUnit && (
          <span
            style={{
              fontFamily: fontFamily.inter,
              fontSize: 48,
              fontWeight: 600,
              color: BSI_COLORS.muted,
            }}
          >
            {statUnit}
          </span>
        )}
      </div>

      {playerName && (
        <div
          style={{
            marginTop: 40,
            fontFamily: fontFamily.inter,
            fontSize: 28,
            fontWeight: 600,
            color: BSI_COLORS.white,
            opacity: interpolate(frame, [fps * 3, fps * 3.5], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          {playerName}
        </div>
      )}

      <BSIBranding fadeInFrame={brandingFadeIn} position="bottom-center" />
    </AbsoluteFill>
  );
}

export const socialStatDefaultProps: SocialStatProps = {
  statLabel: 'Career Home Runs',
  statValue: 47,
  statUnit: '',
  playerName: 'Austin Wells',
  teamLogo: '',
  backgroundColor: BSI_COLORS.midnight,
  aspectRatio: 'square',
};
