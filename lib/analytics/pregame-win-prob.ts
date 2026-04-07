import type { IntelSport } from '@/lib/intel/types';

// ─── Home-Field Advantage by Sport ─────────────────────────────────────────

export function homeEdgeBySport(sport: Exclude<IntelSport, 'all'>): number {
  switch (sport) {
    case 'nba':
    case 'cbb':
      return 0.04;
    case 'ncaafb':
      return 0.045;
    case 'nfl':
      return 0.03;
    case 'd1bb':
      return 0.035; // College baseball has a notable home-field advantage
    case 'mlb':
    default:
      return 0.025;
  }
}

// ─── Pregame Win Probability Estimate ──────────────────────────────────────

function parseRecordForProb(record?: string): { wins: number; losses: number } | null {
  if (!record) return null;
  const m = record.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return null;
  const wins = Number(m[1]);
  const losses = Number(m[2]);
  if (!Number.isFinite(wins) || !Number.isFinite(losses)) return null;
  return { wins, losses };
}

export function estimatePregameWinProbability(
  sport: Exclude<IntelSport, 'all'>,
  homeRecord?: string,
  awayRecord?: string,
): { home: number; away: number } {
  const parsedHome = parseRecordForProb(homeRecord);
  const parsedAway = parseRecordForProb(awayRecord);

  const homePct = parsedHome ? parsedHome.wins / Math.max(parsedHome.wins + parsedHome.losses, 1) : 0.5;
  const awayPct = parsedAway ? parsedAway.wins / Math.max(parsedAway.wins + parsedAway.losses, 1) : 0.5;
  const hfa = homeEdgeBySport(sport);

  const rawHomeProb = 0.5 + (homePct - awayPct) * 0.9 + hfa;
  const clamped = Math.min(0.88, Math.max(0.12, rawHomeProb));
  const home = Math.round(clamped * 100);
  return { home, away: 100 - home };
}
