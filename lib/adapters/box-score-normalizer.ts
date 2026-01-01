/**
 * Box Score Normalizer
 *
 * Transforms raw API responses from ESPN, MLB StatsAPI, and NCAA sources
 * into the unified UnifiedBoxScore format for cross-sport compatibility.
 *
 * Supports: MLB, College Baseball, NFL, College Football, NBA, College Basketball
 */

import type {
  UnifiedBoxScore,
  UnifiedGame,
  UnifiedSportKey,
  TeamBoxStats,
  PlayerBoxStats as _PlayerBoxStats,
  DetailedPlayerBoxStats,
  ScoringSummary,
  GameLeaders,
  LeaderCategory,
  UnifiedTeam,
  UnifiedPlayer,
  BaseballBattingStats,
  BaseballPitchingStats,
  FootballPassingStats,
  FootballRushingStats,
  FootballReceivingStats,
  FootballDefenseStats,
  BasketballPlayerStats,
} from '@/lib/types/adapters';

// ============================================================================
// ESPN BOX SCORE NORMALIZATION
// ============================================================================

/**
 * Raw ESPN boxscore response structure (partial)
 */
interface ESPNBoxScoreResponse {
  teams?: ESPNBoxScoreTeam[];
  players?: ESPNBoxScorePlayers[];
  header?: {
    competitions?: Array<{
      competitors?: ESPNCompetitor[];
      status?: { type?: { name?: string } };
    }>;
  };
}

interface ESPNBoxScoreTeam {
  team: { id: string; displayName: string; abbreviation: string; logo?: string };
  statistics: Array<{
    name: string;
    displayValue: string;
    label?: string;
  }>;
}

interface ESPNBoxScorePlayers {
  team: { id: string };
  statistics: Array<{
    type: string;
    labels: string[];
    athletes: Array<{
      athlete: {
        id: string;
        displayName: string;
        shortName?: string;
        headshot?: { href?: string };
        position?: { abbreviation?: string };
      };
      starter: boolean;
      stats: string[];
    }>;
  }>;
}

interface ESPNCompetitor {
  homeAway: 'home' | 'away';
  team: { id: string; displayName: string; abbreviation: string };
  score: string;
  linescores?: Array<{ value: number }>;
}

/**
 * Normalize ESPN box score response for all sports
 */
export function normalizeESPNBoxScore(
  raw: ESPNBoxScoreResponse,
  game: UnifiedGame
): UnifiedBoxScore {
  const sport = game.sport;

  // Get team data
  const homeTeamRaw = raw.teams?.find(
    (t) => t.team.id === game.homeTeam.id || t.team.abbreviation === game.homeTeam.abbreviation
  );
  const awayTeamRaw = raw.teams?.find(
    (t) => t.team.id === game.awayTeam.id || t.team.abbreviation === game.awayTeam.abbreviation
  );

  // Get player stats
  const homePlayersRaw = raw.players?.find((p) => p.team.id === game.homeTeam.id);
  const awayPlayersRaw = raw.players?.find((p) => p.team.id === game.awayTeam.id);

  // Build scoring summary from linescores
  const scoring = buildScoringFromLinescores(raw, sport);

  // Build team box stats
  const homeStats = buildTeamBoxStats(homeTeamRaw, homePlayersRaw, game.homeTeam, sport);
  const awayStats = buildTeamBoxStats(awayTeamRaw, awayPlayersRaw, game.awayTeam, sport);

  // Extract leaders
  const leaders = extractGameLeaders(homeStats, awayStats, sport);

  return {
    gameId: game.id,
    sport,
    game,
    homeStats,
    awayStats,
    scoring,
    leaders,
  };
}

function buildScoringFromLinescores(
  raw: ESPNBoxScoreResponse,
  sport: UnifiedSportKey
): ScoringSummary[] {
  const competition = raw.header?.competitions?.[0];
  if (!competition?.competitors) return [];

  const home = competition.competitors.find((c) => c.homeAway === 'home');
  const away = competition.competitors.find((c) => c.homeAway === 'away');

  if (!home?.linescores || !away?.linescores) return [];

  return home.linescores.map((ls, idx) => ({
    period: getPeriodLabel(idx + 1, sport),
    home: ls.value,
    away: away.linescores?.[idx]?.value ?? 0,
  }));
}

function getPeriodLabel(period: number, sport: UnifiedSportKey): string {
  if (sport === 'mlb' || sport === 'cbb') {
    return period.toString(); // Inning number
  }
  if (sport === 'nfl' || sport === 'ncaaf') {
    return `Q${period}`;
  }
  if (sport === 'nba' || sport === 'ncaab' || sport === 'wcbb') {
    return `Q${period}`;
  }
  return period.toString();
}

function buildTeamBoxStats(
  teamRaw: ESPNBoxScoreTeam | undefined,
  playersRaw: ESPNBoxScorePlayers | undefined,
  team: UnifiedTeam,
  sport: UnifiedSportKey
): TeamBoxStats {
  // Convert team statistics array to Record
  const statsRecord: Record<string, string | number> = {};
  if (teamRaw?.statistics) {
    for (const stat of teamRaw.statistics) {
      statsRecord[stat.name] = stat.displayValue;
    }
  }

  // Parse player stats based on sport
  const players = parseESPNPlayers(playersRaw, sport);

  return {
    team,
    score: parseInt(statsRecord['totalScore'] as string) || 0,
    stats: statsRecord,
    players,
  };
}

function parseESPNPlayers(
  playersRaw: ESPNBoxScorePlayers | undefined,
  sport: UnifiedSportKey
): DetailedPlayerBoxStats[] {
  if (!playersRaw?.statistics) return [];

  const players: DetailedPlayerBoxStats[] = [];

  for (const statGroup of playersRaw.statistics) {
    const labels = statGroup.labels;
    const type = statGroup.type.toLowerCase();

    for (const athleteData of statGroup.athletes) {
      const player: UnifiedPlayer = {
        id: athleteData.athlete.id,
        firstName: athleteData.athlete.displayName.split(' ')[0] || '',
        lastName: athleteData.athlete.displayName.split(' ').slice(1).join(' ') || '',
        fullName: athleteData.athlete.displayName,
        displayName: athleteData.athlete.shortName || athleteData.athlete.displayName,
        position: athleteData.athlete.position
          ? {
              name: athleteData.athlete.position.abbreviation,
              abbreviation: athleteData.athlete.position.abbreviation,
            }
          : undefined,
        headshot: athleteData.athlete.headshot?.href,
        active: true,
      };

      // Convert stats array to record
      const statsRecord: Record<string, string | number> = {};
      athleteData.stats.forEach((value, idx) => {
        if (labels[idx]) {
          statsRecord[labels[idx]] = value;
        }
      });

      // Build detailed stats based on sport and stat type
      const detailedStats = buildDetailedStats(statsRecord, type, sport);

      players.push({
        player,
        stats: statsRecord,
        starter: athleteData.starter,
        position: athleteData.athlete.position?.abbreviation || '',
        headshotUrl: athleteData.athlete.headshot?.href,
        ...detailedStats,
      });
    }
  }

  return players;
}

function buildDetailedStats(
  stats: Record<string, string | number>,
  statType: string,
  sport: UnifiedSportKey
): Partial<DetailedPlayerBoxStats> {
  if (sport === 'mlb' || sport === 'cbb') {
    if (statType.includes('batting') || statType.includes('hitting')) {
      return { batting: parseBaseballBattingStats(stats) };
    }
    if (statType.includes('pitching')) {
      return { pitching: parseBaseballPitchingStats(stats) };
    }
  }

  if (sport === 'nfl' || sport === 'ncaaf') {
    if (statType.includes('passing')) {
      return { passing: parseFootballPassingStats(stats) };
    }
    if (statType.includes('rushing')) {
      return { rushing: parseFootballRushingStats(stats) };
    }
    if (statType.includes('receiving')) {
      return { receiving: parseFootballReceivingStats(stats) };
    }
    if (statType.includes('defensive') || statType.includes('defense')) {
      return { defense: parseFootballDefenseStats(stats) };
    }
  }

  if (sport === 'nba' || sport === 'ncaab' || sport === 'wcbb' || sport === 'wnba') {
    return { basketball: parseBasketballStats(stats) };
  }

  return {};
}

// ============================================================================
// MLB STATS API NORMALIZATION
// ============================================================================

interface MLBBoxScoreResponse {
  teams: {
    home: MLBTeamBoxScore;
    away: MLBTeamBoxScore;
  };
  officials?: Array<{ official: { fullName: string }; officialType: string }>;
}

interface MLBTeamBoxScore {
  team: {
    id: number;
    name: string;
    abbreviation: string;
  };
  teamStats: {
    batting: Record<string, string | number>;
    pitching: Record<string, string | number>;
    fielding: Record<string, string | number>;
  };
  players: Record<string, MLBPlayerBoxScore>;
  batters: number[];
  pitchers: number[];
  battingOrder: number[];
  info?: Array<{ title: string; fieldList: Array<{ label: string; value: string }> }>;
}

interface MLBPlayerBoxScore {
  person: {
    id: number;
    fullName: string;
    link: string;
  };
  jerseyNumber: string;
  position: { code: string; name: string; abbreviation: string };
  stats: {
    batting?: Record<string, string | number>;
    pitching?: Record<string, string | number>;
    fielding?: Record<string, string | number>;
  };
  gameStatus?: { isCurrentBatter?: boolean; isCurrentPitcher?: boolean };
  battingOrder?: string;
  seasonStats?: {
    batting?: Record<string, string>;
    pitching?: Record<string, string>;
  };
}

/**
 * Normalize MLB StatsAPI box score response
 */
export function normalizeMLBBoxScore(raw: MLBBoxScoreResponse, game: UnifiedGame): UnifiedBoxScore {
  const homeStats = buildMLBTeamBoxStats(raw.teams.home, game.homeTeam, true);
  const awayStats = buildMLBTeamBoxStats(raw.teams.away, game.awayTeam, false);

  // Build scoring from linescore if available in game data
  const scoring = buildMLBScoring(game);

  const leaders = extractGameLeaders(homeStats, awayStats, 'mlb');

  return {
    gameId: game.id,
    sport: 'mlb',
    game,
    homeStats,
    awayStats,
    scoring,
    leaders,
  };
}

function buildMLBTeamBoxStats(
  teamRaw: MLBTeamBoxScore,
  team: UnifiedTeam,
  isHome: boolean
): TeamBoxStats {
  // Combine all team stats
  const stats: Record<string, string | number> = {
    ...teamRaw.teamStats.batting,
    ...teamRaw.teamStats.pitching,
    ...teamRaw.teamStats.fielding,
  };

  // Parse batters and pitchers
  const players: DetailedPlayerBoxStats[] = [];

  // Add batters in batting order
  for (let i = 0; i < teamRaw.battingOrder.length; i++) {
    const playerId = teamRaw.battingOrder[i];
    const playerData = teamRaw.players[`ID${playerId}`];
    if (playerData) {
      players.push(parseMLBPlayer(playerData, i + 1));
    }
  }

  // Add pitchers
  for (const pitcherId of teamRaw.pitchers) {
    const playerData = teamRaw.players[`ID${pitcherId}`];
    if (playerData && !players.some((p) => p.player.id === pitcherId.toString())) {
      players.push(parseMLBPlayer(playerData, undefined));
    }
  }

  return {
    team,
    score: parseInt(stats['runs'] as string) || 0,
    stats,
    players,
  };
}

function parseMLBPlayer(raw: MLBPlayerBoxScore, battingOrder?: number): DetailedPlayerBoxStats {
  const player: UnifiedPlayer = {
    id: raw.person.id.toString(),
    firstName: raw.person.fullName.split(' ')[0] || '',
    lastName: raw.person.fullName.split(' ').slice(1).join(' ') || '',
    fullName: raw.person.fullName,
    displayName: raw.person.fullName,
    jersey: raw.jerseyNumber,
    position: {
      name: raw.position.name,
      abbreviation: raw.position.abbreviation,
    },
    headshot: `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${raw.person.id}/headshot/67/current`,
    active: true,
  };

  const allStats: Record<string, string | number> = {
    ...(raw.stats.batting || {}),
    ...(raw.stats.pitching || {}),
    ...(raw.stats.fielding || {}),
  };

  return {
    player,
    stats: allStats,
    starter: battingOrder !== undefined && battingOrder <= 9,
    position: raw.position.abbreviation,
    headshotUrl: player.headshot,
    battingOrder,
    batting: raw.stats.batting ? parseBaseballBattingStats(raw.stats.batting) : undefined,
    pitching: raw.stats.pitching ? parseBaseballPitchingStats(raw.stats.pitching) : undefined,
  };
}

function buildMLBScoring(game: UnifiedGame): ScoringSummary[] {
  const baseballData = game.sportData as {
    linescore?: Array<{ inning: number; home: number; away: number }>;
  };
  if (!baseballData?.linescore) return [];

  return baseballData.linescore.map((inning) => ({
    period: inning.inning.toString(),
    home: inning.home,
    away: inning.away,
  }));
}

// ============================================================================
// NCAA BASEBALL NORMALIZATION
// ============================================================================

interface NCAABoxScoreResponse {
  homeTeam: NCAATeamStats;
  awayTeam: NCAATeamStats;
  linescore?: Array<{ inning: number; home: number; away: number }>;
}

interface NCAATeamStats {
  team: {
    id: string;
    name: string;
    abbreviation: string;
    logo?: string;
  };
  batting: NCAABattingLine[];
  pitching: NCPitchingLine[];
  totals: {
    r: number;
    h: number;
    e: number;
    lob: number;
  };
}

interface NCAABattingLine {
  player: { id: string; name: string; position: string; number?: string };
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  so: number;
  avg?: string;
  hr?: number;
  sb?: number;
}

interface NCPitchingLine {
  player: { id: string; name: string; position: string; number?: string };
  ip: string;
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
  era?: string;
  pitches?: number;
  decision?: 'W' | 'L' | 'S' | 'H' | 'BS';
}

/**
 * Normalize NCAA Baseball box score response
 */
export function normalizeNCAABaseballBoxScore(
  raw: NCAABoxScoreResponse,
  game: UnifiedGame
): UnifiedBoxScore {
  const homeStats = buildNCAATeamBoxStats(raw.homeTeam, game.homeTeam);
  const awayStats = buildNCAATeamBoxStats(raw.awayTeam, game.awayTeam);

  const scoring: ScoringSummary[] = (raw.linescore || []).map((ls) => ({
    period: ls.inning.toString(),
    home: ls.home,
    away: ls.away,
  }));

  const leaders = extractGameLeaders(homeStats, awayStats, 'cbb');

  return {
    gameId: game.id,
    sport: 'cbb',
    game,
    homeStats,
    awayStats,
    scoring,
    leaders,
  };
}

function buildNCAATeamBoxStats(teamRaw: NCAATeamStats, team: UnifiedTeam): TeamBoxStats {
  const players: DetailedPlayerBoxStats[] = [];

  // Add batters
  teamRaw.batting.forEach((b, idx) => {
    const player: UnifiedPlayer = {
      id: b.player.id,
      firstName: b.player.name.split(' ')[0] || '',
      lastName: b.player.name.split(' ').slice(1).join(' ') || '',
      fullName: b.player.name,
      displayName: b.player.name,
      jersey: b.player.number,
      position: { name: b.player.position, abbreviation: b.player.position },
      active: true,
    };

    players.push({
      player,
      stats: { ab: b.ab, r: b.r, h: b.h, rbi: b.rbi, bb: b.bb, so: b.so },
      starter: idx < 9,
      position: b.player.position,
      battingOrder: idx + 1,
      batting: {
        ab: b.ab,
        r: b.r,
        h: b.h,
        rbi: b.rbi,
        bb: b.bb,
        so: b.so,
        avg: b.avg || '.000',
        hr: b.hr,
        sb: b.sb,
      },
    });
  });

  // Add pitchers
  teamRaw.pitching.forEach((p) => {
    const existingPlayer = players.find((pl) => pl.player.id === p.player.id);
    if (existingPlayer) {
      existingPlayer.pitching = {
        ip: p.ip,
        h: p.h,
        r: p.r,
        er: p.er,
        bb: p.bb,
        so: p.so,
        era: p.era || '0.00',
        pitches: p.pitches,
        decision: p.decision,
      };
    } else {
      const player: UnifiedPlayer = {
        id: p.player.id,
        firstName: p.player.name.split(' ')[0] || '',
        lastName: p.player.name.split(' ').slice(1).join(' ') || '',
        fullName: p.player.name,
        displayName: p.player.name,
        jersey: p.player.number,
        position: { name: 'P', abbreviation: 'P' },
        active: true,
      };

      players.push({
        player,
        stats: { ip: p.ip, h: p.h, r: p.r, er: p.er, bb: p.bb, so: p.so },
        starter: false,
        position: 'P',
        pitching: {
          ip: p.ip,
          h: p.h,
          r: p.r,
          er: p.er,
          bb: p.bb,
          so: p.so,
          era: p.era || '0.00',
          pitches: p.pitches,
          decision: p.decision,
        },
      });
    }
  });

  return {
    team,
    score: teamRaw.totals.r,
    stats: {
      runs: teamRaw.totals.r,
      hits: teamRaw.totals.h,
      errors: teamRaw.totals.e,
      lob: teamRaw.totals.lob,
    },
    players,
  };
}

// ============================================================================
// STAT PARSERS
// ============================================================================

function parseBaseballBattingStats(stats: Record<string, string | number>): BaseballBattingStats {
  return {
    ab: toInt(stats['atBats'] || stats['ab'] || stats['AB']),
    r: toInt(stats['runs'] || stats['r'] || stats['R']),
    h: toInt(stats['hits'] || stats['h'] || stats['H']),
    rbi: toInt(stats['rbi'] || stats['RBI']),
    bb: toInt(stats['baseOnBalls'] || stats['bb'] || stats['BB']),
    so: toInt(stats['strikeOuts'] || stats['so'] || stats['SO'] || stats['K']),
    avg: toString(stats['avg'] || stats['AVG'] || '.000'),
    doubles: toInt(stats['doubles'] || stats['2B']),
    triples: toInt(stats['triples'] || stats['3B']),
    hr: toInt(stats['homeRuns'] || stats['hr'] || stats['HR']),
    sb: toInt(stats['stolenBases'] || stats['sb'] || stats['SB']),
    cs: toInt(stats['caughtStealing'] || stats['cs'] || stats['CS']),
    hbp: toInt(stats['hitByPitch'] || stats['hbp'] || stats['HBP']),
    sac: toInt(stats['sacBunts'] || stats['sacFlies'] || stats['sac']),
    lob: toInt(stats['leftOnBase'] || stats['lob'] || stats['LOB']),
  };
}

function parseBaseballPitchingStats(stats: Record<string, string | number>): BaseballPitchingStats {
  return {
    ip: toString(stats['inningsPitched'] || stats['ip'] || stats['IP'] || '0.0'),
    h: toInt(stats['hits'] || stats['h'] || stats['H']),
    r: toInt(stats['runs'] || stats['r'] || stats['R']),
    er: toInt(stats['earnedRuns'] || stats['er'] || stats['ER']),
    bb: toInt(stats['baseOnBalls'] || stats['bb'] || stats['BB']),
    so: toInt(stats['strikeOuts'] || stats['so'] || stats['SO'] || stats['K']),
    era: toString(stats['era'] || stats['ERA'] || '0.00'),
    pitches: toInt(stats['numberOfPitches'] || stats['pitches'] || stats['NP']),
    strikes: toInt(stats['strikes']),
    hr: toInt(stats['homeRuns'] || stats['hr'] || stats['HR']),
    hbp: toInt(stats['hitByPitch'] || stats['hbp'] || stats['HBP']),
    wp: toInt(stats['wildPitches'] || stats['wp'] || stats['WP']),
    bk: toInt(stats['balks'] || stats['bk'] || stats['BK']),
    decision: stats['note'] as 'W' | 'L' | 'S' | 'H' | 'BS' | undefined,
  };
}

function parseFootballPassingStats(stats: Record<string, string | number>): FootballPassingStats {
  const compAtt = toString(stats['C/ATT'] || stats['completionsAttempts'] || '0/0');
  const [comp, att] = compAtt.split('/').map((n) => parseInt(n) || 0);

  return {
    comp,
    att,
    yds: toInt(stats['YDS'] || stats['passingYards'] || stats['yds']),
    td: toInt(stats['TD'] || stats['passingTouchdowns'] || stats['td']),
    int: toInt(stats['INT'] || stats['interceptions'] || stats['int']),
    qbr: toFloat(stats['QBR'] || stats['qbr']),
    sacks: toInt(stats['SACK'] || stats['sacks']),
    long: toInt(stats['LONG'] || stats['longPassing'] || stats['long']),
  };
}

function parseFootballRushingStats(stats: Record<string, string | number>): FootballRushingStats {
  return {
    car: toInt(stats['CAR'] || stats['rushingAttempts'] || stats['car']),
    yds: toInt(stats['YDS'] || stats['rushingYards'] || stats['yds']),
    avg: toString(stats['AVG'] || stats['yardsPerRushAttempt'] || '0.0'),
    td: toInt(stats['TD'] || stats['rushingTouchdowns'] || stats['td']),
    long: toInt(stats['LONG'] || stats['longRushing'] || stats['long']),
    fumbles: toInt(stats['FUM'] || stats['fumbles']),
  };
}

function parseFootballReceivingStats(
  stats: Record<string, string | number>
): FootballReceivingStats {
  return {
    rec: toInt(stats['REC'] || stats['receptions'] || stats['rec']),
    yds: toInt(stats['YDS'] || stats['receivingYards'] || stats['yds']),
    avg: toString(stats['AVG'] || stats['yardsPerReception'] || '0.0'),
    td: toInt(stats['TD'] || stats['receivingTouchdowns'] || stats['td']),
    long: toInt(stats['LONG'] || stats['longReception'] || stats['long']),
    targets: toInt(stats['TGTS'] || stats['targets']),
  };
}

function parseFootballDefenseStats(stats: Record<string, string | number>): FootballDefenseStats {
  return {
    tackles: toInt(stats['TOT'] || stats['totalTackles'] || stats['tackles']),
    soloTackles: toInt(stats['SOLO'] || stats['soloTackles']),
    sacks: toFloat(stats['SACKS'] || stats['sacks']),
    tacklesForLoss: toFloat(stats['TFL'] || stats['tacklesForLoss']),
    int: toInt(stats['INT'] || stats['interceptions'] || stats['int']),
    passDefended: toInt(stats['PD'] || stats['passDefended']),
    ff: toInt(stats['FF'] || stats['forcedFumbles'] || stats['ff']),
    fr: toInt(stats['FR'] || stats['fumbleRecoveries'] || stats['fr']),
    qbHits: toInt(stats['QBH'] || stats['qbHits']),
  };
}

function parseBasketballStats(stats: Record<string, string | number>): BasketballPlayerStats {
  return {
    minutes: toString(stats['MIN'] || stats['minutes'] || '0'),
    pts: toInt(stats['PTS'] || stats['points'] || stats['pts']),
    reb: toInt(stats['REB'] || stats['rebounds'] || stats['reb']),
    oreb: toInt(stats['OREB'] || stats['offensiveRebounds']),
    dreb: toInt(stats['DREB'] || stats['defensiveRebounds']),
    ast: toInt(stats['AST'] || stats['assists'] || stats['ast']),
    stl: toInt(stats['STL'] || stats['steals'] || stats['stl']),
    blk: toInt(stats['BLK'] || stats['blocks'] || stats['blk']),
    to: toInt(stats['TO'] || stats['turnovers']),
    fg: toString(stats['FG'] || stats['fieldGoalsMadeAttempted'] || '0-0'),
    fgPct: toString(stats['FG%'] || stats['fieldGoalPct']),
    threeP: toString(stats['3PT'] || stats['threePointFieldGoalsMadeAttempted'] || '0-0'),
    threePct: toString(stats['3P%'] || stats['threePointFieldGoalPct']),
    ft: toString(stats['FT'] || stats['freeThrowsMadeAttempted'] || '0-0'),
    ftPct: toString(stats['FT%'] || stats['freeThrowPct']),
    plusMinus: toInt(stats['+/-'] || stats['plusMinus']),
    fouls: toInt(stats['PF'] || stats['fouls'] || stats['personalFouls']),
  };
}

// ============================================================================
// LEADERS EXTRACTION
// ============================================================================

function extractGameLeaders(
  homeStats: TeamBoxStats,
  awayStats: TeamBoxStats,
  sport: UnifiedSportKey
): GameLeaders {
  const homeLeaders = extractTeamLeaders(homeStats, sport);
  const awayLeaders = extractTeamLeaders(awayStats, sport);

  return { home: homeLeaders, away: awayLeaders };
}

function extractTeamLeaders(teamStats: TeamBoxStats, sport: UnifiedSportKey): LeaderCategory[] {
  const leaders: LeaderCategory[] = [];
  const detailedPlayers = teamStats.players as DetailedPlayerBoxStats[];

  if (sport === 'mlb' || sport === 'cbb') {
    // Batting leaders - Hits
    const batters = detailedPlayers.filter((p) => p.batting && p.batting.ab > 0);
    const hitLeaders = [...batters]
      .sort((a, b) => (b.batting?.h || 0) - (a.batting?.h || 0))
      .slice(0, 2);
    if (hitLeaders.length > 0) {
      leaders.push({
        category: 'Hitting',
        leaders: hitLeaders.map((p) => ({
          player: p.player.displayName,
          value: `${p.batting?.h}-${p.batting?.ab}, ${p.batting?.rbi} RBI`,
          position: p.position,
        })),
      });
    }

    // Pitching leaders
    const pitchers = detailedPlayers.filter((p) => p.pitching && parseFloat(p.pitching.ip) > 0);
    const pitchLeaders = [...pitchers]
      .sort((a, b) => parseFloat(b.pitching?.ip || '0') - parseFloat(a.pitching?.ip || '0'))
      .slice(0, 2);
    if (pitchLeaders.length > 0) {
      leaders.push({
        category: 'Pitching',
        leaders: pitchLeaders.map((p) => ({
          player: p.player.displayName,
          value: `${p.pitching?.ip} IP, ${p.pitching?.so} K, ${p.pitching?.er} ER`,
          position: 'P',
        })),
      });
    }
  }

  if (sport === 'nfl' || sport === 'ncaaf') {
    // Passing leaders
    const passers = detailedPlayers.filter((p) => p.passing && p.passing.att > 0);
    if (passers.length > 0) {
      const topPasser = passers.sort((a, b) => (b.passing?.yds || 0) - (a.passing?.yds || 0))[0];
      leaders.push({
        category: 'Passing',
        leaders: [
          {
            player: topPasser.player.displayName,
            value: `${topPasser.passing?.comp}/${topPasser.passing?.att}, ${topPasser.passing?.yds} YDS, ${topPasser.passing?.td} TD`,
            position: topPasser.position,
          },
        ],
      });
    }

    // Rushing leaders
    const rushers = detailedPlayers.filter((p) => p.rushing && p.rushing.car > 0);
    if (rushers.length > 0) {
      const topRusher = rushers.sort((a, b) => (b.rushing?.yds || 0) - (a.rushing?.yds || 0))[0];
      leaders.push({
        category: 'Rushing',
        leaders: [
          {
            player: topRusher.player.displayName,
            value: `${topRusher.rushing?.car} CAR, ${topRusher.rushing?.yds} YDS, ${topRusher.rushing?.td} TD`,
            position: topRusher.position,
          },
        ],
      });
    }

    // Receiving leaders
    const receivers = detailedPlayers.filter((p) => p.receiving && p.receiving.rec > 0);
    if (receivers.length > 0) {
      const topReceiver = receivers.sort(
        (a, b) => (b.receiving?.yds || 0) - (a.receiving?.yds || 0)
      )[0];
      leaders.push({
        category: 'Receiving',
        leaders: [
          {
            player: topReceiver.player.displayName,
            value: `${topReceiver.receiving?.rec} REC, ${topReceiver.receiving?.yds} YDS, ${topReceiver.receiving?.td} TD`,
            position: topReceiver.position,
          },
        ],
      });
    }
  }

  if (sport === 'nba' || sport === 'ncaab' || sport === 'wcbb' || sport === 'wnba') {
    const bbPlayers = detailedPlayers.filter(
      (p) => p.basketball && parseInt(p.basketball.minutes) > 0
    );

    // Points leader
    const pointsLeader = [...bbPlayers].sort(
      (a, b) => (b.basketball?.pts || 0) - (a.basketball?.pts || 0)
    )[0];
    if (pointsLeader) {
      leaders.push({
        category: 'Points',
        leaders: [
          {
            player: pointsLeader.player.displayName,
            value: `${pointsLeader.basketball?.pts} PTS`,
            position: pointsLeader.position,
          },
        ],
      });
    }

    // Rebounds leader
    const reboundsLeader = [...bbPlayers].sort(
      (a, b) => (b.basketball?.reb || 0) - (a.basketball?.reb || 0)
    )[0];
    if (reboundsLeader) {
      leaders.push({
        category: 'Rebounds',
        leaders: [
          {
            player: reboundsLeader.player.displayName,
            value: `${reboundsLeader.basketball?.reb} REB`,
            position: reboundsLeader.position,
          },
        ],
      });
    }

    // Assists leader
    const assistsLeader = [...bbPlayers].sort(
      (a, b) => (b.basketball?.ast || 0) - (a.basketball?.ast || 0)
    )[0];
    if (assistsLeader) {
      leaders.push({
        category: 'Assists',
        leaders: [
          {
            player: assistsLeader.player.displayName,
            value: `${assistsLeader.basketball?.ast} AST`,
            position: assistsLeader.position,
          },
        ],
      });
    }
  }

  return leaders;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function toInt(value: string | number | undefined): number {
  if (value === undefined || value === null || value === '' || value === '-') return 0;
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? 0 : parsed;
}

function toFloat(value: string | number | undefined): number {
  if (value === undefined || value === null || value === '' || value === '-') return 0;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
}

function toString(value: string | number | undefined): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

// ============================================================================
// SPORT-SPECIFIC NORMALIZER EXPORTS
// ============================================================================

export const BoxScoreNormalizer = {
  espn: normalizeESPNBoxScore,
  mlb: normalizeMLBBoxScore,
  ncaaBaseball: normalizeNCAABaseballBoxScore,
};

export default BoxScoreNormalizer;
