import { AbsoluteFill, useCurrentFrame } from 'remotion';

type FilmGrainProps = {
  opacity?: number;
  animated?: boolean;
};

export function FilmGrain({
  opacity = 0.035,
  animated = true,
}: FilmGrainProps): React.ReactElement {
  const frame = useCurrentFrame();
  const seed = animated ? frame % 100 : 0;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        mixBlendMode: 'overlay',
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ opacity }}
      >
        <filter id={`grain-${seed}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="4"
            seed={seed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect
          width="100%"
          height="100%"
          filter={`url(#grain-${seed})`}
        />
      </svg>
    </AbsoluteFill>
  );
}
