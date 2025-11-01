import type { D1Database } from '@cloudflare/workers-types';

export type DivisionCode = 'D1' | 'D2' | 'D3';

export interface GamesByDateParams {
  date: string; // YYYY-MM-DD in America/Chicago
  division: string;
  conference?: string;
  status?: string;
}

export interface StandingsParams {
  division: string;
  conference?: string;
}

export interface ScheduleParams {
  teamId: number;
  season?: number;
}

export interface GameTeamSummary {
  id: number;
  name: string;
  nickname: string | null;
  abbr: string | null;
  score: number | null;
}

export interface GameSummary {
  id: number;
  season: number;
  date: string;
  status: 'scheduled' | 'live' | 'final' | 'postponed' | 'canceled';
  start_time_local: string | null;
  inning: number | null;
  inning_half: 'Top' | 'Bottom' | null;
  home: GameTeamSummary;
  away: GameTeamSummary;
  source: string;
  fetched_at: string;
}

export interface BattingLine {
  teamId: number;
  team: string;
  playerId: number | null;
  player: string;
  lineupSlot: number | null;
  ab: number | null;
  r: number | null;
  h: number | null;
  rbi: number | null;
  bb: number | null;
  k: number | null;
  hr: number | null;
  sb: number | null;
  cs: number | null;
  doubles: number | null;
  triples: number | null;
  hbp: number | null;
  sf: number | null;
  sh: number | null;
  notes: string | null;
}

export interface PitchingLine {
  teamId: number;
  team: string;
  playerId: number | null;
  player: string;
  ipOuts: number | null;
  h: number | null;
  r: number | null;
  er: number | null;
  bb: number | null;
  k: number | null;
  hr: number | null;
  bf: number | null;
  pit: number | null;
  strikes: number | null;
  notes: string | null;
}

export interface GameDetail extends GameSummary {
  venue: string | null;
  attendance: number | null;
  last_updated: string;
  box: {
    batting: BattingLine[];
    pitching: PitchingLine[];
  };
}

export interface StandingRow {
  season: number;
  division: string;
  conference: string;
  team: {
    id: number;
    name: string;
    nickname: string | null;
    abbr: string | null;
  };
  record: {
    overall: { w: number; l: number; pct: number | null };
    conference: { w: number; l: number; pct: number | null };
  };
  run_diff: {
    rf: number | null;
    ra: number | null;
  };
  streak: string | null;
  source: string;
  fetched_at: string;
}

export interface ScheduleGame {
  id: number;
  date: string;
  status: 'scheduled' | 'live' | 'final' | 'postponed' | 'canceled';
  start_time_local: string | null;
  venue: string | null;
  opponent: GameTeamSummary;
  is_home: boolean;
  conference: string | null;
  home_score: number | null;
  away_score: number | null;
  source: string;
  fetched_at: string;
}

export class RepoError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
    this.name = 'RepoError';
  }
}

const STATUS_TO_DB: Record<string, string> = {
  scheduled: 'scheduled',
  live: 'in_progress',
  final: 'final',
  postponed: 'postponed',
  canceled: 'canceled',
};

const DB_TO_STATUS: Record<string, GameSummary['status']> = {
  scheduled: 'scheduled',
  in_progress: 'live',
  final: 'final',
  postponed: 'postponed',
  canceled: 'canceled',
};

export async function getGamesByDate(db: D1Database, params: GamesByDateParams): Promise<GameSummary[]> {
  const divisionId = await resolveDivisionId(db, params.division);
  const conferenceId = params.conference ? await resolveConferenceId(db, divisionId, params.conference) : null;
  const statusFilter = params.status ? STATUS_TO_DB[params.status.toLowerCase()] : undefined;

  if (params.status && !statusFilter) {
    throw new RepoError('invalid status', 400);
  }

  let sql = `
    SELECT g.id, g.season, g.date, g.status, g.start_time_local, g.inning, g.inning_half,
           g.home_team_id, g.away_team_id, g.home_score, g.away_score, g.updated_at,
           h.name AS home_name, h.nickname AS home_nickname, h.abbr AS home_abbr,
           a.name AS away_name, a.nickname AS away_nickname, a.abbr AS away_abbr
      FROM games g
      JOIN teams h ON h.id = g.home_team_id
      JOIN teams a ON a.id = g.away_team_id
     WHERE g.date = ?
       AND g.division_id = ?
  `;

  const binds: Array<string | number> = [params.date, divisionId];

  if (conferenceId) {
    sql += ' AND (h.conference_id = ? OR a.conference_id = ?)';
    binds.push(conferenceId, conferenceId);
  }

  if (statusFilter) {
    sql += ' AND g.status = ?';
    binds.push(statusFilter);
  }

  sql += `
     ORDER BY
       CASE WHEN g.start_time_local IS NULL THEN 1 ELSE 0 END,
       g.start_time_local,
       g.id
  `;

  const statement = db.prepare(sql).bind(...binds);
  const query = await statement.all<GameRow>();
  const rows: GameRow[] = query.results ?? [];

  const now = new Date().toISOString();
  return rows.map((row) => ({
    id: row.id,
    season: row.season,
    date: row.date,
    status: DB_TO_STATUS[row.status] ?? 'scheduled',
    start_time_local: row.start_time_local ?? null,
    inning: row.inning ?? null,
    inning_half: (row.inning_half as GameSummary['inning_half']) ?? null,
    home: {
      id: row.home_team_id,
      name: row.home_name,
      nickname: row.home_nickname,
      abbr: row.home_abbr,
      score: row.home_score ?? null,
    },
    away: {
      id: row.away_team_id,
      name: row.away_name,
      nickname: row.away_nickname,
      abbr: row.away_abbr,
      score: row.away_score ?? null,
    },
    source: 'ncaa',
    fetched_at: row.updated_at ?? now,
  }));
}

export async function getGame(db: D1Database, id: number): Promise<GameDetail> {
  const row = await db
    .prepare(
      `
      SELECT g.*, h.name AS home_name, h.nickname AS home_nickname, h.abbr AS home_abbr,
             a.name AS away_name, a.nickname AS away_nickname, a.abbr AS away_abbr
        FROM games g
        JOIN teams h ON h.id = g.home_team_id
        JOIN teams a ON a.id = g.away_team_id
       WHERE g.id = ?
    `
    )
    .bind(id)
    .first<GameRow & { venue: string | null; attendance: number | null }>();

  if (!row) {
    throw new RepoError('game not found', 404);
  }

  const battingQuery = await db
    .prepare(
      `
      SELECT b.game_id, b.team_id, b.player_id, b.lineup_slot, b.ab, b.r, b.h, b.rbi, b.bb, b.k,
             b.hr, b.sb, b.cs, b.doubles, b.triples, b.hbp, b.sf, b.sh, b.notes,
             t.name AS team_name,
             p.full_name AS player_name
        FROM box_batting b
        JOIN teams t ON t.id = b.team_id
        LEFT JOIN players p ON p.id = b.player_id
       WHERE b.game_id = ?
       ORDER BY b.team_id, b.lineup_slot
    `
    )
    .bind(id)
    .all<BattingRow>();

  const pitchingQuery = await db
    .prepare(
      `
      SELECT pch.game_id, pch.team_id, pch.player_id, pch.ip_outs, pch.h, pch.r, pch.er,
             pch.bb, pch.k, pch.hr, pch.bf, pch.pit, pch.strikes, pch.notes,
             t.name AS team_name,
             pl.full_name AS player_name
        FROM box_pitching pch
        JOIN teams t ON t.id = pch.team_id
        LEFT JOIN players pl ON pl.id = pch.player_id
       WHERE pch.game_id = ?
       ORDER BY pch.team_id, pch.ip_outs DESC, pch.player_id
    `
    )
    .bind(id)
    .all<PitchingRow>();

  const battingRows: BattingRow[] = battingQuery.results ?? [];
  const pitchingRows: PitchingRow[] = pitchingQuery.results ?? [];

  const now = new Date().toISOString();

  return {
    id: row.id,
    season: row.season,
    date: row.date,
    status: DB_TO_STATUS[row.status] ?? 'scheduled',
    start_time_local: row.start_time_local ?? null,
    inning: row.inning ?? null,
    inning_half: (row.inning_half as GameSummary['inning_half']) ?? null,
    home: {
      id: row.home_team_id,
      name: row.home_name,
      nickname: row.home_nickname,
      abbr: row.home_abbr,
      score: row.home_score ?? null,
    },
    away: {
      id: row.away_team_id,
      name: row.away_name,
      nickname: row.away_nickname,
      abbr: row.away_abbr,
      score: row.away_score ?? null,
    },
    venue: row.venue ?? null,
    attendance: row.attendance ?? null,
    last_updated: row.updated_at ?? now,
    source: 'ncaa',
    fetched_at: now,
    box: {
      batting: battingRows.map((line) => ({
        teamId: line.team_id,
        team: line.team_name,
        playerId: line.player_id ?? null,
        player: line.player_name ?? 'Unknown',
        lineupSlot: line.lineup_slot ?? null,
        ab: line.ab ?? null,
        r: line.r ?? null,
        h: line.h ?? null,
        rbi: line.rbi ?? null,
        bb: line.bb ?? null,
        k: line.k ?? null,
        hr: line.hr ?? null,
        sb: line.sb ?? null,
        cs: line.cs ?? null,
        doubles: line.doubles ?? null,
        triples: line.triples ?? null,
        hbp: line.hbp ?? null,
        sf: line.sf ?? null,
        sh: line.sh ?? null,
        notes: line.notes ?? null,
      })),
      pitching: pitchingRows.map((line) => ({
        teamId: line.team_id,
        team: line.team_name,
        playerId: line.player_id ?? null,
        player: line.player_name ?? 'Unknown',
        ipOuts: line.ip_outs ?? null,
        h: line.h ?? null,
        r: line.r ?? null,
        er: line.er ?? null,
        bb: line.bb ?? null,
        k: line.k ?? null,
        hr: line.hr ?? null,
        bf: line.bf ?? null,
        pit: line.pit ?? null,
        strikes: line.strikes ?? null,
        notes: line.notes ?? null,
      })),
    },
  };
}

export async function getStandings(db: D1Database, params: StandingsParams): Promise<StandingRow[]> {
  const divisionId = await resolveDivisionId(db, params.division);
  const conferenceId = params.conference ? await resolveConferenceId(db, divisionId, params.conference) : null;

  let sql = `
    SELECT s.*, c.name AS conference_name, c.short_name AS conference_short,
           t.name AS team_name, t.nickname AS team_nickname, t.abbr AS team_abbr
      FROM standings s
      JOIN teams t ON t.id = s.team_id
      JOIN conferences c ON c.id = s.conference_id
     WHERE s.division_id = ?
  `;

  const binds: Array<string | number> = [divisionId];

  if (conferenceId) {
    sql += ' AND s.conference_id = ?';
    binds.push(conferenceId);
  }

  sql += ' ORDER BY s.pct DESC NULLS LAST, s.w DESC, t.name ASC';

  const standingsQuery = await db.prepare(sql).bind(...binds).all<StandingRowRaw>();
  const rows: StandingRowRaw[] = standingsQuery.results ?? [];
  const now = new Date().toISOString();
  return rows.map((row) => ({
    season: row.season,
    division: params.division.toUpperCase(),
    conference: row.conference_short ?? row.conference_name,
    team: {
      id: row.team_id,
      name: row.team_name,
      nickname: row.team_nickname,
      abbr: row.team_abbr,
    },
    record: {
      overall: { w: row.w ?? 0, l: row.l ?? 0, pct: row.pct ?? null },
      conference: { w: row.conf_w ?? 0, l: row.conf_l ?? 0, pct: computePct(row.conf_w, row.conf_l) },
    },
    run_diff: {
      rf: row.rf ?? null,
      ra: row.ra ?? null,
    },
    streak: row.streak ?? null,
    source: 'ncaa',
    fetched_at: now,
  }));
}

export async function getSchedule(db: D1Database, params: ScheduleParams): Promise<ScheduleGame[]> {
  const { teamId } = params;
  const season = params.season ?? (await resolveLatestSeason(db));
  if (!season) {
    throw new RepoError('season not found', 404);
  }

  const scheduleQuery = await db
    .prepare(
      `
      SELECT g.id, g.date, g.status, g.start_time_local, g.venue, g.home_team_id, g.away_team_id,
             g.home_score, g.away_score,
             CASE WHEN g.home_team_id = ? THEN 'home' ELSE 'away' END AS is_home,
             opp.id AS opponent_id, opp.name AS opponent_name, opp.nickname AS opponent_nickname, opp.abbr AS opponent_abbr,
             c.short_name AS conference_short
        FROM games g
        JOIN teams opp ON opp.id = CASE WHEN g.home_team_id = ? THEN g.away_team_id ELSE g.home_team_id END
        LEFT JOIN conferences c ON c.id = opp.conference_id
       WHERE (g.home_team_id = ? OR g.away_team_id = ?)
         AND g.season = ?
       ORDER BY g.date ASC, g.start_time_local ASC
    `
    )
    .bind(teamId, teamId, teamId, teamId, season)
    .all<ScheduleRow>();

  const rows: ScheduleRow[] = scheduleQuery.results ?? [];
  const now = new Date().toISOString();
  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    status: DB_TO_STATUS[row.status] ?? 'scheduled',
    start_time_local: row.start_time_local ?? null,
    venue: row.venue ?? null,
    opponent: {
      id: row.opponent_id,
      name: row.opponent_name,
      nickname: row.opponent_nickname,
      abbr: row.opponent_abbr,
      score: row.is_home === 'home' ? row.away_score ?? null : row.home_score ?? null,
    },
    is_home: row.is_home === 'home',
    conference: row.conference_short ?? null,
    home_score: row.home_score ?? null,
    away_score: row.away_score ?? null,
    source: 'ncaa',
    fetched_at: now,
  }));
}

async function resolveDivisionId(db: D1Database, division: string): Promise<number> {
  const code = division.toUpperCase();
  const row = await db
    .prepare('SELECT id FROM divisions WHERE code = ?')
    .bind(code)
    .first<{ id: number }>();

  if (!row) {
    throw new RepoError('division not found', 404);
  }

  return row.id;
}

async function resolveConferenceId(db: D1Database, divisionId: number, conference: string): Promise<number> {
  const code = conference.toUpperCase();
  const row = await db
    .prepare('SELECT id FROM conferences WHERE division_id = ? AND (UPPER(short_name) = ? OR UPPER(name) = ?)')
    .bind(divisionId, code, code)
    .first<{ id: number }>();

  if (!row) {
    throw new RepoError('conference not found', 404);
  }

  return row.id;
}

async function resolveLatestSeason(db: D1Database): Promise<number | null> {
  const row = await db
    .prepare('SELECT MAX(season) AS season FROM games')
    .first<{ season: number | null }>();
  return row?.season ?? null;
}

function computePct(wins?: number | null, losses?: number | null): number | null {
  if (wins == null || losses == null) {
    return null;
  }

  const total = wins + losses;
  if (total === 0) {
    return null;
  }

  return Number((wins / total).toFixed(3));
}

interface GameRow {
  id: number;
  season: number;
  date: string;
  status: string;
  start_time_local: string | null;
  inning: number | null;
  inning_half: string | null;
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
  updated_at: string | null;
  venue?: string | null;
  attendance?: number | null;
  home_name: string;
  home_nickname: string | null;
  home_abbr: string | null;
  away_name: string;
  away_nickname: string | null;
  away_abbr: string | null;
}

interface BattingRow {
  team_id: number;
  player_id: number | null;
  lineup_slot: number | null;
  ab: number | null;
  r: number | null;
  h: number | null;
  rbi: number | null;
  bb: number | null;
  k: number | null;
  hr: number | null;
  sb: number | null;
  cs: number | null;
  doubles: number | null;
  triples: number | null;
  hbp: number | null;
  sf: number | null;
  sh: number | null;
  notes: string | null;
  team_name: string;
  player_name: string | null;
}

interface PitchingRow {
  team_id: number;
  player_id: number | null;
  ip_outs: number | null;
  h: number | null;
  r: number | null;
  er: number | null;
  bb: number | null;
  k: number | null;
  hr: number | null;
  bf: number | null;
  pit: number | null;
  strikes: number | null;
  notes: string | null;
  team_name: string;
  player_name: string | null;
}

interface StandingRowRaw {
  season: number;
  team_id: number;
  w: number | null;
  l: number | null;
  pct: number | null;
  conf_w: number | null;
  conf_l: number | null;
  rf: number | null;
  ra: number | null;
  streak: string | null;
  conference_name: string;
  conference_short: string | null;
  team_name: string;
  team_nickname: string | null;
  team_abbr: string | null;
}

interface ScheduleRow {
  id: number;
  date: string;
  status: string;
  start_time_local: string | null;
  venue: string | null;
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
  is_home: 'home' | 'away';
  opponent_id: number;
  opponent_name: string;
  opponent_nickname: string | null;
  opponent_abbr: string | null;
  conference_short: string | null;
}
