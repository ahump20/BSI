const DEFAULT_PLAY_BY_PLAY_BASE = 'https://stats.ncaa.org/game/play_by_play';
const DEFAULT_USER_AGENT = 'BlazeSportsIntel/1.0 (+https://blazesportsintel.com)';
const ROBOTS_CACHE = new Map();
const ROBOTS_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Fetch and parse NCAA play-by-play data as a fallback when the TCP feed is unavailable.
 */
export async function fetchFallbackPlayByPlay({ env = {}, gameId, fetchImpl = globalThis.fetch?.bind(globalThis), strict = true } = {}) {
  if (!fetchImpl) {
    throw new Error('Fetch implementation unavailable for NCAA fallback scraper.');
  }

  if (!gameId) {
    if (strict) {
      throw new Error('NCAA gameId is required for play-by-play fallback.');
    }
    return { events: [], source: 'scraper', url: null };
  }

  const url = buildPlayByPlayUrl(env, gameId);
  const parsedUrl = new URL(url);

  const robotsStatus = await ensureRobotsAllowed(parsedUrl, fetchImpl, env);
  if (!robotsStatus.allowed) {
    const error = new Error(`Robots.txt disallows scraping ${parsedUrl.pathname}`);
    if (strict) {
      throw error;
    }
    return { events: [], source: 'blocked', url, reason: robotsStatus.reason };
  }

  const response = await fetchImpl(url, {
    headers: {
      'User-Agent': env?.NCAA_REQUEST_USER_AGENT ?? DEFAULT_USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    const error = new Error(`stats.ncaa.org returned ${response.status}`);
    if (strict) {
      throw error;
    }
    return { events: [], source: 'unreachable', url, status: response.status };
  }

  const html = await response.text();
  const events = parsePlayByPlayHtml(html, { gameId });

  return {
    events,
    source: 'scraper',
    url,
  };
}

function buildPlayByPlayUrl(env, gameId) {
  if (env?.NCAA_PLAY_BY_PLAY_URL_TEMPLATE) {
    return env.NCAA_PLAY_BY_PLAY_URL_TEMPLATE.replace('{gameId}', encodeURIComponent(gameId));
  }
  return `${env?.NCAA_PLAY_BY_PLAY_BASE ?? DEFAULT_PLAY_BY_PLAY_BASE}/${encodeURIComponent(gameId)}`;
}

async function ensureRobotsAllowed(url, fetchImpl, env) {
  const origin = `${url.protocol}//${url.host}`;
  const cached = ROBOTS_CACHE.get(origin);
  const now = Date.now();

  if (cached && cached.expires > now) {
    return {
      allowed: isPathAllowed(url.pathname, cached.disallows),
      reason: 'cache',
    };
  }

  const response = await fetchImpl(`${origin}/robots.txt`, {
    headers: {
      'User-Agent': env?.NCAA_REQUEST_USER_AGENT ?? DEFAULT_USER_AGENT,
      Accept: 'text/plain',
    },
  }).catch(() => null);

  if (!response || !response.ok) {
    // Default to allowed when robots.txt is unreachable
    ROBOTS_CACHE.set(origin, { expires: now + ROBOTS_CACHE_TTL_MS, disallows: [] });
    return { allowed: true, reason: 'no-robots' };
  }

  const robotsTxt = await response.text();
  const disallows = parseRobots(robotsTxt);
  ROBOTS_CACHE.set(origin, { expires: now + ROBOTS_CACHE_TTL_MS, disallows });

  return {
    allowed: isPathAllowed(url.pathname, disallows),
    reason: 'fetched',
  };
}

function parseRobots(robotsTxt) {
  const lines = robotsTxt.split(/\r?\n/);
  const disallows = [];
  let appliesToAll = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const [directive, value = ''] = line.split(':').map((part) => part.trim());
    if (!directive) {
      continue;
    }

    if (directive.toLowerCase() === 'user-agent') {
      appliesToAll = value === '*';
    }

    if (appliesToAll && directive.toLowerCase() === 'disallow' && value) {
      disallows.push(value);
    }
  }

  return disallows;
}

function isPathAllowed(pathname, disallows = []) {
  for (const rule of disallows) {
    if (!rule || rule === '/') {
      return false;
    }
    if (pathname.startsWith(rule)) {
      return false;
    }
  }
  return true;
}

function parsePlayByPlayHtml(html, { gameId }) {
  if (!html) {
    return [];
  }

  const tableMatch = html.match(/<table[^>]*id=["']play_by_play["'][^>]*>([\s\S]*?)<\/table>/i)
    || html.match(/<table[^>]*class=["'][^"']*play\-by\-play[^"']*["'][^>]*>([\s\S]*?)<\/table>/i);

  if (!tableMatch) {
    return [];
  }

  const tableHtml = tableMatch[1];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const events = [];
  let match;
  let sequence = 0;

  while ((match = rowRegex.exec(tableHtml)) !== null) {
    const rowHtml = match[1];
    const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
    const cells = [];
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      const cellText = decodeHtml(stripTags(cellMatch[1])).trim();
      if (cellText) {
        cells.push(cellText);
      }
    }

    if (cells.length < 2) {
      continue;
    }

    const [contextCell, descriptionCell] = cells;
    const inning = parseInning(contextCell);
    const description = descriptionCell;
    const result = parseResult(description);

    sequence += 1;

    events.push({
      id: `${gameId ?? 'scrape'}:${sequence}`,
      sequence,
      gameId,
      timestamp: new Date().toISOString(),
      inning,
      batter: null,
      pitcher: null,
      pitch: {
        type: null,
        speedMph: null,
        zone: null,
        description,
      },
      count: { balls: 0, strikes: 0, outs: inning?.outs ?? 0 },
      result,
      runners: [],
    });
  }

  return events;
}

function stripTags(value) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function parseInning(value) {
  const match = value.match(/(top|bottom)\s+(\d+)(?:st|nd|rd|th)?/i);
  if (!match) {
    return undefined;
  }

  const half = match[1].toLowerCase();
  const number = Number.parseInt(match[2], 10);

  return {
    number: Number.isNaN(number) ? null : number,
    half,
    outs: extractOuts(value),
  };
}

function extractOuts(context) {
  const match = context.match(/(\d)\s+out/);
  if (!match) {
    return 0;
  }
  const outs = Number.parseInt(match[1], 10);
  return Number.isNaN(outs) ? 0 : outs;
}

function parseResult(description) {
  if (!description) {
    return null;
  }
  if (/strikeout/i.test(description)) {
    return 'strikeout';
  }
  if (/walk/i.test(description)) {
    return 'walk';
  }
  if (/single/i.test(description)) {
    return 'single';
  }
  if (/double/i.test(description)) {
    return 'double';
  }
  if (/triple/i.test(description)) {
    return 'triple';
  }
  if (/home\s*run/i.test(description)) {
    return 'home_run';
  }
  if (/hit\s*by\s*pitch/i.test(description)) {
    return 'hit_by_pitch';
  }
  if (/sacrifice/i.test(description)) {
    return 'sacrifice';
  }
  if (/grounded\s*out/i.test(description)) {
    return 'ground_out';
  }
  if (/fl[yi]ed\s*out/i.test(description)) {
    return 'fly_out';
  }
  return 'play';
}
