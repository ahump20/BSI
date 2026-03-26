#!/usr/bin/env node

/**
 * PostToolUse Hook: API Usage Tracker
 *
 * Tracks API call metrics and quotas for external sports data providers.
 * Monitors usage against limits and warns before exceeding quotas.
 *
 * Tracked metrics:
 * - Total calls per provider per day
 * - Calls by endpoint
 * - Rate limit consumption
 * - Cost estimation
 * - Quota warnings
 *
 * Triggers: After API-related tool operations
 */

const fs = require('fs');
const path = require('path');

const USAGE_FILE = '/Users/AustinHumphrey/.claude/data/api-usage.json';
const QUOTA_CONFIG = '/Users/AustinHumphrey/.claude/config/api-quotas.json';

const DEFAULT_QUOTAS = {
  'SportsDataIO': {
    dailyLimit: 10000,
    costPerCall: 0.001,
    warningThreshold: 0.8
  },
  'MLB StatsAPI': {
    dailyLimit: 50000,
    costPerCall: 0,
    warningThreshold: 0.9
  },
  'ESPN API': {
    dailyLimit: 20000,
    costPerCall: 0,
    warningThreshold: 0.85
  },
  'D1Baseball': {
    dailyLimit: 5000,
    costPerCall: 0.002,
    warningThreshold: 0.75
  },
  'NCAA Stats': {
    dailyLimit: 15000,
    costPerCall: 0,
    warningThreshold: 0.85
  },
  'Perfect Game': {
    dailyLimit: 10000,
    costPerCall: 0.0015,
    warningThreshold: 0.8
  }
};

/**
 * Ensure usage file exists
 */
function ensureUsageFile() {
  const dir = path.dirname(USAGE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(USAGE_FILE)) {
    fs.writeFileSync(USAGE_FILE, JSON.stringify({ providers: {} }, null, 2));
  }
}

/**
 * Get current date in America/Chicago timezone
 */
function getCurrentDate() {
  return new Date().toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Load quota configuration
 */
function loadQuotas() {
  try {
    if (fs.existsSync(QUOTA_CONFIG)) {
      return JSON.parse(fs.readFileSync(QUOTA_CONFIG, 'utf8'));
    }
  } catch (error) {
    console.error(`Error loading quota config: ${error.message}`);
  }
  return DEFAULT_QUOTAS;
}

/**
 * Load current usage data
 */
function loadUsage() {
  try {
    ensureUsageFile();
    return JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
  } catch (error) {
    return { providers: {} };
  }
}

/**
 * Save usage data
 */
function saveUsage(usage) {
  try {
    ensureUsageFile();
    fs.writeFileSync(USAGE_FILE, JSON.stringify(usage, null, 2));
  } catch (error) {
    console.error(`Error saving usage data: ${error.message}`);
  }
}

/**
 * Detect API provider from tool arguments
 */
function detectProvider(args) {
  if (!args) return null;

  const url = args.url || args.endpoint || '';
  const command = args.command || '';

  // Match against known provider patterns
  if (url.includes('sportsdata.io') || command.includes('sportsdata')) {
    return 'SportsDataIO';
  }

  if (url.includes('statsapi.mlb.com') || url.includes('mlb.com/api')) {
    return 'MLB StatsAPI';
  }

  if (url.includes('espn.com/apis') || url.includes('espn.com')) {
    return 'ESPN API';
  }

  if (url.includes('d1baseball.com')) {
    return 'D1Baseball';
  }

  if (url.includes('ncaa.com/stats')) {
    return 'NCAA Stats';
  }

  if (url.includes('perfectgame.org')) {
    return 'Perfect Game';
  }

  return null;
}

/**
 * Extract endpoint from URL
 */
function extractEndpoint(args) {
  const url = args.url || args.endpoint || '';
  if (!url) return 'unknown';

  try {
    const urlObj = new URL(url);
    return urlObj.pathname.split('?')[0];
  } catch {
    return 'unknown';
  }
}

/**
 * Track API call
 */
async function trackAPICall(toolName, args, result) {
  try {
    const provider = detectProvider(args);
    if (!provider) return; // Not an API call

    const usage = loadUsage();
    const quotas = loadQuotas();
    const date = getCurrentDate();
    const endpoint = extractEndpoint(args);

    // Initialize provider data if needed
    if (!usage.providers[provider]) {
      usage.providers[provider] = {};
    }

    if (!usage.providers[provider][date]) {
      usage.providers[provider][date] = {
        totalCalls: 0,
        endpoints: {},
        cost: 0,
        warnings: []
      };
    }

    const dailyUsage = usage.providers[provider][date];

    // Increment counters
    dailyUsage.totalCalls++;
    dailyUsage.endpoints[endpoint] = (dailyUsage.endpoints[endpoint] || 0) + 1;

    // Calculate cost
    const quota = quotas[provider] || DEFAULT_QUOTAS[provider];
    if (quota) {
      dailyUsage.cost += quota.costPerCall;

      // Check warning threshold
      const usagePercent = dailyUsage.totalCalls / quota.dailyLimit;
      if (usagePercent >= quota.warningThreshold && !dailyUsage.warnings.includes('threshold')) {
        const warning = {
          type: 'threshold',
          message: `${provider} usage at ${(usagePercent * 100).toFixed(1)}% (${dailyUsage.totalCalls}/${quota.dailyLimit})`,
          timestamp: new Date().toISOString()
        };
        dailyUsage.warnings.push(warning);
        console.error(`⚠️ API QUOTA WARNING: ${warning.message}`);
      }

      // Check quota exceeded
      if (dailyUsage.totalCalls >= quota.dailyLimit && !dailyUsage.warnings.includes('exceeded')) {
        const warning = {
          type: 'exceeded',
          message: `${provider} quota EXCEEDED (${dailyUsage.totalCalls}/${quota.dailyLimit})`,
          timestamp: new Date().toISOString()
        };
        dailyUsage.warnings.push(warning);
        console.error(`🔴 API QUOTA EXCEEDED: ${warning.message}`);
      }
    }

    saveUsage(usage);

  } catch (error) {
    console.error(`API tracking error: ${error.message}`);
  }
}

/**
 * Get usage summary
 */
function getUsageSummary(days = 7) {
  try {
    const usage = loadUsage();
    const quotas = loadQuotas();
    const summary = {
      period: `Last ${days} days`,
      providers: {}
    };

    const today = new Date();
    const daysAgo = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));

    for (const [provider, providerData] of Object.entries(usage.providers)) {
      const quota = quotas[provider] || DEFAULT_QUOTAS[provider];

      let totalCalls = 0;
      let totalCost = 0;
      let dates = [];

      for (const [date, dailyData] of Object.entries(providerData)) {
        const dateObj = new Date(date);
        if (dateObj >= daysAgo) {
          totalCalls += dailyData.totalCalls;
          totalCost += dailyData.cost || 0;
          dates.push(date);
        }
      }

      summary.providers[provider] = {
        totalCalls,
        avgCallsPerDay: (totalCalls / days).toFixed(0),
        totalCost: totalCost.toFixed(2),
        quotaRemaining: quota ? quota.dailyLimit - totalCalls : 'unlimited',
        usagePercent: quota ? ((totalCalls / (quota.dailyLimit * days)) * 100).toFixed(1) + '%' : 'N/A'
      };
    }

    return summary;
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Get current quota status
 */
function getQuotaStatus() {
  try {
    const usage = loadUsage();
    const quotas = loadQuotas();
    const date = getCurrentDate();
    const status = {};

    for (const [provider, quota] of Object.entries(quotas)) {
      const dailyUsage = usage.providers[provider]?.[date];
      const calls = dailyUsage?.totalCalls || 0;
      const cost = dailyUsage?.cost || 0;

      status[provider] = {
        calls,
        limit: quota.dailyLimit,
        remaining: quota.dailyLimit - calls,
        percentUsed: ((calls / quota.dailyLimit) * 100).toFixed(1) + '%',
        cost: cost.toFixed(2),
        status: calls >= quota.dailyLimit
          ? '🔴 EXCEEDED'
          : calls >= quota.dailyLimit * quota.warningThreshold
          ? '🟡 WARNING'
          : '🟢 OK'
      };
    }

    return status;
  } catch (error) {
    return { error: error.message };
  }
}

// Handle CLI invocation
if (require.main === module) {
  const args = JSON.parse(process.argv[2] || '{}');
  const toolName = process.argv[3] || '';
  const result = JSON.parse(process.argv[4] || 'null');

  // Check for status/summary requests
  if (args.status) {
    const status = getQuotaStatus();
    console.log(JSON.stringify(status, null, 2));
    process.exit(0);
  }

  if (args.summary) {
    const summary = getUsageSummary(args.days || 7);
    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
  }

  trackAPICall(toolName, args, result)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(`API tracking error: ${error.message}`);
      process.exit(0); // Don't fail on tracking errors
    });
}

module.exports = { trackAPICall, getUsageSummary, getQuotaStatus };
