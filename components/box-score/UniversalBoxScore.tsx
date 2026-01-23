'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import type {
  UnifiedBoxScore,
  UnifiedSportKey,
  TeamBoxStats,
  PlayerBoxStats,
} from '@/lib/types/adapters';
import { TeamComparison, type TeamStats } from '@/components/sports/TeamComparison';
import { getBoxScoreColumns, getSportConfig } from '@/lib/config/sport-config';

export interface UniversalBoxScoreProps {
  boxScore: UnifiedBoxScore;
  sport: UnifiedSportKey;
  variant?: 'compact' | 'full';
  showTeamToggle?: boolean;
  showTabs?: boolean;
  defaultTeam?: 'away' | 'home';
  defaultTab?: BoxScoreTab;
  className?: string;
}

type TeamFilter = 'away' | 'home';
type BoxScoreTab = 'box' | 'play-by-play' | 'team-comparison' | 'player-stats';

const BOXSCORE_TABS: { id: BoxScoreTab; label: string }[] = [
  { id: 'box', label: 'Box Score' },
  { id: 'team-comparison', label: 'Comparison' },
  { id: 'player-stats', label: 'Players' },
];

/** Convert TeamBoxStats to TeamStats for comparison component */
function toComparisonStats(stats: TeamBoxStats): TeamStats {
  return {
    stats: stats.stats as Record<string, number | string>,
  };
}

export function UniversalBoxScore({
  boxScore,
  sport,
  variant = 'full',
  showTeamToggle = true,
  showTabs = true,
  defaultTeam = 'away',
  defaultTab = 'box',
  className = '',
}: UniversalBoxScoreProps) {
  const [selectedTeam, setSelectedTeam] = useState<TeamFilter>(defaultTeam);
  const [activeTab, setActiveTab] = useState<BoxScoreTab>(defaultTab);

  const isBaseball = sport === 'mlb' || sport === 'cbb';
  const isFootball = sport === 'nfl' || sport === 'ncaaf';
  const isBasketball = ['nba', 'ncaab', 'wcbb', 'wnba'].includes(sport);

  const currentStats = selectedTeam === 'away' ? boxScore.awayStats : boxScore.homeStats;
  const config = getSportConfig(sport);

  return (
    <div className={className}>
      {/* Tab navigation */}
      {showTabs && (
        <div className="flex gap-1 mb-4 border-b border-white/10">
          {BOXSCORE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
                activeTab === tab.id
                  ? 'border-burnt-orange text-burnt-orange'
                  : 'border-transparent text-white/50 hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Team Comparison Tab */}
      {activeTab === 'team-comparison' && (
        <TeamComparison
          sport={sport}
          homeTeam={boxScore.homeStats.team}
          awayTeam={boxScore.awayStats.team}
          homeStats={toComparisonStats(boxScore.homeStats)}
          awayStats={toComparisonStats(boxScore.awayStats)}
          variant="full"
        />
      )}

      {/* Box Score Tab */}
      {(activeTab === 'box' || activeTab === 'player-stats') && (
        <>
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

          {isFootball && <FootballBoxScore stats={currentStats} variant={variant} sport={sport} />}

          {isBasketball && <BasketballBoxScore stats={currentStats} variant={variant} />}
        </>
      )}
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

// Football Box Score - Enhanced with full stat categories
interface FootballBoxScoreProps {
  stats: TeamBoxStats;
  variant: 'compact' | 'full';
  sport?: UnifiedSportKey;
}

function FootballBoxScore({ stats, variant, sport = 'nfl' }: FootballBoxScoreProps) {
  const passers = stats.players.filter((p) => p.stats['comp'] !== undefined);
  const rushers = stats.players.filter((p) => p.stats['car'] !== undefined);
  const receivers = stats.players.filter((p) => p.stats['rec'] !== undefined);
  const defenders = stats.players.filter(
    (p) => p.stats['tackles'] !== undefined || p.stats['sacks'] !== undefined
  );

  // Full stat columns for NFL/CFB
  const passingColumns =
    variant === 'compact'
      ? ['C/ATT', 'YDS', 'TD', 'INT']
      : ['C/ATT', 'YDS', 'TD', 'INT', 'QBR', 'SACKS'];

  const rushingColumns =
    variant === 'compact' ? ['CAR', 'YDS', 'TD'] : ['CAR', 'YDS', 'AVG', 'TD', 'LNG'];

  const receivingColumns =
    variant === 'compact' ? ['REC', 'YDS', 'TD'] : ['REC', 'TGT', 'YDS', 'AVG', 'TD'];

  const defenseColumns =
    variant === 'compact' ? ['TCKL', 'SACK', 'INT'] : ['TCKL', 'SOLO', 'SACK', 'TFL', 'INT', 'PD'];

  return (
    <div className="space-y-4">
      {/* Passing */}
      {passers.length > 0 && (
        <Card variant="default">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Passing</h3>
          <StatsTable
            players={passers}
            columns={passingColumns}
            statKeys={['comp', 'att', 'yds', 'td', 'int', 'qbr', 'sacks']}
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
            columns={rushingColumns}
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
            columns={receivingColumns}
            statKeys={['rec', 'targets', 'yds', 'avg', 'td']}
          />
        </Card>
      )}

      {/* Defense - NEW */}
      {defenders.length > 0 && (
        <Card variant="default">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Defense</h3>
          <StatsTable
            players={defenders}
            columns={defenseColumns}
            statKeys={['tackles', 'soloTackles', 'sacks', 'tacklesForLoss', 'int', 'passDefended']}
          />
        </Card>
      )}
    </div>
  );
}

// Basketball Box Score - Enhanced with full NBA/NCAAB stats
interface BasketballBoxScoreProps {
  stats: TeamBoxStats;
  variant: 'compact' | 'full';
}

function BasketballBoxScore({ stats, variant }: BasketballBoxScoreProps) {
  // Full NBA-style box score columns
  const columns =
    variant === 'compact'
      ? ['MIN', 'PTS', 'REB', 'AST', 'FG', '3P']
      : ['MIN', 'PTS', 'FG', '3P', 'FT', 'REB', 'AST', 'STL', 'BLK', 'TO', '+/-'];

  const statKeys =
    variant === 'compact'
      ? ['minutes', 'pts', 'reb', 'ast', 'fg', 'threeP']
      : ['minutes', 'pts', 'fg', 'threeP', 'ft', 'reb', 'ast', 'stl', 'blk', 'to', 'plusMinus'];

  // Separate starters and bench
  const starters = stats.players.filter((p) => p.starter);
  const bench = stats.players.filter((p) => !p.starter);

  return (
    <div className="space-y-4">
      {/* Starters */}
      {starters.length > 0 && (
        <Card variant="default">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Starters</h3>
          <StatsTable
            players={starters}
            columns={columns}
            statKeys={statKeys}
            showStarter={false}
          />
        </Card>
      )}

      {/* Bench */}
      {bench.length > 0 && (
        <Card variant="default">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Bench</h3>
          <StatsTable players={bench} columns={columns} statKeys={statKeys} showStarter={false} />
        </Card>
      )}

      {/* Fallback: show all players if no starter distinction */}
      {starters.length === 0 && bench.length === 0 && stats.players.length > 0 && (
        <Card variant="default">
          <StatsTable players={stats.players} columns={columns} statKeys={statKeys} showStarter />
        </Card>
      )}

      {/* Team Totals */}
      <Card variant="default">
        <h3 className="text-sm font-semibold text-white/70 mb-3">Team Totals</h3>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-4 text-center">
          <StatBox label="PTS" value={stats.score} />
          <StatBox label="FG%" value={stats.stats['fgPct'] || '-'} />
          <StatBox label="3P%" value={stats.stats['threePct'] || '-'} />
          <StatBox label="FT%" value={stats.stats['ftPct'] || '-'} />
          <StatBox label="REB" value={stats.stats['reb'] || '-'} />
          <StatBox label="AST" value={stats.stats['ast'] || '-'} />
        </div>
      </Card>
    </div>
  );
}

/** Small stat display box for team totals */
function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs text-white/50">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
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
