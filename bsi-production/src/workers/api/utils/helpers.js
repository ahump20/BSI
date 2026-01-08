/**
 * BSI API Utility Functions
 * Date handling, data fetching, and response helpers
 */

/**
 * Get today's date in YYYY-MM-DD format (Chicago timezone)
 */
export function getTodayDate() {
  const now = new Date();
  const chicago = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const year = chicago.getFullYear();
  const month = String(chicago.getMonth() + 1).padStart(2, '0');
  const day = String(chicago.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current month abbreviation (e.g., "JAN", "FEB")
 */
export function getMonthAbbrev() {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return months[new Date().getMonth()];
}

/**
 * Get Chicago timezone timestamp
 */
export function getChicagoTimestamp() {
  return new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
}

/**
 * Format game date string for display
 */
export function formatGameDate(dateString) {
  if (!dateString) return 'TBD';
  try {
    const date = new Date(dateString);
    const options = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago',
    };
    return date.toLocaleString('en-US', options);
  } catch {
    return dateString;
  }
}

/**
 * Create a JSON response with optional session token
 */
export function jsonResponse(data, status, corsHeaders, sessionToken = null) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...corsHeaders,
  });

  if (sessionToken) {
    headers.set(
      'Set-Cookie',
      `bsi_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
    );
  }

  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

/**
 * Fetch data from SportsDataIO with caching
 */
export async function fetchSportsData(url, apiKey, corsHeaders, cacheTTL = 300) {
  try {
    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Accept': 'application/json',
      },
      cf: {
        cacheTtl: cacheTTL,
        cacheEverything: true,
      },
    });

    if (!response.ok) {
      console.error(`SportsDataIO error: ${response.status} for ${url}`);
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${cacheTTL}`,
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('SportsDataIO fetch error:', error.message);
    return new Response(JSON.stringify({ error: 'Failed to fetch sports data', message: error.message }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Fetch data from College Football Data API
 */
export async function fetchCFBData(url, apiKey, corsHeaders, cacheTTL = 600) {
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      cf: {
        cacheTtl: cacheTTL,
        cacheEverything: true,
      },
    });

    if (!response.ok) {
      throw new Error(`CFB API returned ${response.status}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${cacheTTL}`,
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('CFB fetch error:', error.message);
    return new Response(JSON.stringify({ error: 'Failed to fetch CFB data' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}
