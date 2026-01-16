'use client';

import type { TeamStatsTabProps } from '../GameDetailModal.types';
import { Card } from '@/components/ui/Card';

export function TeamStatsTab({ boxScore, sport, loading }: TeamStatsTabProps) {
  // Loading state
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton w-full h-12 rounded" />
        ))}
      </div>
    );
  }

  // No box score available
  if (!boxScore) {
    return (
      <div className="p-4">
        <Card variant="default">
          <div className="text-center py-8">
            <p className="text-white/50">Team stats not available</p>
          </div>
        </Card>
      </div>
    );
  }

  const { awayStats, homeStats, game } = boxScore;
  const isBaseball = sport === 'mlb' || sport === 'cbb';
  const isFootball = sport === 'nfl' || sport === 'ncaaf';
  const isBasketball = ['nba', 'ncaab', 'wcbb', 'wnba'].includes(sport);

  return (
    <div className="p-4">
      <Card variant="default">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            {game.awayTeam.logo ? (
              <img
                src={game.awayTeam.logo}
                alt={game.awayTeam.name}
                className="w-6 h-6 object-contain"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                {game.awayTeam.abbreviation.slice(0, 2)}
              </div>
            )}
            <span className="text-white font-medium">{game.awayTeam.abbreviation}</span>
          </div>
          <span className="text-white/50 text-sm">Team Stats</span>
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{game.homeTeam.abbreviation}</span>
            {game.homeTeam.logo ? (
              <img
                src={game.homeTeam.logo}
                alt={game.homeTeam.name}
                className="w-6 h-6 object-contain"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                {game.homeTeam.abbreviation.slice(0, 2)}
              </div>
            )}
          </div>
        </div>

        {/* Stats comparison */}
        <div className="space-y-1">
          {isBaseball && <BaseballTeamStats away={awayStats.stats} home={homeStats.stats} />}

          {isFootball && <FootballTeamStats away={awayStats.stats} home={homeStats.stats} />}

          {isBasketball && <BasketballTeamStats away={awayStats.stats} home={homeStats.stats} />}
        </div>
      </Card>
    </div>
  );
}

// Stat comparison row component
function StatRow({
  label,
  awayValue,
  homeValue,
  highlight = false,
}: {
  label: string;
  awayValue: string | number;
  homeValue: string | number;
  highlight?: boolean;
}) {
  const awayNum = typeof awayValue === 'number' ? awayValue : parseFloat(awayValue);
  const homeNum = typeof homeValue === 'number' ? homeValue : parseFloat(homeValue);
  const awayWins = !isNaN(awayNum) && !isNaN(homeNum) && awayNum > homeNum;
  const homeWins = !isNaN(awayNum) && !isNaN(homeNum) && homeNum > awayNum;

  return (
    <div className={`flex items-center py-2 ${highlight ? 'bg-white/5 -mx-4 px-4' : ''}`}>
      <span
        className={`flex-1 text-sm font-mono ${awayWins ? 'text-burnt-orange font-semibold' : 'text-white/70'}`}
      >
        {awayValue}
      </span>
      <span className="flex-1 text-center text-xs text-white/50">{label}</span>
      <span
        className={`flex-1 text-right text-sm font-mono ${homeWins ? 'text-burnt-orange font-semibold' : 'text-white/70'}`}
      >
        {homeValue}
      </span>
    </div>
  );
}

// Baseball team stats
function BaseballTeamStats({
  away,
  home,
}: {
  away: Record<string, string | number>;
  home: Record<string, string | number>;
}) {
  return (
    <>
      <StatRow
        label="Runs"
        awayValue={away['runs'] ?? '-'}
        homeValue={home['runs'] ?? '-'}
        highlight
      />
      <StatRow label="Hits" awayValue={away['hits'] ?? '-'} homeValue={home['hits'] ?? '-'} />
      <StatRow label="Errors" awayValue={away['errors'] ?? '-'} homeValue={home['errors'] ?? '-'} />
      <StatRow label="LOB" awayValue={away['lob'] ?? '-'} homeValue={home['lob'] ?? '-'} />
      <StatRow
        label="Total Bases"
        awayValue={away['totalBases'] ?? '-'}
        homeValue={home['totalBases'] ?? '-'}
      />
      <StatRow
        label="Doubles"
        awayValue={away['doubles'] ?? '-'}
        homeValue={home['doubles'] ?? '-'}
      />
      <StatRow
        label="Triples"
        awayValue={away['triples'] ?? '-'}
        homeValue={home['triples'] ?? '-'}
      />
      <StatRow
        label="Home Runs"
        awayValue={away['homeRuns'] ?? '-'}
        homeValue={home['homeRuns'] ?? '-'}
        highlight
      />
      <StatRow label="RBI" awayValue={away['rbi'] ?? '-'} homeValue={home['rbi'] ?? '-'} />
      <StatRow label="Walks" awayValue={away['walks'] ?? '-'} homeValue={home['walks'] ?? '-'} />
      <StatRow
        label="Strikeouts"
        awayValue={away['strikeouts'] ?? '-'}
        homeValue={home['strikeouts'] ?? '-'}
      />
      <StatRow
        label="Stolen Bases"
        awayValue={away['stolenBases'] ?? '-'}
        homeValue={home['stolenBases'] ?? '-'}
      />
      <StatRow
        label="Team AVG"
        awayValue={away['teamAvg'] ?? '-'}
        homeValue={home['teamAvg'] ?? '-'}
      />
    </>
  );
}

// Football team stats
function FootballTeamStats({
  away,
  home,
}: {
  away: Record<string, string | number>;
  home: Record<string, string | number>;
}) {
  return (
    <>
      <StatRow
        label="Total Yards"
        awayValue={away['totalYards'] ?? '-'}
        homeValue={home['totalYards'] ?? '-'}
        highlight
      />
      <StatRow
        label="Passing Yards"
        awayValue={away['passingYards'] ?? '-'}
        homeValue={home['passingYards'] ?? '-'}
      />
      <StatRow
        label="Rushing Yards"
        awayValue={away['rushingYards'] ?? '-'}
        homeValue={home['rushingYards'] ?? '-'}
      />
      <StatRow
        label="First Downs"
        awayValue={away['firstDowns'] ?? '-'}
        homeValue={home['firstDowns'] ?? '-'}
        highlight
      />
      <StatRow
        label="3rd Down Conv"
        awayValue={away['thirdDownConv'] ?? '-'}
        homeValue={home['thirdDownConv'] ?? '-'}
      />
      <StatRow
        label="4th Down Conv"
        awayValue={away['fourthDownConv'] ?? '-'}
        homeValue={home['fourthDownConv'] ?? '-'}
      />
      <StatRow
        label="Turnovers"
        awayValue={away['turnovers'] ?? '-'}
        homeValue={home['turnovers'] ?? '-'}
      />
      <StatRow label="Sacks" awayValue={away['sacks'] ?? '-'} homeValue={home['sacks'] ?? '-'} />
      <StatRow
        label="Penalties"
        awayValue={away['penalties'] ?? '-'}
        homeValue={home['penalties'] ?? '-'}
      />
      <StatRow
        label="Penalty Yards"
        awayValue={away['penaltyYards'] ?? '-'}
        homeValue={home['penaltyYards'] ?? '-'}
      />
      <StatRow
        label="Time of Possession"
        awayValue={away['possession'] ?? '-'}
        homeValue={home['possession'] ?? '-'}
      />
      <StatRow
        label="Red Zone Eff"
        awayValue={away['redZoneEff'] ?? '-'}
        homeValue={home['redZoneEff'] ?? '-'}
      />
    </>
  );
}

// Basketball team stats
function BasketballTeamStats({
  away,
  home,
}: {
  away: Record<string, string | number>;
  home: Record<string, string | number>;
}) {
  return (
    <>
      <StatRow
        label="Points"
        awayValue={away['points'] ?? '-'}
        homeValue={home['points'] ?? '-'}
        highlight
      />
      <StatRow
        label="FG Made-Att"
        awayValue={away['fgMade'] ? `${away['fgMade']}-${away['fgAtt']}` : '-'}
        homeValue={home['fgMade'] ? `${home['fgMade']}-${home['fgAtt']}` : '-'}
      />
      <StatRow label="FG %" awayValue={away['fgPct'] ?? '-'} homeValue={home['fgPct'] ?? '-'} />
      <StatRow
        label="3PT Made-Att"
        awayValue={away['threePtMade'] ? `${away['threePtMade']}-${away['threePtAtt']}` : '-'}
        homeValue={home['threePtMade'] ? `${home['threePtMade']}-${home['threePtAtt']}` : '-'}
      />
      <StatRow
        label="3PT %"
        awayValue={away['threePtPct'] ?? '-'}
        homeValue={home['threePtPct'] ?? '-'}
      />
      <StatRow
        label="FT Made-Att"
        awayValue={away['ftMade'] ? `${away['ftMade']}-${away['ftAtt']}` : '-'}
        homeValue={home['ftMade'] ? `${home['ftMade']}-${home['ftAtt']}` : '-'}
      />
      <StatRow label="FT %" awayValue={away['ftPct'] ?? '-'} homeValue={home['ftPct'] ?? '-'} />
      <StatRow
        label="Rebounds"
        awayValue={away['rebounds'] ?? '-'}
        homeValue={home['rebounds'] ?? '-'}
        highlight
      />
      <StatRow
        label="Offensive Reb"
        awayValue={away['offReb'] ?? '-'}
        homeValue={home['offReb'] ?? '-'}
      />
      <StatRow
        label="Defensive Reb"
        awayValue={away['defReb'] ?? '-'}
        homeValue={home['defReb'] ?? '-'}
      />
      <StatRow
        label="Assists"
        awayValue={away['assists'] ?? '-'}
        homeValue={home['assists'] ?? '-'}
      />
      <StatRow label="Steals" awayValue={away['steals'] ?? '-'} homeValue={home['steals'] ?? '-'} />
      <StatRow label="Blocks" awayValue={away['blocks'] ?? '-'} homeValue={home['blocks'] ?? '-'} />
      <StatRow
        label="Turnovers"
        awayValue={away['turnovers'] ?? '-'}
        homeValue={home['turnovers'] ?? '-'}
      />
      <StatRow label="Fouls" awayValue={away['fouls'] ?? '-'} homeValue={home['fouls'] ?? '-'} />
    </>
  );
}
