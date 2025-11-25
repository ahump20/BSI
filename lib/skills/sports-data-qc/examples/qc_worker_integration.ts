/**
 * Example Cloudflare Worker - Sports Data QC Integration
 *
 * This worker demonstrates production-ready integration of the
 * sports data QC skill with Cloudflare Workers, D1, and KV.
 *
 * Features:
 * - Real-time QC on incoming scraped data
 * - Filtered data ingestion to D1
 * - QC report storage in KV
 * - Error handling and monitoring
 *
 * Deploy: wrangler deploy
 */

import { runQCPipeline } from '../scripts/qc_analysis';
import { saveReportToKV, formatReportConsole, formatReportJSON } from '../scripts/qc_reporting';
import type { GameData, PlayerStats, SourceMetadata } from '../scripts/qc_core';

// ============================================================================
// ENVIRONMENT TYPES
// ============================================================================

interface Env {
  // Cloudflare D1 Database
  DB: D1Database;

  // Cloudflare KV for caching and reports
  CACHE: KVNamespace;

  // R2 Storage for long-term report archival
  R2_BUCKET: R2Bucket;

  // API Keys
  ESPN_API_KEY?: string;
  NCAA_API_KEY?: string;
  SPORTSDATA_API_KEY?: string;

  // Worker Secrets
  INGEST_SECRET: string;
}

// ============================================================================
// WORKER HANDLER
// ============================================================================

export default {
  /**
   * Handle HTTP requests
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Route: POST /ingest - Main data ingestion endpoint
    if (url.pathname === '/ingest' && request.method === 'POST') {
      return handleIngest(request, env, ctx);
    }

    // Route: GET /qc/:reportId - Retrieve QC report
    if (url.pathname.startsWith('/qc/') && request.method === 'GET') {
      return handleGetReport(request, env);
    }

    // Route: GET /health - Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },

  /**
   * Handle scheduled cron jobs
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // Run daily at 3:00 AM UTC (10 PM Chicago time)
    // Scrape yesterday's games and run QC
    console.log('Starting scheduled QC batch job...');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Scrape data from multiple sources
      const scrapedData = await scrapeAllSources(yesterday, env);

      // Run QC pipeline
      const { report, filtered_data } = await runQCPipeline(
        {
          games: scrapedData.games,
          player_stats: scrapedData.player_stats,
          data_source: 'DAILY_BATCH',
        },
        {
          auto_reject_failures: true,
          auto_reject_outliers: false,
          mad_threshold: 5.0,
          include_flagged: true,
          min_confidence_score: 0.7,
        }
      );

      // Log summary
      console.log(formatReportConsole(report));

      // Save report to KV and R2
      await saveReportToKV(report, env.CACHE, 7 * 24 * 60 * 60); // 7 days TTL
      await env.R2_BUCKET.put(`qc-reports/${report.report_id}.json`, formatReportJSON(report));

      // Check failure rate
      const failureRate = report.records_rejected / report.total_records;
      if (failureRate > 0.1) {
        console.error(`❌ High QC failure rate: ${(failureRate * 100).toFixed(1)}%`);
        // In production: send alert to monitoring system
        return;
      }

      // Ingest validated data into D1
      await ingestDataToD1(filtered_data, env);

      console.log(`✅ QC batch complete. Report: ${report.report_id}`);
    } catch (error) {
      console.error('Scheduled job failed:', error);
      // In production: send alert
    }
  },
};

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * Handle POST /ingest - Real-time data ingestion with QC
 */
async function handleIngest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  try {
    // 1. Authenticate request
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${env.INGEST_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 2. Parse incoming data
    const body = (await request.json()) as {
      games?: any[];
      player_stats?: any[];
      data_source: string;
    };

    if (!body.games && !body.player_stats) {
      return new Response(
        JSON.stringify({
          error: 'No data provided',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Run QC pipeline
    const startTime = Date.now();

    const { report, filtered_data } = await runQCPipeline(
      {
        games: body.games,
        player_stats: body.player_stats,
        data_source: body.data_source,
      },
      {
        auto_reject_failures: true,
        auto_reject_outliers: false,
        mad_threshold: 5.0,
        include_flagged: true,
        min_confidence_score: 0.7,
      }
    );

    const qcDuration = Date.now() - startTime;

    // 4. Save QC report asynchronously (don't block response)
    ctx.waitUntil(saveReportToKV(report, env.CACHE));

    // 5. Log summary to console
    console.log(formatReportConsole(report));
    console.log(`QC pipeline completed in ${qcDuration}ms`);

    // 6. Check if too many failures
    const failureRate = report.records_rejected / report.total_records;
    if (failureRate > 0.2) {
      // High failure rate - reject batch
      return new Response(
        JSON.stringify({
          success: false,
          error: 'QC failure rate too high',
          qc_report_id: report.report_id,
          failure_rate: failureRate,
          total_records: report.total_records,
          records_rejected: report.records_rejected,
          recommendations: report.recommendations,
        }),
        {
          status: 422, // Unprocessable Entity
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 7. Ingest validated data into D1
    const ingestStartTime = Date.now();
    const ingested = await ingestDataToD1(filtered_data, env);
    const ingestDuration = Date.now() - ingestStartTime;

    console.log(`Ingested ${ingested} records to D1 in ${ingestDuration}ms`);

    // 8. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        qc_report_id: report.report_id,
        total_records: report.total_records,
        records_passed: report.records_passed,
        records_flagged: report.records_flagged,
        records_rejected: report.records_rejected,
        records_ingested: ingested,
        qc_duration_ms: qcDuration,
        ingest_duration_ms: ingestDuration,
        report_url: `/qc/${report.report_id}`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Ingest error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Handle GET /qc/:reportId - Retrieve QC report
 */
async function handleGetReport(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const reportId = url.pathname.split('/')[2];

  if (!reportId) {
    return new Response('Missing report ID', { status: 400 });
  }

  try {
    // Retrieve report from KV
    const key = `qc:report:${reportId}`;
    const report = await env.CACHE.get(key, 'json');

    if (!report) {
      return new Response('Report not found', { status: 404 });
    }

    return new Response(JSON.stringify(report, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get report error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// ============================================================================
// DATA INGESTION
// ============================================================================

/**
 * Ingest validated data into D1 database
 */
async function ingestDataToD1(
  data: {
    games?: GameData[];
    player_stats?: PlayerStats[];
  },
  env: Env
): Promise<number> {
  let totalIngested = 0;

  // Ingest games
  if (data.games && data.games.length > 0) {
    const stmt = env.DB.prepare(`
      INSERT INTO games (
        game_id, timestamp, season, home_team, away_team,
        home_score, away_score, status, venue,
        source_url, scrape_timestamp, provider_name, confidence_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(game_id) DO UPDATE SET
        home_score = excluded.home_score,
        away_score = excluded.away_score,
        status = excluded.status
    `);

    const batch = data.games.map((game) =>
      stmt.bind(
        game.game_id,
        game.timestamp,
        game.season,
        game.home_team,
        game.away_team,
        game.home_score,
        game.away_score,
        game.status,
        game.venue,
        game.metadata.source_url,
        game.metadata.scrape_timestamp,
        game.metadata.provider_name,
        game.metadata.confidence_score
      )
    );

    await env.DB.batch(batch);
    totalIngested += data.games.length;
  }

  // Ingest player stats
  if (data.player_stats && data.player_stats.length > 0) {
    const stmt = env.DB.prepare(`
      INSERT INTO player_stats (
        player_id, player_name, team_id,
        at_bats, hits, runs, rbi, walks, strikeouts, batting_avg,
        innings_pitched, earned_runs, era, pitches_thrown,
        pitch_velocity, spin_rate, exit_velocity,
        source_url, scrape_timestamp, provider_name, confidence_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const batch = data.player_stats.map((stats) =>
      stmt.bind(
        stats.player_id,
        stats.player_name,
        stats.team_id,
        stats.at_bats,
        stats.hits,
        stats.runs,
        stats.rbi,
        stats.walks,
        stats.strikeouts,
        stats.batting_avg,
        stats.innings_pitched,
        stats.earned_runs,
        stats.era,
        stats.pitches_thrown,
        stats.pitch_velocity,
        stats.spin_rate,
        stats.exit_velocity,
        stats.metadata.source_url,
        stats.metadata.scrape_timestamp,
        stats.metadata.provider_name,
        stats.metadata.confidence_score
      )
    );

    await env.DB.batch(batch);
    totalIngested += data.player_stats.length;
  }

  return totalIngested;
}

// ============================================================================
// DATA SCRAPING (MOCK)
// ============================================================================

/**
 * Scrape data from all sources for a given date
 * (Mock implementation - replace with real scrapers)
 */
async function scrapeAllSources(
  date: Date,
  env: Env
): Promise<{
  games: GameData[];
  player_stats: PlayerStats[];
}> {
  const games: GameData[] = [];
  const player_stats: PlayerStats[] = [];

  // In production, implement real scrapers:
  // - ESPN API scraper
  // - NCAA stats scraper
  // - SportsDataIO API client

  // Mock metadata
  const metadata: SourceMetadata = {
    source_url: 'https://example.com/api/games',
    scrape_timestamp: new Date().toISOString(),
    provider_name: 'ESPN_API',
    confidence_score: 0.85,
  };

  // Example game (replace with real scraping)
  games.push({
    game_id: 'ncaa-bb-2025-03-15-001',
    timestamp: date.toISOString(),
    season: date.getFullYear(),
    home_team: 'Texas',
    away_team: 'Oklahoma',
    home_score: 5,
    away_score: 3,
    status: 'FINAL',
    venue: 'UFCU Disch-Falk Field',
    metadata,
  });

  return { games, player_stats };
}
