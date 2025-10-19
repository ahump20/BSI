import net from 'node:net';

import { fetchFallbackPlayByPlay } from './sources/ncaa/play-by-play-scraper.js';

const DEFAULT_CONNECT_TIMEOUT_MS = 5000;
const DEFAULT_SOCKET_TIMEOUT_MS = 15000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 2500;
const DEFAULT_MAX_EVENTS = 150;

/**
 * Normalized pitch event schema
 */
export function normalizePitchEvent(message, context = {}) {
  if (!message || typeof message !== 'object') {
    return null;
  }

  const {
    gameId = context.gameId ?? null,
    sequence = message.sequence ?? message.seq ?? null,
    timestamp = message.timestamp ?? message.ts ?? new Date().toISOString(),
    inningNumber = Number.parseInt(message.inningNumber ?? message.inning ?? 0, 10) || null,
    inningHalf = message.inningHalf ?? message.half ?? null,
    batter = message.batter ?? {},
    pitcher = message.pitcher ?? {},
    count = message.count ?? {},
    pitch = message.pitch ?? {},
    runners = Array.isArray(message.runners) ? message.runners : [],
    result = message.result ?? message.outcome ?? null,
  } = message;

  const normalizedCount = {
    balls: Number.parseInt(count.balls ?? count.b ?? 0, 10) || 0,
    strikes: Number.parseInt(count.strikes ?? count.s ?? 0, 10) || 0,
    outs: Number.parseInt(count.outs ?? count.o ?? 0, 10) || 0,
  };

  return {
    id: sequence ? `${gameId ?? 'unknown'}:${sequence}` : undefined,
    sequence,
    gameId,
    timestamp,
    inning: inningNumber
      ? {
          number: inningNumber,
          half: inningHalf ?? 'top',
        }
      : undefined,
    batter: batter.id || batter.name ? {
      id: batter.id ?? null,
      name: batter.name ?? null,
      hand: batter.hand ?? batter.handedness ?? null,
    } : undefined,
    pitcher: pitcher.id || pitcher.name ? {
      id: pitcher.id ?? null,
      name: pitcher.name ?? null,
      hand: pitcher.hand ?? pitcher.handedness ?? null,
    } : undefined,
    pitch: {
      type: pitch.type ?? pitch.pitchType ?? null,
      speedMph: pitch.speedMph ?? pitch.velocity ?? pitch.speed ?? null,
      zone: pitch.zone ?? null,
      description: pitch.description ?? message.description ?? null,
    },
    count: normalizedCount,
    result,
    runners: runners.map((runner) => ({
      id: runner.id ?? null,
      name: runner.name ?? null,
      startBase: runner.startBase ?? runner.start ?? null,
      endBase: runner.endBase ?? runner.end ?? null,
      scored: runner.scored ?? false,
    })),
  };
}

/**
 * Connects to the NCAA LiveStats TCP feed and streams pitch events.
 */
export async function streamLivePitchEvents(env, options = {}) {
  const host = env?.NCAA_LIVESTATS_HOST;
  const port = Number.parseInt(env?.NCAA_LIVESTATS_PORT ?? '', 10);

  if (!host || Number.isNaN(port)) {
    throw new Error('NCAA LiveStats host/port are not configured in the environment.');
  }

  const {
    gameId = env?.NCAA_LIVESTATS_GAME_ID ?? null,
    maxEvents = DEFAULT_MAX_EVENTS,
    maxRetries = DEFAULT_MAX_RETRIES,
    connectTimeoutMs = DEFAULT_CONNECT_TIMEOUT_MS,
    socketTimeoutMs = DEFAULT_SOCKET_TIMEOUT_MS,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    signal,
  } = options;

  const events = [];
  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries && events.length < maxEvents) {
    attempt += 1;
    try {
      const batch = await collectEventsFromSocket({
        host,
        port,
        gameId,
        connectTimeoutMs,
        socketTimeoutMs,
        maxEvents: maxEvents - events.length,
        signal,
      });

      events.push(...batch);

      if (events.length >= maxEvents) {
        break;
      }
    } catch (error) {
      lastError = error;
      if (attempt >= maxRetries) {
        break;
      }
      await delay(retryDelayMs, signal);
    }
  }

  if (!events.length && lastError) {
    throw lastError;
  }

  return {
    gameId,
    events,
    attempts: attempt,
    lastError: events.length ? null : lastError,
  };
}

async function collectEventsFromSocket({
  host,
  port,
  gameId,
  connectTimeoutMs,
  socketTimeoutMs,
  maxEvents,
  signal,
}) {
  if (typeof net?.Socket !== 'function') {
    throw new Error('TCP sockets are not available in this runtime.');
  }

  return new Promise((resolve, reject) => {
    let resolved = false;
    const socket = new net.Socket();
    const chunks = [];
    let totalBytes = 0;

    const cleanup = (error) => {
      if (resolved) {
        return;
      }
      resolved = true;
      socket.destroy();
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
      if (error) {
        reject(error);
      } else {
        try {
          const payload = Buffer.concat(chunks).toString('utf8');
          const events = parseLiveStatsPayload(payload, gameId).slice(0, maxEvents);
          resolve(events);
        } catch (parseError) {
          reject(parseError);
        }
      }
    };

    const onAbort = () => {
      cleanup(new Error('Live feed aborted by signal.'));
    };

    if (signal) {
      if (signal.aborted) {
        cleanup(new Error('Live feed aborted before connection.'));
        return;
      }
      signal.addEventListener('abort', onAbort);
    }

    const connectTimer = setTimeout(() => {
      cleanup(new Error(`Timeout connecting to NCAA LiveStats feed ${host}:${port}`));
    }, connectTimeoutMs);

    socket.setTimeout(socketTimeoutMs, () => {
      cleanup(new Error('Live feed socket timed out while reading data.'));
    });

    socket.once('error', (error) => {
      clearTimeout(connectTimer);
      cleanup(error);
    });

    socket.connect(port, host, () => {
      clearTimeout(connectTimer);
    });

    socket.on('data', (chunk) => {
      chunks.push(chunk);
      totalBytes += chunk.length;
      if (totalBytes > 1_000_000) {
        cleanup(new Error('Live feed payload exceeded 1MB limit.'));
      }
    });

    socket.on('close', () => {
      cleanup();
    });
  });
}

function parseLiveStatsPayload(payload, gameId) {
  if (!payload) {
    return [];
  }

  const lines = payload
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const events = [];

  for (const line of lines) {
    const parsed = safeJsonParse(line);
    if (!parsed) {
      continue;
    }
    if (parsed.eventType && parsed.eventType.toLowerCase() !== 'pitch') {
      continue;
    }
    const normalized = normalizePitchEvent(parsed, { gameId });
    if (normalized) {
      events.push(normalized);
    }
  }

  return events;
}

function safeJsonParse(line) {
  try {
    return JSON.parse(line);
  } catch (error) {
    return null;
  }
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Operation aborted.'));
      return;
    }

    let timer;
    const onAbort = () => {
      if (timer) {
        clearTimeout(timer);
      }
      signal?.removeEventListener('abort', onAbort);
      reject(new Error('Operation aborted.'));
    };

    timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function fetchNCAABaseballSnapshot(env, options = {}) {
  const {
    gameId = env?.NCAA_LIVESTATS_GAME_ID ?? null,
    fetchImpl = globalThis.fetch?.bind(globalThis),
    preferLive = true,
  } = options;

  const snapshot = {
    asOf: new Date().toISOString(),
    gameId,
    source: 'unavailable',
    events: [],
    standings: { conferences: [], source: 'unconfigured' },
    meta: {
      preferLive,
      liveAttempts: 0,
      liveError: null,
      scraperError: null,
      standingsError: null,
    },
  };

  if (!fetchImpl) {
    snapshot.meta.standingsError = 'Fetch implementation unavailable in runtime.';
  }

  if (preferLive) {
    try {
      const liveResult = await streamLivePitchEvents(env, { gameId, maxEvents: DEFAULT_MAX_EVENTS });
      snapshot.meta.liveAttempts = liveResult.attempts;
      if (liveResult.events.length) {
        snapshot.events = liveResult.events;
        snapshot.source = 'tcp-live';
      } else if (liveResult.lastError) {
        snapshot.meta.liveError = liveResult.lastError.message;
      }
    } catch (error) {
      snapshot.meta.liveAttempts += 1;
      snapshot.meta.liveError = error.message;
    }
  }

  if (!snapshot.events.length) {
    try {
      const fallback = await fetchFallbackPlayByPlay({ env, gameId, fetchImpl });
      if (fallback.events.length) {
        snapshot.events = fallback.events;
        snapshot.source = 'scraper';
      }
    } catch (error) {
      snapshot.meta.scraperError = error.message;
    }
  } else {
    try {
      const fallback = await fetchFallbackPlayByPlay({ env, gameId, fetchImpl, strict: false });
      if (fallback.events.length) {
        snapshot.events = mergeEvents(snapshot.events, fallback.events);
        snapshot.source = 'tcp-live+scraper';
      }
    } catch (error) {
      snapshot.meta.scraperError = error.message;
    }
  }

  if (fetchImpl) {
    try {
      snapshot.standings = await fetchConferenceStandings(env, fetchImpl);
    } catch (error) {
      snapshot.meta.standingsError = error.message;
    }
  }

  return snapshot;
}

function mergeEvents(primary, secondary) {
  const seen = new Set();
  const merged = [];

  for (const event of primary) {
    const key = event.id ?? `${event.sequence ?? 'unknown'}:${event.timestamp}`;
    seen.add(key);
    merged.push(event);
  }

  for (const event of secondary) {
    const key = event.id ?? `${event.sequence ?? 'unknown'}:${event.timestamp}`;
    if (!seen.has(key)) {
      merged.push(event);
    }
  }

  merged.sort((a, b) => {
    const seqA = a.sequence ?? Number.MAX_SAFE_INTEGER;
    const seqB = b.sequence ?? Number.MAX_SAFE_INTEGER;
    if (seqA !== seqB) {
      return seqA - seqB;
    }
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  return merged;
}

async function fetchConferenceStandings(env, fetchImpl) {
  const url = env?.NCAA_BASEBALL_STANDINGS_URL;
  if (!url) {
    return {
      conferences: [],
      source: 'unconfigured',
    };
  }

  const response = await fetchImpl(url, {
    headers: {
      'User-Agent': env?.NCAA_REQUEST_USER_AGENT ?? 'BlazeSportsIntel/1.0 (+https://blazesportsintel.com)',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Standings endpoint responded with status ${response.status}`);
  }

  const data = await response.json();
  const conferences = Array.isArray(data?.conferences) ? data.conferences : [];

  return {
    conferences,
    source: 'remote',
  };
}
