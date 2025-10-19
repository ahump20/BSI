// @ts-check
import { randomUUID } from 'crypto';
import { PrismaClient, Prisma } from '@prisma/client';

const globalRef = /** @type {Record<string, any>} */ (globalThis);

/** @type {PrismaClient} */
const prisma = globalRef.__bsiPrisma ?? new PrismaClient();
if (!globalRef.__bsiPrisma) {
  globalRef.__bsiPrisma = prisma;
}

const WATCHLIST_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS watchlist_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  team_slug TEXT,
  team_name TEXT NOT NULL,
  team_abbreviation TEXT,
  team_logo_url TEXT,
  alert_lead_changes BOOLEAN NOT NULL DEFAULT 1,
  alert_walk_offs BOOLEAN NOT NULL DEFAULT 1,
  alert_upset_odds BOOLEAN NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

const WATCHLIST_UNIQUE_SQL = `
CREATE UNIQUE INDEX IF NOT EXISTS watchlist_user_team_idx
ON watchlist_entries(user_id, team_id);
`;

let schemaReady = false;

/**
 * @param {PrismaClient} [client]
 */
export async function ensureWatchlistSchema(client = prisma) {
  if (schemaReady) {
    return;
  }

  await client.$executeRawUnsafe(WATCHLIST_TABLE_SQL);
  await client.$executeRawUnsafe(WATCHLIST_UNIQUE_SQL);
  schemaReady = true;
}

/**
 * @param {string} userId
 * @param {PrismaClient} [client]
 */
export async function getUserWatchlist(userId, client = prisma) {
  await ensureWatchlistSchema(client);

  const entries = await client.$queryRaw`
    SELECT
      id,
      user_id as "userId",
      team_id as "teamId",
      team_slug as "teamSlug",
      team_name as "teamName",
      team_abbreviation as "teamAbbreviation",
      team_logo_url as "teamLogoUrl",
      alert_lead_changes as "alertLeadChanges",
      alert_walk_offs as "alertWalkOffs",
      alert_upset_odds as "alertUpsetOdds"
    FROM watchlist_entries
    WHERE user_id = ${userId}
    ORDER BY team_name ASC
  `;

  const teamIds = entries.map((entry) => entry.teamId).filter(Boolean);

  let games = [];
  if (teamIds.length > 0) {
    games = await client.game.findMany({
      where: {
        OR: [
          { homeTeamId: { in: teamIds } },
          { awayTeamId: { in: teamIds } },
        ],
        status: { in: ['SCHEDULED', 'LIVE'] },
      },
      orderBy: [
        { scheduledAt: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 20,
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            slug: true,
            abbreviation: true,
            logoUrl: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            slug: true,
            abbreviation: true,
            logoUrl: true,
          },
        },
      },
    });
  }

  return { watchlist: entries, games };
}

/**
 * @param {string} userId
 * @param {{ teamId?: string; teamSlug?: string; alertLeadChanges?: boolean; alertWalkOffs?: boolean; alertUpsetOdds?: boolean }} payload
 * @param {PrismaClient} [client]
 */
export async function upsertWatchlistEntry(userId, payload, client = prisma) {
  await ensureWatchlistSchema(client);

  const { teamId, teamSlug } = payload;

  const team = teamId
    ? await client.team.findUnique({
        where: { id: teamId },
        select: { id: true, slug: true, name: true, abbreviation: true, logoUrl: true },
      })
    : teamSlug
    ? await client.team.findUnique({
        where: { slug: teamSlug },
        select: { id: true, slug: true, name: true, abbreviation: true, logoUrl: true },
      })
    : null;

  if (!team) {
    throw new Error('Team not found for watchlist entry');
  }

  const recordId = randomUUID();
  const alertLeadChanges = payload.alertLeadChanges ?? true;
  const alertWalkOffs = payload.alertWalkOffs ?? true;
  const alertUpsetOdds = payload.alertUpsetOdds ?? false;

  await client.$executeRaw`
    INSERT INTO watchlist_entries (
      id,
      user_id,
      team_id,
      team_slug,
      team_name,
      team_abbreviation,
      team_logo_url,
      alert_lead_changes,
      alert_walk_offs,
      alert_upset_odds,
      created_at,
      updated_at
    ) VALUES (
      ${recordId},
      ${userId},
      ${team.id},
      ${team.slug},
      ${team.name},
      ${team.abbreviation ?? null},
      ${team.logoUrl ?? null},
      ${alertLeadChanges},
      ${alertWalkOffs},
      ${alertUpsetOdds},
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT(user_id, team_id) DO UPDATE SET
      alert_lead_changes = excluded.alert_lead_changes,
      alert_walk_offs = excluded.alert_walk_offs,
      alert_upset_odds = excluded.alert_upset_odds,
      team_slug = excluded.team_slug,
      team_name = excluded.team_name,
      team_abbreviation = excluded.team_abbreviation,
      team_logo_url = excluded.team_logo_url,
      updated_at = CURRENT_TIMESTAMP
  `;

  const [entry] = await client.$queryRaw`
    SELECT
      id,
      user_id as "userId",
      team_id as "teamId",
      team_slug as "teamSlug",
      team_name as "teamName",
      team_abbreviation as "teamAbbreviation",
      team_logo_url as "teamLogoUrl",
      alert_lead_changes as "alertLeadChanges",
      alert_walk_offs as "alertWalkOffs",
      alert_upset_odds as "alertUpsetOdds"
    FROM watchlist_entries
    WHERE user_id = ${userId}
      AND team_id = ${team.id}
    LIMIT 1
  `;

  return entry;
}

/**
 * @param {string[]} teamIds
 * @param {PrismaClient} [client]
 */
export async function loadWatchlistEntriesForTeams(teamIds, client = prisma) {
  if (!teamIds || teamIds.length === 0) {
    return [];
  }

  await ensureWatchlistSchema(client);

  const rows = await client.$queryRaw`
    SELECT
      id,
      user_id as "userId",
      team_id as "teamId",
      team_slug as "teamSlug",
      team_name as "teamName",
      team_abbreviation as "teamAbbreviation",
      team_logo_url as "teamLogoUrl",
      alert_lead_changes as "alertLeadChanges",
      alert_walk_offs as "alertWalkOffs",
      alert_upset_odds as "alertUpsetOdds"
    FROM watchlist_entries
    WHERE team_id IN (${Prisma.join(teamIds)})
  `;

  return rows;
}

export { prisma };
