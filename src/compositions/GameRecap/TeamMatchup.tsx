import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { TeamLogo } from '../../components/TeamLogo';
import { BSI_COLORS } from '../../lib/colors';
import { fontFamily } from '../../lib/fonts';
import type { Team } from '../../types/sports';

type TeamMatchupProps = {
  homeTeam: Team;
  awayTeam: Team;
};

export function TeamMatchup({ homeTeam, awayTeam }: TeamMatchupProps): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const homeSlide = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  const awaySlide = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  const vsScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 15, stiffness: 200, mass: 0.5 },
  });

  const homeX = interpolate(homeSlide, [0, 1], [-300, 0], {
    extrapolateRight: 'clamp',
  });

  const awayX = interpolate(awaySlide, [0, 1], [300, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 60,
        width: '100%',
        height: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          transform: `translateX(${homeX}px)`,
        }}
      >
        <TeamLogo logo={homeTeam.logo} abbreviation={homeTeam.abbreviation} size={180} />
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 28,
            fontWeight: 600,
            color: BSI_COLORS.white,
            textAlign: 'center',
          }}
        >
          {homeTeam.name}
        </span>
      </div>

      <div
        style={{
          transform: `scale(${Math.max(0, vsScale)})`,
          fontFamily: fontFamily.inter,
          fontSize: 48,
          fontWeight: 800,
          color: BSI_COLORS.burntOrange,
        }}
      >
        VS
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          transform: `translateX(${awayX}px)`,
        }}
      >
        <TeamLogo logo={awayTeam.logo} abbreviation={awayTeam.abbreviation} size={180} />
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 28,
            fontWeight: 600,
            color: BSI_COLORS.white,
            textAlign: 'center',
          }}
        >
          {awayTeam.name}
        </span>
      </div>
    </div>
  );
}
