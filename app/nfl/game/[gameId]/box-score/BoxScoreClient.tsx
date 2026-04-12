'use client';

import { useMemo } from 'react';
import { useGameData } from '../layout';
import { BoxScoreEmptyState } from '@/components/box-score';
import { EspnTeamStatsTable } from '@/components/sports/EspnTeamStatsTable';
import { EspnPlayerStatsTable } from '@/components/sports/EspnPlayerStatsTable';
import type { EspnBoxscore } from '@/components/sports/espn-boxscore-types';

export default function BoxScoreClient() {
  const { game, loading, error } = useGameData();

  const boxscore = game?.boxscore as EspnBoxscore | undefined;

  const teamStats = useMemo(() => {
    if (!boxscore?.teams || boxscore.teams.length < 2) return null;
    const away =
      boxscore.teams.find(
        (t) =>
          t.team?.abbreviation ===
          game?.competitors?.find((c) => c.homeAway === 'away')?.team?.abbreviation,
      ) || boxscore.teams[0];
    const home =
      boxscore.teams.find(
        (t) =>
          t.team?.abbreviation ===
          game?.competitors?.find((c) => c.homeAway === 'home')?.team?.abbreviation,
      ) || boxscore.teams[1];
    return { away, home };
  }, [boxscore, game?.competitors]);

  const playerStats =
    boxscore?.players && boxscore.players.length >= 2 ? boxscore.players : null;

  if (loading || error) {
    return null;
  }

  if (!game || !boxscore || (!teamStats && !playerStats)) {
    return <BoxScoreEmptyState message="Box score data not available yet" />;
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
      {playerStats && <EspnPlayerStatsTable playerStats={playerStats} mode="flat" />}
    </div>
  );
}
