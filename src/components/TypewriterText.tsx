import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { BSI_COLORS } from '../lib/colors';
import { fontFamily } from '../lib/fonts';

type TypewriterTextProps = {
  text: string;
  startFrame?: number;
  durationFrames?: number;
  fontSize?: number;
  color?: string;
  showCursor?: boolean;
  cursorColor?: string;
};

export function TypewriterText({
  text,
  startFrame = 0,
  durationFrames,
  fontSize = 48,
  color = BSI_COLORS.white,
  showCursor = true,
  cursorColor = BSI_COLORS.burntOrange,
}: TypewriterTextProps): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relativeFrame = frame - startFrame;
  const duration = durationFrames ?? fps * 1.5;

  const progress = interpolate(
    relativeFrame,
    [0, duration],
    [0, text.length],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const visibleText = text.slice(0, Math.floor(progress));
  const isTyping = progress < text.length && progress > 0;
  const cursorOpacity = showCursor && isTyping && frame % 15 < 8 ? 1 : 0;

  if (relativeFrame < 0) {
    return <span style={{ opacity: 0 }}>{text}</span>;
  }

  return (
    <span
      style={{
        fontFamily: fontFamily.inter,
        fontSize,
        fontWeight: 600,
        color,
      }}
    >
      {visibleText}
      {showCursor && (
        <span style={{ opacity: cursorOpacity, color: cursorColor }}>|</span>
      )}
    </span>
  );
}
