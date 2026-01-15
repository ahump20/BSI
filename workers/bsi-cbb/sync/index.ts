/**
 * BSI College Baseball Sync Worker
 * Scheduled data ingestion from NCAA and Highlightly APIs
 *
 * Triggers:
 * - Cron: Every minute during season (Feb-Jun), hourly off-season
 * - Manual: POST /sync/trigger (requires BSI_SYNC_TOKEN)
 *
 * Data Sources:
 * - NCAA API: Scoreboard (every minute in-season)
 * - Highlightly: Teams (daily), Matches (hourly), Players/Stats (daily)
 * - Manual NIL: POST /sync/nil (requires BSI_SYNC_TOKEN)
 */

import { Hono } from "hono";
import { z } from "zod";
import {
  type CbbEnv,
  type SyncResult,
  createProviders,
  NcaaProvider,
  HighlightlyProvider,
  getEntityIdFromSource,
  upsertEntitySource,
  logSync,
  getLatestSync,
  generateId,
  NilDealImportSchema,
  NilValuationImportSchema,
} from "../lib";

// =============================================================================
// APP SETUP
// =============================================================================

type Bindings = CbbEnv;

const app = new Hono<{ Bindings: Bindings }>();

// =============================================================================
// AUTH MIDDLEWARE
// =============================================================================

function requireAuth(c: any, next: () => Promise<Response>): Response | Promise<Response> {
  const authHeader = c.req.header("Authorization");
  const expectedToken = c.env.BSI_SYNC_TOKEN;

  if (!expectedToken) {
    return c.json({ error: "Server misconfigured: BSI_SYNC_TOKEN not set" }, 500);
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.substring(7);
  if (token !== expectedToken) {
    return c.json({ error: "Invalid token" }, 403);
  }

  return next();
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get("/sync/cbb/health", async (c) => {
  const env = c.env;

  // Get latest sync status for each source
  const [ncaaStatus, highlightlyStatus] = await Promise.all([
    getLatestSync(env.BSI_DB, "ncaa", "scoreboard"),
    getLatestSync(env.BSI_DB, "highlightly", "teams"),
  ]);

  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    lastSync: {
      ncaa: ncaaStatus,
      highlightly: highlightlyStatus,
    },
  });
});

// =============================================================================
// MANUAL TRIGGER ENDPOINT
// =============================================================================

app.post("/sync/cbb/trigger", async (c) => {
  const authResult = await requireAuth(c, async () => {
    const env = c.env;
    const body = await c.req.json().catch(() => ({}));
    const source = body.source as string | undefined;
    const entityType = body.entityType as string | undefined;

    const results: SyncResult[] = [];

    const providers = createProviders(env);

    // Run requested sync or all
    if (!source || source === "ncaa") {
      const ncaaResult = await syncNcaaScoreboard(env, providers.ncaa);
      results.push(ncaaResult);
    }

    if (providers.highlightly && (!source || source === "highlightly")) {
      if (!entityType || entityType === "teams") {
        const teamsResult = await syncHighlightlyTeams(env, providers.highlightly);
        results.push(teamsResult);
      }
      if (!entityType || entityType === "matches") {
        const matchesResult = await syncHighlightlyMatches(env, providers.highlightly);
        results.push(matchesResult);
      }
    }

    return c.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  });

  return authResult;
});

// =============================================================================
// MANUAL NIL IMPORT ENDPOINT
// =============================================================================

const NilImportRequestSchema = z.object({
  deals: z.array(NilDealImportSchema).optional(),
  valuations: z.array(NilValuationImportSchema).optional(),
});

app.post("/sync/cbb/nil", async (c) => {
  const authResult = await requireAuth(c, async () => {
    const env = c.env;
    const startTime = Date.now();

    let body;
    try {
      body = NilImportRequestSchema.parse(await c.req.json());
    } catch (e) {
      return c.json(
        {
          error: "Invalid request body",
          details: e instanceof z.ZodError ? e.errors : undefined,
        },
        400
      );
    }

    let dealsInserted = 0;
    let valuationsInserted = 0;
    const errors: string[] = [];

    // Import deals
    if (body.deals && body.deals.length > 0) {
      for (const deal of body.deals) {
        try {
          const dealId = generateId("nil_deal");

          // Try to resolve player ID if not provided
          let playerId = deal.playerId;
          if (!playerId && deal.playerName) {
            // Search for player by name (this is a fallback - prefer IDs)
            const result = await env.BSI_DB.prepare(
              "SELECT id FROM college_baseball_players WHERE name = ? LIMIT 1"
            )
              .bind(deal.playerName)
              .first<{ id: string }>();
            playerId = result?.id;
          }

          if (!playerId) {
            errors.push("Could not resolve player for deal: " + deal.playerName);
            continue;
          }

          // Get team ID from player
          const player = await env.BSI_DB.prepare(
            "SELECT team_id FROM college_baseball_players WHERE id = ?"
          )
            .bind(playerId)
            .first<{ team_id: string }>();

          await env.BSI_DB.prepare(
            `INSERT INTO nil_deals (id, player_id, team_id, brand_name, deal_type, deal_value, deal_value_tier, announced_date, source, source_url, verified, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "active", datetime("now"), datetime("now"))`
          )
            .bind(
              dealId,
              playerId,
              player?.team_id ?? "",
              deal.brandName,
              deal.dealType,
              deal.dealValue ?? null,
              deal.dealValueTier ?? null,
              deal.announcedDate ?? null,
              deal.source,
              deal.sourceUrl ?? null,
              deal.verified ? 1 : 0
            )
            .run();

          dealsInserted++;
        } catch (e) {
          errors.push("Failed to insert deal: " + (e instanceof Error ? e.message : "unknown"));
        }
      }
    }

    // Import valuations
    if (body.valuations && body.valuations.length > 0) {
      for (const valuation of body.valuations) {
        try {
          let playerId = valuation.playerId;
          if (!playerId && valuation.playerName) {
            const result = await env.BSI_DB.prepare(
              "SELECT id FROM college_baseball_players WHERE name = ? LIMIT 1"
            )
              .bind(valuation.playerName)
              .first<{ id: string }>();
            playerId = result?.id;
          }

          if (!playerId) {
            errors.push("Could not resolve player for valuation: " + valuation.playerName);
            continue;
          }

          const player = await env.BSI_DB.prepare(
            "SELECT team_id FROM college_baseball_players WHERE id = ?"
          )
            .bind(playerId)
            .first<{ team_id: string }>();

          await env.BSI_DB.prepare(
            `INSERT OR REPLACE INTO nil_valuations 
             (player_id, team_id, estimated_value, value_range_low, value_range_high, social_following, instagram_followers, twitter_followers, tiktok_followers, engagement_rate, marketability_score, performance_score, source, last_updated, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))`
          )
            .bind(
              playerId,
              player?.team_id ?? "",
              valuation.estimatedValue ?? null,
              valuation.valueRangeLow ?? null,
              valuation.valueRangeHigh ?? null,
              valuation.socialFollowing ?? null,
              valuation.instagramFollowers ?? null,
              valuation.twitterFollowers ?? null,
              valuation.tiktokFollowers ?? null,
              valuation.engagementRate ?? null,
              valuation.marketabilityScore ?? null,
              valuation.performanceScore ?? null,
              valuation.source
            )
            .run();

          valuationsInserted++;
        } catch (e) {
          errors.push("Failed to insert valuation: " + (e instanceof Error ? e.message : "unknown"));
        }
      }
    }

    const durationMs = Date.now() - startTime;

    await logSync(env.BSI_DB, {
      worker: "bsi-cbb-sync",
      source: "manual",
      entityType: "nil",
      operation: "import",
      status: errors.length > 0 ? "partial" : "success",
      recordsFetched: (body.deals?.length ?? 0) + (body.valuations?.length ?? 0),
      recordsInserted: dealsInserted + valuationsInserted,
      recordsUpdated: 0,
      recordsSkipped: errors.length,
      errorMessage: errors.length > 0 ? errors.join("; ") : undefined,
      durationMs,
    });

    return c.json({
      success: true,
      dealsInserted,
      valuationsInserted,
      errors: errors.length > 0 ? errors : undefined,
      durationMs,
    });
  });

  return authResult;
});

// =============================================================================
// SYNC FUNCTIONS
// =============================================================================

async function syncNcaaScoreboard(env: CbbEnv, provider: NcaaProvider): Promise<SyncResult> {
  const startTime = Date.now();
  let recordsFetched = 0;
  let recordsInserted = 0;
  let recordsUpdated = 0;
  let recordsSkipped = 0;
  const errors: string[] = [];

  try {
    const scoreboard = await provider.getScoreboard();
    recordsFetched = scoreboard.events.length;

    for (const event of scoreboard.events) {
      try {
        const gameId = await getEntityIdFromSource(env.BSI_DB, "game", "ncaa", event.id);

        if (gameId) {
          // Update existing game
          const competition = event.competitions?.[0];
          const home = competition?.competitors?.find((c) => c.homeAway === "home");
          const away = competition?.competitors?.find((c) => c.homeAway === "away");

          await env.BSI_DB.prepare(
            `UPDATE college_baseball_games 
             SET status = ?, home_score = ?, away_score = ?, 
                 inning = ?, updated_at = datetime("now")
             WHERE id = ?`
          )
            .bind(
              mapNcaaStatus(event.status?.type?.state),
              home?.score ? parseInt(home.score, 10) : null,
              away?.score ? parseInt(away.score, 10) : null,
              event.status?.period ?? null,
              gameId
            )
            .run();

          recordsUpdated++;
        } else {
          // New game - need to resolve team IDs first
          const competition = event.competitions?.[0];
          if (!competition) {
            recordsSkipped++;
            continue;
          }

          const home = competition.competitors?.find((c) => c.homeAway === "home");
          const away = competition.competitors?.find((c) => c.homeAway === "away");

          if (!home?.team?.id || !away?.team?.id) {
            recordsSkipped++;
            continue;
          }

          const homeTeamId = await getOrCreateTeamFromNcaa(env, home.team);
          const awayTeamId = await getOrCreateTeamFromNcaa(env, away.team);

          const newGameId = generateId("game");

          await env.BSI_DB.prepare(
            `INSERT INTO college_baseball_games 
             (id, date, time, home_team_id, away_team_id, home_score, away_score, status, 
              inning, venue, ncaa_id, season, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`
          )
            .bind(
              newGameId,
              event.date.split("T")[0] ?? "",
              event.date.includes("T") ? event.date.split("T")[1] ?? "".substring(0, 5) : null,
              homeTeamId,
              awayTeamId,
              home.score ? parseInt(home.score, 10) : null,
              away.score ? parseInt(away.score, 10) : null,
              mapNcaaStatus(event.status?.type?.state),
              event.status?.period ?? null,
              competition.venue?.fullName ?? null,
              event.id,
              event.season ?? 2025
            )
            .run();

          // Create entity source mapping
          await upsertEntitySource(env.BSI_DB, {
            entityType: "game",
            entityId: newGameId,
            source: "ncaa",
            sourceId: event.id,
          });

          recordsInserted++;
        }
      } catch (e) {
        errors.push("Game " + event.id + ": " + (e instanceof Error ? e.message : "unknown"));
        recordsSkipped++;
      }
    }
  } catch (e) {
    errors.push("Scoreboard fetch failed: " + (e instanceof Error ? e.message : "unknown"));
  }

  const durationMs = Date.now() - startTime;

  await logSync(env.BSI_DB, {
    worker: "bsi-cbb-sync",
    source: "ncaa",
    entityType: "scoreboard",
    operation: "sync",
    status: errors.length > 0 ? "partial" : "success",
    recordsFetched,
    recordsInserted,
    recordsUpdated,
    recordsSkipped,
    errorMessage: errors.length > 0 ? errors.slice(0, 5).join("; ") : undefined,
    durationMs,
  });

  return {
    source: "ncaa",
    entityType: "scoreboard",
    operation: "sync",
    status: errors.length > 0 ? "partial" : "success",
    recordsFetched,
    recordsInserted,
    recordsUpdated,
    recordsSkipped,
    errors: errors.length > 0 ? errors : undefined,
    durationMs,
  };
}

async function syncHighlightlyTeams(env: CbbEnv, provider: HighlightlyProvider): Promise<SyncResult> {
  const startTime = Date.now();
  let recordsFetched = 0;
  let recordsInserted = 0;
  let recordsUpdated = 0;
  let recordsSkipped = 0;
  const errors: string[] = [];

  try {
    const teams = await provider.getTeams();
    recordsFetched = teams.length;

    for (const team of teams) {
      try {
        const existingId = await getEntityIdFromSource(env.BSI_DB, "team", "highlightly", team.id);

        if (existingId) {
          // Update existing
          await env.BSI_DB.prepare(
            `UPDATE college_baseball_teams 
             SET name = ?, abbreviation = ?, primary_color = ?, secondary_color = ?, 
                 highlightly_id = ?, updated_at = datetime("now")
             WHERE id = ?`
          )
            .bind(
              team.name,
              team.abbreviation ?? null,
              team.teamColors?.primary ?? null,
              team.teamColors?.secondary ?? null,
              team.id,
              existingId
            )
            .run();

          recordsUpdated++;
        } else {
          // Check if team exists by name (fuzzy match)
          const existing = await env.BSI_DB.prepare(
            "SELECT id FROM college_baseball_teams WHERE name = ? OR abbreviation = ?"
          )
            .bind(team.name, team.shortName ?? "")
            .first<{ id: string }>();

          if (existing) {
            // Link existing team to Highlightly
            await env.BSI_DB.prepare(
              "UPDATE college_baseball_teams SET highlightly_id = ?, updated_at = datetime(\"now\") WHERE id = ?"
            )
              .bind(team.id, existing.id)
              .run();

            await upsertEntitySource(env.BSI_DB, {
              entityType: "team",
              entityId: existing.id,
              source: "highlightly",
              sourceId: team.id,
            });

            recordsUpdated++;
          } else {
            // Create new team
            const newTeamId = generateId("team");

            await env.BSI_DB.prepare(
              `INSERT INTO college_baseball_teams 
               (id, name, abbreviation, conference, primary_color, secondary_color, highlightly_id, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))`
            )
              .bind(
                newTeamId,
                team.name,
                team.abbreviation ?? team.shortName ?? null,
                team.tournament?.name ?? "Unknown",
                team.teamColors?.primary ?? null,
                team.teamColors?.secondary ?? null,
                team.id
              )
              .run();

            await upsertEntitySource(env.BSI_DB, {
              entityType: "team",
              entityId: newTeamId,
              source: "highlightly",
              sourceId: team.id,
            });

            recordsInserted++;
          }
        }
      } catch (e) {
        errors.push("Team " + team.id + ": " + (e instanceof Error ? e.message : "unknown"));
        recordsSkipped++;
      }
    }
  } catch (e) {
    errors.push("Teams fetch failed: " + (e instanceof Error ? e.message : "unknown"));
  }

  const durationMs = Date.now() - startTime;

  await logSync(env.BSI_DB, {
    worker: "bsi-cbb-sync",
    source: "highlightly",
    entityType: "teams",
    operation: "sync",
    status: errors.length > 0 ? "partial" : "success",
    recordsFetched,
    recordsInserted,
    recordsUpdated,
    recordsSkipped,
    errorMessage: errors.length > 0 ? errors.slice(0, 5).join("; ") : undefined,
    durationMs,
  });

  return {
    source: "highlightly",
    entityType: "teams",
    operation: "sync",
    status: errors.length > 0 ? "partial" : "success",
    recordsFetched,
    recordsInserted,
    recordsUpdated,
    recordsSkipped,
    errors: errors.length > 0 ? errors : undefined,
    durationMs,
  };
}

async function syncHighlightlyMatches(env: CbbEnv, provider: HighlightlyProvider): Promise<SyncResult> {
  const startTime = Date.now();
  let recordsFetched = 0;
  let recordsInserted = 0;
  let recordsUpdated = 0;
  let recordsSkipped = 0;
  const errors: string[] = [];

  try {
    // Get today matches
    const today = new Date().toISOString().split("T")[0] ?? "";
    const matches = await provider.getMatchesByDate(today);
    recordsFetched = matches.length;

    for (const match of matches) {
      try {
        const existingId = await getEntityIdFromSource(env.BSI_DB, "game", "highlightly", match.id);

        const scores = parseScoreFromState(match.state?.score as Record<string, unknown> | undefined);
        if (existingId) {
          // Update existing
          await env.BSI_DB.prepare(
            `UPDATE college_baseball_games 
             SET status = ?, home_score = ?, away_score = ?, updated_at = datetime("now")
             WHERE id = ?`
          )
            .bind(
              mapHighlightlyStateDescription(match.state?.description),
              scores.home,
              scores.away,
              existingId
            )
            .run();

          recordsUpdated++;
        } else {
          // Need to resolve team IDs
          if (!match.homeTeam?.id || !match.awayTeam?.id) {
            recordsSkipped++;
            continue;
          }

          const homeTeamId = await getEntityIdFromSource(env.BSI_DB, "team", "highlightly", match.homeTeam.id);
          const awayTeamId = await getEntityIdFromSource(env.BSI_DB, "team", "highlightly", match.awayTeam.id);

          if (!homeTeamId || !awayTeamId) {
            recordsSkipped++;
            errors.push("Match " + match.id + ": Could not resolve team IDs");
            continue;
          }

          const newGameId = generateId("game");
          const gameDate = new Date(match.date);

          await env.BSI_DB.prepare(
            `INSERT INTO college_baseball_games 
             (id, date, time, home_team_id, away_team_id, home_score, away_score, status, 
              venue, highlightly_id, season, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`
          )
            .bind(
              newGameId,
              gameDate.toISOString().split("T")[0] ?? "",
              gameDate.toISOString().split("T")[1] ?? "".substring(0, 5),
              homeTeamId,
              awayTeamId,
              scores.home,
              scores.away,
              mapHighlightlyStateDescription(match.state?.description),
              null,
              match.id,
              match.season ?? 2025
            )
            .run();

          await upsertEntitySource(env.BSI_DB, {
            entityType: "game",
            entityId: newGameId,
            source: "highlightly",
            sourceId: match.id,
          });

          recordsInserted++;
        }
      } catch (e) {
        errors.push("Match " + match.id + ": " + (e instanceof Error ? e.message : "unknown"));
        recordsSkipped++;
      }
    }
  } catch (e) {
    errors.push("Matches fetch failed: " + (e instanceof Error ? e.message : "unknown"));
  }

  const durationMs = Date.now() - startTime;

  await logSync(env.BSI_DB, {
    worker: "bsi-cbb-sync",
    source: "highlightly",
    entityType: "matches",
    operation: "sync",
    status: errors.length > 0 ? "partial" : "success",
    recordsFetched,
    recordsInserted,
    recordsUpdated,
    recordsSkipped,
    errorMessage: errors.length > 0 ? errors.slice(0, 5).join("; ") : undefined,
    durationMs,
  });

  return {
    source: "highlightly",
    entityType: "matches",
    operation: "sync",
    status: errors.length > 0 ? "partial" : "success",
    recordsFetched,
    recordsInserted,
    recordsUpdated,
    recordsSkipped,
    errors: errors.length > 0 ? errors : undefined,
    durationMs,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function getOrCreateTeamFromNcaa(env: CbbEnv, ncaaTeam: any): Promise<string> {
  // Check if we have this NCAA team mapped
  const existingId = await getEntityIdFromSource(env.BSI_DB, "team", "ncaa", ncaaTeam.id);
        if (existingId) {
    return existingId;
  }

  // Check if team exists by name
  const existing = await env.BSI_DB.prepare(
    "SELECT id FROM college_baseball_teams WHERE name = ? OR abbreviation = ?"
  )
    .bind(ncaaTeam.school ?? ncaaTeam.name, ncaaTeam.abbreviation ?? "")
    .first<{ id: string }>();

  if (existing) {
    // Link to NCAA
    await env.BSI_DB.prepare(
      "UPDATE college_baseball_teams SET ncaa_id = ?, updated_at = datetime(\"now\") WHERE id = ?"
    )
      .bind(ncaaTeam.id, existing.id)
      .run();

    await upsertEntitySource(env.BSI_DB, {
      entityType: "team",
      entityId: existing.id,
      source: "ncaa",
      sourceId: ncaaTeam.id,
    });

    return existing.id;
  }

  // Create new team
  const newTeamId = generateId("team");

  await env.BSI_DB.prepare(
    `INSERT INTO college_baseball_teams 
     (id, name, abbreviation, conference, primary_color, secondary_color, logo_url, ncaa_id, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`
  )
    .bind(
      newTeamId,
      ncaaTeam.school ?? ncaaTeam.name,
      ncaaTeam.abbreviation ?? null,
      ncaaTeam.conference ?? "Unknown",
      ncaaTeam.color ?? null,
      ncaaTeam.alternateColor ?? null,
      ncaaTeam.logo ?? null,
      ncaaTeam.id
    )
    .run();

  await upsertEntitySource(env.BSI_DB, {
    entityType: "team",
    entityId: newTeamId,
    source: "ncaa",
    sourceId: ncaaTeam.id,
  });

  return newTeamId;
}

function mapNcaaStatus(state: string | undefined): string {
  switch (state) {
    case "pre":
      return "scheduled";
    case "in":
      return "in_progress";
    case "post":
      return "final";
    case "postponed":
      return "postponed";
    case "canceled":
      return "canceled";
    default:
      return "scheduled";
  }
}

// Map state.description string to game status
function mapHighlightlyStateDescription(description: string | undefined): string {
  if (!description) return "scheduled";
  const desc = description.toLowerCase();
  if (desc === "finished") return "final";
  if (desc === "scheduled") return "scheduled";
  if (desc.includes("in progress") || desc.includes("live")) return "in_progress";
  if (desc.includes("postponed")) return "postponed";
  if (desc.includes("canceled") || desc.includes("cancelled")) return "canceled";
  if (desc.includes("delayed")) return "delayed";
  return "scheduled";
}

// Parse score from "26 - 24" format  
function parseScoreFromState(score: Record<string, unknown> | undefined): { home: number | null; away: number | null } {
  if (!score || typeof score.current !== "string") return { home: null, away: null };
  const parts = (score.current as string).split(" - ");
  if (parts.length !== 2) return { home: null, away: null };
  const homeStr = parts[0] ?? "";
  const awayStr = parts[1] ?? "";
  const home = parseInt(homeStr, 10);
  const away = parseInt(awayStr, 10);
  return { home: isNaN(home) ? null : home, away: isNaN(away) ? null : away };
}

// =============================================================================
// SEASON GATING
// =============================================================================

function isInSeason(): boolean {
  const month = new Date().getMonth() + 1; // 1-12
  // College baseball season: February through June
  return month >= 2 && month <= 6;
}

// =============================================================================
// SCHEDULED HANDLER
// =============================================================================

export default {
  fetch: app.fetch,

  async scheduled(_event: ScheduledEvent, env: CbbEnv, _ctx: ExecutionContext) {
    // Season gating: only run frequent syncs during season unless enabled
    const inSeason = isInSeason();
    const forceOffseason = env.ENABLE_OFFSEASON_SYNC === "true";

    if (!inSeason && !forceOffseason) {
      console.log("Off-season, skipping scheduled sync");
      return;
    }

    const providers = createProviders(env);

    // Always sync NCAA scoreboard (primary live data source)
    const ncaaResult = await syncNcaaScoreboard(env, providers.ncaa);
    console.log("NCAA sync complete:", ncaaResult.status, ncaaResult.recordsUpdated, "updated");

    // Sync Highlightly if configured (less frequently)
    if (providers.highlightly) {
      // Only sync Highlightly teams once per day (check last sync time)
      const lastTeamSync = await getLatestSync(env.BSI_DB, "highlightly", "teams");
      const lastTeamSyncTime = lastTeamSync ? new Date(lastTeamSync.startedAt).getTime() : 0;
      const hoursSinceTeamSync = (Date.now() - lastTeamSyncTime) / (1000 * 60 * 60);

      if (hoursSinceTeamSync >= 24) {
        const teamsResult = await syncHighlightlyTeams(env, providers.highlightly);
        console.log("Highlightly teams sync complete:", teamsResult.status);
      }

      // Sync matches every hour
      const lastMatchSync = await getLatestSync(env.BSI_DB, "highlightly", "matches");
      const lastMatchSyncTime = lastMatchSync ? new Date(lastMatchSync.startedAt).getTime() : 0;
      const hoursSinceMatchSync = (Date.now() - lastMatchSyncTime) / (1000 * 60 * 60);

      if (hoursSinceMatchSync >= 1) {
        const matchesResult = await syncHighlightlyMatches(env, providers.highlightly);
        console.log("Highlightly matches sync complete:", matchesResult.status);
      }
    }
  },
};
