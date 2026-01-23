import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BSI_COLORS } from '../../lib/colors';
import { fontFamily } from '../../lib/fonts';
import { AnimatedCounter } from '../../components/AnimatedCounter';
import type { InvestorAdProps } from '../../types/investor-ad';
import { INVESTOR_AD_DEFAULTS } from '../../types/investor-ad';

type TheAskProps = Pick<InvestorAdProps, 'investorAmount' | 'breakEvenMonth'>;

export function TheAsk({
  investorAmount = INVESTOR_AD_DEFAULTS.investorAmount,
  breakEvenMonth = INVESTOR_AD_DEFAULTS.breakEvenMonth,
}: TheAskProps): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phase1End = fps * 3;   // Investment equation (trimmed)
  const phase2End = fps * 6;   // Use of funds with details (trimmed)
  const phase3End = fps * 9;   // Milestones (trimmed)

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BSI_COLORS.midnight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 50,
        padding: 60,
      }}
    >
      {frame < phase1End && (
        <InvestmentEquation
          frame={frame}
          fps={fps}
          investorAmount={investorAmount}
        />
      )}
      {frame >= phase1End && frame < phase2End && (
        <UseOfFundsDetailed frame={frame - phase1End} fps={fps} />
      )}
      {frame >= phase2End && frame < phase3End && (
        <Milestones frame={frame - phase2End} fps={fps} breakEvenMonth={breakEvenMonth} />
      )}
      {frame >= phase3End && (
        <ContactCTA frame={frame - phase3End} fps={fps} />
      )}
    </AbsoluteFill>
  );
}

function InvestmentEquation({
  frame,
  fps,
  investorAmount,
}: {
  frame: number;
  fps: number;
  investorAmount: number;
}): React.ReactElement {
  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  const amountProgress = spring({
    frame: frame - 15,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.5 },
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 50,
      }}
    >
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 18,
          fontWeight: 600,
          color: BSI_COLORS.muted,
          textTransform: 'uppercase',
          letterSpacing: 6,
          opacity: titleProgress,
        }}
      >
        The Ask
      </span>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          opacity: amountProgress,
          transform: `scale(${amountProgress})`,
        }}
      >
        <AnimatedCounter
          value={investorAmount / 1000}
          startFrame={15}
          fontSize={96}
          color={BSI_COLORS.burntOrange}
          prefix="$"
          suffix="K"
        />
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 20,
            fontWeight: 500,
            color: BSI_COLORS.muted,
          }}
        >
          Seed Investment
        </span>
      </div>
    </div>
  );
}

function UseOfFundsDetailed({ frame, fps }: { frame: number; fps: number }): React.ReactElement {
  const funds = [
    {
      label: 'Engineering',
      percent: 50,
      details: ['API Infrastructure', 'Real-time Data Pipeline', 'Mobile Apps'],
      color: BSI_COLORS.burntOrange,
    },
    {
      label: 'Marketing',
      percent: 30,
      details: ['Content & Social', 'Influencer Partnerships', 'Launch Campaign'],
      color: '#22c55e',
    },
    {
      label: 'Operations',
      percent: 20,
      details: ['Data Licensing', 'Cloud Costs', 'Legal & Admin'],
      color: '#3b82f6',
    },
  ];

  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 40,
      }}
    >
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 18,
          fontWeight: 600,
          color: BSI_COLORS.muted,
          textTransform: 'uppercase',
          letterSpacing: 6,
          opacity: titleProgress,
        }}
      >
        Use of Funds
      </span>

      <div
        style={{
          display: 'flex',
          gap: 40,
        }}
      >
        {funds.map((fund, i) => {
          const delay = 15 + i * 20;
          const cardProgress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 15, stiffness: 150, mass: 0.6 },
          });

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                padding: '24px 32px',
                backgroundColor: BSI_COLORS.charcoal,
                borderRadius: 12,
                border: `1px solid ${fund.color}40`,
                opacity: cardProgress,
                transform: `translateY(${interpolate(cardProgress, [0, 1], [20, 0])}px)`,
                minWidth: 200,
              }}
            >
              <span
                style={{
                  fontFamily: fontFamily.inter,
                  fontSize: 48,
                  fontWeight: 800,
                  color: fund.color,
                }}
              >
                {fund.percent}%
              </span>
              <span
                style={{
                  fontFamily: fontFamily.inter,
                  fontSize: 16,
                  fontWeight: 700,
                  color: BSI_COLORS.white,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                }}
              >
                {fund.label}
              </span>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  alignItems: 'center',
                }}
              >
                {fund.details.map((detail, j) => (
                  <span
                    key={j}
                    style={{
                      fontFamily: fontFamily.inter,
                      fontSize: 11,
                      fontWeight: 500,
                      color: BSI_COLORS.muted,
                    }}
                  >
                    {detail}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Milestones({ frame, fps, breakEvenMonth }: { frame: number; fps: number; breakEvenMonth: number }): React.ReactElement {
  const milestones = [
    { month: 'Month 3', milestone: 'Beta Launch', status: 'upcoming' },
    { month: 'Month 6', milestone: '10K Users', status: 'upcoming' },
    { month: 'Month 12', milestone: '50K Users', status: 'upcoming' },
    { month: `Month ${breakEvenMonth}`, milestone: 'Breakeven', status: 'target' },
  ];

  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 40,
      }}
    >
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 18,
          fontWeight: 600,
          color: BSI_COLORS.muted,
          textTransform: 'uppercase',
          letterSpacing: 6,
          opacity: titleProgress,
        }}
      >
        Milestones
      </span>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
        }}
      >
        {milestones.map((m, i) => {
          const delay = 15 + i * 15;
          const nodeProgress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 15, stiffness: 150, mass: 0.6 },
          });

          const isTarget = m.status === 'target';

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  opacity: nodeProgress,
                  transform: `scale(${nodeProgress})`,
                }}
              >
                <div
                  style={{
                    width: isTarget ? 56 : 44,
                    height: isTarget ? 56 : 44,
                    borderRadius: '50%',
                    backgroundColor: isTarget ? BSI_COLORS.burntOrange : BSI_COLORS.charcoal,
                    border: `3px solid ${isTarget ? BSI_COLORS.burntOrange : BSI_COLORS.muted}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isTarget && (
                    <span style={{ fontSize: 24, color: BSI_COLORS.midnight }}>✓</span>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: fontFamily.inter,
                    fontSize: 14,
                    fontWeight: 700,
                    color: isTarget ? BSI_COLORS.burntOrange : BSI_COLORS.white,
                  }}
                >
                  {m.month}
                </span>
                <span
                  style={{
                    fontFamily: fontFamily.inter,
                    fontSize: 12,
                    fontWeight: 500,
                    color: BSI_COLORS.muted,
                  }}
                >
                  {m.milestone}
                </span>
              </div>

              {i < milestones.length - 1 && (
                <div
                  style={{
                    width: 80,
                    height: 3,
                    backgroundColor: BSI_COLORS.charcoal,
                    marginTop: -40,
                    opacity: nodeProgress,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContactCTA({ frame, fps }: { frame: number; fps: number }): React.ReactElement {
  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 100, mass: 1 },
  });

  const emailProgress = spring({
    frame: frame - 15,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.5 },
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 40,
      }}
    >
      <span
        style={{
          fontFamily: fontFamily.inter,
          fontSize: 18,
          fontWeight: 600,
          color: BSI_COLORS.muted,
          textTransform: 'uppercase',
          letterSpacing: 6,
          opacity: titleProgress,
        }}
      >
        Let's Talk
      </span>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          opacity: emailProgress,
          transform: `scale(${emailProgress})`,
        }}
      >
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 36,
            fontWeight: 600,
            color: BSI_COLORS.burntOrange,
            letterSpacing: 1,
          }}
        >
          austin@blazesportsintel.com
        </span>
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 16,
            fontWeight: 500,
            color: BSI_COLORS.muted,
          }}
        >
          Join the journey
        </span>
      </div>
    </div>
  );
}
