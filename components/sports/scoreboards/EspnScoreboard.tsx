'use client';

import type { ReactNode } from 'react';
import { Badge, FreshnessBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { getTeamLogo, getPeriodLabel } from '@/lib/utils/game-helpers';
import type { DataMeta } from '@/lib/types/data-meta';

// ============================================================================
// TYPES — ESPN-shaped game data (NFL, NBA, CFB)
// ============================================================================

interface CompetitorTeam {
  id?: string;
  displayName?: string;
  abbreviation?: string;
  shortDisplayName?: string;
  logo?: string;
  logos?: Array<{ href?: string }>;
  color?: string;
}

export interface EspnCompetitor {
  homeAway?: string;
  winner?: boolean;
  score?: string;
  team?: CompetitorTeam;
  records?: Array<{ summary?: string }>;
  linescores?: Array<{ value?: number }>;
  statistics?: Array<{ name?: string; displayValue?: string }>;
}

export interface EspnLeader {
  name?: string;
  displayName?: string;
  leaders?: Array<{
    displayValue?: string;
    athlete?: { displayName?: string; position?: { abbreviation?: string } };
  }>;
}

export interface EspnPlay {
  id?: string;
  type?: { id?: string; text?: string };
  text?: string;
  shortText?: string;
  period?: { number?: number; displayValue?: string };
  clock?: { displayValue?: string };
  scoringPlay?: boolean;
  scoreValue?: number;
  homeScore?: string;
  awayScore?: string;
  team?: { id?: string; displayName?: string; abbreviation?: string };
  wallclock?: string;
  start?: { down?: number; distance?: number; yardLine?: number; yardsToEndzone?: number };
  end?: { down?: number; distance?: number; yardLine?: number; yardsToEndzone?: number };
  statYardage?: number;
}

export interface EspnGameData {
  id?: string;
  status?: {
    type?: {
      completed?: boolean;
      state?: string;
      shortDetail?: string;
      description?: string;
    };
    period?: number;
    displayClock?: string;
  };
  competitors?: EspnCompetitor[];
  boxscore?: Record<string, unknown>;
  leaders?: EspnLeader[];
  plays?: EspnPlay[];
  winProbability?: unknown[];
}

// ============================================================================
// HELPERS
// ============================================================================

function isEspnGameLive(game: EspnGameData): boolean {
  return game.status?.type?.state === 'in';
}

function isEspnGameFinal(game: EspnGameData): boolean {
  return game.status?.type?.completed === true;
}

export function deriveEspnTeams(game: EspnGameData): {
  home: EspnCompetitor | undefined;
  away: EspnCompetitor | undefined;
} {
  return {
    home: game.competitors?.find((c) => c.homeAway === 'home'),
    away: game.competitors?.find((c) => c.homeAway === 'away'),
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

interface EspnScoreboardProps {
  game: EspnGameData;
  meta: DataMeta | null;
  /** Fallback label shown in the badge, e.g. "NFL", "NBA", "CFB" */
  sportLabel: string;
  /** Period label prefix for live display, e.g. "Q" for quarter-based. */
  periodPrefix?: string;
  /** Default number of periods in regulation, e.g. 4 for football/basketball. */
  defaultPeriods?: number;
}

export function EspnScoreboard({
  game,
  meta,
  sportLabel,
  periodPrefix = 'Q',
  defaultPeriods = 4,
}: EspnScoreboardProps): ReactNode {
  const { home: homeTeam, away: awayTeam } = deriveEspnTeams(game);
  const live = isEspnGameLive(game);
  const final = isEspnGameFinal(game);

  const maxPeriods = Math.max(
    homeTeam?.linescores?.length || defaultPeriods,
    awayTeam?.linescores?.length || defaultPeriods,
    defaultPeriods
  );

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <Badge variant="secondary">
          {game.status?.type?.shortDetail || game.status?.type?.description || sportLabel}
        </Badge>
        {live && <FreshnessBadge isLive fetchedAt={meta?.lastUpdated} />}
      </div>

      {/* Scoreboard */}
      <div className="flex items-center justify-center gap-8 md:gap-16 py-6">
        {/* Away Team */}
        <div className="text-center">
          <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center overflow-hidden mx-auto mb-2">
            {getTeamLogo(awayTeam) ? (
              <img
                src={getTeamLogo(awayTeam)!}
                alt={awayTeam?.team?.abbreviation || 'Away'}
                className="w-12 h-12 object-contain"
              />
            ) : (
              <span className="text-xl font-bold text-burnt-orange">
                {awayTeam?.team?.abbreviation || 'AWY'}
              </span>
            )}
          </div>
          <p className="font-semibold text-text-primary">
            {awayTeam?.team?.shortDisplayName || awayTeam?.team?.displayName || 'Away'}
          </p>
          <p className="text-xs text-text-tertiary">
            {awayTeam?.records?.[0]?.summary || ''}
          </p>
          <p
            className={`text-4xl font-bold font-mono mt-2 ${
              final && awayTeam?.winner ? 'text-text-primary' : 'text-text-secondary'
            }`}
          >
            {awayTeam?.score || '-'}
          </p>
        </div>

        {/* Status */}
        <div className="text-center">
          {live ? (
            <span className="flex items-center justify-center gap-1.5 text-success font-semibold">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              {periodPrefix}{game.status?.period || '?'} {game.status?.displayClock || ''}
            </span>
          ) : final ? (
            <span className="text-text-tertiary font-semibold">FINAL</span>
          ) : (
            <span className="text-burnt-orange font-semibold">
              {game.status?.type?.shortDetail || 'Scheduled'}
            </span>
          )}
        </div>

        {/* Home Team */}
        <div className="text-center">
          <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center overflow-hidden mx-auto mb-2">
            {getTeamLogo(homeTeam) ? (
              <img
                src={getTeamLogo(homeTeam)!}
                alt={homeTeam?.team?.abbreviation || 'Home'}
                className="w-12 h-12 object-contain"
              />
            ) : (
              <span className="text-xl font-bold text-burnt-orange">
                {homeTeam?.team?.abbreviation || 'HME'}
              </span>
            )}
          </div>
          <p className="font-semibold text-text-primary">
            {homeTeam?.team?.shortDisplayName || homeTeam?.team?.displayName || 'Home'}
          </p>
          <p className="text-xs text-text-tertiary">
            {homeTeam?.records?.[0]?.summary || ''}
          </p>
          <p
            className={`text-4xl font-bold font-mono mt-2 ${
              final && homeTeam?.winner ? 'text-text-primary' : 'text-text-secondary'
            }`}
          >
            {homeTeam?.score || '-'}
          </p>
        </div>
      </div>

      {/* Period Linescore */}
      {(awayTeam?.linescores?.length || homeTeam?.linescores?.length) && (
        <Card variant="default" padding="sm" className="mt-4 max-w-2xl mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-text-tertiary">
                  <th className="text-left p-1.5 w-12">Team</th>
                  {Array.from({ length: maxPeriods }, (_, i) => (
                    <th key={i} className="text-center p-1.5 w-8">
                      {getPeriodLabel(i)}
                    </th>
                  ))}
                  <th className="text-center p-1.5 w-8 border-l border-border-subtle text-burnt-orange font-bold">
                    T
                  </th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                <tr className="border-b border-border-subtle">
                  <td className="p-1.5 font-semibold text-text-primary">
                    {awayTeam?.team?.abbreviation || 'AWY'}
                  </td>
                  {Array.from({ length: maxPeriods }, (_, i) => (
                    <td key={i} className="text-center p-1.5 font-mono">
                      {awayTeam?.linescores?.[i]?.value ?? '-'}
                    </td>
                  ))}
                  <td className="text-center p-1.5 font-mono font-bold text-text-primary border-l border-border-subtle">
                    {awayTeam?.score || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="p-1.5 font-semibold text-text-primary">
                    {homeTeam?.team?.abbreviation || 'HME'}
                  </td>
                  {Array.from({ length: maxPeriods }, (_, i) => (
                    <td key={i} className="text-center p-1.5 font-mono">
                      {homeTeam?.linescores?.[i]?.value ?? '-'}
                    </td>
                  ))}
                  <td className="text-center p-1.5 font-mono font-bold text-text-primary border-l border-border-subtle">
                    {homeTeam?.score || '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
