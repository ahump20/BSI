/**
 * BSI Portal Database - Cloudflare D1 Integration
 *
 * Schema and operations for storing transfer portal intelligence.
 * Designed for the D1 database: bsi-portal-db
 */

import { z } from "zod";

// -----------------------------------------------------------------------------
// Schema Definitions
// -----------------------------------------------------------------------------

/**
 * SQL schema for portal entries table.
 * Run this via wrangler d1 to initialize.
 */
export const PORTAL_SCHEMA = `
-- Portal entries table
CREATE TABLE IF NOT EXISTS portal_entries (
  id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  school_from TEXT,
  school_to TEXT,
  position TEXT,
  conference TEXT,
  class_year TEXT,

  -- Source tracking
  source TEXT NOT NULL,
  source_id TEXT,
  source_url TEXT,

  -- Timestamps
  portal_date TEXT NOT NULL,
  discovered_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  -- Status
  status TEXT DEFAULT 'in_portal',

  -- Engagement metrics (from Twitter)
  engagement_score INTEGER DEFAULT 0,

  -- Generated content
  profile_generated INTEGER DEFAULT 0,
  alerts_sent INTEGER DEFAULT 0,

  -- Indexes
  UNIQUE(player_name, school_from, portal_date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_portal_status ON portal_entries(status);
CREATE INDEX IF NOT EXISTS idx_portal_conference ON portal_entries(conference);
CREATE INDEX IF NOT EXISTS idx_portal_date ON portal_entries(portal_date);
CREATE INDEX IF NOT EXISTS idx_portal_school ON portal_entries(school_from);

-- Player profiles table
CREATE TABLE IF NOT EXISTS player_profiles (
  id TEXT PRIMARY KEY,
  portal_entry_id TEXT NOT NULL,

  -- Stats
  batting_avg TEXT,
  era TEXT,
  home_runs INTEGER,
  rbis INTEGER,
  strikeouts INTEGER,
  innings_pitched TEXT,

  -- Scouting
  scouting_grade TEXT,
  strengths TEXT,
  weaknesses TEXT,

  -- Generated content
  summary TEXT,
  analysis TEXT,
  comparison_players TEXT,

  -- Timestamps
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  FOREIGN KEY (portal_entry_id) REFERENCES portal_entries(id)
);

-- Alert history table
CREATE TABLE IF NOT EXISTS alert_history (
  id TEXT PRIMARY KEY,
  portal_entry_id TEXT NOT NULL,

  -- Alert details
  channel TEXT NOT NULL,
  recipient TEXT,
  message TEXT NOT NULL,

  -- Status
  sent_at TEXT NOT NULL,
  delivered INTEGER DEFAULT 0,
  opened INTEGER DEFAULT 0,

  FOREIGN KEY (portal_entry_id) REFERENCES portal_entries(id)
);

CREATE INDEX IF NOT EXISTS idx_alerts_entry ON alert_history(portal_entry_id);
CREATE INDEX IF NOT EXISTS idx_alerts_channel ON alert_history(channel);
`;

// -----------------------------------------------------------------------------
// Zod Schemas for Validation
// -----------------------------------------------------------------------------

export const PortalEntrySchema = z.object({
  id: z.string(),
  player_name: z.string(),
  school_from: z.string().nullable(),
  school_to: z.string().nullable(),
  position: z.string().nullable(),
  conference: z.string().nullable(),
  class_year: z.string().nullable(),
  source: z.enum(["twitter", "d1baseball", "baseballamerica", "manual"]),
  source_id: z.string().nullable(),
  source_url: z.string().nullable(),
  portal_date: z.string(),
  discovered_at: z.string(),
  updated_at: z.string(),
  status: z.enum(["in_portal", "committed", "withdrawn", "unknown"]).default("in_portal"),
  engagement_score: z.number().default(0),
  profile_generated: z.boolean().default(false),
  alerts_sent: z.number().default(0),
});

export type PortalEntry = z.infer<typeof PortalEntrySchema>;

export const PlayerProfileSchema = z.object({
  id: z.string(),
  portal_entry_id: z.string(),
  batting_avg: z.string().nullable(),
  era: z.string().nullable(),
  home_runs: z.number().nullable(),
  rbis: z.number().nullable(),
  strikeouts: z.number().nullable(),
  innings_pitched: z.string().nullable(),
  scouting_grade: z.string().nullable(),
  strengths: z.string().nullable(),
  weaknesses: z.string().nullable(),
  summary: z.string().nullable(),
  analysis: z.string().nullable(),
  comparison_players: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type PlayerProfile = z.infer<typeof PlayerProfileSchema>;

// -----------------------------------------------------------------------------
// D1 Database Interface
// -----------------------------------------------------------------------------

/**
 * D1 binding type for Cloudflare Workers.
 * This will be injected via wrangler.toml bindings.
 */
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  run(query: string): Promise<D1RunResult>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta?: Record<string, unknown>;
}

interface D1RunResult {
  count: number;
  duration: number;
}

// -----------------------------------------------------------------------------
// Database Operations
// -----------------------------------------------------------------------------

export class PortalDatabase {
  constructor(private db: D1Database) {}

  /**
   * Initialize the database schema.
   */
  async initialize(): Promise<void> {
    await this.db.run(PORTAL_SCHEMA);
  }

  /**
   * Insert a new portal entry.
   */
  async insertEntry(entry: Omit<PortalEntry, "id" | "discovered_at" | "updated_at">): Promise<PortalEntry> {
    const now = new Date().toISOString();
    const id = `portal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const fullEntry: PortalEntry = {
      ...entry,
      id,
      discovered_at: now,
      updated_at: now,
    };

    await this.db
      .prepare(
        `INSERT INTO portal_entries (
          id, player_name, school_from, school_to, position, conference, class_year,
          source, source_id, source_url, portal_date, discovered_at, updated_at,
          status, engagement_score, profile_generated, alerts_sent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        fullEntry.id,
        fullEntry.player_name,
        fullEntry.school_from,
        fullEntry.school_to,
        fullEntry.position,
        fullEntry.conference,
        fullEntry.class_year,
        fullEntry.source,
        fullEntry.source_id,
        fullEntry.source_url,
        fullEntry.portal_date,
        fullEntry.discovered_at,
        fullEntry.updated_at,
        fullEntry.status,
        fullEntry.engagement_score,
        fullEntry.profile_generated ? 1 : 0,
        fullEntry.alerts_sent
      )
      .run();

    return fullEntry;
  }

  /**
   * Upsert a portal entry (insert or update if exists).
   */
  async upsertEntry(entry: Omit<PortalEntry, "id" | "discovered_at" | "updated_at">): Promise<{
    entry: PortalEntry;
    isNew: boolean;
  }> {
    // Check if entry already exists
    const existing = await this.findByPlayerAndSchool(entry.player_name, entry.school_from || "");

    if (existing) {
      // Update existing
      const updated = await this.updateEntry(existing.id, {
        ...entry,
        updated_at: new Date().toISOString(),
      });
      return { entry: updated || existing, isNew: false };
    } else {
      // Insert new
      const newEntry = await this.insertEntry(entry);
      return { entry: newEntry, isNew: true };
    }
  }

  /**
   * Find entry by player name and school.
   */
  async findByPlayerAndSchool(playerName: string, schoolFrom: string): Promise<PortalEntry | null> {
    const result = await this.db
      .prepare(
        `SELECT * FROM portal_entries
         WHERE LOWER(player_name) = LOWER(?)
         AND LOWER(school_from) = LOWER(?)`
      )
      .bind(playerName, schoolFrom)
      .first<PortalEntry>();

    return result || null;
  }

  /**
   * Get entry by ID.
   */
  async getById(id: string): Promise<PortalEntry | null> {
    const result = await this.db
      .prepare("SELECT * FROM portal_entries WHERE id = ?")
      .bind(id)
      .first<PortalEntry>();

    return result || null;
  }

  /**
   * Update an existing entry.
   */
  async updateEntry(id: string, updates: Partial<PortalEntry>): Promise<PortalEntry | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    const allowedFields = [
      "school_to",
      "status",
      "engagement_score",
      "profile_generated",
      "alerts_sent",
      "updated_at",
    ];

    for (const field of allowedFields) {
      if (field in updates) {
        fields.push(`${field} = ?`);
        values.push(updates[field as keyof typeof updates]);
      }
    }

    if (fields.length === 0) return this.getById(id);

    // Always update updated_at
    if (!fields.includes("updated_at = ?")) {
      fields.push("updated_at = ?");
      values.push(new Date().toISOString());
    }

    values.push(id);

    await this.db
      .prepare(`UPDATE portal_entries SET ${fields.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    return this.getById(id);
  }

  /**
   * Get recent portal entries.
   */
  async getRecentEntries(options: {
    limit?: number;
    status?: PortalEntry["status"];
    conference?: string;
    since?: string;
  } = {}): Promise<PortalEntry[]> {
    const { limit = 50, status, conference, since } = options;

    let query = "SELECT * FROM portal_entries WHERE 1=1";
    const params: unknown[] = [];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    if (conference) {
      query += " AND LOWER(conference) = LOWER(?)";
      params.push(conference);
    }

    if (since) {
      query += " AND portal_date >= ?";
      params.push(since);
    }

    query += " ORDER BY portal_date DESC LIMIT ?";
    params.push(limit);

    const result = await this.db.prepare(query).bind(...params).all<PortalEntry>();

    return result.results || [];
  }

  /**
   * Get entries needing profile generation.
   */
  async getEntriesNeedingProfiles(limit: number = 10): Promise<PortalEntry[]> {
    const result = await this.db
      .prepare(
        `SELECT * FROM portal_entries
         WHERE profile_generated = 0
         ORDER BY engagement_score DESC, discovered_at DESC
         LIMIT ?`
      )
      .bind(limit)
      .all<PortalEntry>();

    return result.results || [];
  }

  /**
   * Get entries needing alerts.
   */
  async getEntriesNeedingAlerts(limit: number = 10): Promise<PortalEntry[]> {
    const result = await this.db
      .prepare(
        `SELECT * FROM portal_entries
         WHERE alerts_sent = 0
         AND status = 'in_portal'
         ORDER BY engagement_score DESC, discovered_at DESC
         LIMIT ?`
      )
      .bind(limit)
      .all<PortalEntry>();

    return result.results || [];
  }

  /**
   * Get portal statistics.
   */
  async getStats(): Promise<{
    total: number;
    inPortal: number;
    committed: number;
    byConference: Record<string, number>;
    last24Hours: number;
    last7Days: number;
  }> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [total, inPortal, committed, last24, last7, conferences] = await this.db.batch([
      this.db.prepare("SELECT COUNT(*) as count FROM portal_entries"),
      this.db.prepare("SELECT COUNT(*) as count FROM portal_entries WHERE status = 'in_portal'"),
      this.db.prepare("SELECT COUNT(*) as count FROM portal_entries WHERE status = 'committed'"),
      this.db.prepare("SELECT COUNT(*) as count FROM portal_entries WHERE discovered_at >= ?").bind(yesterday),
      this.db.prepare("SELECT COUNT(*) as count FROM portal_entries WHERE discovered_at >= ?").bind(lastWeek),
      this.db.prepare(
        "SELECT conference, COUNT(*) as count FROM portal_entries WHERE conference IS NOT NULL GROUP BY conference"
      ),
    ]);

    const byConference: Record<string, number> = {};
    for (const row of (conferences.results as { conference: string; count: number }[]) || []) {
      byConference[row.conference] = row.count;
    }

    return {
      total: (total.results?.[0] as { count: number })?.count || 0,
      inPortal: (inPortal.results?.[0] as { count: number })?.count || 0,
      committed: (committed.results?.[0] as { count: number })?.count || 0,
      byConference,
      last24Hours: (last24.results?.[0] as { count: number })?.count || 0,
      last7Days: (last7.results?.[0] as { count: number })?.count || 0,
    };
  }

  // -------------------------------------------------------------------------
  // Player Profile Operations
  // -------------------------------------------------------------------------

  async insertProfile(profile: Omit<PlayerProfile, "id" | "created_at" | "updated_at">): Promise<PlayerProfile> {
    const now = new Date().toISOString();
    const id = `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const fullProfile: PlayerProfile = {
      ...profile,
      id,
      created_at: now,
      updated_at: now,
    };

    await this.db
      .prepare(
        `INSERT INTO player_profiles (
          id, portal_entry_id, batting_avg, era, home_runs, rbis, strikeouts,
          innings_pitched, scouting_grade, strengths, weaknesses, summary,
          analysis, comparison_players, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        fullProfile.id,
        fullProfile.portal_entry_id,
        fullProfile.batting_avg,
        fullProfile.era,
        fullProfile.home_runs,
        fullProfile.rbis,
        fullProfile.strikeouts,
        fullProfile.innings_pitched,
        fullProfile.scouting_grade,
        fullProfile.strengths,
        fullProfile.weaknesses,
        fullProfile.summary,
        fullProfile.analysis,
        fullProfile.comparison_players,
        fullProfile.created_at,
        fullProfile.updated_at
      )
      .run();

    // Mark portal entry as having profile
    await this.updateEntry(profile.portal_entry_id, { profile_generated: true });

    return fullProfile;
  }

  async getProfileByEntryId(entryId: string): Promise<PlayerProfile | null> {
    const result = await this.db
      .prepare("SELECT * FROM player_profiles WHERE portal_entry_id = ?")
      .bind(entryId)
      .first<PlayerProfile>();

    return result || null;
  }

  // -------------------------------------------------------------------------
  // Alert History Operations
  // -------------------------------------------------------------------------

  async recordAlert(alert: {
    portal_entry_id: string;
    channel: string;
    recipient?: string;
    message: string;
  }): Promise<void> {
    const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await this.db
      .prepare(
        `INSERT INTO alert_history (id, portal_entry_id, channel, recipient, message, sent_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(id, alert.portal_entry_id, alert.channel, alert.recipient || null, alert.message, new Date().toISOString())
      .run();

    // Increment alerts_sent counter on portal entry
    await this.db
      .prepare("UPDATE portal_entries SET alerts_sent = alerts_sent + 1 WHERE id = ?")
      .bind(alert.portal_entry_id)
      .run();
  }

  async getAlertHistory(entryId: string): Promise<{ channel: string; sent_at: string; message: string }[]> {
    const result = await this.db
      .prepare("SELECT channel, sent_at, message FROM alert_history WHERE portal_entry_id = ? ORDER BY sent_at DESC")
      .bind(entryId)
      .all<{ channel: string; sent_at: string; message: string }>();

    return result.results || [];
  }
}

// -----------------------------------------------------------------------------
// Singleton Pattern for Worker Context
// -----------------------------------------------------------------------------

let dbInstance: PortalDatabase | null = null;

export function getDatabase(d1: D1Database): PortalDatabase {
  if (!dbInstance) {
    dbInstance = new PortalDatabase(d1);
  }
  return dbInstance;
}

// -----------------------------------------------------------------------------
// Migration Helper
// -----------------------------------------------------------------------------

export async function runMigrations(db: D1Database): Promise<void> {
  console.log("[Database] Running migrations...");
  await db.run(PORTAL_SCHEMA);
  console.log("[Database] Migrations complete");
}
