/**
 * Editorial Data Types
 *
 * Shared interfaces for editorial pages: SEC team previews, weekly recaps,
 * conference previews, draft profiles. Each page defines data objects
 * conforming to these contracts.
 */

// ── Weekly Recap Types ──────────────────────────────────────────────

export interface RankingEntry {
  rank: number;
  team: string;
  record: string;
  change: string;
  prev: string;
  headline: string;
}

export function movementClass(change: string): string {
  if (change === 'NEW') return 'text-ember font-semibold';
  if (change.includes('↑')) return 'text-success';
  if (change.includes('↓')) return 'text-error';
  return 'text-text-muted';
}

// ── SEC Team Preview Types ──────────────────────────────────────────

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
