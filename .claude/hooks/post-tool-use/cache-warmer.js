#!/usr/bin/env node

/**
 * PostToolUse Hook: Cache Warmer
 *
 * Pre-warms caches after data updates to improve response times.
 * Identifies frequently accessed endpoints and proactively fetches data.
 *
 * Warming strategies:
 * - Post-deployment cache priming
 * - Popular team/player data prefetch
 * - Time-based cache refresh (standings, scores)
 * - User-driven warming (after new data ingestion)
 *
 * Triggers: After data updates, deployments, or Write operations on data files
 */

const fs = require('fs');
const path = require('path');

const WARM_CACHE_CONFIG = '/Users/AustinHumphrey/.claude/config/cache-warming.json';
const WARM_CACHE_LOG = '/Users/AustinHumphrey/.claude/logs/cache-warming.log';

const DEFAULT_CONFIG = {
  enabled: true,
  warmOnDeployment: true,
  warmOnDataUpdate: true,
  endpoints: {
    mlb: {
      enabled: true,
      endpoints: [
        '/api/mlb/standings',
        '/api/mlb/teams?teamId=138', // Cardinals
        '/api/mlb/players?teamId=138',
        '/api/mlb/schedule?teamId=138'
      ],
      priority: 'high'
    },
    nfl: {
      enabled: true,
      endpoints: [
        '/api/nfl/standings',
        '/api/nfl/teams?teamId=10', // Titans
        '/api/nfl/schedule?teamId=10'
      ],
      priority: 'high'
    },
    cfb: {
      enabled: true,
      endpoints: [
        '/api/cfb/standings?conference=SEC',
        '/api/cfb/teams?teamId=251', // Texas
        '/api/cfb/schedule?teamId=251'
      ],
      priority: 'medium'
    },
    cbb: {
      enabled: true,
      endpoints: [
        '/api/cbb/standings',
        '/api/cbb/teams?teamId=251' // Texas
      ],
      priority: 'medium'
    }
  }
};

/**
 * Ensure cache warming infrastructure exists
 */
function ensureCacheInfrastructure() {
  [path.dirname(WARM_CACHE_CONFIG), path.dirname(WARM_CACHE_LOG)].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  if (!fs.existsSync(WARM_CACHE_CONFIG)) {
    fs.writeFileSync(WARM_CACHE_CONFIG, JSON.stringify(DEFAULT_CONFIG, null, 2));
  }
}

/**
 * Load cache warming configuration
 */
function loadConfig() {
  try {
    ensureCacheInfrastructure();
    return JSON.parse(fs.readFileSync(WARM_CACHE_CONFIG, 'utf8'));
  } catch (error) {
    return DEFAULT_CONFIG;
  }
}

/**
 * Determine if cache warming should trigger
 */
function shouldWarmCache(toolName, args) {
  const config = loadConfig();

  if (!config.enabled) return false;

  // Warm on deployment
  if (config.warmOnDeployment && args.command?.includes('wrangler pages deploy')) {
    return true;
  }

  // Warm on data update
  if (config.warmOnDataUpdate && toolName.includes('Write')) {
    const filePath = args.file_path || '';

    // Check if data file was updated
    const dataPatterns = [
      /standings/i,
      /scores/i,
      /stats/i,
      /teams/i,
      /players/i,
      /schedule/i
    ];

    return dataPatterns.some(pattern => pattern.test(filePath));
  }

  return false;
}

/**
 * Fetch and warm endpoint
 */
async function warmEndpoint(url, priority) {
  try {
    const startTime = Date.now();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'BlazeSportsIntel-CacheWarmer/1.0',
        'X-Cache-Warm': 'true'
      }
    });

    const duration = Date.now() - startTime;

    return {
      url,
      priority,
      status: response.ok ? 'success' : 'failed',
      statusCode: response.status,
      duration,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      url,
      priority,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Warm caches
 */
async function warmCaches(toolName, args, result) {
  try {
    if (!shouldWarmCache(toolName, args)) {
      return;
    }

    const config = loadConfig();
    const warmingStart = Date.now();

    console.error('\n🔥 Cache Warming Started...\n');

    // Collect all endpoints to warm
    const endpointsToWarm = [];

    for (const [sport, sportConfig] of Object.entries(config.endpoints)) {
      if (!sportConfig.enabled) continue;

      for (const endpoint of sportConfig.endpoints) {
        endpointsToWarm.push({
          url: `https://blazesportsintel.com${endpoint}`,
          priority: sportConfig.priority,
          sport
        });
      }
    }

    // Sort by priority (high -> medium -> low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    endpointsToWarm.sort((a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    console.error(`   Warming ${endpointsToWarm.length} endpoints...`);

    // Warm endpoints with concurrency limit
    const concurrency = 3;
    const results = [];

    for (let i = 0; i < endpointsToWarm.length; i += concurrency) {
      const batch = endpointsToWarm.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(e => warmEndpoint(e.url, e.priority))
      );
      results.push(...batchResults);

      // Log progress
      const completed = Math.min(i + concurrency, endpointsToWarm.length);
      console.error(`   Progress: ${completed}/${endpointsToWarm.length}`);
    }

    const warmingDuration = Date.now() - warmingStart;

    // Summarize results
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status !== 'success').length;

    console.error(`\n✅ Cache Warming Complete:`);
    console.error(`   Success: ${successful}/${results.length}`);
    console.error(`   Failed: ${failed}/${results.length}`);
    console.error(`   Duration: ${warmingDuration}ms\n`);

    // Log to file
    ensureCacheInfrastructure();

    const logEntry = `\n[${new Date().toISOString()}] Cache Warming\n` +
      `Trigger: ${toolName}\n` +
      `Endpoints: ${endpointsToWarm.length}\n` +
      `Success: ${successful}\n` +
      `Failed: ${failed}\n` +
      `Duration: ${warmingDuration}ms\n` +
      `---\n`;

    fs.appendFileSync(WARM_CACHE_LOG, logEntry);

    // Log individual failures if any
    if (failed > 0) {
      const failures = results.filter(r => r.status !== 'success');
      console.error('   Failed endpoints:');
      failures.forEach(f => {
        console.error(`   - ${f.url}: ${f.error || 'HTTP ' + f.statusCode}`);
      });
    }

  } catch (error) {
    console.error(`Cache warming error: ${error.message}`);
  }
}

/**
 * Get warming statistics
 */
function getWarmingStats() {
  try {
    ensureCacheInfrastructure();

    if (!fs.existsSync(WARM_CACHE_LOG)) {
      return { message: 'No warming history found' };
    }

    const content = fs.readFileSync(WARM_CACHE_LOG, 'utf8');
    const entries = content.split('---\n').filter(e => e.trim());

    const stats = {
      totalWarming: entries.length,
      lastWarming: null,
      successRate: 0,
      avgDuration: 0
    };

    if (entries.length > 0) {
      // Parse last entry
      const lastEntry = entries[entries.length - 1];
      const timestampMatch = lastEntry.match(/\[(.+?)\]/);
      const successMatch = lastEntry.match(/Success: (\d+)/);
      const failedMatch = lastEntry.match(/Failed: (\d+)/);
      const durationMatch = lastEntry.match(/Duration: (\d+)ms/);

      if (timestampMatch) stats.lastWarming = timestampMatch[1];

      // Calculate success rate
      let totalSuccess = 0;
      let totalAttempts = 0;

      entries.forEach(entry => {
        const success = parseInt(entry.match(/Success: (\d+)/)?.[1] || 0);
        const failed = parseInt(entry.match(/Failed: (\d+)/)?.[1] || 0);
        totalSuccess += success;
        totalAttempts += success + failed;
      });

      stats.successRate = totalAttempts > 0
        ? ((totalSuccess / totalAttempts) * 100).toFixed(2) + '%'
        : '0%';

      // Calculate average duration
      let totalDuration = 0;
      entries.forEach(entry => {
        const duration = parseInt(entry.match(/Duration: (\d+)ms/)?.[1] || 0);
        totalDuration += duration;
      });

      stats.avgDuration = entries.length > 0
        ? (totalDuration / entries.length).toFixed(0) + 'ms'
        : '0ms';
    }

    return stats;
  } catch (error) {
    return { error: error.message };
  }
}

// Handle CLI invocation
if (require.main === module) {
  const args = JSON.parse(process.argv[2] || '{}');
  const toolName = process.argv[3] || '';
  const result = JSON.parse(process.argv[4] || 'null');

  // Check for stats request
  if (args.stats) {
    const stats = getWarmingStats();
    console.log(JSON.stringify(stats, null, 2));
    process.exit(0);
  }

  // Manual warming request
  if (args.warm) {
    warmCaches('Manual', args, null)
      .then(() => process.exit(0))
      .catch(error => {
        console.error(`Cache warming error: ${error.message}`);
        process.exit(1);
      });
    return;
  }

  warmCaches(toolName, args, result)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(`Cache warming error: ${error.message}`);
      process.exit(0); // Don't fail on cache warming errors
    });
}

module.exports = { warmCaches, getWarmingStats };
