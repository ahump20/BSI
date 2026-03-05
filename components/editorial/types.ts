/**
 * SEC Team 2026 Season Preview — Editorial Data Types
 *
 * Shared interfaces for all 16 SEC team editorial preview pages.
 * Each team's page.tsx defines a TeamPreviewData object conforming to this contract.
 */

export interface ProgramStats {
  allTimeWins: string;
  winPct: string;
  cwsAppearances: number;
  nationalTitles: number;
  confTitles: number;
  cwsWins: number;
}

export interface SeasonStats {
  teamBA: string;
  teamERA: string;
  homeRuns: number;
  stolenBases: number;
  strikeouts: number;
  opponentBA: string;
}

export interface KeyReturnee {
  name: string;
  position: string;
  year: string;
  stats: string;
  bio: string;
}

export interface TransferAddition {
  name: string;
  position: string;
  year: string;
  fromSchool: string;
  stats: string;
  bio: string;
}

export interface ScheduleHighlight {
  dates: string;
  opponent: string;
  location: 'Home' | 'Away' | 'Neutral';
  notes: string;
}

export interface ScoutingGrade {
  category: string;
  grade: number;
}

export interface TeamPreviewData {
  teamName: string;
  teamSlug: string;
  mascot: string;
  badgeText: string;
  date: string;
  readTime: string;
  heroTitle: string;
  heroSubtitle: string;
  programStats: ProgramStats;
  record2025: string;
  record2025Context: string;
  seasonStats2025: SeasonStats;
  seasonHighlights: string[];
  keyReturnees: KeyReturnee[];
  transferAdditions: TransferAddition[];
  pitchingAnalysis: {
    headline: string;
    rotation: string;
    depth: string;
  };
  lineupAnalysis: {
    engine: string;
    middle: string;
    supportingCast: string;
  };
  scheduleHighlights: ScheduleHighlight[];
  scoutingGrades: ScoutingGrade[];
  projectionTier: string;
  projectionText: string;
  relatedLinks: { label: string; href: string }[];
}
