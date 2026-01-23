import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BSI_COLORS } from '../lib/colors';
import { fontFamily } from '../lib/fonts';

type TimelineMarker = {
  month: number;
  label: string;
  highlight?: boolean;
};

type RunwayTimelineProps = {
  markers: TimelineMarker[];
  currentMonth?: number;
  startFrame?: number;
  width?: number;
};

export function RunwayTimeline({
  markers,
  currentMonth = 0,
  startFrame = 0,
  width = 800,
}: RunwayTimelineProps): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relativeFrame = frame - startFrame;

  const lineProgress = spring({
    frame: relativeFrame,
    fps,
    config: {
      damping: 200,
      stiffness: 50,
      mass: 1,
    },
  });

  const fillProgress = spring({
    frame: relativeFrame - 20,
    fps,
    config: {
      damping: 200,
      stiffness: 30,
      mass: 1,
    },
  });

  if (relativeFrame < 0) {
    return <div style={{ opacity: 0, width }} />;
  }

  const maxMonth = Math.max(...markers.map(m => m.month));

  return (
    <div
      style={{
        width,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div
        style={{
          position: 'relative',
          height: 8,
          backgroundColor: `${BSI_COLORS.muted}33`,
          borderRadius: 4,
          overflow: 'hidden',
          transform: `scaleX(${lineProgress})`,
          transformOrigin: 'left',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${(currentMonth / maxMonth) * 100 * fillProgress}%`,
            backgroundColor: BSI_COLORS.burntOrange,
            borderRadius: 4,
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        {markers.map((marker, i) => {
          const markerDelay = i * 8 + 30;
          const markerOpacity = interpolate(
            relativeFrame - markerDelay,
            [0, fps * 0.3],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                opacity: markerOpacity,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: marker.highlight ? BSI_COLORS.burntOrange : BSI_COLORS.muted,
                  border: marker.highlight ? `2px solid ${BSI_COLORS.ember}` : 'none',
                }}
              />
              <span
                style={{
                  fontFamily: fontFamily.inter,
                  fontSize: 12,
                  fontWeight: 600,
                  color: marker.highlight ? BSI_COLORS.burntOrange : BSI_COLORS.muted,
                  textTransform: 'uppercase',
                }}
              >
                {marker.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
