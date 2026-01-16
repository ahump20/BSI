/**
 * Cookie Consent Storage API Endpoint
 *
 * GDPR/CCPA compliant consent management for Blaze Sports Intel.
 * Stores user cookie preferences with privacy-first design.
 *
 * Endpoint: POST /api/consent
 * Body: { userId: string, preferences: { essential: boolean, analytics: boolean, timestamp: string, version: string } }
 *
 * Privacy Features:
 * - IP addresses are hashed with SHA-256 (never stored raw)
 * - User agents are stored for security/audit purposes only
 * - All timestamps in ISO 8601 format (America/Chicago timezone)
 * - Automatic table creation if not exists
 *
 * Database: D1 (binding: DB, database: blazesports-historical)
 * Table: consent_records
 *
 * Data Sources: User consent interactions via frontend cookie banner
 * Last Updated: November 25, 2025
 * Timezone: America/Chicago
 */

import type { PagesFunction, D1Database } from '@cloudflare/workers-types';

// ============================================================================
// Type Definitions
// ============================================================================

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  timestamp: string;
  version: string;
}

interface ConsentRequest {
  userId: string;
  preferences: ConsentPreferences;
}

interface ConsentRecord {
  id: string;
  user_id: string;
  essential: number; // SQLite boolean (0/1)
  analytics: number; // SQLite boolean (0/1)
  ip_hash: string;
  user_agent: string;
  timestamp: string;
  version: string;
  created_at: string;
}

interface ConsentResponse {
  success: boolean;
  id?: string;
  message?: string;
  error?: string;
}

interface Env {
  DB: D1Database;
}

// ============================================================================
// CORS Headers (aligned with _utils.js pattern)
// ============================================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Hash IP address with SHA-256 for privacy
 * Never store raw IP addresses - GDPR/CCPA requirement
 */
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Generate unique consent record ID
 */
function generateConsentId(): string {
  return `consent_${Date.now()}_${crypto.randomUUID()}`;
}

/**
 * Get client IP address from request headers
 */
function getClientIP(request: Request): string {
  // Cloudflare provides the real client IP
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
    request.headers.get('X-Real-IP') ||
    'unknown'
  );
}

/**
 * Validate consent request payload
 */
function validateConsentRequest(body: any): body is ConsentRequest {
  if (!body || typeof body !== 'object') {
    return false;
  }

  if (!body.userId || typeof body.userId !== 'string') {
    return false;
  }

  if (!body.preferences || typeof body.preferences !== 'object') {
    return false;
  }

  const { essential, analytics, timestamp, version } = body.preferences;

  if (typeof essential !== 'boolean') {
    return false;
  }

  if (typeof analytics !== 'boolean') {
    return false;
  }

  if (!timestamp || typeof timestamp !== 'string') {
    return false;
  }

  if (!version || typeof version !== 'string') {
    return false;
  }

  return true;
}

/**
 * Initialize consent_records table if it doesn't exist
 */
async function initializeConsentTable(db: D1Database): Promise<void> {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS consent_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      essential INTEGER NOT NULL DEFAULT 1,
      analytics INTEGER NOT NULL DEFAULT 0,
      ip_hash TEXT NOT NULL,
      user_agent TEXT,
      timestamp TEXT NOT NULL,
      version TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Create index on user_id for faster lookups
  const createIndexSQL = `
    CREATE INDEX IF NOT EXISTS idx_consent_user_id ON consent_records(user_id);
  `;

  // Create index on created_at for audit queries
  const createTimestampIndexSQL = `
    CREATE INDEX IF NOT EXISTS idx_consent_created_at ON consent_records(created_at);
  `;

  try {
    await db.batch([
      db.prepare(createTableSQL),
      db.prepare(createIndexSQL),
      db.prepare(createTimestampIndexSQL),
    ]);
  } catch (error) {
    console.error('Failed to initialize consent_records table:', error);
    throw new Error('Database initialization failed');
  }
}

/**
 * Store consent record in D1 database
 */
async function storeConsentRecord(
  db: D1Database,
  record: Omit<ConsentRecord, 'created_at'>
): Promise<string> {
  const insertSQL = `
    INSERT INTO consent_records (
      id,
      user_id,
      essential,
      analytics,
      ip_hash,
      user_agent,
      timestamp,
      version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const result = await db
      .prepare(insertSQL)
      .bind(
        record.id,
        record.user_id,
        record.essential,
        record.analytics,
        record.ip_hash,
        record.user_agent,
        record.timestamp,
        record.version
      )
      .run();

    if (!result.success) {
      throw new Error('Failed to insert consent record');
    }

    return record.id;
  } catch (error) {
    console.error('Database insert error:', error);
    throw new Error('Failed to store consent record');
  }
}

// ============================================================================
// API Handler
// ============================================================================

export const onRequestOptions: PagesFunction = async () => {
  // Handle CORS preflight
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON payload',
        } as ConsentResponse),
        {
          status: 400,
          headers: CORS_HEADERS,
        }
      );
    }

    // Validate request
    if (!validateConsentRequest(body)) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Invalid request format. Expected: { userId: string, preferences: { essential: boolean, analytics: boolean, timestamp: string, version: string } }',
        } as ConsentResponse),
        {
          status: 400,
          headers: CORS_HEADERS,
        }
      );
    }

    // Initialize database table (idempotent)
    await initializeConsentTable(env.DB);

    // Get client information
    const clientIP = getClientIP(request);
    const ipHash = await hashIP(clientIP);
    const userAgent = request.headers.get('User-Agent') || 'unknown';

    // Generate consent record
    const consentId = generateConsentId();
    const record: Omit<ConsentRecord, 'created_at'> = {
      id: consentId,
      user_id: body.userId,
      essential: body.preferences.essential ? 1 : 0,
      analytics: body.preferences.analytics ? 1 : 0,
      ip_hash: ipHash,
      user_agent: userAgent,
      timestamp: body.preferences.timestamp,
      version: body.preferences.version,
    };

    // Store in database
    const recordId = await storeConsentRecord(env.DB, record);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        id: recordId,
        message: 'Consent preferences stored successfully',
      } as ConsentResponse),
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  } catch (error) {
    console.error('Consent API error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ConsentResponse),
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
};

// Fallback for unsupported methods
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return onRequestOptions(context);
  }

  if (request.method === 'POST') {
    return onRequestPost(context);
  }

  // Method not allowed
  return new Response(
    JSON.stringify({
      success: false,
      error: `Method ${request.method} not allowed. This endpoint only accepts POST requests.`,
    } as ConsentResponse),
    {
      status: 405,
      headers: {
        ...CORS_HEADERS,
        Allow: 'POST, OPTIONS',
      },
    }
  );
};
