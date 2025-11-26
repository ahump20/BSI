/**
 * Contact Form API Endpoint
 * Handles contact form submissions for privacy requests, support, and general inquiries
 * Stores submissions in D1 database with proper validation
 */

interface Env {
  DB: D1Database;
}

interface ContactFormData {
  requestType: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
  timezone: string;
}

const VALID_REQUEST_TYPES = [
  'general',
  'support',
  'gdpr-access',
  'gdpr-delete',
  'ccpa-access',
  'ccpa-delete',
  'cookies',
  'accessibility',
  'partnership',
  'press',
  'other',
];

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate limiting: max 5 submissions per IP per hour
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    // Parse request body
    const data: ContactFormData = await request.json();

    // Validate required fields
    if (!data.requestType || !data.name || !data.email || !data.subject || !data.message) {
      return new Response(JSON.stringify({ error: 'Missing required fields', success: false }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Validate request type
    if (!VALID_REQUEST_TYPES.includes(data.requestType)) {
      return new Response(JSON.stringify({ error: 'Invalid request type', success: false }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Validate email format
    if (!EMAIL_REGEX.test(data.email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format', success: false }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Sanitize inputs (basic XSS prevention)
    const sanitize = (str: string): string => {
      return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim()
        .slice(0, 5000); // Max length
    };

    const sanitizedData = {
      requestType: data.requestType,
      name: sanitize(data.name).slice(0, 200),
      email: data.email.toLowerCase().trim().slice(0, 320),
      subject: sanitize(data.subject).slice(0, 500),
      message: sanitize(data.message),
      timestamp: data.timestamp || new Date().toISOString(),
      timezone: data.timezone || 'America/Chicago',
    };

    // Get client IP for rate limiting (hashed for privacy)
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const ipHash = await hashIP(clientIP);

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(env.DB, ipHash);
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
          success: false,
          retryAfter: rateLimitCheck.retryAfter,
        }),
        { status: 429, headers: corsHeaders }
      );
    }

    // Generate unique submission ID
    const submissionId = crypto.randomUUID();

    // Determine priority based on request type
    const isPriorityRequest = ['gdpr-access', 'gdpr-delete', 'ccpa-access', 'ccpa-delete'].includes(
      sanitizedData.requestType
    );
    const priority = isPriorityRequest ? 'high' : 'normal';

    // Calculate response deadline
    const responseDeadline = calculateResponseDeadline(sanitizedData.requestType);

    // Store in D1 database
    await env.DB.prepare(
      `
      INSERT INTO contact_submissions (
        id, request_type, name, email, subject, message,
        ip_hash, timestamp, timezone, priority, response_deadline, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
      .bind(
        submissionId,
        sanitizedData.requestType,
        sanitizedData.name,
        sanitizedData.email,
        sanitizedData.subject,
        sanitizedData.message,
        ipHash,
        sanitizedData.timestamp,
        sanitizedData.timezone,
        priority,
        responseDeadline,
        'pending'
      )
      .run();

    // Update rate limit counter
    await updateRateLimit(env.DB, ipHash);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        submissionId,
        message: 'Your request has been submitted successfully.',
        expectedResponse: getExpectedResponseTime(sanitizedData.requestType),
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Contact form error:', error);

    // Check if it's a database error (table doesn't exist)
    if (error instanceof Error && error.message.includes('no such table')) {
      // Create table and retry
      try {
        await createContactTable(env.DB);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Database initialized. Please resubmit your request.',
          }),
          { status: 503, headers: corsHeaders }
        );
      } catch (tableError) {
        console.error('Table creation error:', tableError);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'An error occurred while processing your request. Please try again.',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};

// Handle OPTIONS for CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};

// Helper functions
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + 'blaze-contact-salt-2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function checkRateLimit(
  db: D1Database,
  ipHash: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const cutoffTime = new Date(Date.now() - RATE_LIMIT_WINDOW * 1000).toISOString();

    const result = await db
      .prepare(
        `
        SELECT COUNT(*) as count FROM contact_submissions
        WHERE ip_hash = ? AND timestamp > ?
        `
      )
      .bind(ipHash, cutoffTime)
      .first<{ count: number }>();

    if (result && result.count >= RATE_LIMIT_MAX) {
      return { allowed: false, retryAfter: 3600 };
    }

    return { allowed: true };
  } catch {
    // If rate limit check fails, allow the request
    return { allowed: true };
  }
}

async function updateRateLimit(db: D1Database, _ipHash: string): Promise<void> {
  // Rate limiting is handled by the contact_submissions table itself
  // No separate rate limit table needed
}

function calculateResponseDeadline(requestType: string): string {
  const now = new Date();

  // GDPR/CCPA requests have 30-day legal requirement
  if (['gdpr-access', 'gdpr-delete', 'ccpa-access', 'ccpa-delete'].includes(requestType)) {
    now.setDate(now.getDate() + 30);
  } else {
    // Standard requests: 3 business days
    now.setDate(now.getDate() + 5); // ~3 business days accounting for weekends
  }

  return now.toISOString();
}

function getExpectedResponseTime(requestType: string): string {
  if (['gdpr-access', 'gdpr-delete', 'ccpa-access', 'ccpa-delete'].includes(requestType)) {
    return 'Within 30 days as required by law';
  }
  return 'Within 2-3 business days';
}

async function createContactTable(db: D1Database): Promise<void> {
  await db
    .prepare(
      `
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id TEXT PRIMARY KEY,
      request_type TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      ip_hash TEXT,
      timestamp TEXT NOT NULL,
      timezone TEXT DEFAULT 'America/Chicago',
      priority TEXT DEFAULT 'normal',
      response_deadline TEXT,
      status TEXT DEFAULT 'pending',
      resolved_at TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
    `
    )
    .run();
}
