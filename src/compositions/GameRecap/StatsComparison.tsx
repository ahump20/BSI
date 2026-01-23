import { useCurrentFrame, interpolate } from 'remotion';
import { StatBar } from '../../components/StatBar';
import { BSI_COLORS } from '../../lib/colors';
import { fontFamily } from '../../lib/fonts';
import type { StatLine } from '../../types/sports';

type StatsComparisonProps = {
  stats: StatLine[];
  homeAbbr: string;
  awayAbbr: string;
};

export function StatsComparison({
  stats,
  homeAbbr,
  awayAbbr,
}: StatsComparisonProps): React.ReactElement {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 30,
        width: '100%',
        height: '100%',
        padding: '0 100px',
        opacity,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          marginBottom: 20,
        }}
      >
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 32,
            fontWeight: 700,
            color: BSI_COLORS.burntOrange,
          }}
        >
          {homeAbbr}
        </span>
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 24,
            fontWeight: 600,
            color: BSI_COLORS.muted,
            textTransform: 'uppercase',
            letterSpacing: 3,
          }}
        >
          Game Stats
        </span>
        <span
          style={{
            fontFamily: fontFamily.inter,
            fontSize: 32,
            fontWeight: 700,
            color: BSI_COLORS.ember,
          }}
        >
          {awayAbbr}
        </span>
      </div>

      {stats.map((stat, index) => (
        <StatBar
          key={stat.label}
          label={stat.label}
          homeValue={stat.home}
          awayValue={stat.away}
          startFrame={0}
          index={index}
        />
      ))}
    </div>
  );
}
