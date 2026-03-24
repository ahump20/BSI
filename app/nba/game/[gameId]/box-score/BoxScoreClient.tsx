'use client';

import { useMemo } from 'react';
import { useGameData } from '../layout';
import { Card } from '@/components/ui/Card';
import { EspnTeamStatsTable } from '@/components/sports/EspnTeamStatsTable';
import { EspnPlayerStatsTable } from '@/components/sports/EspnPlayerStatsTable';
import type { EspnBoxscore } from '@/components/sports/espn-boxscore-types';

export default function BoxScoreClient() {
  const { game, loading, error } = useGameData();

  const boxscore = game?.boxscore as EspnBoxscore | undefined;

  const teamStats = useMemo(() => {
    if (!boxscore?.teams || boxscore.teams.length < 2) return null;
    const away = boxscore.teams.find(
      (t) => t.team?.abbreviation === game?.competitors?.find((c) => c.homeAway === 'away')?.team?.abbreviation
    ) || boxscore.teams[0];
    const home = boxscore.teams.find(
      (t) => t.team?.abbreviation === game?.competitors?.find((c) => c.homeAway === 'home')?.team?.abbreviation
    ) || boxscore.teams[1];
    return { away, home };
  }, [boxscore, game?.competitors]);

  const playerStats =
    boxscore?.players && boxscore.players.length >= 2 ? boxscore.players : null;

  if (loading || error) {
    return null; // Layout handles loading/error states
  }

  if (!game || !boxscore || (!teamStats && !playerStats)) {
    return (
      <Card variant="default" padding="lg">
        <div className="text-center py-8">
          <svg viewBox="0 0 24 24" className="w-16 h-16 text-text-tertiary mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-text-secondary">Box score data not available yet</p>
          <p className="text-text-tertiary text-sm mt-2">
            The full box score will appear once the game gets underway
          </p>
        </div>
      </Card>
    );
  }

  const homeTeam = game.competitors?.find((c) => c.homeAway === 'home');
  const awayTeam = game.competitors?.find((c) => c.homeAway === 'away');

  return (
    <div className="space-y-6">
      {teamStats && (
        <EspnTeamStatsTable
          away={teamStats.away}
          home={teamStats.home}
          awayLabel={awayTeam?.team?.abbreviation || 'Away'}
          homeLabel={homeTeam?.team?.abbreviation || 'Home'}
        />
      )}
      {playerStats && (
        <EspnPlayerStatsTable playerStats={playerStats} mode="split" benchLabel="Bench" />
      )}
    </div>
  );
}
