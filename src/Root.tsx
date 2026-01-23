import { Composition } from 'remotion';
import { GameRecap, gameRecapDefaultProps } from './compositions/GameRecap';
import { SocialStat, socialStatDefaultProps } from './compositions/SocialStat';
import { InvestorAd, investorAdDefaultProps, getTotalDuration } from './compositions/InvestorAd';
import { ASPECT_RATIOS } from './types/sports';
import type { AspectRatio } from './types/sports';

const FPS = 30;

function getGameRecapDuration(): number {
  const scene1 = FPS * 2;
  const scene2 = FPS * 3;
  const scene3 = FPS * 3;
  const scene4 = FPS * 2;
  const transitions = FPS * 0.5 * 3;
  return scene1 + scene2 + scene3 + scene4 + transitions;
}

export function RemotionRoot(): React.ReactElement {
  const aspectRatios: AspectRatio[] = ['horizontal', 'vertical', 'square'];

  return (
    <>
      {aspectRatios.map((ratio) => (
        <Composition
          key={`GameRecap-${ratio}`}
          id={`GameRecap-${ratio}`}
          component={GameRecap}
          durationInFrames={getGameRecapDuration()}
          fps={FPS}
          width={ASPECT_RATIOS[ratio].width}
          height={ASPECT_RATIOS[ratio].height}
          defaultProps={{ ...gameRecapDefaultProps, aspectRatio: ratio }}
        />
      ))}

      {aspectRatios.map((ratio) => (
        <Composition
          key={`SocialStat-${ratio}`}
          id={`SocialStat-${ratio}`}
          component={SocialStat}
          durationInFrames={FPS * 5}
          fps={FPS}
          width={ASPECT_RATIOS[ratio].width}
          height={ASPECT_RATIOS[ratio].height}
          defaultProps={{ ...socialStatDefaultProps, aspectRatio: ratio }}
        />
      ))}

      <Composition
        id="InvestorAd"
        component={InvestorAd}
        durationInFrames={getTotalDuration()}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          ...investorAdDefaultProps,
          audioSrc: 'audio/inspiring-corporate-186816.mp3',
          audioVolume: 0.4,
        }}
      />
    </>
  );
}
