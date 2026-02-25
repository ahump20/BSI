/**
 * NCAA Baseball API Client — ESPN Hidden API Implementation
 *
 * Replaces the stub client with real data from ESPN's undocumented college
 * baseball endpoints. No authentication required.
 *
 * Endpoints used:
 *   - site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard
 *   - site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams
 *   - site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/standings
 *   - site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings (if available)
 */
interface ProviderHealth {
  healthy: boolean;
  latencyMs: number;
  error?: string;
}

export interface NcaaApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  source: 'ncaa';
}

export interface NcaaPaginated<T> {
  data: T[];
  totalCount?: number;
}

export interface NcaaApiClient {
  healthCheck(): Promise<ProviderHealth>;
  getMatches(league: string, date?: string): Promise<NcaaApiResponse<NcaaPaginated<unknown>>>;
  getStandings(): Promise<NcaaApiResponse<unknown[]>>;
  getRankings(): Promise<NcaaApiResponse<unknown[]>>;
  getTeam(teamId: number): Promise<NcaaApiResponse<unknown>>;
  getTeamPlayers(teamId: number): Promise<NcaaApiResponse<NcaaPaginated<unknown>>>;
  getPlayer(playerId: number): Promise<NcaaApiResponse<unknown>>;
  getPlayerStatistics(playerId: number): Promise<NcaaApiResponse<unknown>>;
  getMatch(matchId: number): Promise<NcaaApiResponse<unknown>>;
  getBoxScore(matchId: number): Promise<NcaaApiResponse<unknown>>;
  getSchedule(date: string, range: string): Promise<NcaaApiResponse<NcaaPaginated<unknown>>>;
  getTeamSchedule(teamId: number): Promise<NcaaApiResponse<unknown>>;
}

const ESPN_BASE = 'https://site.api.espn.com';
const _ESPN_CORE = 'https://sports.core.api.espn.com';
const SPORT_PATH = 'baseball/college-baseball';

/** Format date as YYYYMMDD for ESPN */
function toEspnDate(dateStr?: string): string {
  if (!dateStr) {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }
  return dateStr.replace(/-/g, '');
}

/** Safe fetch with timeout and error handling */
async function espnFetch<T>(url: string): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { ok: false, error: `ESPN returned ${res.status}` };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown ESPN fetch error';
    return { ok: false, error: message };
  }
}

/** Extract record from ESPN competitor records array */
function extractRecord(competitor: Record<string, unknown>): { wins: number; losses: number } {
  const records = (competitor.records as Record<string, unknown>[]) ?? [];
  const overall = records.find((r) => (r.type as string) === 'total') ?? records[0];
  if (overall?.summary) {
    const parts = (overall.summary as string).split('-');
    return { wins: parseInt(parts[0], 10) || 0, losses: parseInt(parts[1], 10) || 0 };
  }
  return { wins: 0, losses: 0 };
}

/** Extract conference name from ESPN competitor's team object */
function extractConference(competitor: Record<string, unknown>): string {
  const team = (competitor.team as Record<string, unknown>) ?? {};
  // ESPN sometimes provides conferenceId or groups
  const groups = team.groups as Record<string, unknown> | undefined;
  if (groups?.name) return groups.name as string;
  // Some ESPN responses include conference in a different location
  const confId = team.conferenceId as string | undefined;
  if (confId) return confId;
  return '';
}

/** Transform ESPN scoreboard event into a normalized match object */
function normalizeEvent(event: Record<string, unknown>): Record<string, unknown> {
  const competitions = (event.competitions as Record<string, unknown>[]) || [];
  const comp = competitions[0] || {};
  const competitors = (comp.competitors as Record<string, unknown>[]) || [];
  const home = competitors.find((c) => c.homeAway === 'home') || {};
  const away = competitors.find((c) => c.homeAway === 'away') || {};
  const status = (comp.status as Record<string, unknown>) || {};
  const statusType = (status.type as Record<string, unknown>) || {};

  return {
    id: event.id,
    name: event.name,
    shortName: event.shortName,
    date: event.date,
    homeTeam: {
      id: (home.team as Record<string, unknown>)?.id,
      name: (home.team as Record<string, unknown>)?.displayName,
      abbreviation: (home.team as Record<string, unknown>)?.abbreviation,
      logo: (home.team as Record<string, unknown>)?.logo,
      conference: extractConference(home),
      record: extractRecord(home),
    },
    awayTeam: {
      id: (away.team as Record<string, unknown>)?.id,
      name: (away.team as Record<string, unknown>)?.displayName,
      abbreviation: (away.team as Record<string, unknown>)?.abbreviation,
      logo: (away.team as Record<string, unknown>)?.logo,
      conference: extractConference(away),
      record: extractRecord(away),
    },
    homeScore: home.score != null ? Number(home.score) : null,
    awayScore: away.score != null ? Number(away.score) : null,
    status: {
      type: statusType.name,
      state: statusType.state,
      detail: statusType.detail ?? status.detail,
      displayClock: status.displayClock,
      period: status.period,
    },
    venue: comp.venue,
  };
}

class EspnNcaaClient implements NcaaApiClient {
  private now(): string {
    return new Date().toISOString();
  }

  /** Lightweight health check — pings ESPN college baseball scoreboard */
  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const url = `${ESPN_BASE}/apis/site/v2/sports/${SPORT_PATH}/scoreboard?limit=1`;
      const result = await espnFetch<Record<string, unknown>>(url);
      return {
        healthy: result.ok,
        latencyMs: Date.now() - start,
        error: result.ok ? undefined : result.error ?? 'Health check failed',
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  }

  async getMatches(_league: string, date?: string): Promise<NcaaApiResponse<NcaaPaginated<unknown>>> {
    const dateParam = date ? `?dates=${toEspnDate(date)}` : '';
    const url = `${ESPN_BASE}/apis/site/v2/sports/${SPORT_PATH}/scoreboard${dateParam}`;
    const result = await espnFetch<Record<string, unknown>>(url);

    if (!result.ok || !result.data) {
      return { success: false, error: result.error, data: { data: [], totalCount: 0 }, timestamp: this.now(), source: 'ncaa' };
    }

    const events = (result.data.events as Record<string, unknown>[]) || [];
    const normalized = events.map(normalizeEvent);

    return {
      success: true,
      data: { data: normalized, totalCount: normalized.length },
      timestamp: this.now(),
      source: 'ncaa',
    };
  }

  async getStandings(): Promise<NcaaApiResponse<unknown[]>> {
    // Returns all D1 conference groups from ESPN. The handler owns conference
    // filtering via team-metadata.ts espnId → conference mapping.
    const url = `${ESPN_BASE}/apis/site/v2/sports/${SPORT_PATH}/standings`;
    const result = await espnFetch<Record<string, unknown>>(url);

    if (!result.ok || !result.data) {
      // Fallback: try rankings endpoint
      return this.getRankings();
    }

    const children = (result.data.children as Record<string, unknown>[]) || [];
    return { success: true, data: children, timestamp: this.now(), source: 'ncaa' };
  }

  async getRankings(): Promise<NcaaApiResponse<unknown[]>> {
    const url = `${ESPN_BASE}/apis/site/v2/sports/${SPORT_PATH}/rankings`;
    const result = await espnFetch<Record<string, unknown>>(url);

    if (!result.ok || !result.data) {
      return { success: false, error: result.error, data: [], timestamp: this.now(), source: 'ncaa' };
    }

    const rankings = (result.data.rankings as unknown[]) || [];
    return { success: true, data: rankings, timestamp: this.now(), source: 'ncaa' };
  }

  async getTeam(teamId: number): Promise<NcaaApiResponse<unknown>> {
    const url = `${ESPN_BASE}/apis/site/v2/sports/${SPORT_PATH}/teams/${teamId}`;
    const result = await espnFetch<Record<string, unknown>>(url);

    if (!result.ok || !result.data) {
      return { success: false, error: result.error, data: null, timestamp: this.now(), source: 'ncaa' };
    }

    return { success: true, data: result.data.team ?? result.data, timestamp: this.now(), source: 'ncaa' };
  }

  async getTeamPlayers(teamId: number): Promise<NcaaApiResponse<NcaaPaginated<unknown>>> {
    const url = `${ESPN_BASE}/apis/site/v2/sports/${SPORT_PATH}/teams/${teamId}?enable=roster`;
    const result = await espnFetch<Record<string, unknown>>(url);

    if (!result.ok || !result.data) {
      return { success: false, error: result.error, data: { data: [], totalCount: 0 }, timestamp: this.now(), source: 'ncaa' };
    }

    const team = (result.data.team as Record<string, unknown>) ?? result.data;
    const athletes = (team.athletes as unknown[]) || [];

    return {
      success: true,
      data: { data: athletes, totalCount: athletes.length },
      timestamp: this.now(),
      source: 'ncaa',
    };
  }

  async getPlayer(playerId: number): Promise<NcaaApiResponse<unknown>> {
    const url = `${ESPN_BASE}/apis/common/v3/sports/${SPORT_PATH}/athletes/${playerId}`;
    const result = await espnFetch<Record<string, unknown>>(url);

    if (!result.ok || !result.data) {
      return { success: false, error: result.error, data: null, timestamp: this.now(), source: 'ncaa' };
    }

    return { success: true, data: result.data, timestamp: this.now(), source: 'ncaa' };
  }

  async getPlayerStatistics(playerId: number): Promise<NcaaApiResponse<unknown>> {
    const url = `${ESPN_BASE}/apis/common/v3/sports/${SPORT_PATH}/athletes/${playerId}/overview`;
    const result = await espnFetch<Record<string, unknown>>(url);

    if (!result.ok || !result.data) {
      return { success: false, error: result.error, data: null, timestamp: this.now(), source: 'ncaa' };
    }

    return { success: true, data: result.data, timestamp: this.now(), source: 'ncaa' };
  }

  async getMatch(matchId: number): Promise<NcaaApiResponse<unknown>> {
    const url = `${ESPN_BASE}/apis/site/v2/sports/${SPORT_PATH}/summary?event=${matchId}`;
    const result = await espnFetch<Record<string, unknown>>(url);

    if (!result.ok || !result.data) {
      return { success: false, error: result.error, data: null, timestamp: this.now(), source: 'ncaa' };
    }

    return { success: true, data: result.data, timestamp: this.now(), source: 'ncaa' };
  }

  async getBoxScore(matchId: number): Promise<NcaaApiResponse<unknown>> {
    const url = `${ESPN_BASE}/apis/site/v2/sports/${SPORT_PATH}/summary?event=${matchId}`;
    const result = await espnFetch<Record<string, unknown>>(url);

    if (!result.ok || !result.data) {
      return { success: false, error: result.error, data: null, timestamp: this.now(), source: 'ncaa' };
    }

    return { success: true, data: result.data.boxscore ?? result.data, timestamp: this.now(), source: 'ncaa' };
  }

  async getSchedule(date: string, _range: string): Promise<NcaaApiResponse<NcaaPaginated<unknown>>> {
    // ESPN scoreboard with date range serves as schedule
    const espnDate = toEspnDate(date);
    const url = `${ESPN_BASE}/apis/site/v2/sports/${SPORT_PATH}/scoreboard?dates=${espnDate}`;
    const result = await espnFetch<Record<string, unknown>>(url);

    if (!result.ok || !result.data) {
      return { success: false, error: result.error, data: { data: [], totalCount: 0 }, timestamp: this.now(), source: 'ncaa' };
    }

    const events = (result.data.events as Record<string, unknown>[]) || [];
    const normalized = events.map(normalizeEvent);

    return {
      success: true,
      data: { data: normalized, totalCount: normalized.length },
      timestamp: this.now(),
      source: 'ncaa',
    };
  }

  async getTeamSchedule(teamId: number): Promise<NcaaApiResponse<unknown>> {
    const url = `${ESPN_BASE}/apis/site/v2/sports/${SPORT_PATH}/teams/${teamId}/schedule`;
    const result = await espnFetch<Record<string, unknown>>(url);

    if (!result.ok || !result.data) {
      return { success: false, error: result.error, data: null, timestamp: this.now(), source: 'ncaa' };
    }

    return { success: true, data: result.data, timestamp: this.now(), source: 'ncaa' };
  }
}

export function createNcaaClient(): NcaaApiClient {
  return new EspnNcaaClient();
}
