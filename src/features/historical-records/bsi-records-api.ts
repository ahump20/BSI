/**
 * BSI Historical Records API Worker
 * Serves franchise records, season records, postseason history, key eras, and all-time players
 * 
 * Deployed to: bsi-records-api.{account}.workers.dev
 * Bindings: D1 (bsi-historical-db)
 */

interface Env {
  DB: D1Database;
}

interface RecordBookResponse {
  teamId: string;
  teamName: string;
  league: string;
  franchiseRecords: FranchiseRecord[];
  seasonRecords: SeasonRecord[];
  postseasonHistory: PostseasonEntry[];
  keyEras: KeyEra[];
  allTimePlayers: AllTimePlayer[];
  lastUpdated: string;
}

interface FranchiseRecord {
  id: number;
  category: string;
  recordType: string;
  statName: string;
  statValue: number | string;
  holderName: string;
  holderYears: string;
  achievedDate?: string;
  notes?: string;
  sourceUrl: string;
  sourceName: string;
}

interface SeasonRecord {
  id: number;
  category: string;
  statName: string;
  statValue: number | string;
  playerName: string;
  seasonYear: number;
  rank: number;
  sourceUrl: string;
  sourceName: string;
}

interface PostseasonEntry {
  id: number;
  seasonYear: number;
  achievementType: string;
  achievementName?: string;
  result: string;
  opponent?: string;
  finalScore?: string;
  mvpName?: string;
  notableMoments?: string;
  sourceUrl: string;
  sourceName: string;
}

interface KeyEra {
  id: number;
  eraName: string;
  startYear: number;
  endYear?: number;
  headCoach?: string;
  overallRecord?: string;
  championships: number;
  notablePlayers?: string[];
  summary: string;
  significance?: string;
  sourceUrl: string;
  sourceName: string;
}

interface AllTimePlayer {
  id: number;
  playerName: string;
  position: string;
  yearsWithTeam: string;
  jerseyNumber?: number;
  careerStats?: Record<string, unknown>;
  hallOfFame: boolean;
  hofYear?: number;
  retiredNumber: boolean;
  allStarSelections: number;
  mvpAwards: number;
  franchiseRank: number;
  rankCategory: string;
  legacySummary?: string;
  sourceUrl: string;
  sourceName: string;
  imageUrl?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // GET /api/records/:league/:teamId
      if (path.match(/^\/api\/records\/[A-Z_]+\/[a-zA-Z0-9_-]+$/)) {
        const parts = path.split('/');
        const league = parts[3];
        const teamId = parts[4];
        return await getTeamRecordBook(env.DB, league, teamId);
      }

      // GET /api/records/:league
      if (path.match(/^\/api\/records\/[A-Z_]+$/)) {
        const league = path.split('/')[3];
        return await getLeagueTeams(env.DB, league);
      }

      // GET /api/health
      if (path === '/api/health') {
        return jsonResponse({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          timezone: 'America/Chicago',
          endpoints: [
            'GET /api/records/:league - List teams in league',
            'GET /api/records/:league/:teamId - Get team record book',
          ],
        });
      }

      return jsonResponse({ error: 'Endpoint not found' }, 404);
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        500
      );
    }
  },
};

async function getTeamRecordBook(
  db: D1Database,
  league: string,
  teamId: string
): Promise<Response> {
  // Validate league
  const validLeagues = ['MLB', 'NFL', 'NBA', 'NCAA_FB', 'NCAA_BB'];
  if (!validLeagues.includes(league)) {
    return jsonResponse({ error: 'Invalid league' }, 400);
  }

  // Get team info
  const team = await db
    .prepare('SELECT * FROM teams WHERE id = ? AND league = ?')
    .bind(teamId, league)
    .first<{ id: string; name: string; league: string }>();

  if (!team) {
    return jsonResponse({ error: 'Team not found' }, 404);
  }

  // Fetch all record data in parallel
  const [franchiseRecords, seasonRecords, postseasonHistory, keyEras, allTimePlayers] =
    await Promise.all([
      getFranchiseRecords(db, teamId),
      getSeasonRecords(db, teamId),
      getPostseasonHistory(db, teamId),
      getKeyEras(db, teamId),
      getAllTimePlayers(db, teamId),
    ]);

  const response: RecordBookResponse = {
    teamId: team.id,
    teamName: team.name,
    league: team.league,
    franchiseRecords,
    seasonRecords,
    postseasonHistory,
    keyEras,
    allTimePlayers,
    lastUpdated: new Date().toISOString(),
  };

  return jsonResponse(response);
}

async function getFranchiseRecords(db: D1Database, teamId: string): Promise<FranchiseRecord[]> {
  const results = await db
    .prepare(
      `SELECT id, category, record_type, stat_name, stat_value, holder_name, 
              holder_years, achieved_date, notes, source_url, source_name
       FROM franchise_records 
       WHERE team_id = ? 
       ORDER BY category, stat_name`
    )
    .bind(teamId)
    .all();

  return (results.results || []).map((row: Record<string, unknown>) => ({
    id: row.id as number,
    category: row.category as string,
    recordType: row.record_type as string,
    statName: row.stat_name as string,
    statValue: row.stat_value as number | string,
    holderName: row.holder_name as string,
    holderYears: row.holder_years as string,
    achievedDate: row.achieved_date as string | undefined,
    notes: row.notes as string | undefined,
    sourceUrl: row.source_url as string,
    sourceName: row.source_name as string,
  }));
}

async function getSeasonRecords(db: D1Database, teamId: string): Promise<SeasonRecord[]> {
  const results = await db
    .prepare(
      `SELECT id, category, stat_name, stat_value, player_name, season_year,
              rank_in_category, source_url, source_name
       FROM season_records 
       WHERE team_id = ? 
       ORDER BY category, rank_in_category`
    )
    .bind(teamId)
    .all();

  return (results.results || []).map((row: Record<string, unknown>) => ({
    id: row.id as number,
    category: row.category as string,
    statName: row.stat_name as string,
    statValue: row.stat_value as number | string,
    playerName: row.player_name as string,
    seasonYear: row.season_year as number,
    rank: row.rank_in_category as number,
    sourceUrl: row.source_url as string,
    sourceName: row.source_name as string,
  }));
}

async function getPostseasonHistory(db: D1Database, teamId: string): Promise<PostseasonEntry[]> {
  const results = await db
    .prepare(
      `SELECT id, season_year, achievement_type, achievement_name, result,
              opponent, final_score, mvp_name, notable_moments, source_url, source_name
       FROM postseason_history 
       WHERE team_id = ? 
       ORDER BY season_year DESC`
    )
    .bind(teamId)
    .all();

  return (results.results || []).map((row: Record<string, unknown>) => ({
    id: row.id as number,
    seasonYear: row.season_year as number,
    achievementType: row.achievement_type as string,
    achievementName: row.achievement_name as string | undefined,
    result: row.result as string,
    opponent: row.opponent as string | undefined,
    finalScore: row.final_score as string | undefined,
    mvpName: row.mvp_name as string | undefined,
    notableMoments: row.notable_moments as string | undefined,
    sourceUrl: row.source_url as string,
    sourceName: row.source_name as string,
  }));
}

async function getKeyEras(db: D1Database, teamId: string): Promise<KeyEra[]> {
  const results = await db
    .prepare(
      `SELECT id, era_name, start_year, end_year, head_coach, overall_record,
              championships, notable_players, summary, significance, source_url, source_name
       FROM key_eras 
       WHERE team_id = ? 
       ORDER BY start_year DESC`
    )
    .bind(teamId)
    .all();

  return (results.results || []).map((row: Record<string, unknown>) => ({
    id: row.id as number,
    eraName: row.era_name as string,
    startYear: row.start_year as number,
    endYear: row.end_year as number | undefined,
    headCoach: row.head_coach as string | undefined,
    overallRecord: row.overall_record as string | undefined,
    championships: row.championships as number,
    notablePlayers: row.notable_players
      ? JSON.parse(row.notable_players as string)
      : undefined,
    summary: row.summary as string,
    significance: row.significance as string | undefined,
    sourceUrl: row.source_url as string,
    sourceName: row.source_name as string,
  }));
}

async function getAllTimePlayers(db: D1Database, teamId: string): Promise<AllTimePlayer[]> {
  const results = await db
    .prepare(
      `SELECT id, player_name, position, years_with_team, jersey_number, career_stats,
              hall_of_fame, hof_year, retired_number, all_star_selections, mvp_awards,
              franchise_rank, rank_category, legacy_summary, source_url, source_name, image_url
       FROM all_time_players 
       WHERE team_id = ? 
       ORDER BY franchise_rank ASC`
    )
    .bind(teamId)
    .all();

  return (results.results || []).map((row: Record<string, unknown>) => ({
    id: row.id as number,
    playerName: row.player_name as string,
    position: row.position as string,
    yearsWithTeam: row.years_with_team as string,
    jerseyNumber: row.jersey_number as number | undefined,
    careerStats: row.career_stats ? JSON.parse(row.career_stats as string) : undefined,
    hallOfFame: Boolean(row.hall_of_fame),
    hofYear: row.hof_year as number | undefined,
    retiredNumber: Boolean(row.retired_number),
    allStarSelections: row.all_star_selections as number,
    mvpAwards: row.mvp_awards as number,
    franchiseRank: row.franchise_rank as number,
    rankCategory: row.rank_category as string,
    legacySummary: row.legacy_summary as string | undefined,
    sourceUrl: row.source_url as string,
    sourceName: row.source_name as string,
    imageUrl: row.image_url as string | undefined,
  }));
}

async function getLeagueTeams(db: D1Database, league: string): Promise<Response> {
  const validLeagues = ['MLB', 'NFL', 'NBA', 'NCAA_FB', 'NCAA_BB'];
  if (!validLeagues.includes(league)) {
    return jsonResponse({ error: 'Invalid league' }, 400);
  }

  const results = await db
    .prepare(
      `SELECT id, name, abbreviation, location, conference, division, venue
       FROM teams 
       WHERE league = ? 
       ORDER BY name`
    )
    .bind(league)
    .all();

  return jsonResponse({
    league,
    teams: results.results || [],
    count: results.results?.length || 0,
  });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}
