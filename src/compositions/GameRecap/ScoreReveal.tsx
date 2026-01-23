import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { AnimatedCounter } from '../../components/AnimatedCounter';
import { TeamLogo } from '../../components/TeamLogo';
import { BSI_COLORS } from '../../lib/colors';
import { fontFamily } from '../../lib/fonts';
import type { Team } from '../../types/sports';

type ScoreRevealProps = {
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
};

export function ScoreReveal({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
}: ScoreRevealProps): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const homeWins = homeScore > awayScore;
  const awayWins = awayScore > homeScore;

  const fadeIn = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const winnerGlow = spring({
    frame: frame - fps * 0.8,
    fps,
    config: { damping: 20, stiffness: 100, mass: 1 },
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
        width: '100%',
        height: '100%',
        opacity: fadeIn,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 80,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            filter: homeWins ? `drop-shadow(0 0 ${30 * winnerGlow}px ${BSI_COLORS.burntOrange})` : 'none',
          }}
        >
          <TeamLogo logo={homeTeam.logo} abbreviation={homeTeam.abbreviation} size={120} />
          <AnimatedCounter
            value={homeScore}
            startFrame={10}
            fontSize={140}
            color={homeWins ? BSI_COLORS.burntOrange : BSI_COLORS.white}
          />
          <span
            style={{
              fontFamily: fontFamily.inter,
              fontSize: 20,
              fontWeight: 600,
              color: BSI_COLORS.muted,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            {homeTeam.abbreviation}
          </span>
        </div>

        <div
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 60,
            fontWeight: 300,
            color: BSI_COLORS.muted,
          }}
        >
          -
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            filter: awayWins ? `drop-shadow(0 0 ${30 * winnerGlow}px ${BSI_COLORS.burntOrange})` : 'none',
          }}
        >
          <TeamLogo logo={awayTeam.logo} abbreviation={awayTeam.abbreviation} size={120} />
          <AnimatedCounter
            value={awayScore}
            startFrame={10}
            fontSize={140}
            color={awayWins ? BSI_COLORS.burntOrange : BSI_COLORS.white}
          />
          <span
            style={{
              fontFamily: fontFamily.inter,
              fontSize: 20,
              fontWeight: 600,
              color: BSI_COLORS.muted,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            {awayTeam.abbreviation}
          </span>
        </div>
      </div>
    </div>
  );
}
