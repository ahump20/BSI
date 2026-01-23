import { AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { TeamMatchup } from './TeamMatchup';
import { ScoreReveal } from './ScoreReveal';
import { StatsComparison } from './StatsComparison';
import { Outro } from './Outro';
import { BSI_COLORS } from '../../lib/colors';
import type { GameRecapProps } from '../../types/sports';
import { ASPECT_RATIOS } from '../../types/sports';

export function GameRecap({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  stats,
  aspectRatio = 'horizontal',
}: GameRecapProps): React.ReactElement {
  const { width, height } = ASPECT_RATIOS[aspectRatio];
  const fps = 30;

  const scene1Duration = fps * 2;
  const scene2Duration = fps * 3;
  const scene3Duration = fps * 3;
  const scene4Duration = fps * 2;
  const transitionDuration = fps * 0.5;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BSI_COLORS.midnight,
        width,
        height,
      }}
    >
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={scene1Duration} premountFor={10}>
          <TeamMatchup homeTeam={homeTeam} awayTeam={awayTeam} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: transitionDuration })}
          presentation={fade()}
        />

        <TransitionSeries.Sequence durationInFrames={scene2Duration} premountFor={10}>
          <ScoreReveal
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeScore={homeScore}
            awayScore={awayScore}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: transitionDuration })}
          presentation={fade()}
        />

        <TransitionSeries.Sequence durationInFrames={scene3Duration} premountFor={10}>
          <StatsComparison
            stats={stats}
            homeAbbr={homeTeam.abbreviation}
            awayAbbr={awayTeam.abbreviation}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: transitionDuration })}
          presentation={fade()}
        />

        <TransitionSeries.Sequence durationInFrames={scene4Duration} premountFor={10}>
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}

export const gameRecapDefaultProps: GameRecapProps = {
  homeTeam: {
    name: 'Texas Longhorns',
    logo: '',
    abbreviation: 'TEX',
  },
  awayTeam: {
    name: 'Oklahoma Sooners',
    logo: '',
    abbreviation: 'OU',
  },
  homeScore: 7,
  awayScore: 3,
  stats: [
    { label: 'Runs', home: 7, away: 3 },
    { label: 'Hits', home: 12, away: 8 },
    { label: 'Errors', home: 0, away: 2 },
  ],
  sport: 'mlb',
  aspectRatio: 'horizontal',
};
