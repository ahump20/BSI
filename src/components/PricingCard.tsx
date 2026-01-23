import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BSI_COLORS } from '../lib/colors';
import { fontFamily } from '../lib/fonts';

type PricingTier = {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
};

type PricingCardProps = {
  tier: PricingTier;
  startFrame?: number;
  index?: number;
};

export function PricingCard({
  tier,
  startFrame = 0,
  index = 0,
}: PricingCardProps): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const staggerDelay = index * 10;
  const relativeFrame = frame - startFrame - staggerDelay;

  const flipProgress = spring({
    frame: relativeFrame,
    fps,
    config: {
      damping: 20,
      stiffness: 80,
      mass: 1,
    },
  });

  const rotateY = interpolate(flipProgress, [0, 1], [90, 0]);
  const opacity = interpolate(flipProgress, [0, 0.5, 1], [0, 0, 1]);

  if (relativeFrame < 0) {
    return <div style={{ opacity: 0, width: 280 }} />;
  }

  return (
    <div
      style={{
        width: 280,
        padding: 32,
        backgroundColor: tier.highlighted ? BSI_COLORS.burntOrange : BSI_COLORS.charcoal,
        borderRadius: 16,
        border: tier.highlighted ? 'none' : `1px solid ${BSI_COLORS.muted}33`,
        transform: `perspective(1000px) rotateY(${rotateY}deg)`,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 14,
          fontWeight: 700,
          color: tier.highlighted ? BSI_COLORS.midnight : BSI_COLORS.muted,
          textTransform: 'uppercase',
          letterSpacing: 3,
        }}
      >
        {tier.name}
      </span>
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 48,
          fontWeight: 800,
          color: tier.highlighted ? BSI_COLORS.midnight : BSI_COLORS.white,
        }}
      >
        {tier.price}
      </span>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          width: '100%',
        }}
      >
        {tier.features.map((feature, i) => (
          <span
            key={i}
            style={{
              fontFamily: fontFamily.inter,
              fontSize: 14,
              color: tier.highlighted ? BSI_COLORS.midnight : BSI_COLORS.muted,
              textAlign: 'center',
            }}
          >
            {feature}
          </span>
        ))}
      </div>
    </div>
  );
}
