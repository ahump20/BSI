/**
 * BSI Portal Intelligence Agent
 *
 * Automated transfer portal tracking for college baseball.
 * Monitors Twitter and scrapes sources for portal entries,
 * enriches with stats, and dispatches real-time alerts.
 *
 * Built with Claude Agent SDK + Cloudflare infrastructure.
 */

// Tool imports
import {
  pollForPortalNews,
  getApiUsage,
  getRecommendedPollInterval,
  testTwitterConnection,
  setTwitterConfig,
  type PortalEntry as TwitterPortalEntry,
} from './tools/twitter.js';

// Puppeteer scraping is NOT available in Workers runtime
// Use this locally only - the Worker uses Twitter API exclusively
// import { scrapeAllPortalSources, testScraper, closeBrowser } from "./tools/scraper.js";

import {
  PortalDatabase,
  getDatabase,
  runMigrations,
  type D1Database,
  type PortalEntry,
} from './tools/database.js';

import {
  processAlertQueue,
  testAlertChannels,
  setAlertsConfig,
  type AlertConfig,
} from './tools/alerts.js';

// -----------------------------------------------------------------------------
// Agent Configuration
// -----------------------------------------------------------------------------

export interface AgentConfig {
  // Data sources
  useTwitterApi: boolean;

  // Alert settings
  alertConfig: AlertConfig;

  // Polling
  pollIntervalMs?: number;
  autoPoll?: boolean;

  // Database binding (injected from Cloudflare Worker)
  database?: D1Database;
}

const DEFAULT_CONFIG: AgentConfig = {
  useTwitterApi: true, // Twitter API is required for Workers deployment

  alertConfig: {
    channels: {
      push: true,
      email: false,
      webhook: true,
    },
    filters: {
      conferences: ['SEC', 'Big 12', 'ACC', 'Big Ten', 'Pac-12'],
      minEngagement: 10,
    },
    recipients: {
      pushSegments: ['Subscribed Users'],
      webhookUrls: [],
    },
  },

  autoPoll: false,
};

// -----------------------------------------------------------------------------
// Portal Intelligence Agent
// -----------------------------------------------------------------------------

export class PortalIntelAgent {
  private config: AgentConfig;
  private db: PortalDatabase | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private lastPollTime: Date | null = null;
  private isRunning = false;

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.database) {
      this.db = getDatabase(this.config.database);
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async initialize(): Promise<void> {
    console.log('[Agent] Initializing Portal Intelligence Agent...');

    // Initialize database if provided
    if (this.db) {
      await runMigrations(this.config.database!);
      console.log('[Agent] Database initialized');
    }

    // Test data sources
    if (this.config.useTwitterApi) {
      const twitterTest = await testTwitterConnection();
      console.log(
        `[Agent] Twitter API: ${twitterTest.success ? '✓ Connected' : '✗ ' + twitterTest.message}`
      );
    }

    // Note: Puppeteer scraping only available locally, not in Workers

    // Test alert channels
    const alertTest = await testAlertChannels();
    console.log(
      `[Agent] Alerts - Push: ${alertTest.push.configured ? '✓' : '✗'}, ` +
        `Email: ${alertTest.email.configured ? '✓' : '✗'}, ` +
        `Webhooks: ${alertTest.webhook.count}`
    );

    console.log('[Agent] Initialization complete');
  }

  async shutdown(): Promise<void> {
    console.log('[Agent] Shutting down...');
    this.stopPolling();
    // Note: closeBrowser() only needed for local Puppeteer runs
    console.log('[Agent] Shutdown complete');
  }

  // ---------------------------------------------------------------------------
  // Core Detection Loop
  // ---------------------------------------------------------------------------

  async detectPortalEntries(): Promise<{
    entries: PortalEntry[];
    newCount: number;
    sources: { name: string; count: number }[];
  }> {
    type PartialEntry = Omit<PortalEntry, 'id' | 'discovered_at' | 'updated_at'>;
    const allEntries: PartialEntry[] = [];
    const sources: { name: string; count: number }[] = [];

    // Twitter API (if enabled and configured)
    if (this.config.useTwitterApi) {
      try {
        const { entries: twitterEntries } = await pollForPortalNews();
        const converted = twitterEntries.map((e) => this.convertTwitterEntry(e));
        allEntries.push(...converted);
        sources.push({ name: 'Twitter API', count: converted.length });
      } catch (error) {
        console.error('[Agent] Twitter API error:', error);
        sources.push({ name: 'Twitter API', count: 0 });
      }
    }

    // Note: Puppeteer scraping only available for local CLI testing
    // Workers deployment uses Twitter API exclusively

    // Deduplicate and store
    let newCount = 0;
    const uniqueEntries: PortalEntry[] = [];

    if (this.db) {
      for (const entry of allEntries) {
        const { entry: stored, isNew } = await this.db.upsertEntry(entry);
        uniqueEntries.push(stored);
        if (isNew) newCount++;
      }
    } else {
      // No database - just dedupe in memory and add required fields
      const seen = new Set<string>();
      const now = new Date().toISOString();
      for (const entry of allEntries) {
        const key = `${entry.player_name}|${entry.school_from}`.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          // Add required fields for PortalEntry
          const fullEntry: PortalEntry = {
            ...entry,
            id: `portal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            discovered_at: now,
            updated_at: now,
          };
          uniqueEntries.push(fullEntry);
          newCount++;
        }
      }
    }

    this.lastPollTime = new Date();

    return {
      entries: uniqueEntries,
      newCount,
      sources,
    };
  }

  // ---------------------------------------------------------------------------
  // Alert Processing
  // ---------------------------------------------------------------------------

  async processNewEntries(entries: PortalEntry[]): Promise<{
    alerted: number;
    failed: number;
  }> {
    // Filter to entries needing alerts
    const needingAlerts = entries.filter((e) => e.alerts_sent === 0);

    if (needingAlerts.length === 0) {
      return { alerted: 0, failed: 0 };
    }

    const result = await processAlertQueue(needingAlerts, this.config.alertConfig);

    // Update database with alert status
    if (this.db) {
      for (const { entryId, results } of result.results) {
        const succeeded = results.some((r) => r.success);
        if (succeeded) {
          await this.db.recordAlert({
            portal_entry_id: entryId,
            channel: results.find((r) => r.success)?.channel || 'unknown',
            message: results.find((r) => r.success)?.message || '',
          });
        }
      }
    }

    return {
      alerted: result.succeeded,
      failed: result.failed,
    };
  }

  // ---------------------------------------------------------------------------
  // Polling Management
  // ---------------------------------------------------------------------------

  startPolling(): void {
    if (this.isRunning) {
      console.log('[Agent] Already polling');
      return;
    }

    this.isRunning = true;
    const interval = this.config.pollIntervalMs || getRecommendedPollInterval();
    console.log(`[Agent] Starting poll loop (every ${Math.round(interval / 1000 / 60)} minutes)`);

    const poll = async () => {
      try {
        console.log(`[Agent] Polling at ${new Date().toISOString()}`);
        const { entries, newCount, sources } = await this.detectPortalEntries();

        console.log(
          `[Agent] Found ${entries.length} entries (${newCount} new) from ${sources.length} sources`
        );

        if (newCount > 0) {
          const { alerted, failed } = await this.processNewEntries(entries);
          console.log(`[Agent] Dispatched ${alerted} alerts (${failed} failed)`);
        }
      } catch (error) {
        console.error('[Agent] Poll error:', error);
      }

      // Schedule next poll
      if (this.isRunning) {
        const nextInterval = getRecommendedPollInterval();
        this.pollTimer = setTimeout(poll, nextInterval);
      }
    };

    // Start immediately
    poll();
  }

  stopPolling(): void {
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    console.log('[Agent] Polling stopped');
  }

  // ---------------------------------------------------------------------------
  // Manual Triggers
  // ---------------------------------------------------------------------------

  async runOnce(): Promise<{
    entries: PortalEntry[];
    newCount: number;
    alerted: number;
    sources: { name: string; count: number }[];
  }> {
    const detection = await this.detectPortalEntries();
    const alertResult = await this.processNewEntries(detection.entries);

    return {
      ...detection,
      alerted: alertResult.alerted,
    };
  }

  async getStats(): Promise<{
    lastPoll: string | null;
    isRunning: boolean;
    apiUsage?: ReturnType<typeof getApiUsage>;
    dbStats?: Awaited<ReturnType<PortalDatabase['getStats']>>;
  }> {
    const stats: ReturnType<typeof this.getStats> extends Promise<infer T> ? T : never = {
      lastPoll: this.lastPollTime?.toISOString() || null,
      isRunning: this.isRunning,
    };

    if (this.config.useTwitterApi) {
      stats.apiUsage = getApiUsage();
    }

    if (this.db) {
      stats.dbStats = await this.db.getStats();
    }

    return stats;
  }

  // ---------------------------------------------------------------------------
  // Entry Conversion
  // ---------------------------------------------------------------------------

  private convertTwitterEntry(
    entry: TwitterPortalEntry
  ): Omit<PortalEntry, 'id' | 'discovered_at' | 'updated_at'> {
    return {
      player_name: entry.playerName || 'Unknown',
      school_from: entry.school,
      school_to: null,
      position: entry.position,
      conference: entry.conference,
      class_year: null,
      source: 'twitter',
      source_id: entry.tweetId,
      source_url: `https://twitter.com/${entry.authorUsername}/status/${entry.tweetId}`,
      portal_date: entry.timestamp,
      status: 'in_portal',
      engagement_score: entry.engagement,
      profile_generated: false,
      alerts_sent: 0,
    };
  }
}

// -----------------------------------------------------------------------------
// Cloudflare Worker Entry Point
// -----------------------------------------------------------------------------

export interface Env {
  DB: D1Database;
  TWITTER_BEARER_TOKEN?: string;
  ONESIGNAL_APP_ID?: string;
  ONESIGNAL_API_KEY?: string;
  RESEND_API_KEY?: string;
  WEBHOOK_URLS?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Configure services with environment bindings (Workers-compatible)
    setTwitterConfig({ bearerToken: env.TWITTER_BEARER_TOKEN });
    setAlertsConfig({
      onesignalAppId: env.ONESIGNAL_APP_ID,
      onesignalApiKey: env.ONESIGNAL_API_KEY,
      resendApiKey: env.RESEND_API_KEY,
      webhookUrls: env.WEBHOOK_URLS,
    });

    // Create agent with environment bindings
    const agent = new PortalIntelAgent({
      database: env.DB,
      useTwitterApi: Boolean(env.TWITTER_BEARER_TOKEN),
    });

    try {
      // Health check
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Run detection manually
      if (url.pathname === '/detect' && request.method === 'POST') {
        const result = await agent.runOnce();
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get stats
      if (url.pathname === '/stats') {
        const stats = await agent.getStats();
        return new Response(JSON.stringify(stats), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get recent entries
      if (url.pathname === '/entries') {
        const db = getDatabase(env.DB);
        const entries = await db.getRecentEntries({ limit: 50 });
        return new Response(JSON.stringify({ entries }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response('Not Found', { status: 404 });
    } finally {
      await agent.shutdown();
    }
  },

  // Scheduled trigger for cron-based polling
  async scheduled(_event: { cron: string; scheduledTime: number }, env: Env): Promise<void> {
    // Configure services with environment bindings (Workers-compatible)
    setTwitterConfig({ bearerToken: env.TWITTER_BEARER_TOKEN });
    setAlertsConfig({
      onesignalAppId: env.ONESIGNAL_APP_ID,
      onesignalApiKey: env.ONESIGNAL_API_KEY,
      resendApiKey: env.RESEND_API_KEY,
      webhookUrls: env.WEBHOOK_URLS,
    });

    const agent = new PortalIntelAgent({
      database: env.DB,
      useTwitterApi: Boolean(env.TWITTER_BEARER_TOKEN),
    });

    try {
      await agent.initialize();
      const result = await agent.runOnce();
      console.log(`[Cron] Detected ${result.newCount} new entries, alerted ${result.alerted}`);
    } finally {
      await agent.shutdown();
    }
  },
};

// -----------------------------------------------------------------------------
// Local Testing (use wrangler dev instead of CLI)
// -----------------------------------------------------------------------------
// For local testing, use: npx wrangler dev
// This will start a local server at http://localhost:8787
// Test endpoints:
//   GET  /health  - Health check
//   POST /detect  - Manual detection run
//   GET  /stats   - Agent statistics
//   GET  /entries - Recent portal entries
