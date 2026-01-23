import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BSI_COLORS } from '../lib/colors';
import { fontFamily } from '../lib/fonts';

type BSILogoProps = {
  startFrame?: number;
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
};

const SIZES = {
  small: { logo: 32, tagline: 14 },
  medium: { logo: 64, tagline: 20 },
  large: { logo: 120, tagline: 32 },
};

export function BSILogo({
  startFrame = 0,
  size = 'large',
  showTagline = true,
}: BSILogoProps): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relativeFrame = frame - startFrame;
  const sizeConfig = SIZES[size];

  const letterBProgress = spring({
    frame: relativeFrame,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.5 },
  });

  const letterSProgress = spring({
    frame: relativeFrame - 5,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.5 },
  });

  const letterIProgress = spring({
    frame: relativeFrame - 10,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.5 },
  });

  const taglineProgress = spring({
    frame: relativeFrame - 25,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  if (relativeFrame < 0) {
    return <div style={{ opacity: 0 }} />;
  }

  const letters = [
    { char: 'B', progress: letterBProgress },
    { char: 'S', progress: letterSProgress },
    { char: 'I', progress: letterIProgress },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: sizeConfig.logo * 0.2,
      }}
    >
      <div style={{ display: 'flex', gap: sizeConfig.logo * 0.1 }}>
        {letters.map(({ char, progress }, i) => (
          <span
            key={i}
            style={{
              fontFamily: fontFamily.inter,
              fontSize: sizeConfig.logo,
              fontWeight: 900,
              color: BSI_COLORS.burntOrange,
              transform: `scale(${progress}) translateY(${interpolate(progress, [0, 1], [-20, 0])}px)`,
              opacity: progress,
              display: 'inline-block',
            }}
          >
            {char}
          </span>
        ))}
      </div>
      {showTagline && (
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: sizeConfig.tagline,
            fontWeight: 500,
            color: BSI_COLORS.muted,
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity: taglineProgress,
            transform: `translateY(${interpolate(taglineProgress, [0, 1], [10, 0])}px)`,
          }}
        >
          Blaze Sports Intel
        </span>
      )}
    </div>
  );
}
