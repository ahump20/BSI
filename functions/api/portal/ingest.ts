/* eslint-disable no-undef */
/**
 * Transfer Portal Ingestion Endpoint
 *
 * Accepts new/updated portal entries, stores raw snapshot in R2,
 * writes normalized record to D1, updates KV freshness marker,
 * and creates changelog events.
 *
 * POST /api/portal/ingest
 * Body: { entries: PortalIngestEntry[] }
 *
 * Called by scheduled workers or webhook handlers.
 * Not public-facing — should be gated by auth header in production.
 */

interface Env {
  GAME_DB: D1Database;
  KV: KVNamespace;
  SPORTS_DATA: R2Bucket;
}

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

interface IngestEntry {
  id: string;
  player_name: string;
  sport: 'baseball' | 'football';
  position: string;
  class_year?: string;
  from_team: string;
  to_team?: string | null;
  from_conference?: string;
  to_conference?: string | null;
  status: string;
  portal_date: string;
  commitment_date?: string | null;
  stats_json?: string;
  engagement_score?: number;
  stars?: number | null;
  overall_rank?: number | null;
  source_url?: string;
  source_id?: string;
  source_name: string;
  source_confidence?: number;
}

function generateChangelogId(): string {
  return `cl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST required' }), {
      status: 405,
      headers: HEADERS,
    });
  }

  // Auth gate: require Authorization header or internal cron header
  const authHeader = request.headers.get('Authorization');
  const cronHeader = request.headers.get('X-BSI-Cron');
  if (!authHeader && !cronHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: HEADERS,
    });
  }

  try {
    const body = (await request.json()) as { entries?: IngestEntry[] };
    if (!body.entries || !Array.isArray(body.entries) || body.entries.length === 0) {
      return new Response(JSON.stringify({ error: 'Body must contain entries array' }), {
        status: 400,
        headers: HEADERS,
      });
    }

    const now = new Date().toISOString();
    const db = env.GAME_DB;

    // Store raw snapshot in R2
    const snapshotKey = `portal/snapshots/ingest-${Date.now()}.json`;
    await env.SPORTS_DATA.put(
      snapshotKey,
      JSON.stringify({
        ingested_at: now,
        entry_count: body.entries.length,
        raw: body.entries,
      })
    );

    let inserted = 0;
    let updated = 0;
    const changelogBatch: D1PreparedStatement[] = [];

    const changeStmt = db.prepare(`
      INSERT INTO transfer_portal_changelog (id, portal_entry_id, change_type, description, old_value, new_value, event_timestamp, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
    `);

    for (const entry of body.entries) {
      // Check if entry exists
      const existing = await db
        .prepare('SELECT id, status, to_team FROM transfer_portal WHERE id = ?1')
        .bind(entry.id)
        .first<{ id: string; status: string; to_team: string | null }>();

      if (existing) {
        // Update existing
        await db
          .prepare(
            `
          UPDATE transfer_portal SET
            player_name = ?2, status = ?3, to_team = ?4, to_conference = ?5,
            commitment_date = ?6, stats_json = ?7, engagement_score = ?8,
            source_url = ?9, source_confidence = ?10, last_verified_at = ?11,
            updated_at = ?11, raw_snapshot_key = ?12
          WHERE id = ?1
        `
          )
          .bind(
            entry.id,
            entry.player_name,
            entry.status,
            entry.to_team || null,
            entry.to_conference || null,
            entry.commitment_date || null,
            entry.stats_json || null,
            entry.engagement_score || null,
            entry.source_url || null,
            entry.source_confidence ?? 1.0,
            now,
            snapshotKey
          )
          .run();

        // Detect status change for changelog
        if (existing.status !== entry.status) {
          changelogBatch.push(
            changeStmt.bind(
              generateChangelogId(),
              entry.id,
              entry.status,
              `${entry.player_name} ${entry.status === 'committed' ? 'committed to ' + (entry.to_team || 'TBD') : entry.status}`,
              existing.status,
              entry.status,
              now,
              now
            )
          );
        }
        updated++;
      } else {
        // Insert new
        await db
          .prepare(
            `
          INSERT INTO transfer_portal (
            id, player_name, sport, position, class_year,
            from_team, to_team, from_conference, to_conference,
            status, event_timestamp, portal_date, commitment_date,
            stats_json, engagement_score, stars, overall_rank,
            source_url, source_id, source_name,
            is_partial, needs_review, source_confidence, verified,
            raw_snapshot_key, last_verified_at, created_at, updated_at
          ) VALUES (
            ?1, ?2, ?3, ?4, ?5,
            ?6, ?7, ?8, ?9,
            ?10, ?11, ?12, ?13,
            ?14, ?15, ?16, ?17,
            ?18, ?19, ?20,
            0, 0, ?21, 0,
            ?22, ?23, ?23, ?23
          )
        `
          )
          .bind(
            entry.id,
            entry.player_name,
            entry.sport,
            entry.position,
            entry.class_year || 'Jr',
            entry.from_team,
            entry.to_team || null,
            entry.from_conference || '',
            entry.to_conference || null,
            entry.status,
            now,
            entry.portal_date,
            entry.commitment_date || null,
            entry.stats_json || null,
            entry.engagement_score || null,
            entry.stars || null,
            entry.overall_rank || null,
            entry.source_url || null,
            entry.source_id || null,
            entry.source_name,
            entry.source_confidence ?? 1.0,
            snapshotKey,
            now
          )
          .run();

        changelogBatch.push(
          changeStmt.bind(
            generateChangelogId(),
            entry.id,
            'entered',
            `${entry.player_name} entered the transfer portal from ${entry.from_team}`,
            null,
            entry.from_team,
            now,
            now
          )
        );
        inserted++;
      }
    }

    // Batch insert changelog events
    if (changelogBatch.length > 0) {
      await db.batch(changelogBatch);
    }

    // Update KV freshness marker
    await env.KV.put('portal:last_updated', now);

    return new Response(
      JSON.stringify({
        success: true,
        inserted,
        updated,
        changelog_events: changelogBatch.length,
        snapshot_key: snapshotKey,
        timestamp: now,
      }),
      { headers: HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: HEADERS });
  }
};
