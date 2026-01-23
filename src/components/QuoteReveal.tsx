import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BSI_COLORS } from '../lib/colors';
import { fontFamily } from '../lib/fonts';

type QuoteRevealProps = {
  text: string;
  startFrame?: number;
  fontSize?: number;
  color?: string;
  lineHeight?: number;
  maxWidth?: number;
  wordDelay?: number;
};

export function QuoteReveal({
  text,
  startFrame = 0,
  fontSize = 56,
  color = BSI_COLORS.white,
  lineHeight = 1.4,
  maxWidth = 1200,
  wordDelay = 8,
}: QuoteRevealProps): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = text.split(' ');
  const relativeFrame = frame - startFrame;

  if (relativeFrame < 0) {
    return <div style={{ opacity: 0 }}>{text}</div>;
  }

  return (
    <div
      style={{
        fontFamily: fontFamily.inter,
        fontSize,
        fontWeight: 500,
        color,
        lineHeight,
        maxWidth,
        textAlign: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: `0 ${fontSize * 0.3}px`,
      }}
    >
      {words.map((word, i) => {
        const wordStart = i * wordDelay;
        const wordProgress = spring({
          frame: relativeFrame - wordStart,
          fps,
          config: {
            damping: 200,
            stiffness: 100,
            mass: 1,
          },
        });

        const opacity = interpolate(wordProgress, [0, 1], [0, 1]);
        const y = interpolate(wordProgress, [0, 1], [20, 0]);

        return (
          <span
            key={i}
            style={{
              opacity,
              transform: `translateY(${y}px)`,
              display: 'inline-block',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}
