'use client';

import { useMemo } from 'react';
import { useGameData } from '../layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

/**
 * Full Box Score Page
 *
 * Displays team statistics comparison and player stats if available.
 * ESPN NFL game summary boxscore shape mirrors NBA:
 *   { teams: [{team, statistics: [{name, displayValue}]}],
 *     players: [{team, statistics: [{names, labels, athletes: [{athlete, stats}]}]}] }
 */

interface BoxscoreTeamStat {
  name?: string;
  displayValue?: string;
  label?: string;
}

interface BoxscoreTeam {
  team?: { displayName?: string; abbreviation?: string; logo?: string };
  statistics?: BoxscoreTeamStat[];
}

interface BoxscorePlayerAthlete {
  athlete?: {
    displayName?: string;
    shortName?: string;
    position?: { abbreviation?: string };
    starter?: boolean;
  };
  stats?: string[];
  didNotPlay?: boolean;
  reason?: string;
}

interface BoxscorePlayerGroup {
  team?: { displayName?: string; abbreviation?: string };
  statistics?: Array<{
    names?: string[];
    labels?: string[];
    athletes?: BoxscorePlayerAthlete[];
    type?: string;
    name?: string;
  }>;
}

export default function BoxScoreClient() {
  const { game, loading, error } = useGameData();

  const boxscore = game?.boxscore as {
    teams?: BoxscoreTeam[];
    players?: BoxscorePlayerGroup[];
  } | undefined;

  // Extract team stats
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

  // Extract player stats
  const playerStats = useMemo(() => {
    if (!boxscore?.players || boxscore.players.length < 2) return null;
    return boxscore.players;
  }, [boxscore]);

  if (loading || error || !game) {
    return null; // Layout handles loading/error states
  }

  const homeTeam = game.competitors?.find((c) => c.homeAway === 'home');
  const awayTeam = game.competitors?.find((c) => c.homeAway === 'away');

  if (!boxscore || (!teamStats && !playerStats)) {
    return (
      <Card variant="default" padding="lg">
        <div className="text-center py-8">
          <svg
            viewBox="0 0 24 24"
            className="w-16 h-16 text-text-tertiary mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
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

  return (
    <div className="space-y-6">
      {/* Team Statistics Comparison */}
      {teamStats && (
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Team Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left p-2 text-text-tertiary">
                      {awayTeam?.team?.abbreviation || 'Away'}
                    </th>
                    <th className="text-center p-2 text-text-tertiary">Stat</th>
                    <th className="text-right p-2 text-text-tertiary">
                      {homeTeam?.team?.abbreviation || 'Home'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(teamStats.away.statistics || []).map((awayStat, idx) => {
                    const homeStat = teamStats.home.statistics?.[idx];
                    const label = awayStat.label || awayStat.name || '';
                    return (
                      <tr key={idx} className="border-b border-border-subtle last:border-0">
                        <td className="p-2 font-mono text-text-secondary">
                          {awayStat.displayValue || '-'}
                        </td>
                        <td className="p-2 text-center text-text-tertiary text-xs uppercase tracking-wide">
                          {label}
                        </td>
                        <td className="p-2 text-right font-mono text-text-secondary">
                          {homeStat?.displayValue || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player Stats — each team, each stat group (passing, rushing, receiving, etc.) */}
      {playerStats && playerStats.map((teamGroup, tIdx) => {
        const teamAbbr = teamGroup.team?.abbreviation || (tIdx === 0 ? 'Away' : 'Home');
        const teamName = teamGroup.team?.displayName || teamAbbr;

        // NFL boxscore can have multiple stat groups per team (passing, rushing, receiving, etc.)
        const statGroups = teamGroup.statistics || [];
        if (statGroups.length === 0) return null;

        return (
          <Card key={tIdx} variant="default" padding="md">
            <CardHeader>
              <CardTitle>{teamName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {statGroups.map((statGroup, gIdx) => {
                  const headers = statGroup.labels || statGroup.names || [];
                  const athletes = statGroup.athletes || [];
                  const groupName = statGroup.name || statGroup.type || '';
                  const activePlayers = athletes.filter((a) => !a.didNotPlay);

                  if (activePlayers.length === 0) return null;

                  return (
                    <div key={gIdx}>
                      {groupName && (
                        <div className="px-2 py-1.5 mb-2 text-xs text-burnt-orange font-semibold uppercase tracking-wide bg-graphite rounded">
                          {groupName}
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border-subtle">
                              <th className="text-left p-2 text-text-tertiary sticky left-0 bg-inherit">
                                Player
                              </th>
                              {headers.map((h, hIdx) => (
                                <th
                                  key={hIdx}
                                  className="text-center p-2 text-text-tertiary text-xs uppercase"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {activePlayers.map((player, pIdx) => (
                              <tr
                                key={pIdx}
                                className="border-b border-border-subtle last:border-0 hover:bg-white/5"
                              >
                                <td className="p-2 text-white font-medium whitespace-nowrap sticky left-0 bg-inherit">
                                  <span>
                                    {player.athlete?.shortName || player.athlete?.displayName || '-'}
                                  </span>
                                  {player.athlete?.position?.abbreviation && (
                                    <span className="text-text-tertiary text-xs ml-1.5">
                                      {player.athlete.position.abbreviation}
                                    </span>
                                  )}
                                </td>
                                {(player.stats || []).map((val, sIdx) => (
                                  <td
                                    key={sIdx}
                                    className="p-2 text-center font-mono text-text-secondary text-xs"
                                  >
                                    {val}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
