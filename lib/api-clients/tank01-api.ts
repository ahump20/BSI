/**
 * Pro Sports API Client — ESPN Hidden API Implementation
 *
 * Replaces the Tank01/RapidAPI stub with real data from ESPN's undocumented
 * endpoints. No authentication required. Covers MLB, NFL, and NBA.
 *
 * This client conforms to the Tank01Response interface so the worker router
 * needs zero changes — only the underlying data source changes.
 */
import type { ProviderHealth } from '../../src/types/api-envelope';

export interface Tank01Response<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  source: 'tank01';
}

export interface Tank01ApiClient {
  healthCheck(sport?: string): Promise<ProviderHealth>;
  // MLB
  getMLBScores(date: string): Promise<Tank01Response<{ body: unknown[] }>>;
  getMLBStandings(): Promise<Tank01Response<{ body: unknown[] }>>;
  getMLBBoxScore(gameId: string): Promise<Tank01Response<{ body: unknown }>>;
  getMLBPlayer(playerId: string): Promise<Tank01Response<{ body: unknown }>>;
  getMLBTeamRoster(teamAbv: string): Promise<Tank01Response<{ body: unknown[] }>>;
  getMLBTeamSchedule(teamAbv: string): Promise<Tank01Response<{ body: unknown[] }>>;
  getMLBNews(): Promise<Tank01Response<{ body: unknown[] }>>;
  // NFL
  getNFLScores(week: string, season?: string): Promise<Tank01Response<{ body: unknown[] }>>;
  getNFLStandings(): Promise<Tank01Response<{ body: unknown[] }>>;
  getNFLBoxScore(gameId: string): Promise<Tank01Response<{ body: unknown }>>;
  getNFLPlayer(playerId: string): Promise<Tank01Response<{ body: unknown }>>;
  getNFLTeamRoster(teamAbv: string): Promise<Tank01Response<{ body: unknown[] }>>;
  getNFLTeamSchedule(teamAbv: string): Promise<Tank01Response<{ body: unknown[] }>>;
  getNFLNews(): Promise<Tank01Response<{ body: unknown[] }>>;
  // NBA
  getNBAScores(date: string): Promise<Tank01Response<{ body: unknown[] }>>;
  getNBAStandings(): Promise<Tank01Response<{ body: unknown[] }>>;
  getNBABoxScore(gameId: string): Promise<Tank01Response<{ body: unknown }>>;
  getNBAPlayer(playerId: string): Promise<Tank01Response<{ body: unknown }>>;
  getNBATeamRoster(teamAbv: string): Promise<Tank01Response<{ body: unknown[] }>>;
  getNBATeamSchedule(teamAbv: string): Promise<Tank01Response<{ body: unknown[] }>>;
  getNBANews(): Promise<Tank01Response<{ body: unknown[] }>>;
}

const ESPN_BASE = 'https://site.api.espn.com';

/** ESPN sport/league path mapping */
const PATHS = {
  mlb: 'baseball/mlb',
  nfl: 'football/nfl',
  nba: 'basketball/nba',
} as const;

/** Safe fetch with timeout */
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

class EspnSportsClient implements Tank01ApiClient {
  private now(): string {
    return new Date().toISOString();
  }

  private ok<T>(body: T): Tank01Response<{ body: T }> {
    return { success: true, data: { body }, timestamp: this.now(), source: 'tank01' };
  }

  private fail<T>(error: string, fallback: T): Tank01Response<{ body: T }> {
    return { success: false, error, data: { body: fallback }, timestamp: this.now(), source: 'tank01' };
  }

  /** Lightweight health check — pings ESPN MLB scoreboard and measures latency */
  async healthCheck(sport: string = 'mlb'): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const path = PATHS[sport as keyof typeof PATHS] ?? PATHS.mlb;
      const url = `${ESPN_BASE}/apis/site/v2/sports/${path}/scoreboard?limit=1`;
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

  // ─── Generic helpers ──────────────────────────────────────────────────────

  private async fetchScoreboard(sport: keyof typeof PATHS, dateParam?: string): Promise<Tank01Response<{ body: unknown[] }>> {
    const qs = dateParam ? `?dates=${dateParam}` : '';
    const url = `${ESPN_BASE}/apis/site/v2/sports/${PATHS[sport]}/scoreboard${qs}`;
    const result = await espnFetch<Record<string, unknown>>(url);

    if (!result.ok || !result.data) {
      return this.fail(result.error ?? 'Scoreboard fetch failed', []);
    }

    const events = (result.data.events as unknown[]) || [];
    return this.ok(events);
  }

  private async fetchStandings(sport: keyof typeof PATHS): Promise<Tank01Response<{ body: unknown[] }>> {
    const url = `${ESPN_BASE}/apis/site/v2/sports/${PATHS[sport]}/standings`;
    const result = await espnFetch<Record<string, unknown>>(url);

    if (!result.ok || !result.data) {
      return this.fail(result.error ?? 'Standings fetch failed', []);
    }

    const children = (result.data.children as unknown[]) || [];
    return this.ok(children);
  }

  private async fetchGameSummary(sport: keyof typeof PATHS, gameId: string): Promise<Tank01Response<{ body: unknown }>> {
    const url = `${ESPN_BASE}/apis/site/v2/sports/${PATHS[sport]}/summary?event=${gameId}`;
    const result = await espnFetch<Record<string, unknown>>(url);

    if (!result.ok || !result.data) {
      return this.fail(result.error ?? 'Game summary fetch failed', null);
    }

    return this.ok(result.data as unknown);
  }

  private async fetchPlayer(sport: keyof typeof PATHS, playerId: string): Promise<Tank01Response<{ body: unknown }>> {
    const url = `${ESPN_BASE}/apis/common/v3/sports/${PATHS[sport]}/athletes/${playerId}/overview`;
    const result = await espnFetch<Record<string, unknown>>(url);

    if (!result.ok || !result.data) {
      return this.fail(result.error ?? 'Player fetch failed', null);
    }

    return this.ok(result.data as unknown);
  }

  private async fetchTeamRoster(sport: keyof typeof PATHS, teamId: string): Promise<Tank01Response<{ body: unknown[] }>> {
    const url = `${ESPN_BASE}/apis/site/v2/sports/${PATHS[sport]}/teams/${teamId}?enable=roster`;
    const result = await espnFetch<Record<string, unknown>>(url);

    if (!result.ok || !result.data) {
      return this.fail(result.error ?? 'Roster fetch failed', []);
    }

    const team = (result.data.team as Record<string, unknown>) ?? result.data;
    const athletes = (team.athletes as unknown[]) || [];
    return this.ok(athletes);
  }

  private async fetchTeamSchedule(sport: keyof typeof PATHS, teamId: string): Promise<Tank01Response<{ body: unknown[] }>> {
    const now = new Date();
    const season = now.getFullYear();
    const url = `${ESPN_BASE}/apis/site/v2/sports/${PATHS[sport]}/teams/${teamId}/schedule?season=${season}`;
    const result = await espnFetch<Record<string, unknown>>(url);

    if (!result.ok || !result.data) {
      return this.fail(result.error ?? 'Schedule fetch failed', []);
    }

    const events = (result.data.events as unknown[]) || [];
    return this.ok(events);
  }

  private async fetchNews(sport: keyof typeof PATHS): Promise<Tank01Response<{ body: unknown[] }>> {
    const url = `${ESPN_BASE}/apis/site/v2/sports/${PATHS[sport]}/news?limit=25`;
    const result = await espnFetch<Record<string, unknown>>(url);

    if (!result.ok || !result.data) {
      return this.fail(result.error ?? 'News fetch failed', []);
    }

    const articles = (result.data.articles as unknown[]) || [];
    return this.ok(articles);
  }

  // ─── MLB ──────────────────────────────────────────────────────────────────

  async getMLBScores(date: string): Promise<Tank01Response<{ body: unknown[] }>> {
    return this.fetchScoreboard('mlb', date);
  }

  async getMLBStandings(): Promise<Tank01Response<{ body: unknown[] }>> {
    return this.fetchStandings('mlb');
  }

  async getMLBBoxScore(gameId: string): Promise<Tank01Response<{ body: unknown }>> {
    return this.fetchGameSummary('mlb', gameId);
  }

  async getMLBPlayer(playerId: string): Promise<Tank01Response<{ body: unknown }>> {
    return this.fetchPlayer('mlb', playerId);
  }

  async getMLBTeamRoster(teamAbv: string): Promise<Tank01Response<{ body: unknown[] }>> {
    return this.fetchTeamRoster('mlb', teamAbv);
  }

  async getMLBTeamSchedule(teamAbv: string): Promise<Tank01Response<{ body: unknown[] }>> {
    return this.fetchTeamSchedule('mlb', teamAbv);
  }

  async getMLBNews(): Promise<Tank01Response<{ body: unknown[] }>> {
    return this.fetchNews('mlb');
  }

  // ─── NFL ──────────────────────────────────────────────────────────────────

  async getNFLScores(week: string, season?: string): Promise<Tank01Response<{ body: unknown[] }>> {
    const yr = season ?? new Date().getFullYear().toString();
    const primaryUrl =
      `${ESPN_BASE}/apis/site/v2/sports/${PATHS.nfl}/scoreboard?` +
      `week=${week}&seasontype=2&season=${yr}`;
    const primary = await espnFetch<Record<string, unknown>>(primaryUrl);

    if (primary.ok && primary.data) {
      const events = (primary.data.events as unknown[]) || [];
      return this.ok(events);
    }

    // ESPN intermittently errors for week/season params in offseason; fallback to generic scoreboard.
    const fallbackUrl = `${ESPN_BASE}/apis/site/v2/sports/${PATHS.nfl}/scoreboard`;
    const fallback = await espnFetch<Record<string, unknown>>(fallbackUrl);
    if (fallback.ok && fallback.data) {
      const events = (fallback.data.events as unknown[]) || [];
      return this.ok(events);
    }

    return this.fail(
      primary.error ?? fallback.error ?? 'NFL scores fetch failed',
      []
    );
  }

  async getNFLStandings(): Promise<Tank01Response<{ body: unknown[] }>> {
    return this.fetchStandings('nfl');
  }

  async getNFLBoxScore(gameId: string): Promise<Tank01Response<{ body: unknown }>> {
    return this.fetchGameSummary('nfl', gameId);
  }

  async getNFLPlayer(playerId: string): Promise<Tank01Response<{ body: unknown }>> {
    return this.fetchPlayer('nfl', playerId);
  }

  async getNFLTeamRoster(teamAbv: string): Promise<Tank01Response<{ body: unknown[] }>> {
    return this.fetchTeamRoster('nfl', teamAbv);
  }

  async getNFLTeamSchedule(teamAbv: string): Promise<Tank01Response<{ body: unknown[] }>> {
    return this.fetchTeamSchedule('nfl', teamAbv);
  }

  async getNFLNews(): Promise<Tank01Response<{ body: unknown[] }>> {
    return this.fetchNews('nfl');
  }

  // ─── NBA ──────────────────────────────────────────────────────────────────

  async getNBAScores(date: string): Promise<Tank01Response<{ body: unknown[] }>> {
    return this.fetchScoreboard('nba', date);
  }

  async getNBAStandings(): Promise<Tank01Response<{ body: unknown[] }>> {
    return this.fetchStandings('nba');
  }

  async getNBABoxScore(gameId: string): Promise<Tank01Response<{ body: unknown }>> {
    return this.fetchGameSummary('nba', gameId);
  }

  async getNBAPlayer(playerId: string): Promise<Tank01Response<{ body: unknown }>> {
    return this.fetchPlayer('nba', playerId);
  }

  async getNBATeamRoster(teamAbv: string): Promise<Tank01Response<{ body: unknown[] }>> {
    return this.fetchTeamRoster('nba', teamAbv);
  }

  async getNBATeamSchedule(teamAbv: string): Promise<Tank01Response<{ body: unknown[] }>> {
    return this.fetchTeamSchedule('nba', teamAbv);
  }

  async getNBANews(): Promise<Tank01Response<{ body: unknown[] }>> {
    return this.fetchNews('nba');
  }
}

export function createTank01Client(_apiKey?: string): Tank01ApiClient {
  // ESPN APIs don't need an API key — this parameter is kept for interface compatibility
  return new EspnSportsClient();
}
