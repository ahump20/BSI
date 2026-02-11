'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';

/**
 * AITeamPreview — College Baseball Scouting Intelligence
 *
 * Computes structured scouting grades and analysis from team stats that are
 * already flowing through the Highlightly API adapter. No additional data
 * source required — this transforms raw stats (batting avg, ERA, runs
 * scored/allowed, RPI, record) into actionable scouting intelligence.
 *
 * Grades use the 20-80 scouting scale standard in professional baseball.
 * Pythagorean win expectation uses the baseball exponent of 1.83.
 *
 * Per the CV sports survey: college baseball has the thinnest scouting
 * infrastructure of any BSI focus sport. This component fills that gap by
 * generating pro-style scouting reports from available data.
 */

interface TeamStats {
  wins: number;
  losses: number;
  confWins: number;
  confLosses: number;
  rpi: number;
  streak?: string;
  runsScored: number;
  runsAllowed: number;
  battingAvg: number;
  era: number;
}

interface AITeamPreviewProps {
  teamId: string;
  teamName: string;
  stats?: TeamStats;
  conference?: string;
}

// ─── Scouting Scale (20-80) ─────────────────────────────────────────────────

interface ScoutingGrade {
  label: string;
  value: number;
  grade: number;
  explanation: string;
}

function toGrade(percentile: number): number {
  // Map 0-100 percentile to 20-80 scouting scale
  return Math.round(Math.min(80, Math.max(20, 20 + (percentile / 100) * 60)) / 5) * 5;
}

function gradeColor(grade: number): string {
  if (grade >= 70) return 'text-green-400';
  if (grade >= 60) return 'text-blue-400';
  if (grade >= 50) return 'text-white';
  if (grade >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

function gradeLabel(grade: number): string {
  if (grade >= 70) return 'Plus-Plus';
  if (grade >= 60) return 'Plus';
  if (grade >= 50) return 'Average';
  if (grade >= 40) return 'Below Avg';
  return 'Well Below';
}

// ─── Pythagorean Expectation ────────────────────────────────────────────────

function pythagoreanWinPct(runsScored: number, runsAllowed: number): number {
  const exp = 1.83; // Baseball exponent
  if (runsScored + runsAllowed === 0) return 0.5;
  return Math.pow(runsScored, exp) / (Math.pow(runsScored, exp) + Math.pow(runsAllowed, exp));
}

// ─── D1 Benchmarks (approximate season-wide averages for grading context) ──

const D1_AVG = {
  battingAvg: 0.270,
  era: 5.20,
  runsPerGame: 6.0,
  runDiffPerGame: 0.0, // neutral
  rpi: 150, // midpoint of ~300 teams
  winPct: 0.500,
};

function computeGrades(stats: TeamStats): ScoutingGrade[] {
  const games = stats.wins + stats.losses;
  if (games === 0) return [];

  const runDiff = stats.runsScored - stats.runsAllowed;

  // Grade batting (batting avg relative to D1 average)
  const battingPercentile = Math.min(100, Math.max(0,
    50 + ((stats.battingAvg - D1_AVG.battingAvg) / 0.040) * 20
  ));

  // Grade pitching (ERA — lower is better)
  const pitchingPercentile = Math.min(100, Math.max(0,
    50 + ((D1_AVG.era - stats.era) / 1.5) * 20
  ));

  // Grade run production
  const rpg = stats.runsScored / games;
  const offensePercentile = Math.min(100, Math.max(0,
    50 + ((rpg - D1_AVG.runsPerGame) / 2.0) * 20
  ));

  // Grade run prevention
  const rapg = stats.runsAllowed / games;
  const defensePercentile = Math.min(100, Math.max(0,
    50 + ((D1_AVG.runsPerGame - rapg) / 2.0) * 20
  ));

  // Grade overall strength (RPI — lower rank is better)
  const rpiPercentile = Math.min(100, Math.max(0,
    50 + ((D1_AVG.rpi - stats.rpi) / 100) * 30
  ));

  return [
    {
      label: 'Hitting',
      value: stats.battingAvg,
      grade: toGrade(battingPercentile),
      explanation: `Team AVG ${stats.battingAvg.toFixed(3)} vs D1 avg ~${D1_AVG.battingAvg.toFixed(3)}`,
    },
    {
      label: 'Pitching',
      value: stats.era,
      grade: toGrade(pitchingPercentile),
      explanation: `Team ERA ${stats.era.toFixed(2)} vs D1 avg ~${D1_AVG.era.toFixed(2)}`,
    },
    {
      label: 'Offense',
      value: rpg,
      grade: toGrade(offensePercentile),
      explanation: `${rpg.toFixed(1)} runs/game (${runDiff > 0 ? '+' : ''}${runDiff} run diff)`,
    },
    {
      label: 'Defense',
      value: rapg,
      grade: toGrade(defensePercentile),
      explanation: `${rapg.toFixed(1)} runs allowed/game`,
    },
    {
      label: 'Strength',
      value: stats.rpi,
      grade: toGrade(rpiPercentile),
      explanation: `RPI #${stats.rpi} of ~300 D1 programs`,
    },
  ];
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AITeamPreview({ teamId: _teamId, teamName, stats, conference: _conference }: AITeamPreviewProps) {
  const grades = useMemo(() => (stats ? computeGrades(stats) : []), [stats]);

  const analysis = useMemo(() => {
    if (!stats) return null;

    const games = stats.wins + stats.losses;
    if (games === 0) return null;

    const winPct = stats.wins / games;
    const pythWinPct = pythagoreanWinPct(stats.runsScored, stats.runsAllowed);
    const luck = winPct - pythWinPct;
    const runDiff = stats.runsScored - stats.runsAllowed;

    // Generate narrative bullets
    const bullets: string[] = [];

    // Pythagorean analysis
    if (Math.abs(luck) > 0.030) {
      const direction = luck > 0 ? 'outperforming' : 'underperforming';
      const expected = Math.round(pythWinPct * games);
      bullets.push(
        `${direction.charAt(0).toUpperCase() + direction.slice(1)} run differential by ${Math.abs(Math.round(luck * games))} wins. Pythagorean projects ${expected}-${games - expected} record — regression ${luck > 0 ? 'risk' : 'upside'} is real.`
      );
    } else {
      bullets.push(
        `Record aligns with run differential. This team is what their numbers say they are.`
      );
    }

    // Offense vs defense identity
    const rpg = stats.runsScored / games;
    const rapg = stats.runsAllowed / games;
    if (rpg > rapg + 1.5) {
      bullets.push(`Offense-first identity: scoring ${rpg.toFixed(1)} R/G while allowing ${rapg.toFixed(1)}. Likely bullpen-dependent in close games.`);
    } else if (rapg <= 4 && (rpg - rapg) <= 0.5) {
      bullets.push(`Pitching-dominant: allowing just ${rapg.toFixed(1)} R/G. Run prevention carries this team.`);
    } else {
      bullets.push(`Balanced approach: ${rpg.toFixed(1)} R/G scored, ${rapg.toFixed(1)} allowed. No single phase dominates.`);
    }

    // Conference play
    const confGames = stats.confWins + stats.confLosses;
    if (confGames > 0) {
      const confWinPct = stats.confWins / confGames;
      if (confWinPct > winPct + 0.05) {
        bullets.push(`Rising in conference play: ${stats.confWins}-${stats.confLosses} (${(confWinPct * 100).toFixed(0)}%) in-conference vs ${(winPct * 100).toFixed(0)}% overall. Tournament-caliber trajectory.`);
      } else if (confWinPct < winPct - 0.05) {
        bullets.push(`Conference struggles: ${stats.confWins}-${stats.confLosses} in-conference, weaker than ${(winPct * 100).toFixed(0)}% overall mark. Schedule strength is a concern.`);
      }
    }

    // Streak
    if (stats.streak) {
      const streakNum = parseInt(stats.streak.replace(/\D/g, ''), 10);
      const isWin = stats.streak.toUpperCase().startsWith('W');
      if (streakNum >= 5) {
        bullets.push(`${isWin ? 'Hot streak' : 'Concerning skid'}: ${stats.streak}. ${isWin ? 'Momentum' : 'Urgency'} factor for upcoming series.`);
      }
    }

    return { winPct, pythWinPct, luck, runDiff, bullets };
  }, [stats]);

  // No stats available — show minimal placeholder
  if (!stats || !analysis) {
    return (
      <div className="bg-charcoal/50 border border-border-subtle rounded-xl p-4 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-burnt-orange text-xs font-semibold uppercase tracking-wider">Scouting Intel</span>
          <Badge variant="secondary" size="sm">Pre-Season</Badge>
        </div>
        <p className="text-text-secondary text-sm">
          Scouting intelligence for {teamName} activates once season stats are available.
          Grades, Pythagorean projections, and narrative analysis generate automatically
          from game data.
        </p>
      </div>
    );
  }

  const games = stats.wins + stats.losses;

  return (
    <div className="bg-charcoal/50 border border-border-subtle rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-burnt-orange text-xs font-semibold uppercase tracking-wider">Scouting Intel</span>
          <Badge variant="primary" size="sm">Live</Badge>
        </div>
        <span className="text-text-tertiary text-xs">{games}G sample</span>
      </div>

      {/* Scouting Grades */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {grades.map((g) => (
          <div key={g.label} className="text-center">
            <div className={`font-display text-2xl font-bold ${gradeColor(g.grade)}`}>
              {g.grade}
            </div>
            <div className="text-text-tertiary text-[10px] uppercase tracking-wider mt-0.5">{g.label}</div>
            <div className="text-text-tertiary text-[10px] mt-0.5">{gradeLabel(g.grade)}</div>
          </div>
        ))}
      </div>

      {/* Pythagorean Bar */}
      <div className="bg-graphite rounded-lg p-3 mb-4">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-text-tertiary text-xs">Actual Win%</span>
          <span className="text-white font-mono text-sm font-bold">{(analysis.winPct * 100).toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-charcoal rounded-full overflow-hidden mb-2">
          <div className="h-full bg-burnt-orange rounded-full" style={{ width: `${analysis.winPct * 100}%` }} />
        </div>
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-text-tertiary text-xs">Pythagorean Expected</span>
          <span className="text-text-secondary font-mono text-sm">{(analysis.pythWinPct * 100).toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-charcoal rounded-full overflow-hidden">
          <div className="h-full bg-white/30 rounded-full" style={{ width: `${analysis.pythWinPct * 100}%` }} />
        </div>
        {Math.abs(analysis.luck) > 0.02 && (
          <p className="text-text-tertiary text-xs mt-2">
            {analysis.luck > 0 ? 'Over' : 'Under'}performing by {Math.abs(Math.round(analysis.luck * games))} wins relative to run differential.
          </p>
        )}
      </div>

      {/* Narrative Bullets */}
      <div className="space-y-2">
        {analysis.bullets.map((bullet, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-burnt-orange mt-1 shrink-0">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </span>
            <p className="text-text-secondary text-sm leading-relaxed">{bullet}</p>
          </div>
        ))}
      </div>

      {/* Data Attribution */}
      <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
        <span className="text-text-tertiary text-[10px]">Grades: 20-80 scouting scale | Pyth exp: 1.83</span>
        <span className="text-text-tertiary text-[10px]">NCAA / Highlightly</span>
      </div>
    </div>
  );
}
