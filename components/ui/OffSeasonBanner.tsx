'use client';

import { Card } from '@/components/ui/Card';

type Sport = 'mlb' | 'nfl' | 'nba';

const SEASON_CONFIG: Record<
  Sport,
  { label: string; startMonth: number; startDay: number; startLabel: string }
> = {
  mlb: { label: 'MLB', startMonth: 3, startDay: 26, startLabel: 'March 26' },
  nfl: { label: 'NFL', startMonth: 9, startDay: 10, startLabel: 'September 10' },
  nba: { label: 'NBA', startMonth: 10, startDay: 21, startLabel: 'October 21' },
};

function isOffSeason(sport: Sport): boolean {
  const now = new Date();
  const config = SEASON_CONFIG[sport];
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  switch (sport) {
    case 'mlb':
      // Season: late March through October
      // Off-season: November through late March
      return month >= 11 || month < 3 || (month === 3 && day < config.startDay);
    case 'nfl':
      // Season: September through early February (Super Bowl)
      // Off-season: mid-February through early September
      return (
        (month >= 3 && month <= 8) ||
        (month === 2 && day > 15) ||
        (month === 9 && day < config.startDay)
      );
    case 'nba':
      // Season: mid-October through mid-June
      // Off-season: July through mid-October
      return (month >= 7 && month <= 9) || (month === 10 && day < config.startDay);
    default:
      return false;
  }
}

interface OffSeasonBannerProps {
  sport: Sport;
  className?: string;
}

export function OffSeasonBanner({ sport, className }: OffSeasonBannerProps) {
  const config = SEASON_CONFIG[sport];
  if (!isOffSeason(sport)) return null;

  const year = new Date().getFullYear();
  const seasonYear = new Date().getMonth() < 6 ? year : year + 1;

  return (
    <Card variant="default" padding="lg" className={className}>
      <div className="text-center py-6">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-burnt-orange/10 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 text-burnt-orange"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h3 className="font-display text-lg font-bold text-white mb-2">
          {config.label} Off-Season
        </h3>
        <p className="text-text-secondary text-sm mb-1">
          The {seasonYear} {config.label} season begins {config.startLabel}.
        </p>
        <p className="text-text-muted text-xs">
          Check back for standings, stats, and news from last season.
        </p>
      </div>
    </Card>
  );
}

export { isOffSeason, SEASON_CONFIG };
export type { Sport as OffSeasonSport };
