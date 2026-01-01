/**
 * BSI Alert Dispatcher
 *
 * Multi-channel notification system for portal intelligence.
 * Supports: OneSignal push, email (Resend), and webhooks.
 *
 * Note: This module is Workers-compatible. Environment variables are passed
 * via setAlertsConfig() rather than process.env.
 */

import type { PortalEntry } from "./database.js";

// -----------------------------------------------------------------------------
// Configuration (Workers-compatible - no process.env)
// -----------------------------------------------------------------------------

let ONESIGNAL_APP_ID: string | undefined;
let ONESIGNAL_API_KEY: string | undefined;
let RESEND_API_KEY: string | undefined;
let WEBHOOK_URLS: string[] = [];

/**
 * Configure alert service credentials at runtime.
 * Call this before using any alert functions.
 */
export function setAlertsConfig(config: {
  onesignalAppId?: string;
  onesignalApiKey?: string;
  resendApiKey?: string;
  webhookUrls?: string;
}): void {
  ONESIGNAL_APP_ID = config.onesignalAppId;
  ONESIGNAL_API_KEY = config.onesignalApiKey;
  RESEND_API_KEY = config.resendApiKey;
  WEBHOOK_URLS = config.webhookUrls?.split(",") || [];
}

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface AlertConfig {
  channels: {
    push: boolean;
    email: boolean;
    webhook: boolean;
  };
  filters: {
    conferences?: string[];
    schools?: string[];
    positions?: string[];
    minEngagement?: number;
  };
  recipients: {
    pushSegments?: string[];
    emailAddresses?: string[];
    webhookUrls?: string[];
  };
}

export interface AlertResult {
  channel: "push" | "email" | "webhook";
  success: boolean;
  message: string;
  recipientCount?: number;
  errorDetails?: string;
}

export interface AlertPayload {
  entry: PortalEntry;
  headline: string;
  body: string;
  url?: string;
  priority: "high" | "normal" | "low";
}

// -----------------------------------------------------------------------------
// Alert Message Generation
// -----------------------------------------------------------------------------

export function generateAlertPayload(entry: PortalEntry): AlertPayload {
  const playerName = entry.player_name;
  const school = entry.school_from || "Unknown";
  const position = entry.position || "";
  const conference = entry.conference || "";

  // Determine priority based on engagement and conference
  let priority: AlertPayload["priority"] = "normal";
  if (entry.engagement_score > 100) priority = "high";
  if (conference === "SEC" || conference === "Big 12") priority = "high";
  if (entry.engagement_score < 10) priority = "low";

  // Generate headline based on status
  let headline = "";
  let body = "";

  switch (entry.status) {
    case "in_portal":
      headline = `🚨 PORTAL: ${playerName} enters transfer portal`;
      body = `${position ? position + " " : ""}${playerName} from ${school}${conference ? ` (${conference})` : ""} has entered the transfer portal.`;
      break;
    case "committed":
      headline = `✅ COMMITTED: ${playerName} finds new home`;
      body = `${playerName} has committed to ${entry.school_to || "a new program"} from ${school}.`;
      break;
    case "withdrawn":
      headline = `↩️ WITHDRAWN: ${playerName} returns to ${school}`;
      body = `${playerName} has withdrawn from the transfer portal and will stay at ${school}.`;
      break;
    default:
      headline = `📢 PORTAL UPDATE: ${playerName}`;
      body = `New development for ${playerName} from ${school}.`;
  }

  return {
    entry,
    headline,
    body,
    url: `https://blazesportsintel.com/portal/${entry.id}`,
    priority,
  };
}

// -----------------------------------------------------------------------------
// OneSignal Push Notifications
// -----------------------------------------------------------------------------

export async function sendPushNotification(
  payload: AlertPayload,
  options: {
    segments?: string[];
    playerIds?: string[];
  } = {}
): Promise<AlertResult> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
    return {
      channel: "push",
      success: false,
      message: "OneSignal not configured",
      errorDetails: "Missing ONESIGNAL_APP_ID or ONESIGNAL_API_KEY",
    };
  }

  const { segments = ["Subscribed Users"], playerIds } = options;

  const notification: Record<string, unknown> = {
    app_id: ONESIGNAL_APP_ID,
    headings: { en: payload.headline },
    contents: { en: payload.body },
    url: payload.url,
    priority: payload.priority === "high" ? 10 : payload.priority === "low" ? 1 : 5,
    data: {
      portal_entry_id: payload.entry.id,
      player_name: payload.entry.player_name,
      school: payload.entry.school_from,
      conference: payload.entry.conference,
    },
    // Add conference-based tags for filtering
    filters: payload.entry.conference
      ? [{ field: "tag", key: "conferences", relation: "=", value: payload.entry.conference }]
      : undefined,
  };

  // Target by segments or specific player IDs
  if (playerIds && playerIds.length > 0) {
    notification.include_player_ids = playerIds;
  } else {
    notification.included_segments = segments;
  }

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify(notification),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        channel: "push",
        success: false,
        message: "OneSignal API error",
        errorDetails: JSON.stringify(data),
      };
    }

    return {
      channel: "push",
      success: true,
      message: `Push notification sent: ${data.id}`,
      recipientCount: data.recipients || 0,
    };
  } catch (error) {
    return {
      channel: "push",
      success: false,
      message: "Failed to send push notification",
      errorDetails: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// -----------------------------------------------------------------------------
// Email via Resend
// -----------------------------------------------------------------------------

export async function sendEmailAlert(
  payload: AlertPayload,
  options: {
    to: string[];
    from?: string;
  }
): Promise<AlertResult> {
  if (!RESEND_API_KEY) {
    return {
      channel: "email",
      success: false,
      message: "Resend not configured",
      errorDetails: "Missing RESEND_API_KEY",
    };
  }

  const { to, from = "alerts@blazesportsintel.com" } = options;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #BF5700; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .player-card { background: white; padding: 15px; border-left: 4px solid #BF5700; margin: 15px 0; }
    .cta { display: inline-block; background: #BF5700; color: white; padding: 12px 24px; text-decoration: none; margin-top: 15px; }
    .footer { padding: 15px; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">🔥 Blaze Sports Intel</h1>
      <p style="margin:5px 0 0 0;">Transfer Portal Alert</p>
    </div>
    <div class="content">
      <h2>${payload.headline}</h2>
      <p>${payload.body}</p>

      <div class="player-card">
        <strong>Player:</strong> ${payload.entry.player_name}<br>
        <strong>School:</strong> ${payload.entry.school_from || "Unknown"}<br>
        ${payload.entry.position ? `<strong>Position:</strong> ${payload.entry.position}<br>` : ""}
        ${payload.entry.conference ? `<strong>Conference:</strong> ${payload.entry.conference}<br>` : ""}
        <strong>Status:</strong> ${payload.entry.status.replace("_", " ").toUpperCase()}
      </div>

      ${payload.url ? `<a href="${payload.url}" class="cta">View Full Profile →</a>` : ""}
    </div>
    <div class="footer">
      <p>Blaze Sports Intel • Born to Blaze the Path Less Beaten</p>
      <p>blazesportsintel.com</p>
    </div>
  </div>
</body>
</html>
`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject: payload.headline,
        html: htmlBody,
        tags: [
          { name: "type", value: "portal_alert" },
          { name: "player", value: payload.entry.player_name },
          { name: "conference", value: payload.entry.conference || "unknown" },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        channel: "email",
        success: false,
        message: "Resend API error",
        errorDetails: JSON.stringify(data),
      };
    }

    return {
      channel: "email",
      success: true,
      message: `Email sent: ${data.id}`,
      recipientCount: to.length,
    };
  } catch (error) {
    return {
      channel: "email",
      success: false,
      message: "Failed to send email",
      errorDetails: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// -----------------------------------------------------------------------------
// Webhook Dispatch
// -----------------------------------------------------------------------------

export async function sendWebhook(
  payload: AlertPayload,
  options: {
    urls?: string[];
    headers?: Record<string, string>;
  } = {}
): Promise<AlertResult[]> {
  const urls = options.urls || WEBHOOK_URLS;

  if (urls.length === 0) {
    return [
      {
        channel: "webhook",
        success: false,
        message: "No webhook URLs configured",
      },
    ];
  }

  const webhookPayload = {
    event: "portal_entry",
    timestamp: new Date().toISOString(),
    data: {
      id: payload.entry.id,
      player_name: payload.entry.player_name,
      school_from: payload.entry.school_from,
      school_to: payload.entry.school_to,
      position: payload.entry.position,
      conference: payload.entry.conference,
      status: payload.entry.status,
      portal_date: payload.entry.portal_date,
      source: payload.entry.source,
      engagement_score: payload.entry.engagement_score,
    },
    alert: {
      headline: payload.headline,
      body: payload.body,
      url: payload.url,
      priority: payload.priority,
    },
  };

  const results: AlertResult[] = [];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BSI-Event": "portal_entry",
          "X-BSI-Signature": generateWebhookSignature(webhookPayload),
          ...options.headers,
        },
        body: JSON.stringify(webhookPayload),
      });

      results.push({
        channel: "webhook",
        success: response.ok,
        message: response.ok ? `Webhook sent to ${url}` : `Webhook failed: ${response.status}`,
        errorDetails: response.ok ? undefined : await response.text(),
      });
    } catch (error) {
      results.push({
        channel: "webhook",
        success: false,
        message: `Webhook error for ${url}`,
        errorDetails: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

function generateWebhookSignature(payload: unknown): string {
  // Simple HMAC-like signature for webhook verification
  // In production, use a proper HMAC with a shared secret
  const payloadStr = JSON.stringify(payload);
  let hash = 0;
  for (let i = 0; i < payloadStr.length; i++) {
    const char = payloadStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `bsi_${Math.abs(hash).toString(16)}`;
}

// -----------------------------------------------------------------------------
// Multi-Channel Dispatcher
// -----------------------------------------------------------------------------

export interface DispatchOptions {
  push?: boolean | { segments?: string[] };
  email?: boolean | { to: string[] };
  webhook?: boolean | { urls?: string[] };
}

export async function dispatchAlert(
  entry: PortalEntry,
  options: DispatchOptions = { push: true, webhook: true }
): Promise<{
  payload: AlertPayload;
  results: AlertResult[];
  allSucceeded: boolean;
}> {
  const payload = generateAlertPayload(entry);
  const results: AlertResult[] = [];

  // Send push notification
  if (options.push) {
    const pushOptions = typeof options.push === "object" ? options.push : {};
    const pushResult = await sendPushNotification(payload, pushOptions);
    results.push(pushResult);
  }

  // Send email
  if (options.email) {
    const emailOptions = typeof options.email === "object" ? options.email : { to: [] };
    if (emailOptions.to.length > 0) {
      const emailResult = await sendEmailAlert(payload, emailOptions);
      results.push(emailResult);
    }
  }

  // Send webhooks
  if (options.webhook) {
    const webhookOptions = typeof options.webhook === "object" ? options.webhook : {};
    const webhookResults = await sendWebhook(payload, webhookOptions);
    results.push(...webhookResults);
  }

  return {
    payload,
    results,
    allSucceeded: results.every((r) => r.success),
  };
}

// -----------------------------------------------------------------------------
// Batch Alert Processing
// -----------------------------------------------------------------------------

export async function processAlertQueue(
  entries: PortalEntry[],
  config: AlertConfig
): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  results: { entryId: string; results: AlertResult[] }[];
}> {
  const allResults: { entryId: string; results: AlertResult[] }[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const entry of entries) {
    // Apply filters
    if (config.filters.conferences && !config.filters.conferences.includes(entry.conference || "")) {
      continue;
    }
    if (config.filters.schools && !config.filters.schools.includes(entry.school_from || "")) {
      continue;
    }
    if (config.filters.positions && !config.filters.positions.includes(entry.position || "")) {
      continue;
    }
    if (config.filters.minEngagement && entry.engagement_score < config.filters.minEngagement) {
      continue;
    }

    const dispatchOptions: DispatchOptions = {};

    if (config.channels.push) {
      dispatchOptions.push = { segments: config.recipients.pushSegments };
    }
    if (config.channels.email && config.recipients.emailAddresses?.length) {
      dispatchOptions.email = { to: config.recipients.emailAddresses };
    }
    if (config.channels.webhook) {
      dispatchOptions.webhook = { urls: config.recipients.webhookUrls };
    }

    const { results, allSucceeded } = await dispatchAlert(entry, dispatchOptions);

    allResults.push({ entryId: entry.id, results });

    if (allSucceeded) {
      succeeded++;
    } else {
      failed++;
    }

    // Rate limiting: wait between alerts to avoid overwhelming services
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return {
    processed: entries.length,
    succeeded,
    failed,
    results: allResults,
  };
}

// -----------------------------------------------------------------------------
// Test Functions
// -----------------------------------------------------------------------------

export async function testAlertChannels(): Promise<{
  push: { configured: boolean; testResult?: AlertResult };
  email: { configured: boolean; testResult?: AlertResult };
  webhook: { configured: boolean; count: number };
}> {
  // Mock entry for future test usage:
  // const mockEntry: PortalEntry = { ... };
  // const payload = generateAlertPayload(mockEntry);

  return {
    push: {
      configured: Boolean(ONESIGNAL_APP_ID && ONESIGNAL_API_KEY),
    },
    email: {
      configured: Boolean(RESEND_API_KEY),
    },
    webhook: {
      configured: WEBHOOK_URLS.length > 0,
      count: WEBHOOK_URLS.length,
    },
  };
}
