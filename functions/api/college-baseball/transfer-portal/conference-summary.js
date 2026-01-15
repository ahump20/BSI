/**
 * College Baseball Transfer Portal - Conference Summary
 * Returns conference-level transfer flow analysis
 *
 * Query params:
 * - conference: Filter to specific conference
 */

import { corsHeaders, ok, err } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const conference = url.searchParams.get('conference') || '';

    const db = env.GAME_DB;
    if (!db) {
      return err(new Error('Database not configured'), 500);
    }

    // Conference filter for both queries
    const confFilter = conference ? ` AND (to_conference = ? OR from_conference = ?)` : '';
    const confParams = conference ? [conference, conference] : [];

    // Get inbound transfers per conference
    const inboundQuery = `
      SELECT to_conference as conference, COUNT(*) as incoming
      FROM transfer_portal
      WHERE to_conference IS NOT NULL ${conference ? 'AND to_conference = ?' : ''}
      GROUP BY to_conference
    `;
    const inboundResults = await db.prepare(inboundQuery).bind(...(conference ? [conference] : [])).all();

    // Get outbound transfers per conference
    const outboundQuery = `
      SELECT from_conference as conference, COUNT(*) as outgoing
      FROM transfer_portal
      WHERE from_conference IS NOT NULL ${conference ? 'AND from_conference = ?' : ''}
      GROUP BY from_conference
    `;
    const outboundResults = await db.prepare(outboundQuery).bind(...(conference ? [conference] : [])).all();

    // Get top hitters per conference (avg > .300)
    const topHittersQuery = `
      SELECT
        to_conference as conference,
        player_name, from_school, to_school,
        stats_avg as avg, stats_hr as hr, stats_rbi as rbi
      FROM transfer_portal
      WHERE stats_avg > 0.300 AND to_conference IS NOT NULL
      ${conference ? 'AND to_conference = ?' : ''}
      ORDER BY stats_avg DESC
      LIMIT 25
    `;
    const topHitters = await db.prepare(topHittersQuery).bind(...(conference ? [conference] : [])).all();

    // Get top arms per conference (ERA < 3.00)
    const topArmsQuery = `
      SELECT
        to_conference as conference,
        player_name, from_school, to_school,
        stats_era as era, stats_strikeouts as strikeouts,
        stats_innings as innings_pitched, stats_wins as wins, stats_saves as saves
      FROM transfer_portal
      WHERE stats_era < 3.00 AND stats_era > 0 AND to_conference IS NOT NULL
      ${conference ? 'AND to_conference = ?' : ''}
      ORDER BY stats_era ASC
      LIMIT 25
    `;
    const topArms = await db.prepare(topArmsQuery).bind(...(conference ? [conference] : [])).all();

    // Merge inbound and outbound into conference summary
    const conferenceMap = new Map();

    for (const row of (inboundResults.results || [])) {
      conferenceMap.set(row.conference, {
        conference: row.conference,
        incoming: row.incoming,
        outgoing: 0,
        net: row.incoming
      });
    }

    for (const row of (outboundResults.results || [])) {
      if (conferenceMap.has(row.conference)) {
        const conf = conferenceMap.get(row.conference);
        conf.outgoing = row.outgoing;
        conf.net = conf.incoming - row.outgoing;
      } else {
        conferenceMap.set(row.conference, {
          conference: row.conference,
          incoming: 0,
          outgoing: row.outgoing,
          net: -row.outgoing
        });
      }
    }

    const conferenceSummary = Array.from(conferenceMap.values())
      .sort((a, b) => b.net - a.net);

    return ok({
      success: true,
      conferences: conferenceSummary,
      topHitters: topHitters.results || [],
      topArms: topArms.results || [],
      filter: conference || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[transfer-portal/conference-summary] Error:', error);
    return err(error, 500);
  }
}
