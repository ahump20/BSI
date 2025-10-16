const DEFAULT_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

export const corsHeaders = {
  ...DEFAULT_CORS_HEADERS,
  'Content-Type': 'application/json',
};

export const ok = (data, init = {}) =>
  new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: {
      ...corsHeaders,
      ...(init.headers || {}),
    },
  });

export const err = (error, status = 500, init = {}) => {
  const message =
    error instanceof Error && error.message ? error.message : 'Internal Server Error';

  return new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        ...(init.headers || {}),
      },
    },
  );
};

const getCacheBinding = (env) => {
  if (!env || typeof env !== 'object') {
    return null;
  }

  const candidates = ['CACHE', 'KV', 'kv', 'cache'];
  for (const key of candidates) {
    const binding = env[key];
    if (binding && typeof binding.get === 'function' && typeof binding.put === 'function') {
      return binding;
    }
  }

  return null;
};

export const cache = async (env, key, fetcher, ttl = 300) => {
  const store = getCacheBinding(env);
  if (!store || typeof fetcher !== 'function') {
    return fetcher();
  }

  const now = Date.now();
  try {
    const cached = await store.get(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.expires && parsed.expires > now) {
        return parsed.data;
      }
    }
  } catch (error) {
    console.warn(`Cache read miss for key ${key}:`, error);
  }

  const fresh = await fetcher();

  try {
    await store.put(
      key,
      JSON.stringify({
        data: fresh,
        expires: now + ttl * 1000,
      }),
      { expirationTtl: ttl },
    );
  } catch (error) {
    console.warn(`Cache write failed for key ${key}:`, error);
  }

  return fresh;
};

export const preflight = () => new Response(null, { headers: corsHeaders });

export const createTimeoutSignal = (timeoutMs = 8000) => {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs).unref?.();
  return controller.signal;
};

/**
 * Exponential backoff retry wrapper
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts (default 3)
 * @param {number} baseDelay - Base delay in milliseconds (default 250)
 */
export const withRetry = async (fn, maxRetries = 3, baseDelay = 250) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const jitter = Math.random() * 100;
        const delay = baseDelay * Math.pow(2, attempt) + jitter;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

/**
 * Fetch with timeout wrapper
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds (default 10000)
 */
export const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const signal = createTimeoutSignal(timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal
    });
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms: ${url}`);
    }
    throw error;
  }
};

/**
 * Data validation: Ensure NFL records make sense
 * @param {Object} team - Team data with wins, losses, gamesPlayed
 * @returns {Object} Validation result with valid flag and errors array
 */
export const validateNFLRecord = (team) => {
  const { currentWins = 0, gamesPlayed = 0, games = 17 } = team;
  const currentLosses = gamesPlayed - currentWins;

  const errors = [];

  if (currentWins < 0) {
    errors.push(`Invalid wins: ${currentWins} (must be >= 0)`);
  }

  if (currentWins > gamesPlayed) {
    errors.push(`Wins (${currentWins}) exceed games played (${gamesPlayed})`);
  }

  if (gamesPlayed > games) {
    errors.push(`Games played (${gamesPlayed}) exceed season total (${games})`);
  }

  if (currentWins + currentLosses !== gamesPlayed) {
    errors.push(`Wins (${currentWins}) + Losses (${currentLosses}) != Games Played (${gamesPlayed})`);
  }

  if (errors.length > 0) {
    console.warn(`Record validation failed for team:`, team.name || 'Unknown', errors);
    return { valid: false, errors };
  }

  return {
    valid: true,
    record: {
      wins: currentWins,
      losses: currentLosses,
      gamesPlayed,
      displayRecord: `${currentWins}-${currentLosses}`
    }
  };
};

/**
 * Get current NFL week number based on season start date
 * @returns {number} Current week (1-18)
 */
export const getCurrentNFLWeek = () => {
  const now = new Date();
  const seasonStart = new Date('2025-09-04'); // NFL 2025 season start (Thursday after Labor Day)
  const weeksSinceStart = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));

  // Week 1-18 regular season
  const week = Math.min(Math.max(1, weeksSinceStart + 1), 18);
  return week;
};

/**
 * Data validation: Ensure MLB records make sense
 * @param {Object} team - Team data with wins, losses, gamesPlayed
 * @returns {Object} Validation result with valid flag and errors array
 */
export const validateMLBRecord = (team) => {
  const { wins = 0, losses = 0, gamesPlayed = 0, games = 162 } = team;

  const errors = [];

  if (wins < 0) {
    errors.push(`Invalid wins: ${wins} (must be >= 0)`);
  }

  if (losses < 0) {
    errors.push(`Invalid losses: ${losses} (must be >= 0)`);
  }

  if (wins > gamesPlayed) {
    errors.push(`Wins (${wins}) exceed games played (${gamesPlayed})`);
  }

  if (gamesPlayed > games) {
    errors.push(`Games played (${gamesPlayed}) exceed season total (${games})`);
  }

  if (wins + losses !== gamesPlayed) {
    errors.push(`Wins (${wins}) + Losses (${losses}) != Games Played (${gamesPlayed})`);
  }

  if (errors.length > 0) {
    console.warn(`MLB record validation failed for team:`, team.name || 'Unknown', errors);
    return { valid: false, errors };
  }

  const winningPercentage = gamesPlayed > 0 ? (wins / gamesPlayed).toFixed(3) : '.000';

  return {
    valid: true,
    record: {
      wins,
      losses,
      gamesPlayed,
      winningPercentage,
      displayRecord: `${wins}-${losses}`
    }
  };
};

/**
 * Data validation: Ensure NBA records make sense
 * @param {Object} team - Team data with wins, losses, gamesPlayed
 * @returns {Object} Validation result with valid flag and errors array
 */
export const validateNBARecord = (team) => {
  const { wins = 0, losses = 0, gamesPlayed = 0, games = 82 } = team;

  const errors = [];

  if (wins < 0) {
    errors.push(`Invalid wins: ${wins} (must be >= 0)`);
  }

  if (losses < 0) {
    errors.push(`Invalid losses: ${losses} (must be >= 0)`);
  }

  if (wins > gamesPlayed) {
    errors.push(`Wins (${wins}) exceed games played (${gamesPlayed})`);
  }

  if (gamesPlayed > games) {
    errors.push(`Games played (${gamesPlayed}) exceed season total (${games})`);
  }

  if (wins + losses !== gamesPlayed) {
    errors.push(`Wins (${wins}) + Losses (${losses}) != Games Played (${gamesPlayed})`);
  }

  if (errors.length > 0) {
    console.warn(`NBA record validation failed for team:`, team.name || 'Unknown', errors);
    return { valid: false, errors };
  }

  const winningPercentage = gamesPlayed > 0 ? (wins / gamesPlayed).toFixed(3) : '.000';

  return {
    valid: true,
    record: {
      wins,
      losses,
      gamesPlayed,
      winningPercentage,
      displayRecord: `${wins}-${losses}`
    }
  };
};
