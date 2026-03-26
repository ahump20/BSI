#!/usr/bin/env node

/**
 * PostToolUse Hook: Deployment Notifier
 *
 * Notifies on successful deployments to Cloudflare Pages.
 * Sends notifications via console, file log, and optional webhooks.
 *
 * Notifications include:
 * - Deployment URL
 * - Commit hash and message
 * - Build status
 * - Affected files
 * - Deployment timestamp
 *
 * Triggers: After successful wrangler pages deploy commands
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEPLOYMENT_LOG = '/Users/AustinHumphrey/.claude/logs/deployments.log';
const NOTIFICATION_CONFIG = '/Users/AustinHumphrey/.claude/config/notification-channels.json';

/**
 * Ensure deployment log exists
 */
function ensureDeploymentLog() {
  const dir = path.dirname(DEPLOYMENT_LOG);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DEPLOYMENT_LOG)) {
    fs.writeFileSync(DEPLOYMENT_LOG, '# Blaze Sports Intel Deployment Log\n\n');
  }
}

/**
 * Get current date in America/Chicago timezone
 */
function getCurrentTimestamp() {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Get git commit information
 */
function getGitInfo() {
  try {
    const commitHash = execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();

    const commitMessage = execSync('git log -1 --pretty=%B', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();

    const branch = execSync('git branch --show-current', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();

    return {
      commitHash,
      commitMessage,
      branch
    };
  } catch (error) {
    return {
      commitHash: 'unknown',
      commitMessage: 'unknown',
      branch: 'unknown'
    };
  }
}

/**
 * Get affected files from deployment
 */
function getAffectedFiles() {
  try {
    const changedFiles = execSync('git diff --name-only HEAD~1 HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim().split('\n').filter(f => f);

    return changedFiles;
  } catch (error) {
    return [];
  }
}

/**
 * Parse deployment URL from command output
 */
function parseDeploymentUrl(output) {
  // Try to find deployment URL in various formats
  const urlPatterns = [
    /https:\/\/[a-f0-9]{8}\.blazesportsintel\.pages\.dev/,
    /https:\/\/blazesportsintel\.pages\.dev/,
    /https:\/\/blazesportsintel\.com/,
    /Deployment URL:\s+(https:\/\/[^\s]+)/
  ];

  for (const pattern of urlPatterns) {
    const match = output.match(pattern);
    if (match) {
      return match[0] || match[1];
    }
  }

  return null;
}

/**
 * Load notification configuration
 */
function loadNotificationConfig() {
  try {
    if (fs.existsSync(NOTIFICATION_CONFIG)) {
      return JSON.parse(fs.readFileSync(NOTIFICATION_CONFIG, 'utf8'));
    }
  } catch (error) {
    console.error(`Error loading notification config: ${error.message}`);
  }

  return {
    console: { enabled: true },
    file: { enabled: true },
    webhook: { enabled: false, url: null }
  };
}

/**
 * Send webhook notification
 */
async function sendWebhook(url, payload) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (error) {
    console.error(`Webhook notification failed: ${error.message}`);
    return false;
  }
}

/**
 * Notify deployment
 */
async function notifyDeployment(toolName, args, result) {
  try {
    // Only process deployment commands
    const command = args.command || '';
    if (!command.includes('wrangler pages deploy') && !command.includes('wrangler deploy')) {
      return;
    }

    // Check if deployment succeeded
    const output = result?.toString() || '';
    const success = result !== null && !output.includes('Error') && !output.includes('Failed');

    if (!success) return; // Don't notify failed deployments here

    const timestamp = getCurrentTimestamp();
    const gitInfo = getGitInfo();
    const affectedFiles = getAffectedFiles();
    const deploymentUrl = parseDeploymentUrl(output);

    const notification = {
      timestamp,
      project: 'blazesportsintel',
      status: 'success',
      deploymentUrl,
      git: gitInfo,
      affectedFiles: affectedFiles.slice(0, 10), // Limit to 10 files
      affectedCount: affectedFiles.length,
      user: 'Austin Humphrey'
    };

    const config = loadNotificationConfig();

    // Console notification
    if (config.console?.enabled) {
      console.error('\n🎉 DEPLOYMENT SUCCESSFUL\n');
      console.error(`📅 Time: ${timestamp} (America/Chicago)`);
      console.error(`🔗 URL: ${deploymentUrl || 'checking...'}`);
      console.error(`📝 Commit: ${gitInfo.commitHash} - ${gitInfo.commitMessage}`);
      console.error(`🌿 Branch: ${gitInfo.branch}`);
      console.error(`📦 Files Changed: ${affectedFiles.length}`);

      if (affectedFiles.length > 0 && affectedFiles.length <= 10) {
        console.error(`\n   ${affectedFiles.join('\n   ')}`);
      } else if (affectedFiles.length > 10) {
        console.error(`\n   ${affectedFiles.slice(0, 10).join('\n   ')}`);
        console.error(`   ... and ${affectedFiles.length - 10} more`);
      }

      console.error('');
    }

    // File notification
    if (config.file?.enabled) {
      ensureDeploymentLog();

      const logEntry = `\n## Deployment - ${timestamp}\n\n` +
        `**Status**: ✅ Success\n` +
        `**URL**: ${deploymentUrl || 'N/A'}\n` +
        `**Commit**: ${gitInfo.commitHash} - ${gitInfo.commitMessage}\n` +
        `**Branch**: ${gitInfo.branch}\n` +
        `**Files Changed**: ${affectedFiles.length}\n\n` +
        `---\n`;

      fs.appendFileSync(DEPLOYMENT_LOG, logEntry);
    }

    // Webhook notification
    if (config.webhook?.enabled && config.webhook?.url) {
      await sendWebhook(config.webhook.url, {
        type: 'deployment',
        ...notification
      });
    }

  } catch (error) {
    console.error(`Deployment notification error: ${error.message}`);
  }
}

/**
 * Get deployment history
 */
function getDeploymentHistory(limit = 10) {
  try {
    ensureDeploymentLog();

    const content = fs.readFileSync(DEPLOYMENT_LOG, 'utf8');
    const deployments = [];

    const regex = /## Deployment - (.+?)\n\n\*\*Status\*\*: (.+?)\n\*\*URL\*\*: (.+?)\n\*\*Commit\*\*: (.+?)\n\*\*Branch\*\*: (.+?)\n\*\*Files Changed\*\*: (.+?)\n/g;

    let match;
    while ((match = regex.exec(content)) !== null) {
      deployments.push({
        timestamp: match[1],
        status: match[2],
        url: match[3],
        commit: match[4],
        branch: match[5],
        filesChanged: parseInt(match[6])
      });
    }

    return deployments.slice(-limit).reverse();
  } catch (error) {
    return { error: error.message };
  }
}

// Handle CLI invocation
if (require.main === module) {
  const args = JSON.parse(process.argv[2] || '{}');
  const toolName = process.argv[3] || '';
  const result = process.argv[4] || null;

  // Check for history request
  if (args.history) {
    const history = getDeploymentHistory(args.limit || 10);
    console.log(JSON.stringify(history, null, 2));
    process.exit(0);
  }

  notifyDeployment(toolName, args, result)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(`Deployment notification error: ${error.message}`);
      process.exit(0); // Don't fail on notification errors
    });
}

module.exports = { notifyDeployment, getDeploymentHistory };
