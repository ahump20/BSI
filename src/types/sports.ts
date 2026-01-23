export type Sport = 'mlb' | 'cbb' | 'nfl' | 'cfb';

export type AspectRatio = 'vertical' | 'horizontal' | 'square';

export type AspectRatioConfig = {
  width: number;
  height: number;
};

export const ASPECT_RATIOS: Record<AspectRatio, AspectRatioConfig> = {
  vertical: { width: 1080, height: 1920 },
  horizontal: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
};

export type Team = {
  name: string;
  logo: string;
  abbreviation: string;
};

export type StatLine = {
  label: string;
  home: number;
  away: number;
};

export type GameRecapProps = {
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  stats: StatLine[];
  sport: Sport;
  aspectRatio?: AspectRatio;
};

export type SocialStatProps = {
  statLabel: string;
  statValue: number | string;
  statUnit?: string;
  playerName?: string;
  teamLogo?: string;
  backgroundColor?: string;
  aspectRatio?: AspectRatio;
};
