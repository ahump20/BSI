import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BSI_COLORS } from '../../lib/colors';
import { fontFamily } from '../../lib/fonts';
import { PricingCard } from '../../components/PricingCard';

const PRICING_TIERS = [
  {
    name: 'Free',
    price: '$0',
    features: ['Live scores', 'Basic standings', 'Game schedules'],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29/mo',
    features: ['Advanced analytics', 'Real-time alerts', 'Historical data'],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$199/mo',
    features: ['API access', 'White-label', 'Priority support'],
    highlighted: false,
  },
];

export function BusinessModel(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BSI_COLORS.midnight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 60,
        padding: 80,
      }}
    >
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 48,
          fontWeight: 700,
          color: BSI_COLORS.white,
          opacity: titleProgress,
        }}
      >
        Revenue Model
      </span>

      <div
        style={{
          display: 'flex',
          gap: 40,
          alignItems: 'stretch',
        }}
      >
        {PRICING_TIERS.map((tier, i) => (
          <PricingCard
            key={i}
            tier={tier}
            startFrame={fps * 0.5}
            index={i}
          />
        ))}
      </div>

      <RevenueProjection frame={frame} fps={fps} />
    </AbsoluteFill>
  );
}

function RevenueProjection({
  frame,
  fps,
}: {
  frame: number;
  fps: number;
}): React.ReactElement {
  const projectionProgress = spring({
    frame: frame - fps * 2.5,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 40,
        opacity: projectionProgress,
        transform: `translateY(${interpolate(projectionProgress, [0, 1], [20, 0])}px)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 14,
            fontWeight: 600,
            color: BSI_COLORS.muted,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          Year 1 Target
        </span>
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 36,
            fontWeight: 800,
            color: BSI_COLORS.burntOrange,
          }}
        >
          $120K ARR
        </span>
      </div>
      <div
        style={{
          width: 1,
          height: 40,
          backgroundColor: BSI_COLORS.muted + '33',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 14,
            fontWeight: 600,
            color: BSI_COLORS.muted,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          LTV:CAC
        </span>
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 36,
            fontWeight: 800,
            color: BSI_COLORS.white,
          }}
        >
          4:1
        </span>
      </div>
    </div>
  );
}
