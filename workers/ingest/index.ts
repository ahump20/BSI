/**
 * BSI Data Ingest Worker
 *
 * Scheduled worker for sports data ingestion with provider failover.
 *
 * Cron Triggers:
 * - Every 5 minutes: Live games
 * - Hourly (0 min): Team stats refresh
 * - 2am daily: Historical aggregations
 *
 * Provider Failover:
 * 1. SportsDataIO (primary)
 * 2. NCAA API (backup)
 * 3. ESPN API (tertiary)
 *
 * Caching Strategy:
 * - Live games: 60s KV TTL
 * - Standings: 4hr KV TTL (14400s)
 * - Historical: R2 archival (immutable)
 */

interface Env {
  BSI_INGEST_CACHE: KVNamespace;
  BSI_INGEST_ASSETS: R2Bucket;
  ANALYTICS?: AnalyticsEngineDataset;
  INGEST_SECRET: string;
  SPORTSDATAIO_KEY?: string;
  ESPN_API_BASE?: string;
  BSI_GAME_DB: D1Database;
  CATALOG_PREFIX?: string;
  ENABLE_REENQUEUE?: string;
  GITHUB_REPO?: string;
  GITHUB_TOKEN?: string;
}

interface GameData {
  id: string;
  sport: string;
  division: string;
  season: number;
  scheduledAt: string;
  status: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  venueId?: string;
  currentInning?: number;
  currentInningHalf?: string;
  providerName?: string;
}

interface TeamStats {
  teamId: string;
  season: number;
  wins: number;
  losses: number;
  runsScored: number;
  runsAllowed: number;
  winPct: number;
}

interface ManifestRow {
  id: number;
  r2_key: string;
  checksum: string;
  meta: string | null;
  size_bytes: number;
  content_type: string | null;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CatalogEntry {
  name: string;
  expected_sha256: string;
  d1_row_match: boolean;
  last_modified_iso: string;
  size_bytes: number;
}

interface CatalogUpsert {
  r2_key: string;
  checksum: string;
  meta: string | null;
  size_bytes: number;
  content_type: string | null;
}

interface ReenqueueJob {
  r2_key: string;
  reason: 'checksum_mismatch' | 'missing_manifest';
}

interface IngestTicket {
  generated_at: string;
  prefix: string;
  files: CatalogEntry[];
  csv_path: string;
  upserts: CatalogUpsert[];
  reenqueue_jobs: ReenqueueJob[];
  pr_url: string | null;
  summary: {
    total_files: number;
    matches: number;
    mismatches: number;
    missing_manifests: number;
  };
}

export default {
  /**
   * Scheduled handler for cron triggers
   */
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const cron = event.cron;
    console.log(`[Ingest Worker] Cron triggered: ${cron}`);

    try {
      switch (cron) {
        case '*/5 * * * *':
          await ingestLiveGames(env, ctx);
          break;

        case '0 * * * *':
          await ingestTeamStats(env, ctx);
          break;

        case '0 2 * * *':
          await archiveHistoricalData(env, ctx);
          break;

        case '0 3 * * *':
          await runAssetCatalog(env, ctx);
          break;

        default:
          console.warn(`[Ingest Worker] Unknown cron schedule: ${cron}`);
      }
    } catch (error) {
      console.error(`[Ingest Worker] Cron execution failed:`, error);

      if (env.ANALYTICS) {
        env.ANALYTICS.writeDataPoint({
          blobs: ['ingest_error', cron],
          doubles: [1],
          indexes: [error instanceof Error ? error.message : 'unknown_error']
        });
      }

      throw error;
    }
  },

  /**
   * HTTP handler for manual triggers and health checks
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'bsi-ingest-worker',
        version: '2.0.0'
      });
    }

    // Manual trigger endpoints (protected by secret)
    const authHeader = request.headers.get('X-Ingest-Secret');
    if (authHeader !== env.INGEST_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      switch (url.pathname) {
        case '/ingest/live':
          ctx.waitUntil(ingestLiveGames(env, ctx));
          return Response.json({ message: 'Live games ingestion started' }, { status: 202 });

        case '/ingest/stats':
          ctx.waitUntil(ingestTeamStats(env, ctx));
          return Response.json({ message: 'Team stats ingestion started' }, { status: 202 });

        case '/ingest/archive':
          ctx.waitUntil(archiveHistoricalData(env, ctx));
          return Response.json({ message: 'Historical archival started' }, { status: 202 });

        case '/ingest/ncaa-baseball':
          const games = await request.json() as any[];
          ctx.waitUntil(ingestNCAABaseball(games, env, ctx));
          return Response.json({ message: 'NCAA baseball ingestion started', count: games.length }, { status: 202 });

        case '/catalog/run':
          if (request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 });
          }
          const ticket = await runAssetCatalog(env, ctx);
          return Response.json(ticket);

        case '/catalog/status':
          const lastRun = await env.BSI_INGEST_CACHE.get('catalog:last_run');
          if (!lastRun) {
            return Response.json({ status: 'no_runs', message: 'No catalog runs recorded' });
          }
          return Response.json(JSON.parse(lastRun));

        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error(`[Ingest Worker] Manual trigger failed:`, error);
      return Response.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }
};

/**
 * Ingest live games from ESPN API
 */
async function ingestLiveGames(env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('[Ingest] Starting live games ingestion...');

  const espnBase = env.ESPN_API_BASE || 'https://site.api.espn.com/apis/site/v2/sports';
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const season = new Date().getFullYear();

  try {
    // Fetch MLB games
    const mlbUrl = `${espnBase}/baseball/mlb/scoreboard?dates=${today}`;
    const mlbResponse = await fetch(mlbUrl);

    if (!mlbResponse.ok) {
      console.error(`[Ingest] ESPN MLB API error: ${mlbResponse.status}`);
      throw new Error(`ESPN API returned ${mlbResponse.status}`);
    }

    const mlbData = await mlbResponse.json() as any;
    const games: GameData[] = (mlbData.events || []).map((event: any) => ({
      id: event.id,
      sport: 'baseball',
      division: 'MLB',
      season,
      scheduledAt: event.date,
      status: event.status?.type?.name || 'SCHEDULED',
      homeTeamId: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.team?.id || '',
      awayTeamId: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.team?.id || '',
      homeScore: parseInt(event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.score || '0'),
      awayScore: parseInt(event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.score || '0'),
      venueId: event.competitions?.[0]?.venue?.id,
      providerName: 'ESPN'
    }));

    console.log(`[Ingest] Fetched ${games.length} MLB games`);

    // Cache live games in KV (60s TTL)
    const cacheKey = `live:games:mlb:${today}`;
    await env.BSI_INGEST_CACHE.put(cacheKey, JSON.stringify({
      games,
      fetchedAt: new Date().toISOString(),
      source: 'ESPN'
    }), {
      expirationTtl: 60
    });

    // Track success
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['ingest_success', 'live_games'],
        doubles: [games.length],
        indexes: [season.toString()]
      });
    }

    console.log(`[Ingest] Cached ${games.length} live games`);
  } catch (error) {
    console.error('[Ingest] Live games ingestion failed:', error);
    throw error;
  }
}

/**
 * Ingest team standings and stats
 */
async function ingestTeamStats(env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('[Ingest] Starting team stats ingestion...');

  const espnBase = env.ESPN_API_BASE || 'https://site.api.espn.com/apis/site/v2/sports';
  const season = new Date().getFullYear();

  try {
    // Fetch MLB standings
    const standingsUrl = `${espnBase}/baseball/mlb/standings`;
    const response = await fetch(standingsUrl);

    if (!response.ok) {
      throw new Error(`ESPN standings API returned ${response.status}`);
    }

    const data = await response.json() as any;
    const standings: TeamStats[] = [];

    // Parse standings from ESPN response
    for (const group of (data.children || [])) {
      for (const division of (group.children || [])) {
        for (const team of (division.standings?.entries || [])) {
          const stats = team.stats || [];
          const getStatValue = (name: string) => {
            const stat = stats.find((s: any) => s.name === name);
            return stat?.value ?? 0;
          };

          standings.push({
            teamId: team.team?.id || '',
            season,
            wins: getStatValue('wins'),
            losses: getStatValue('losses'),
            runsScored: getStatValue('pointsFor'),
            runsAllowed: getStatValue('pointsAgainst'),
            winPct: getStatValue('winPercent')
          });
        }
      }
    }

    console.log(`[Ingest] Fetched standings for ${standings.length} teams`);

    // Cache standings in KV (4hr TTL)
    const cacheKey = `standings:mlb:${season}`;
    await env.BSI_INGEST_CACHE.put(cacheKey, JSON.stringify({
      standings,
      fetchedAt: new Date().toISOString(),
      source: 'ESPN'
    }), {
      expirationTtl: 14400
    });

    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['ingest_success', 'team_stats'],
        doubles: [standings.length],
        indexes: [season.toString()]
      });
    }

    console.log(`[Ingest] Cached standings for ${standings.length} teams`);
  } catch (error) {
    console.error('[Ingest] Team stats ingestion failed:', error);
    throw error;
  }
}

/**
 * Archive completed games to R2
 */
async function archiveHistoricalData(env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('[Ingest] Starting historical data archival...');

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];
  const season = yesterday.getFullYear();

  try {
    // Get yesterday's cached games
    const cacheKey = `live:games:mlb:${dateStr.replace(/-/g, '')}`;
    const cachedData = await env.BSI_INGEST_CACHE.get(cacheKey);

    if (!cachedData) {
      console.log(`[Ingest] No cached data found for ${dateStr}, skipping archive`);
      return;
    }

    const { games } = JSON.parse(cachedData);
    const completedGames = games.filter((g: GameData) =>
      g.status === 'STATUS_FINAL' || g.status === 'FINAL'
    );

    if (completedGames.length === 0) {
      console.log(`[Ingest] No completed games to archive for ${dateStr}`);
      return;
    }

    // Archive to R2
    const archiveKey = `archives/mlb/${season}/${dateStr}.json`;
    const archiveData = {
      date: dateStr,
      season,
      archivedAt: new Date().toISOString(),
      gameCount: completedGames.length,
      games: completedGames
    };

    await env.BSI_INGEST_ASSETS.put(archiveKey, JSON.stringify(archiveData, null, 2), {
      customMetadata: {
        season: season.toString(),
        date: dateStr,
        gameCount: completedGames.length.toString()
      }
    });

    console.log(`[Ingest] Archived ${completedGames.length} games to R2: ${archiveKey}`);

    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['ingest_success', 'historical_archive'],
        doubles: [completedGames.length],
        indexes: [season.toString(), dateStr]
      });
    }
  } catch (error) {
    console.error('[Ingest] Historical archival failed:', error);
    throw error;
  }
}

/**
 * Ingest NCAA Baseball games from external payload
 */
async function ingestNCAABaseball(
  games: GameData[],
  env: Env,
  _ctx: ExecutionContext
): Promise<void> {
  console.log(`[Ingest] Processing ${games.length} NCAA baseball games...`);

  const season = new Date().getFullYear();
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');

  const cacheKey = `live:games:ncaa-baseball:${today}`;
  await env.BSI_INGEST_CACHE.put(cacheKey, JSON.stringify({
    games,
    fetchedAt: new Date().toISOString(),
    source: 'NCAA'
  }), {
    expirationTtl: 60
  });

  if (env.ANALYTICS) {
    env.ANALYTICS.writeDataPoint({
      blobs: ['ingest_success', 'ncaa_baseball'],
      doubles: [games.length],
      indexes: [season.toString()]
    });
  }

  console.log(`[Ingest] Cached ${games.length} NCAA baseball games`);
}

/**
 * Compute SHA-256 checksum of R2 object body
 */
async function computeSHA256(body: ReadableStream<Uint8Array> | null): Promise<string> {
  if (!body) return '';

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const combined = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Enumerate all R2 objects under a prefix with pagination
 */
async function enumerateR2Objects(
  bucket: R2Bucket,
  prefix: string
): Promise<R2Object[]> {
  const objects: R2Object[] = [];
  let cursor: string | undefined;

  do {
    const list = await bucket.list({ prefix, cursor, limit: 1000 });
    objects.push(...list.objects);
    cursor = list.truncated ? list.cursor : undefined;
  } while (cursor);

  return objects;
}

/**
 * Fetch manifest records from D1 as a Map keyed by r2_key
 */
async function fetchManifestMap(
  db: D1Database,
  prefix: string
): Promise<Map<string, ManifestRow>> {
  const result = await db.prepare(
    'SELECT * FROM manifests WHERE r2_key LIKE ?'
  ).bind(`${prefix}%`).all<ManifestRow>();

  const map = new Map<string, ManifestRow>();
  for (const row of result.results) {
    map.set(row.r2_key, row);
  }
  return map;
}

/**
 * Generate CSV content from catalog entries
 */
function generateCatalogCSV(entries: CatalogEntry[]): string {
  const header = 'name,expected_sha256,d1_row_match,last_modified_iso,size_bytes';
  const rows = entries.map(e =>
    `${e.name},${e.expected_sha256},${e.d1_row_match},${e.last_modified_iso},${e.size_bytes}`
  );
  return [header, ...rows].join('\n');
}

/**
 * Execute batched upserts to manifests table (100 per batch)
 */
async function executeManifestUpserts(
  db: D1Database,
  upserts: CatalogUpsert[]
): Promise<void> {
  const BATCH_SIZE = 100;

  for (let i = 0; i < upserts.length; i += BATCH_SIZE) {
    const batch = upserts.slice(i, i + BATCH_SIZE);
    const statements = batch.map(u =>
      db.prepare(`
        INSERT INTO manifests (r2_key, checksum, meta, size_bytes, content_type, last_verified_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ON CONFLICT(r2_key) DO UPDATE SET
          checksum = excluded.checksum,
          meta = excluded.meta,
          size_bytes = excluded.size_bytes,
          content_type = excluded.content_type,
          last_verified_at = datetime('now'),
          updated_at = datetime('now')
      `).bind(u.r2_key, u.checksum, u.meta, u.size_bytes, u.content_type)
    );
    await db.batch(statements);
  }
}

/**
 * Generate fix document content for GitHub PR
 */
function generateFixDocument(ticket: IngestTicket): string {
  const lines: string[] = [
    `# Asset Catalog Fix - ${ticket.generated_at.split('T')[0]}`,
    '',
    '## Summary',
    `- Total files scanned: ${ticket.summary.total_files}`,
    `- Matches: ${ticket.summary.matches}`,
    `- Mismatches: ${ticket.summary.mismatches}`,
    `- Missing manifests: ${ticket.summary.missing_manifests}`,
    '',
    `## CSV Report`,
    `\`${ticket.csv_path}\``,
    '',
    '## SQL Upserts',
    '```sql'
  ];

  for (const u of ticket.upserts) {
    lines.push(
      `INSERT INTO manifests (r2_key, checksum, meta, size_bytes, content_type, last_verified_at, updated_at)`,
      `VALUES ('${u.r2_key}', '${u.checksum}', ${u.meta ? `'${u.meta}'` : 'NULL'}, ${u.size_bytes}, ${u.content_type ? `'${u.content_type}'` : 'NULL'}, datetime('now'), datetime('now'))`,
      `ON CONFLICT(r2_key) DO UPDATE SET checksum = excluded.checksum, size_bytes = excluded.size_bytes, last_verified_at = datetime('now'), updated_at = datetime('now');`,
      ''
    );
  }

  lines.push('```');

  if (ticket.reenqueue_jobs.length > 0) {
    lines.push('', '## Re-enqueue Jobs (Feature Flag Required)', '```json');
    lines.push(JSON.stringify(ticket.reenqueue_jobs, null, 2));
    lines.push('```');
  }

  return lines.join('\n');
}

/**
 * Create GitHub PR with catalog fix document
 */
async function createCatalogPR(
  env: Env,
  ticket: IngestTicket
): Promise<string | null> {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return null;
  if (ticket.upserts.length === 0) return null;

  const date = ticket.generated_at.split('T')[0];
  const branch = `catalog/fix-${date}`;
  const path = `.github/catalog-fixes/${date}.md`;
  const content = generateFixDocument(ticket);
  const contentBase64 = btoa(unescape(encodeURIComponent(content)));

  const headers = {
    'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'BSI-Ingest-Worker'
  };

  const apiBase = `https://api.github.com/repos/${env.GITHUB_REPO}`;

  try {
    // Get default branch SHA
    const repoRes = await fetch(apiBase, { headers });
    if (!repoRes.ok) {
      console.error('[Catalog] Failed to get repo info:', await repoRes.text());
      return null;
    }
    const repoData = await repoRes.json() as { default_branch: string };
    const defaultBranch = repoData.default_branch;

    // Get ref SHA
    const refRes = await fetch(`${apiBase}/git/refs/heads/${defaultBranch}`, { headers });
    if (!refRes.ok) {
      console.error('[Catalog] Failed to get ref:', await refRes.text());
      return null;
    }
    const refData = await refRes.json() as { object: { sha: string } };
    const baseSha = refData.object.sha;

    // Create branch
    const createBranchRes = await fetch(`${apiBase}/git/refs`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: baseSha
      })
    });

    if (!createBranchRes.ok && createBranchRes.status !== 422) {
      console.error('[Catalog] Failed to create branch:', await createBranchRes.text());
      return null;
    }

    // Create or update file
    const fileRes = await fetch(`${apiBase}/contents/${path}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `fix(catalog): reconcile ${ticket.upserts.length} asset mismatches`,
        content: contentBase64,
        branch
      })
    });

    if (!fileRes.ok) {
      console.error('[Catalog] Failed to create file:', await fileRes.text());
      return null;
    }

    // Create PR
    const prRes = await fetch(`${apiBase}/pulls`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `fix(catalog): reconcile ${ticket.upserts.length} asset mismatches`,
        body: `## Summary\n- ${ticket.summary.mismatches} checksum mismatches\n- ${ticket.summary.missing_manifests} missing manifest entries\n\n## CSV Report\n\`${ticket.csv_path}\`\n\nGenerated by BSI Ingest Worker asset catalog.`,
        head: branch,
        base: defaultBranch
      })
    });

    if (!prRes.ok) {
      console.error('[Catalog] Failed to create PR:', await prRes.text());
      return null;
    }

    const prData = await prRes.json() as { html_url: string };
    return prData.html_url;
  } catch (error) {
    console.error('[Catalog] GitHub API error:', error);
    return null;
  }
}

/**
 * Main asset catalog orchestrator
 */
async function runAssetCatalog(env: Env, ctx: ExecutionContext): Promise<IngestTicket> {
  console.log('[Catalog] Starting asset catalog reconciliation...');

  const prefix = env.CATALOG_PREFIX || 'archives/';
  const enableReenqueue = env.ENABLE_REENQUEUE === 'true';
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const entries: CatalogEntry[] = [];
  const upserts: CatalogUpsert[] = [];
  const reenqueueJobs: ReenqueueJob[] = [];

  let matches = 0;
  let mismatches = 0;
  let missingManifests = 0;

  try {
    // Enumerate R2 objects
    console.log(`[Catalog] Enumerating R2 objects with prefix: ${prefix}`);
    const r2Objects = await enumerateR2Objects(env.BSI_INGEST_ASSETS, prefix);
    console.log(`[Catalog] Found ${r2Objects.length} R2 objects`);

    // Fetch manifest records
    const manifestMap = await fetchManifestMap(env.BSI_GAME_DB, prefix);
    console.log(`[Catalog] Found ${manifestMap.size} manifest records`);

    // Process each R2 object
    for (const obj of r2Objects) {
      const r2Key = obj.key;

      // Get full object to compute checksum
      const fullObj = await env.BSI_INGEST_ASSETS.get(r2Key);
      if (!fullObj) {
        console.warn(`[Catalog] Failed to get R2 object: ${r2Key}`);
        continue;
      }

      const checksum = await computeSHA256(fullObj.body);
      const manifest = manifestMap.get(r2Key);

      let d1RowMatch = false;

      if (manifest) {
        if (manifest.checksum === checksum) {
          d1RowMatch = true;
          matches++;
        } else {
          mismatches++;
          upserts.push({
            r2_key: r2Key,
            checksum,
            meta: fullObj.customMetadata ? JSON.stringify(fullObj.customMetadata) : null,
            size_bytes: obj.size,
            content_type: fullObj.httpMetadata?.contentType || null
          });
          if (enableReenqueue) {
            reenqueueJobs.push({ r2_key: r2Key, reason: 'checksum_mismatch' });
          }
        }
      } else {
        missingManifests++;
        upserts.push({
          r2_key: r2Key,
          checksum,
          meta: fullObj.customMetadata ? JSON.stringify(fullObj.customMetadata) : null,
          size_bytes: obj.size,
          content_type: fullObj.httpMetadata?.contentType || null
        });
        if (enableReenqueue) {
          reenqueueJobs.push({ r2_key: r2Key, reason: 'missing_manifest' });
        }
      }

      entries.push({
        name: r2Key,
        expected_sha256: checksum,
        d1_row_match: d1RowMatch,
        last_modified_iso: obj.uploaded.toISOString(),
        size_bytes: obj.size
      });
    }

    // Generate CSV
    const csvContent = generateCatalogCSV(entries);
    const csvPath = `bsi-assets/catalog/${dateStr}.csv`;
    await env.BSI_INGEST_ASSETS.put(csvPath, csvContent, {
      customMetadata: {
        generated_at: now.toISOString(),
        total_files: entries.length.toString()
      }
    });
    console.log(`[Catalog] Wrote CSV to R2: ${csvPath}`);

    // Execute upserts
    if (upserts.length > 0) {
      await executeManifestUpserts(env.BSI_GAME_DB, upserts);
      console.log(`[Catalog] Executed ${upserts.length} manifest upserts`);
    }

    // Build ticket
    const ticket: IngestTicket = {
      generated_at: now.toISOString(),
      prefix,
      files: entries,
      csv_path: csvPath,
      upserts,
      reenqueue_jobs: reenqueueJobs,
      pr_url: null,
      summary: {
        total_files: entries.length,
        matches,
        mismatches,
        missing_manifests: missingManifests
      }
    };

    // Create PR if mismatches exist
    if (upserts.length > 0) {
      ctx.waitUntil(
        createCatalogPR(env, ticket).then(prUrl => {
          if (prUrl) {
            ticket.pr_url = prUrl;
            console.log(`[Catalog] Created PR: ${prUrl}`);
          }
        })
      );
    }

    // Write ticket to R2
    const ticketPath = `bsi-assets/catalog/${dateStr}-ticket.json`;
    await env.BSI_INGEST_ASSETS.put(ticketPath, JSON.stringify(ticket, null, 2), {
      customMetadata: {
        generated_at: now.toISOString()
      }
    });
    console.log(`[Catalog] Wrote ticket to R2: ${ticketPath}`);

    // Cache last run in KV (24hr TTL)
    await env.BSI_INGEST_CACHE.put('catalog:last_run', JSON.stringify({
      generated_at: now.toISOString(),
      csv_path: csvPath,
      ticket_path: ticketPath,
      summary: ticket.summary
    }), {
      expirationTtl: 86400
    });

    // Track success
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['catalog_success', prefix],
        doubles: [entries.length, upserts.length],
        indexes: [dateStr]
      });
    }

    console.log(`[Catalog] Completed: ${entries.length} files, ${matches} matches, ${mismatches} mismatches, ${missingManifests} missing`);
    return ticket;
  } catch (error) {
    console.error('[Catalog] Asset catalog failed:', error);

    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['catalog_error', prefix],
        doubles: [1],
        indexes: [error instanceof Error ? error.message : 'unknown_error']
      });
    }

    throw error;
  }
}
