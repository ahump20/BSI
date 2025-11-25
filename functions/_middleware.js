/**
 * Seasonal Routing Middleware
 *
 * Automatically redirects root path (/) to the appropriate sport based on current season:
 * - Basketball: January 1 - March 31 (NCAA basketball / March Madness)
 * - Baseball: April 1 - July 31 (college baseball season)
 * - Football: August 1 - December 31 (college football season)
 *
 * Respects user preferences via:
 * - Query parameter: ?sport=basketball, ?sport=baseball, or ?sport=football
 * - Cookie: preferred_sport=basketball, preferred_sport=baseball, or preferred_sport=football
 *
 * All other routes pass through unchanged.
 */

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // DISABLED: Seasonal routing - let homepage show by default
  // User can manually navigate to sport pages via navigation
  return next();

  // Only apply routing logic to root path
  if (url.pathname !== '/') {
    return next();
  }

  // Check for manual override via query parameter
  const sportParam = url.searchParams.get('sport');
  if (sportParam === 'baseball' || sportParam === 'football' || sportParam === 'basketball') {
    // Set cookie to remember preference (30 days)
    const cookieHeader = `preferred_sport=${sportParam}; Path=/; Max-Age=2592000; SameSite=Lax`;

    if (sportParam === 'baseball') {
      // Stay on baseball page, but set preference cookie
      const response = await next();
      // Create new response with cookie header
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers([
          ...Array.from(response.headers.entries()),
          ['Set-Cookie', cookieHeader],
        ]),
      });
    } else if (sportParam === 'football') {
      // Redirect to football with cookie
      const redirectUrl = new URL('/football', request.url).toString();
      return new Response(null, {
        status: 302,
        headers: {
          Location: redirectUrl,
          'Set-Cookie': cookieHeader,
        },
      });
    } else if (sportParam === 'basketball') {
      // Redirect to basketball with cookie
      const redirectUrl = new URL('/basketball', request.url).toString();
      return new Response(null, {
        status: 302,
        headers: {
          Location: redirectUrl,
          'Set-Cookie': cookieHeader,
        },
      });
    }
  }

  // Check for saved preference in cookie
  const cookies = request.headers.get('Cookie') || '';
  const preferredSport = cookies
    .split(';')
    .find((c) => c.trim().startsWith('preferred_sport='))
    ?.split('=')[1];

  if (preferredSport === 'football') {
    return Response.redirect(new URL('/football', request.url).toString(), 302);
  }

  if (preferredSport === 'basketball') {
    return Response.redirect(new URL('/basketball', request.url).toString(), 302);
  }

  if (preferredSport === 'baseball') {
    return next(); // Already on baseball page
  }

  // No manual preference - use seasonal logic
  const currentDate = getCurrentDateInCentralTime();
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  // Determine active sport season (non-overlapping)
  const isBasketballSeason = currentMonth >= 1 && currentMonth <= 3; // January-March
  const isBaseballSeason = currentMonth >= 4 && currentMonth <= 7; // April-July
  const isFootballSeason = currentMonth >= 8 && currentMonth <= 12; // August-December

  if (isBasketballSeason) {
    // Redirect to basketball during winter/March Madness
    return Response.redirect(new URL('/basketball', request.url).toString(), 302);
  }

  if (isBaseballSeason) {
    // Stay on baseball during spring/summer season
    return next();
  }

  if (isFootballSeason) {
    // Redirect to football during fall season
    return Response.redirect(new URL('/football', request.url).toString(), 302);
  }

  // Fallback (should never reach here with current logic)
  return next();
}

/**
 * Get current date in America/Chicago timezone
 * Uses Intl.DateTimeFormat to convert UTC to Central Time
 */
function getCurrentDateInCentralTime() {
  const now = new Date();

  // Convert to America/Chicago timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find((p) => p.type === 'year').value);
  const month = parseInt(parts.find((p) => p.type === 'month').value);
  const day = parseInt(parts.find((p) => p.type === 'day').value);

  return new Date(year, month - 1, day);
}
