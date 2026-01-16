/**
 * Cloudflare Pages Function - Cookie Consent Management
 * Handles cookie consent preferences storage and retrieval
 * GDPR and CCPA compliant
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'anonymous';

    // Get consent preferences from KV
    const consentKey = `consent:${userId}`;
    const consent = await env.CACHE.get(consentKey, 'json');

    if (!consent) {
      return new Response(
        JSON.stringify({
          hasConsent: false,
          preferences: {
            essential: true,
            analytics: false,
            timestamp: null,
          },
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, must-revalidate',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        hasConsent: true,
        preferences: consent,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to retrieve consent preferences',
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json();
    const { userId = 'anonymous', preferences } = body;

    // Validate preferences
    if (!preferences || typeof preferences !== 'object') {
      return new Response(
        JSON.stringify({
          error: 'Invalid consent preferences',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Ensure essential cookies are always enabled
    const validatedPreferences = {
      essential: true, // Always true
      analytics: Boolean(preferences.analytics),
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('User-Agent'),
      ipHash: await hashIP(request.headers.get('CF-Connecting-IP')), // Anonymized IP
    };

    // Store in KV (expires after 1 year)
    const consentKey = `consent:${userId}`;
    await env.CACHE.put(
      consentKey,
      JSON.stringify(validatedPreferences),
      { expirationTtl: 31536000 } // 1 year
    );

    // Log to analytics (privacy-preserving)
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['cookie_consent_updated'],
        doubles: [preferences.analytics ? 1 : 0],
        indexes: [validatedPreferences.timestamp.split('T')[0]], // Date only
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        preferences: validatedPreferences,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to save consent preferences',
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Hash IP address for privacy (GDPR compliance)
async function hashIP(ip) {
  if (!ip) return 'unknown';

  const encoder = new TextEncoder();
  const data = encoder.encode(ip + 'salt'); // Add salt for security
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex.substring(0, 16); // Truncate for storage efficiency
}
