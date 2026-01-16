'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import type {
  UnifiedBoxScore,
  UnifiedSportKey,
  TeamBoxStats,
  PlayerBoxStats,
} from '@/lib/types/adapters';

export interface UniversalBoxScoreProps {
  boxScore: UnifiedBoxScore;
  sport: UnifiedSportKey;
  variant?: 'compact' | 'full';
  showTeamToggle?: boolean;
  defaultTeam?: 'away' | 'home';
  className?: string;
}

type TeamFilter = 'away' | 'home';

export function UniversalBoxScore({
  boxScore,
  sport,
  variant = 'full',
  showTeamToggle = true,
  defaultTeam = 'away',
  className = '',
}: UniversalBoxScoreProps) {
  const [selectedTeam, setSelectedTeam] = useState<TeamFilter>(defaultTeam);

  const isBaseball = sport === 'mlb' || sport === 'cbb';
  const isFootball = sport === 'nfl' || sport === 'ncaaf';
  const isBasketball = ['nba', 'ncaab', 'wcbb', 'wnba'].includes(sport);

  const currentStats = selectedTeam === 'away' ? boxScore.awayStats : boxScore.homeStats;

  return (
    <div className={className}>
      {/* Team toggle */}
      {showTeamToggle && (
        <div className="flex gap-2 mb-4">
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
      )}

      {/* Sport-specific box score */}
      {isBaseball && <BaseballBoxScore stats={currentStats} variant={variant} />}

      {isFootball && <FootballBoxScore stats={currentStats} variant={variant} />}

      {isBasketball && <BasketballBoxScore stats={currentStats} variant={variant} />}
    </div>
  );
}

// Baseball Box Score
interface BaseballBoxScoreProps {
  stats: TeamBoxStats;
  variant: 'compact' | 'full';
}

function BaseballBoxScore({ stats, variant }: BaseballBoxScoreProps) {
  // Separate batters and pitchers
  const batters = stats.players.filter(
    (p) => p.stats['ab'] !== undefined || p.stats['r'] !== undefined
  );
  const pitchers = stats.players.filter(
    (p) => p.stats['ip'] !== undefined || p.stats['era'] !== undefined
  );

  const columns =
    variant === 'compact'
      ? ['AB', 'H', 'R', 'RBI', 'BB', 'SO']
      : ['AB', 'R', 'H', 'RBI', 'BB', 'SO', 'AVG'];

  const pitchingColumns =
    variant === 'compact'
      ? ['IP', 'H', 'R', 'ER', 'BB', 'SO']
      : ['IP', 'H', 'R', 'ER', 'BB', 'SO', 'ERA'];

  return (
    <div className="space-y-4">
      {/* Batting */}
      <Card variant="default">
        <h3 className="text-sm font-semibold text-white/70 mb-3">Batting</h3>
        <StatsTable
          players={batters}
          columns={columns}
          statKeys={['ab', 'r', 'h', 'rbi', 'bb', 'so', 'avg']}
        />
      </Card>

      {/* Pitching */}
      {pitchers.length > 0 && (
        <Card variant="default">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Pitching</h3>
          <StatsTable
            players={pitchers}
            columns={pitchingColumns}
            statKeys={['ip', 'h', 'r', 'er', 'bb', 'so', 'era']}
            showDecision
          />
        </Card>
      )}
    </div>
  );
}

// Football Box Score
interface FootballBoxScoreProps {
  stats: TeamBoxStats;
  variant: 'compact' | 'full';
}

function FootballBoxScore({ stats, variant }: FootballBoxScoreProps) {
  const passers = stats.players.filter((p) => p.stats['comp'] !== undefined);
  const rushers = stats.players.filter((p) => p.stats['car'] !== undefined);
  const receivers = stats.players.filter((p) => p.stats['rec'] !== undefined);

  return (
    <div className="space-y-4">
      {/* Passing */}
      {passers.length > 0 && (
        <Card variant="default">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Passing</h3>
          <StatsTable
            players={passers}
            columns={['C/ATT', 'YDS', 'TD', 'INT']}
            statKeys={['comp', 'att', 'yds', 'td', 'int']}
            compoundStats={{ 'C/ATT': ['comp', 'att'] }}
          />
        </Card>
      )}

      {/* Rushing */}
      {rushers.length > 0 && (
        <Card variant="default">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Rushing</h3>
          <StatsTable
            players={rushers}
            columns={
              variant === 'compact' ? ['CAR', 'YDS', 'TD'] : ['CAR', 'YDS', 'AVG', 'TD', 'LNG']
            }
            statKeys={['car', 'yds', 'avg', 'td', 'long']}
          />
        </Card>
      )}

      {/* Receiving */}
      {receivers.length > 0 && (
        <Card variant="default">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Receiving</h3>
          <StatsTable
            players={receivers}
            columns={
              variant === 'compact' ? ['REC', 'YDS', 'TD'] : ['REC', 'YDS', 'AVG', 'TD', 'LNG']
            }
            statKeys={['rec', 'yds', 'avg', 'td', 'long']}
          />
        </Card>
      )}
    </div>
  );
}

// Basketball Box Score
interface BasketballBoxScoreProps {
  stats: TeamBoxStats;
  variant: 'compact' | 'full';
}

function BasketballBoxScore({ stats, variant }: BasketballBoxScoreProps) {
  const columns =
    variant === 'compact'
      ? ['MIN', 'PTS', 'REB', 'AST', 'FG', '3P']
      : ['MIN', 'PTS', 'REB', 'AST', 'FG', '3P', 'FT', '+/-'];

  return (
    <Card variant="default">
      <StatsTable
        players={stats.players}
        columns={columns}
        statKeys={['minutes', 'pts', 'reb', 'ast', 'fg', 'threeP', 'ft', 'plusMinus']}
        showStarter
      />
    </Card>
  );
}

// Generic Stats Table Component
interface StatsTableProps {
  players: PlayerBoxStats[];
  columns: string[];
  statKeys: string[];
  compoundStats?: Record<string, string[]>;
  showDecision?: boolean;
  showStarter?: boolean;
}

function StatsTable({
  players,
  columns,
  statKeys,
  compoundStats = {},
  showDecision = false,
  showStarter = false,
}: StatsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-white/50 border-b border-white/10">
            <th className="text-left py-2 pr-2 font-normal sticky left-0 bg-charcoal">Player</th>
            {columns.map((col, i) => (
              <th key={i} className="w-10 text-center py-2 font-normal">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((player, i) => (
            <tr key={i} className="text-white border-b border-white/5 last:border-0">
              <td className="py-2 pr-2 sticky left-0 bg-charcoal">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate max-w-[120px]">
                    {player.player.displayName}
                  </span>
                  {showStarter && player.starter && (
                    <span className="text-burnt-orange text-[10px]">*</span>
                  )}
                  {showDecision && player.stats['decision'] && (
                    <span
                      className={`text-[10px] font-semibold ${
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
                  {player.stats['position'] && (
                    <span className="text-white/40 text-[10px]">{player.stats['position']}</span>
                  )}
                </div>
              </td>
              {columns.map((col, j) => {
                // Handle compound stats like C/ATT
                if (compoundStats[col]) {
                  const [key1, key2] = compoundStats[col];
                  return (
                    <td key={j} className="w-10 text-center py-2">
                      {player.stats[key1]}/{player.stats[key2]}
                    </td>
                  );
                }

                // Regular stat
                const statKey = statKeys[j];
                const value = player.stats[statKey];

                // Plus/minus formatting
                if (statKey === 'plusMinus' && value !== undefined) {
                  const numVal = Number(value);
                  return (
                    <td
                      key={j}
                      className={`w-10 text-center py-2 ${
                        numVal > 0 ? 'text-success' : numVal < 0 ? 'text-error' : ''
                      }`}
                    >
                      {numVal > 0 ? '+' : ''}
                      {value}
                    </td>
                  );
                }

                return (
                  <td key={j} className="w-10 text-center py-2">
                    {value ?? '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Loading skeleton
export function UniversalBoxScoreSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="skeleton flex-1 h-10 rounded" />
        <div className="skeleton flex-1 h-10 rounded" />
      </div>
      <div className="skeleton w-full h-64 rounded" />
    </div>
  );
}

export default UniversalBoxScore;
