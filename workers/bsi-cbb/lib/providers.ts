/**
 * BSI Sports Data Providers
 * API clients for NCAA, Highlightly Baseball, and Highlightly Football
 *
 * Rate Limiting: Fixed-window using KV with keys like ratelimit:${source}:${YYYYMMDDHHmm}
 * Caching: KV with stale fallback on API failure
 *
 * Highlightly API Coverage:
 * - Baseball: MLB + NCAA
 * - Football: NFL + NCAA
 */

import {
  NcaaScoreboardResponseSchema,
  NcaaGameSchema,
  HighlightlyTeamSchema,
  HighlightlyMatchSchema,
  HighlightlyPlayerSchema,
  HighlightlyPlayerStatsSchema,
  type NcaaScoreboardResponse,
  type NcaaGame,
  type HighlightlyTeam,
  type HighlightlyMatch,
  type HighlightlyPlayer,
  type HighlightlyPlayerStats,
  type CbbEnv,
} from "./types";
import { z } from "zod";

// =============================================================================
// HIGHLIGHTLY API URLS & LEAGUE NAMES
// =============================================================================

type SportType = "baseball" | "american-football";

const HIGHLIGHTLY_URLS: Record<SportType, string> = {
  baseball: "https://baseball.highlightly.net",
  "american-football": "https://american-football.highlightly.net",
};

const HIGHLIGHTLY_HOSTS: Record<SportType, string> = {
  baseball: "baseball.highlightly.net",
  "american-football": "american-football.highlightly.net",
};

// League names used by Highlightly API
export const HIGHLIGHTLY_LEAGUES = {
  baseball: {
    MLB: "MLB",
    NCAA: "NCAA",
  },
  football: {
    NFL: "NFL",
    NCAA: "NCAA",
  },
} as const;

// =============================================================================
// RATE LIMITING
// =============================================================================

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  ncaa: { windowMs: 60_000, maxRequests: 60 },
  highlightly: { windowMs: 60_000, maxRequests: 600 },
  highlightly_baseball: { windowMs: 60_000, maxRequests: 300 },
  highlightly_american_football: { windowMs: 60_000, maxRequests: 300 },
};

async function checkRateLimit(
  kv: KVNamespace,
  source: string
): Promise<boolean> {
  const config = RATE_LIMITS[source] ?? { windowMs: 60_000, maxRequests: 100 };
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hour = String(now.getUTCHours()).padStart(2, "0");
  const minute = String(now.getUTCMinutes()).padStart(2, "0");
  const windowKey = year + month + day + hour + minute;
  const key = "ratelimit:" + source + ":" + windowKey;

  const current = await kv.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= config.maxRequests) {
    return false;
  }

  await kv.put(key, String(count + 1), { expirationTtl: 120 });
  return true;
}

// =============================================================================
// KV CACHE HELPERS
// =============================================================================

interface CacheOptions {
  ttlSeconds: number;
  staleWhileRevalidate?: boolean;
}

async function getCached<T>(
  kv: KVNamespace,
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions
): Promise<T> {
  const cached = (await kv.get(key, "json")) as T | null;
  if (cached) {
    return cached;
  }
  const fresh = await fetcher();
  await kv.put(key, JSON.stringify(fresh), { expirationTtl: options.ttlSeconds });
  return fresh;
}

async function getCachedWithStale<T>(
  kv: KVNamespace,
  key: string,
  staleKey: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<{ data: T; isStale: boolean }> {
  const cached = (await kv.get(key, "json")) as T | null;
  if (cached) {
    return { data: cached, isStale: false };
  }

  try {
    const fresh = await fetcher();
    await kv.put(key, JSON.stringify(fresh), { expirationTtl: ttlSeconds });
    await kv.put(staleKey, JSON.stringify(fresh), { expirationTtl: ttlSeconds * 10 });
    return { data: fresh, isStale: false };
  } catch (error) {
    const stale = (await kv.get(staleKey, "json")) as T | null;
    if (stale) {
      return { data: stale, isStale: true };
    }
    throw error;
  }
}

// =============================================================================
// NCAA API PROVIDER (henrygd/ncaa-api)
// =============================================================================

const NCAA_BASE_URL = "https://ncaa-api.henrygd.me";
const NCAA_SPORT = "baseball";

export class NcaaProvider {
  constructor(private kv: KVNamespace) {}

  async getScoreboard(date?: string): Promise<NcaaScoreboardResponse> {
    if (!(await checkRateLimit(this.kv, "ncaa"))) {
      throw new Error("NCAA API rate limited");
    }

    const dateParam = date ?? new Date().toISOString().split("T")[0] ?? "";
    const cacheKey = "ncaa:scoreboard:" + dateParam;
    const staleKey = "ncaa:scoreboard:stale:" + dateParam;

    const { data, isStale } = await getCachedWithStale(
      this.kv,
      cacheKey,
      staleKey,
      async () => {
        const url = NCAA_BASE_URL + "/scoreboard/" + NCAA_SPORT + "/" + dateParam.replace(/-/g, "/");
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("NCAA API error: " + response.status);
        }
        const json = await response.json();
        return NcaaScoreboardResponseSchema.parse(json);
      },
      60
    );

    if (isStale) {
      console.log("NCAA scoreboard served from stale cache for " + dateParam);
    }
    return data;
  }

  async getGame(gameId: string): Promise<NcaaGame> {
    if (!(await checkRateLimit(this.kv, "ncaa"))) {
      throw new Error("NCAA API rate limited");
    }

    const cacheKey = "ncaa:game:" + gameId;
    const cached = (await this.kv.get(cacheKey, "json")) as NcaaGame | null;
    if (cached) {
      return cached;
    }

    const url = NCAA_BASE_URL + "/game/" + NCAA_SPORT + "/" + gameId;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("NCAA API error: " + response.status);
    }

    const json = await response.json();
    const game = NcaaGameSchema.parse(json);
    const status = game.status?.type?.state;
    const ttl = status === "post" ? 86400 : 300;
    await this.kv.put(cacheKey, JSON.stringify(game), { expirationTtl: ttl });
    return game;
  }

  async getSchedule(startDate: string, endDate: string): Promise<NcaaGame[]> {
    if (!(await checkRateLimit(this.kv, "ncaa"))) {
      throw new Error("NCAA API rate limited");
    }

    const cacheKey = "ncaa:schedule:" + startDate + ":" + endDate;
    return getCached(
      this.kv,
      cacheKey,
      async () => {
        const games: NcaaGame[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split("T")[0] ?? "";
          try {
            const scoreboard = await this.getScoreboard(dateStr);
            games.push(...scoreboard.events);
          } catch (e) {
            console.error("Failed to fetch schedule for " + dateStr, e);
          }
        }
        return games;
      },
      { ttlSeconds: 3600 }
    );
  }
}

// =============================================================================
// HIGHLIGHTLY BASE CLASS
// =============================================================================

export abstract class HighlightlyBase {
  protected baseUrl: string;
  protected host: string;
  protected rateLimitKey: string;

  constructor(
    protected kv: KVNamespace,
    protected apiKey: string,
    sport: SportType
  ) {
    this.baseUrl = HIGHLIGHTLY_URLS[sport];
    this.host = HIGHLIGHTLY_HOSTS[sport];
    this.rateLimitKey = "highlightly_" + sport.replace("-", "_");
  }

  protected async makeRequest<T>(
    endpoint: string,
    schema: z.ZodType<T>,
    cacheKey: string,
    ttlSeconds: number
  ): Promise<T> {
    if (!(await checkRateLimit(this.kv, this.rateLimitKey))) {
      throw new Error("Highlightly API rate limited");
    }

    const staleKey = cacheKey + ":stale";
    const { data, isStale } = await getCachedWithStale(
      this.kv,
      cacheKey,
      staleKey,
      async () => {
        const url = this.baseUrl + endpoint;
        const response = await fetch(url, {
          headers: {
            "x-rapidapi-key": this.apiKey,
            "x-rapidapi-host": this.host,
          },
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error("Highlightly API error " + response.status + ": " + errorText);
        }
        const json = await response.json();
        return schema.parse(json);
      },
      ttlSeconds
    );

    if (isStale) {
      console.log("Highlightly " + endpoint + " served from stale cache");
    }
    return data;
  }

  protected async makeRequestRaw<T>(
    endpoint: string,
    cacheKey: string,
    ttlSeconds: number
  ): Promise<T> {
    if (!(await checkRateLimit(this.kv, this.rateLimitKey))) {
      throw new Error("Highlightly API rate limited");
    }

    const staleKey = cacheKey + ":stale";
    const { data, isStale } = await getCachedWithStale(
      this.kv,
      cacheKey,
      staleKey,
      async () => {
        const url = this.baseUrl + endpoint;
        const response = await fetch(url, {
          headers: {
            "x-rapidapi-key": this.apiKey,
            "x-rapidapi-host": this.host,
          },
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error("Highlightly API error " + response.status + ": " + errorText);
        }
        return response.json() as Promise<T>;
      },
      ttlSeconds
    );

    if (isStale) {
      console.log("Highlightly " + endpoint + " served from stale cache");
    }
    return data;
  }
}

// =============================================================================
// HIGHLIGHTLY BASEBALL PROVIDER (MLB + NCAA Baseball)
// =============================================================================

export class HighlightlyBaseballProvider extends HighlightlyBase {
  constructor(kv: KVNamespace, apiKey: string) {
    super(kv, apiKey, "baseball");
  }

  // -------------------------------------------------------------------------
  // Teams
  // -------------------------------------------------------------------------

  async getTeams(league?: string): Promise<HighlightlyTeam[]> {
    const endpoint = league ? "/teams?league=" + league : "/teams";
    const cacheKey = "hl:baseball:teams:" + (league ?? "all");
    const TeamsArraySchema = z.array(HighlightlyTeamSchema);
    return this.makeRequest(endpoint, TeamsArraySchema, cacheKey, 86400);
  }

  async getMLBTeams(): Promise<HighlightlyTeam[]> {
    return this.getTeams(HIGHLIGHTLY_LEAGUES.baseball.MLB);
  }

  async getNCAABaseballTeams(): Promise<HighlightlyTeam[]> {
    return this.getTeams(HIGHLIGHTLY_LEAGUES.baseball.NCAA);
  }

  async getTeam(teamId: string): Promise<HighlightlyTeam> {
    const cacheKey = "hl:baseball:team:" + teamId;
    return this.makeRequest("/teams/" + teamId, HighlightlyTeamSchema, cacheKey, 86400);
  }

  // -------------------------------------------------------------------------
  // Matches/Games
  // -------------------------------------------------------------------------

  async getMatches(options?: {
    date?: string;
    league?: string;
    teamId?: string;
  }): Promise<HighlightlyMatch[]> {
    const params = new URLSearchParams();
    if (options?.date) params.append("date", options.date);
    if (options?.league) params.append("league", options.league);
    if (options?.teamId) params.append("teamId", options.teamId);

    const queryStr = params.toString();
    const endpoint = "/matches" + (queryStr ? "?" + queryStr : "");
    const cacheKey = "hl:baseball:matches:" + (queryStr || "all");

    // API returns { data: [...], pagination, plan } - extract data array
    const response = await this.makeRequestRaw<{ data: unknown[] }>(endpoint, cacheKey, 300);
    const MatchesArraySchema = z.array(HighlightlyMatchSchema);
    return MatchesArraySchema.parse(response.data);
  }

  async getLiveMatches(league?: string): Promise<HighlightlyMatch[]> {
    const all = await this.getMatches({ league });
    // Filter for non-finished games (live or upcoming)
    return all.filter((m) => {
      const desc = (m as unknown as { state?: { description?: string } }).state?.description;
      return desc && desc !== "Finished";
    });
  }

  async getMLBLiveGames(): Promise<HighlightlyMatch[]> {
    return this.getLiveMatches(HIGHLIGHTLY_LEAGUES.baseball.MLB);
  }

  async getNCAABaseballLiveGames(): Promise<HighlightlyMatch[]> {
    return this.getLiveMatches(HIGHLIGHTLY_LEAGUES.baseball.NCAA);
  }

  async getMatchesByDate(date: string, league?: string): Promise<HighlightlyMatch[]> {
    return this.getMatches({ date, league });
  }

  async getMatch(matchId: string): Promise<HighlightlyMatch> {
    const cacheKey = "hl:baseball:match:" + matchId;
    const cached = (await this.kv.get(cacheKey, "json")) as HighlightlyMatch | null;
    const ttl = cached?.state?.description === "Finished" ? 86400 : 300;
    return this.makeRequest("/matches/" + matchId, HighlightlyMatchSchema, cacheKey, ttl);
  }

  async getBoxScore(matchId: string): Promise<unknown> {
    const cacheKey = "hl:baseball:boxscore:" + matchId;
    return this.makeRequestRaw("/box-scores/" + matchId, cacheKey, 300);
  }

  async getLineup(matchId: string): Promise<unknown> {
    const cacheKey = "hl:baseball:lineup:" + matchId;
    return this.makeRequestRaw("/lineups?matchId=" + matchId, cacheKey, 300);
  }

  // -------------------------------------------------------------------------
  // Standings (returns all leagues structured data)
  // -------------------------------------------------------------------------

  async getStandings(season?: number): Promise<unknown> {
    const params = season ? "?season=" + season : "";
    const endpoint = "/standings" + params;
    const cacheKey = "hl:baseball:standings:" + (season ?? "current");
    return this.makeRequestRaw(endpoint, cacheKey, 3600);
  }

  async getMLBStandings(season?: number): Promise<unknown> {
    return this.getStandings(season);
  }

  async getNCAABaseballStandings(season?: number): Promise<unknown> {
    return this.getStandings(season);
  }

  // -------------------------------------------------------------------------
  // Players
  // -------------------------------------------------------------------------

  async getPlayers(options?: {
    teamId?: string;
    league?: string;
    search?: string;
  }): Promise<HighlightlyPlayer[]> {
    const params = new URLSearchParams();
    if (options?.teamId) params.append("teamId", options.teamId);
    if (options?.league) params.append("league", options.league);
    if (options?.search) params.append("search", options.search);

    const queryStr = params.toString();
    const endpoint = "/players" + (queryStr ? "?" + queryStr : "");
    const cacheKey = "hl:baseball:players:" + (queryStr || "all");
    const PlayersArraySchema = z.array(HighlightlyPlayerSchema);
    return this.makeRequest(endpoint, PlayersArraySchema, cacheKey, 43200);
  }

  async getPlayer(playerId: string): Promise<HighlightlyPlayer> {
    const cacheKey = "hl:baseball:player:" + playerId;
    return this.makeRequest("/players/" + playerId, HighlightlyPlayerSchema, cacheKey, 86400);
  }

  async getTeamPlayers(teamId: string): Promise<HighlightlyPlayer[]> {
    const cacheKey = "hl:baseball:team-players:" + teamId;
    const PlayersArraySchema = z.array(HighlightlyPlayerSchema);
    return this.makeRequest("/teams/" + teamId + "/players", PlayersArraySchema, cacheKey, 43200);
  }

  async getPlayerStats(playerId: string, season?: number): Promise<HighlightlyPlayerStats> {
    const params = season ? "?season=" + season : "";
    const endpoint = "/players/" + playerId + "/statistics" + params;
    const cacheKey = "hl:baseball:player-stats:" + playerId + ":" + (season ?? "career");
    return this.makeRequest(endpoint, HighlightlyPlayerStatsSchema, cacheKey, 43200);
  }

  // -------------------------------------------------------------------------
  // Head-to-Head & Recent Games
  // -------------------------------------------------------------------------

  async getHeadToHead(team1Id: string, team2Id: string): Promise<unknown> {
    const cacheKey = "hl:baseball:h2h:" + team1Id + ":" + team2Id;
    return this.makeRequestRaw("/head-2-head?teamIdOne=" + team1Id + "&teamIdTwo=" + team2Id, cacheKey, 3600);
  }

  async getLastFiveGames(teamId: string): Promise<unknown> {
    const cacheKey = "hl:baseball:last5:" + teamId;
    return this.makeRequestRaw("/last-five-games?teamId=" + teamId, cacheKey, 1800);
  }
}

// =============================================================================
// HIGHLIGHTLY FOOTBALL PROVIDER (NFL + NCAA Football)
// =============================================================================

export class HighlightlyFootballProvider extends HighlightlyBase {
  constructor(kv: KVNamespace, apiKey: string) {
    super(kv, apiKey, "american-football");
  }

  // -------------------------------------------------------------------------
  // Teams
  // -------------------------------------------------------------------------

  async getTeams(league?: string): Promise<HighlightlyTeam[]> {
    const endpoint = league ? "/teams?league=" + league : "/teams";
    const cacheKey = "hl:football:teams:" + (league ?? "all");
    const TeamsArraySchema = z.array(HighlightlyTeamSchema);
    return this.makeRequest(endpoint, TeamsArraySchema, cacheKey, 86400);
  }

  async getNFLTeams(): Promise<HighlightlyTeam[]> {
    return this.getTeams(HIGHLIGHTLY_LEAGUES.football.NFL);
  }

  async getNCAAFootballTeams(): Promise<HighlightlyTeam[]> {
    return this.getTeams(HIGHLIGHTLY_LEAGUES.football.NCAA);
  }

  async getTeam(teamId: string): Promise<HighlightlyTeam> {
    const cacheKey = "hl:football:team:" + teamId;
    return this.makeRequest("/teams/" + teamId, HighlightlyTeamSchema, cacheKey, 86400);
  }

  // -------------------------------------------------------------------------
  // Matches/Games
  // -------------------------------------------------------------------------

  async getMatches(options?: {
    date?: string;
    league?: string;
    teamId?: string;
  }): Promise<HighlightlyMatch[]> {
    const params = new URLSearchParams();
    if (options?.date) params.append("date", options.date);
    if (options?.league) params.append("league", options.league);
    if (options?.teamId) params.append("teamId", options.teamId);

    const queryStr = params.toString();
    const endpoint = "/matches" + (queryStr ? "?" + queryStr : "");
    const cacheKey = "hl:football:matches:" + (queryStr || "all");

    // API returns { data: [...], pagination, plan } - extract data array
    const response = await this.makeRequestRaw<{ data: unknown[] }>(endpoint, cacheKey, 300);
    const MatchesArraySchema = z.array(HighlightlyMatchSchema);
    return MatchesArraySchema.parse(response.data);
  }

  async getLiveMatches(league?: string): Promise<HighlightlyMatch[]> {
    const all = await this.getMatches({ league });
    // Filter for non-finished games (live or upcoming)
    return all.filter((m) => {
      const desc = (m as unknown as { state?: { description?: string } }).state?.description;
      return desc && desc !== "Finished";
    });
  }

  async getNFLLiveGames(): Promise<HighlightlyMatch[]> {
    return this.getLiveMatches(HIGHLIGHTLY_LEAGUES.football.NFL);
  }

  async getNCAAFootballLiveGames(): Promise<HighlightlyMatch[]> {
    return this.getLiveMatches(HIGHLIGHTLY_LEAGUES.football.NCAA);
  }

  async getMatchesByDate(date: string, league?: string): Promise<HighlightlyMatch[]> {
    return this.getMatches({ date, league });
  }

  async getMatch(matchId: string): Promise<HighlightlyMatch> {
    const cacheKey = "hl:football:match:" + matchId;
    const cached = (await this.kv.get(cacheKey, "json")) as HighlightlyMatch | null;
    const ttl = cached?.state?.description === "Finished" ? 86400 : 300;
    return this.makeRequest("/matches/" + matchId, HighlightlyMatchSchema, cacheKey, ttl);
  }

  async getBoxScore(matchId: string): Promise<unknown> {
    const cacheKey = "hl:football:boxscore:" + matchId;
    return this.makeRequestRaw("/box-scores/" + matchId, cacheKey, 300);
  }

  async getLineup(matchId: string): Promise<unknown> {
    const cacheKey = "hl:football:lineup:" + matchId;
    return this.makeRequestRaw("/lineups?matchId=" + matchId, cacheKey, 300);
  }

  // -------------------------------------------------------------------------
  // Standings (returns all leagues structured data)
  // -------------------------------------------------------------------------

  async getStandings(season?: number): Promise<unknown> {
    const params = season ? "?season=" + season : "";
    const endpoint = "/standings" + params;
    const cacheKey = "hl:football:standings:" + (season ?? "current");
    return this.makeRequestRaw(endpoint, cacheKey, 3600);
  }

  async getNFLStandings(season?: number): Promise<unknown> {
    return this.getStandings(season);
  }

  async getNCAAFootballStandings(season?: number): Promise<unknown> {
    return this.getStandings(season);
  }

  // -------------------------------------------------------------------------
  // Players
  // -------------------------------------------------------------------------

  async getPlayers(options?: {
    teamId?: string;
    league?: string;
    search?: string;
  }): Promise<HighlightlyPlayer[]> {
    const params = new URLSearchParams();
    if (options?.teamId) params.append("teamId", options.teamId);
    if (options?.league) params.append("league", options.league);
    if (options?.search) params.append("search", options.search);

    const queryStr = params.toString();
    const endpoint = "/players" + (queryStr ? "?" + queryStr : "");
    const cacheKey = "hl:football:players:" + (queryStr || "all");
    const PlayersArraySchema = z.array(HighlightlyPlayerSchema);
    return this.makeRequest(endpoint, PlayersArraySchema, cacheKey, 43200);
  }

  async getPlayer(playerId: string): Promise<HighlightlyPlayer> {
    const cacheKey = "hl:football:player:" + playerId;
    return this.makeRequest("/players/" + playerId, HighlightlyPlayerSchema, cacheKey, 86400);
  }

  async getTeamPlayers(teamId: string): Promise<HighlightlyPlayer[]> {
    const cacheKey = "hl:football:team-players:" + teamId;
    const PlayersArraySchema = z.array(HighlightlyPlayerSchema);
    return this.makeRequest("/teams/" + teamId + "/players", PlayersArraySchema, cacheKey, 43200);
  }

  async getPlayerStats(playerId: string, season?: number): Promise<HighlightlyPlayerStats> {
    const params = season ? "?season=" + season : "";
    const endpoint = "/players/" + playerId + "/statistics" + params;
    const cacheKey = "hl:football:player-stats:" + playerId + ":" + (season ?? "career");
    return this.makeRequest(endpoint, HighlightlyPlayerStatsSchema, cacheKey, 43200);
  }

  // -------------------------------------------------------------------------
  // Head-to-Head & Recent Games
  // -------------------------------------------------------------------------

  async getHeadToHead(team1Id: string, team2Id: string): Promise<unknown> {
    const cacheKey = "hl:football:h2h:" + team1Id + ":" + team2Id;
    return this.makeRequestRaw("/head-2-head?teamIdOne=" + team1Id + "&teamIdTwo=" + team2Id, cacheKey, 3600);
  }

  async getLastFiveGames(teamId: string): Promise<unknown> {
    const cacheKey = "hl:football:last5:" + teamId;
    return this.makeRequestRaw("/last-five-games?teamId=" + teamId, cacheKey, 1800);
  }
}

// =============================================================================
// LEGACY PROVIDER (Backward Compatibility)
// =============================================================================

/**
 * @deprecated Use HighlightlyBaseballProvider or HighlightlyFootballProvider directly
 * Maintained for backward compatibility with existing code
 */
export class HighlightlyProvider extends HighlightlyBaseballProvider {
  constructor(kv: KVNamespace, apiKey: string) {
    super(kv, apiKey);
  }
}

// =============================================================================
// PROVIDER FACTORY
// =============================================================================

export interface ProvidersResult {
  ncaa: NcaaProvider;
  highlightly: HighlightlyProvider | null;
  baseball: HighlightlyBaseballProvider | null;
  football: HighlightlyFootballProvider | null;
}

export function createProviders(env: CbbEnv): ProvidersResult {
  const apiKey = env.HIGHLIGHTLY_API_KEY;

  return {
    ncaa: new NcaaProvider(env.BSI_CACHE),
    highlightly: apiKey ? new HighlightlyProvider(env.BSI_CACHE, apiKey) : null,
    baseball: apiKey ? new HighlightlyBaseballProvider(env.BSI_CACHE, apiKey) : null,
    football: apiKey ? new HighlightlyFootballProvider(env.BSI_CACHE, apiKey) : null,
  };
}
