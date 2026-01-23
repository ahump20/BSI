import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { HookReveal } from './HookReveal';
import { OriginStory } from './OriginStory';
import { ProblemStatement } from './ProblemStatement';
import { SolutionDemo } from './SolutionDemo';
import { TechMoat } from './TechMoat';
import { TheAsk } from './TheAsk';
import { CovenantClose } from './CovenantClose';
import { INVESTOR_AD_SCENES, INVESTOR_AD_DEFAULTS } from '../../types/investor-ad';
import type { InvestorAdProps } from '../../types/investor-ad';

const TRANSITION_FRAMES = 15;

export function InvestorAd(props: InvestorAdProps): React.ReactElement {
  const config = { ...INVESTOR_AD_DEFAULTS, ...props };

  return (
    <AbsoluteFill>
      {props.audioSrc && (
        <Audio src={staticFile(props.audioSrc)} volume={props.audioVolume ?? 0.5} />
      )}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={INVESTOR_AD_SCENES[0].durationFrames}>
          <HookReveal />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={INVESTOR_AD_SCENES[1].durationFrames}>
          <OriginStory />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={INVESTOR_AD_SCENES[2].durationFrames}>
          <ProblemStatement />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={INVESTOR_AD_SCENES[3].durationFrames}>
          <SolutionDemo />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={INVESTOR_AD_SCENES[4].durationFrames}>
          <TechMoat />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={INVESTOR_AD_SCENES[5].durationFrames}>
          <TheAsk
            investorAmount={config.investorAmount}
            breakEvenMonth={config.breakEvenMonth}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={INVESTOR_AD_SCENES[6].durationFrames}>
          <CovenantClose />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}

export { INVESTOR_AD_DEFAULTS as investorAdDefaultProps };
export { getTotalDuration } from '../../types/investor-ad';
