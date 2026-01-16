'use client';

import { useState } from 'react';
import type { BoxScoreTabProps } from '../GameDetailModal.types';
import { Card } from '@/components/ui/Card';

type TeamFilter = 'away' | 'home';

export function BoxScoreTab({ boxScore, sport, loading }: BoxScoreTabProps) {
  const [selectedTeam, setSelectedTeam] = useState<TeamFilter>('away');

  // Loading state
  if (loading) {
    return (
      <div className="p-4">
        <div className="skeleton w-full h-64 rounded" />
      </div>
    );
  }

  // No box score available
  if (!boxScore) {
    return (
      <div className="p-4">
        <Card variant="default">
          <div className="text-center py-8">
            <p className="text-white/50">Box score not available</p>
          </div>
        </Card>
      </div>
    );
  }

  const isBaseball = sport === 'mlb' || sport === 'cbb';
  const isFootball = sport === 'nfl' || sport === 'ncaaf';
  const isBasketball = ['nba', 'ncaab', 'wcbb', 'wnba'].includes(sport);

  const currentStats = selectedTeam === 'away' ? boxScore.awayStats : boxScore.homeStats;

  return (
    <div className="p-4 space-y-4">
      {/* Team toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedTeam('away')}
          className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
            selectedTeam === 'away'
              ? 'bg-burnt-orange text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/15'
          }`}
        >
          {boxScore.awayStats.team.abbreviation}
        </button>
        <button
          onClick={() => setSelectedTeam('home')}
          className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
            selectedTeam === 'home'
              ? 'bg-burnt-orange text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/15'
          }`}
        >
          {boxScore.homeStats.team.abbreviation}
        </button>
      </div>

      {/* Baseball box score */}
      {isBaseball && <BaseballBoxScore stats={currentStats} />}

      {/* Football box score */}
      {isFootball && <FootballBoxScore stats={currentStats} />}

      {/* Basketball box score */}
      {isBasketball && <BasketballBoxScore stats={currentStats} />}
    </div>
  );
}

// Baseball box score component
function BaseballBoxScore({
  stats,
}: {
  stats: BoxScoreTabProps['boxScore'] extends null
    ? never
    : NonNullable<BoxScoreTabProps['boxScore']>['homeStats'];
}) {
  // Separate batters and pitchers
  const batters = stats.players.filter(
    (p) => p.stats['ab'] !== undefined || p.stats['r'] !== undefined
  );
  const pitchers = stats.players.filter(
    (p) => p.stats['ip'] !== undefined || p.stats['era'] !== undefined
  );

  return (
    <div className="space-y-4">
      {/* Batting */}
      <Card variant="default">
        <h3 className="text-sm font-semibold text-white/70 mb-3">Batting</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/50 border-b border-white/10">
                <th className="text-left py-2 pr-2 font-normal sticky left-0 bg-charcoal">
                  Batter
                </th>
                <th className="w-8 text-center py-2 font-normal">AB</th>
                <th className="w-8 text-center py-2 font-normal">R</th>
                <th className="w-8 text-center py-2 font-normal">H</th>
                <th className="w-8 text-center py-2 font-normal">RBI</th>
                <th className="w-8 text-center py-2 font-normal">BB</th>
                <th className="w-8 text-center py-2 font-normal">SO</th>
                <th className="w-12 text-center py-2 font-normal">AVG</th>
              </tr>
            </thead>
            <tbody>
              {batters.map((player, i) => (
                <tr key={i} className="text-white border-b border-white/5 last:border-0">
                  <td className="py-2 pr-2 sticky left-0 bg-charcoal">
                    <div className="flex items-center gap-2">
                      <span className="text-white/50 w-4">
                        {player.stats['battingOrder'] || ''}
                      </span>
                      <span className="font-medium truncate max-w-[120px]">
                        {player.player.displayName}
                      </span>
                      <span className="text-white/40 text-xs">
                        {player.stats['position'] || ''}
                      </span>
                    </div>
                  </td>
                  <td className="w-8 text-center py-2">{player.stats['ab'] ?? '-'}</td>
                  <td className="w-8 text-center py-2">{player.stats['r'] ?? '-'}</td>
                  <td className="w-8 text-center py-2">{player.stats['h'] ?? '-'}</td>
                  <td className="w-8 text-center py-2">{player.stats['rbi'] ?? '-'}</td>
                  <td className="w-8 text-center py-2">{player.stats['bb'] ?? '-'}</td>
                  <td className="w-8 text-center py-2">{player.stats['so'] ?? '-'}</td>
                  <td className="w-12 text-center py-2 text-white/70">
                    {player.stats['avg'] ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pitching */}
      {pitchers.length > 0 && (
        <Card variant="default">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Pitching</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white/50 border-b border-white/10">
                  <th className="text-left py-2 pr-2 font-normal sticky left-0 bg-charcoal">
                    Pitcher
                  </th>
                  <th className="w-10 text-center py-2 font-normal">IP</th>
                  <th className="w-8 text-center py-2 font-normal">H</th>
                  <th className="w-8 text-center py-2 font-normal">R</th>
                  <th className="w-8 text-center py-2 font-normal">ER</th>
                  <th className="w-8 text-center py-2 font-normal">BB</th>
                  <th className="w-8 text-center py-2 font-normal">SO</th>
                  <th className="w-12 text-center py-2 font-normal">ERA</th>
                </tr>
              </thead>
              <tbody>
                {pitchers.map((player, i) => (
                  <tr key={i} className="text-white border-b border-white/5 last:border-0">
                    <td className="py-2 pr-2 sticky left-0 bg-charcoal">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate max-w-[140px]">
                          {player.player.displayName}
                        </span>
                        {player.stats['decision'] && (
                          <span
                            className={`text-xs font-semibold ${
                              player.stats['decision'] === 'W'
                                ? 'text-success'
                                : player.stats['decision'] === 'L'
                                  ? 'text-error'
                                  : 'text-burnt-orange'
                            }`}
                          >
                            ({player.stats['decision']})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="w-10 text-center py-2">{player.stats['ip'] ?? '-'}</td>
                    <td className="w-8 text-center py-2">{player.stats['h'] ?? '-'}</td>
                    <td className="w-8 text-center py-2">{player.stats['r'] ?? '-'}</td>
                    <td className="w-8 text-center py-2">{player.stats['er'] ?? '-'}</td>
                    <td className="w-8 text-center py-2">{player.stats['bb'] ?? '-'}</td>
                    <td className="w-8 text-center py-2">{player.stats['so'] ?? '-'}</td>
                    <td className="w-12 text-center py-2 text-white/70">
                      {player.stats['era'] ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// Football box score component
function FootballBoxScore({
  stats,
}: {
  stats: BoxScoreTabProps['boxScore'] extends null
    ? never
    : NonNullable<BoxScoreTabProps['boxScore']>['homeStats'];
}) {
  const passers = stats.players.filter((p) => p.stats['comp'] !== undefined);
  const rushers = stats.players.filter((p) => p.stats['car'] !== undefined);
  const receivers = stats.players.filter((p) => p.stats['rec'] !== undefined);

  return (
    <div className="space-y-4">
      {/* Passing */}
      {passers.length > 0 && (
        <Card variant="default">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Passing</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white/50 border-b border-white/10">
                  <th className="text-left py-2 font-normal sticky left-0 bg-charcoal">Player</th>
                  <th className="w-14 text-center py-2 font-normal">C/ATT</th>
                  <th className="w-10 text-center py-2 font-normal">YDS</th>
                  <th className="w-8 text-center py-2 font-normal">TD</th>
                  <th className="w-8 text-center py-2 font-normal">INT</th>
                </tr>
              </thead>
              <tbody>
                {passers.map((player, i) => (
                  <tr key={i} className="text-white border-b border-white/5 last:border-0">
                    <td className="py-2 sticky left-0 bg-charcoal font-medium">
                      {player.player.displayName}
                    </td>
                    <td className="w-14 text-center py-2">
                      {player.stats['comp']}/{player.stats['att']}
                    </td>
                    <td className="w-10 text-center py-2">{player.stats['yds']}</td>
                    <td className="w-8 text-center py-2">{player.stats['td']}</td>
                    <td className="w-8 text-center py-2">{player.stats['int']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Rushing */}
      {rushers.length > 0 && (
        <Card variant="default">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Rushing</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white/50 border-b border-white/10">
                  <th className="text-left py-2 font-normal sticky left-0 bg-charcoal">Player</th>
                  <th className="w-8 text-center py-2 font-normal">CAR</th>
                  <th className="w-10 text-center py-2 font-normal">YDS</th>
                  <th className="w-10 text-center py-2 font-normal">AVG</th>
                  <th className="w-8 text-center py-2 font-normal">TD</th>
                  <th className="w-10 text-center py-2 font-normal">LNG</th>
                </tr>
              </thead>
              <tbody>
                {rushers.map((player, i) => (
                  <tr key={i} className="text-white border-b border-white/5 last:border-0">
                    <td className="py-2 sticky left-0 bg-charcoal font-medium">
                      {player.player.displayName}
                    </td>
                    <td className="w-8 text-center py-2">{player.stats['car']}</td>
                    <td className="w-10 text-center py-2">{player.stats['yds']}</td>
                    <td className="w-10 text-center py-2">{player.stats['avg']}</td>
                    <td className="w-8 text-center py-2">{player.stats['td']}</td>
                    <td className="w-10 text-center py-2">{player.stats['long']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Receiving */}
      {receivers.length > 0 && (
        <Card variant="default">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Receiving</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white/50 border-b border-white/10">
                  <th className="text-left py-2 font-normal sticky left-0 bg-charcoal">Player</th>
                  <th className="w-8 text-center py-2 font-normal">REC</th>
                  <th className="w-10 text-center py-2 font-normal">YDS</th>
                  <th className="w-10 text-center py-2 font-normal">AVG</th>
                  <th className="w-8 text-center py-2 font-normal">TD</th>
                  <th className="w-10 text-center py-2 font-normal">LNG</th>
                </tr>
              </thead>
              <tbody>
                {receivers.map((player, i) => (
                  <tr key={i} className="text-white border-b border-white/5 last:border-0">
                    <td className="py-2 sticky left-0 bg-charcoal font-medium">
                      {player.player.displayName}
                    </td>
                    <td className="w-8 text-center py-2">{player.stats['rec']}</td>
                    <td className="w-10 text-center py-2">{player.stats['yds']}</td>
                    <td className="w-10 text-center py-2">{player.stats['avg']}</td>
                    <td className="w-8 text-center py-2">{player.stats['td']}</td>
                    <td className="w-10 text-center py-2">{player.stats['long']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// Basketball box score component
function BasketballBoxScore({
  stats,
}: {
  stats: BoxScoreTabProps['boxScore'] extends null
    ? never
    : NonNullable<BoxScoreTabProps['boxScore']>['homeStats'];
}) {
  return (
    <Card variant="default">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-white/50 border-b border-white/10">
              <th className="text-left py-2 font-normal sticky left-0 bg-charcoal">Player</th>
              <th className="w-10 text-center py-2 font-normal">MIN</th>
              <th className="w-8 text-center py-2 font-normal">PTS</th>
              <th className="w-8 text-center py-2 font-normal">REB</th>
              <th className="w-8 text-center py-2 font-normal">AST</th>
              <th className="w-10 text-center py-2 font-normal">FG</th>
              <th className="w-10 text-center py-2 font-normal">3P</th>
              <th className="w-10 text-center py-2 font-normal">FT</th>
              <th className="w-8 text-center py-2 font-normal">+/-</th>
            </tr>
          </thead>
          <tbody>
            {stats.players.map((player, i) => (
              <tr key={i} className="text-white border-b border-white/5 last:border-0">
                <td className="py-2 sticky left-0 bg-charcoal">
                  <span className="font-medium">{player.player.displayName}</span>
                  {player.starter && <span className="text-burnt-orange text-xs ml-1">*</span>}
                </td>
                <td className="w-10 text-center py-2 text-white/70">
                  {player.stats['minutes'] ?? '-'}
                </td>
                <td className="w-8 text-center py-2 font-semibold">{player.stats['pts'] ?? '-'}</td>
                <td className="w-8 text-center py-2">{player.stats['reb'] ?? '-'}</td>
                <td className="w-8 text-center py-2">{player.stats['ast'] ?? '-'}</td>
                <td className="w-10 text-center py-2 text-white/70">{player.stats['fg'] ?? '-'}</td>
                <td className="w-10 text-center py-2 text-white/70">
                  {player.stats['threeP'] ?? '-'}
                </td>
                <td className="w-10 text-center py-2 text-white/70">{player.stats['ft'] ?? '-'}</td>
                <td
                  className={`w-8 text-center py-2 ${
                    Number(player.stats['plusMinus']) > 0
                      ? 'text-success'
                      : Number(player.stats['plusMinus']) < 0
                        ? 'text-error'
                        : ''
                  }`}
                >
                  {player.stats['plusMinus'] !== undefined
                    ? (Number(player.stats['plusMinus']) > 0 ? '+' : '') + player.stats['plusMinus']
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
