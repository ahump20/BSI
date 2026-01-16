/**
 * MCP Tool Base Utilities
 *
 * Shared utilities for all MCP tools following official patterns.
 * Provides caching, citation generation, and response formatting.
 *
 * @see https://github.com/modelcontextprotocol/typescript-sdk
 */

import { createHash } from 'crypto';
import type {
  Citation,
  ToolResponse,
  ToolContext,
  LonghornsEnv,
  CacheChainInterface,
  Sport,
} from './types';
import { LonghornsError, SPORT_ORDER } from './types';

// ============================================================================
// SOCCER KEYWORD FILTER
// ============================================================================

const SOCCER_KEYWORDS = ['soccer', 'fútbol', 'futbol'];

// ============================================================================
// CACHE CHAIN IMPLEMENTATION
// ============================================================================

export class CacheChain implements CacheChainInterface {
  private readonly memory = new Map<string, string>();

  constructor(private readonly env?: LonghornsEnv) {}

  async get(key: string): Promise<string | undefined> {
    // Try each tier in order: KV -> R2 -> D1 -> DO -> Memory
    const kvHit = await this.tryKvGet(key);
    if (kvHit) return kvHit;

    const r2Hit = await this.tryR2Get(key);
    if (r2Hit) return r2Hit;

    const d1Hit = await this.tryD1Get(key);
    if (d1Hit) return d1Hit;

    const doHit = await this.tryDoGet(key);
    if (doHit) return doHit;

    return this.memory.get(key);
  }

  async put(key: string, value: string): Promise<void> {
    // Write to all available tiers
    await Promise.all([
      this.tryKvPut(key, value),
      this.tryR2Put(key, value),
      this.tryD1Put(key, value),
      this.tryDoPut(key, value),
    ]);

    this.memory.set(key, value);
  }

  private async tryKvGet(key: string): Promise<string | undefined> {
    if (!this.env?.LONGHORNS_KV) return undefined;
    try {
      const value = await this.env.LONGHORNS_KV.get(key);
      return value ?? undefined;
    } catch (error) {
      console.warn('[CacheChain] KV get failed', error);
      return undefined;
    }
  }

  private async tryKvPut(key: string, value: string): Promise<void> {
    if (!this.env?.LONGHORNS_KV) return;
    try {
      await this.env.LONGHORNS_KV.put(key, value, { expirationTtl: 300 });
    } catch (error) {
      console.warn('[CacheChain] KV put failed', error);
    }
  }

  private async tryR2Get(key: string): Promise<string | undefined> {
    if (!this.env?.LONGHORNS_R2) return undefined;
    try {
      const object = await this.env.LONGHORNS_R2.get(key);
      if (!object) return undefined;
      return object.text();
    } catch (error) {
      console.warn('[CacheChain] R2 get failed', error);
      return undefined;
    }
  }

  private async tryR2Put(key: string, value: string): Promise<void> {
    if (!this.env?.LONGHORNS_R2) return;
    try {
      await this.env.LONGHORNS_R2.put(key, value, {
        httpMetadata: { contentType: 'application/json', cacheControl: 'max-age=300' },
      });
    } catch (error) {
      console.warn('[CacheChain] R2 put failed', error);
    }
  }

  private async tryD1Get(key: string): Promise<string | undefined> {
    if (!this.env?.LONGHORNS_D1) return undefined;
    try {
      const row = await this.env.LONGHORNS_D1.prepare(
        'SELECT payload FROM longhorns_cache WHERE cache_key = ? LIMIT 1;'
      )
        .bind(key)
        .first<{ payload: string }>();
      return row?.payload;
    } catch (error) {
      console.warn('[CacheChain] D1 get failed', error);
      return undefined;
    }
  }

  private async tryD1Put(key: string, value: string): Promise<void> {
    if (!this.env?.LONGHORNS_D1) return;
    try {
      await this.env.LONGHORNS_D1.prepare(
        'INSERT OR REPLACE INTO longhorns_cache (cache_key, payload, updated_at) VALUES (?, ?, ?);'
      )
        .bind(key, value, new Date().toISOString())
        .run();
    } catch (error) {
      console.warn('[CacheChain] D1 put failed', error);
    }
  }

  private async tryDoGet(key: string): Promise<string | undefined> {
    if (!this.env?.LONGHORNS_DO) return undefined;
    try {
      const id = this.env.LONGHORNS_DO.idFromName('longhorns-cache');
      const stub = this.env.LONGHORNS_DO.get(id);
      const response = await stub.fetch(`https://longhorns/cache?key=${encodeURIComponent(key)}`, {
        method: 'GET',
      });
      if (!response.ok) return undefined;
      return response.text();
    } catch (error) {
      console.warn('[CacheChain] Durable Object get failed', error);
      return undefined;
    }
  }

  private async tryDoPut(key: string, value: string): Promise<void> {
    if (!this.env?.LONGHORNS_DO) return;
    try {
      const id = this.env.LONGHORNS_DO.idFromName('longhorns-cache');
      const stub = this.env.LONGHORNS_DO.get(id);
      await stub.fetch('https://longhorns/cache', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key, value, ttl: 300 }),
      });
    } catch (error) {
      console.warn('[CacheChain] Durable Object put failed', error);
    }
  }
}

// ============================================================================
// RESPONSE FORMATTERS
// ============================================================================

/**
 * Format a timestamp in Chicago/Central time
 */
export function formatChicagoTimestamp(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  });
  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day} ${lookup.hour}:${lookup.minute}:${lookup.second} ${lookup.timeZoneName}`;
}

/**
 * Create a citation object
 */
export function createCitation(id: string, path: string, label: string): Citation {
  return {
    id,
    path,
    label,
    timestamp: formatChicagoTimestamp(),
  };
}

/**
 * Build a cache key for a tool invocation
 */
export function buildCacheKey(tool: string, args: unknown): string {
  const hash = createHash('sha256')
    .update(JSON.stringify(args ?? {}))
    .digest('hex')
    .slice(0, 16);
  return `longhorns:${tool}:${hash}`;
}

/**
 * Create a standardized tool response
 */
export function createToolResponse<T>(
  result: T,
  citations: Citation[],
  cacheKey: string,
  cacheStatus: 'HIT' | 'MISS'
): ToolResponse<T> {
  return {
    result,
    citations,
    generatedAt: formatChicagoTimestamp(),
    meta: {
      cache: {
        key: cacheKey,
        status: cacheStatus,
      },
    },
  };
}

// ============================================================================
// VALIDATION & GUARDS
// ============================================================================

/**
 * Enforce sport guard - reject soccer and validate sport
 */
export function enforceSportGuard(sport?: string): asserts sport is Sport | undefined {
  if (!sport) return;

  if (SOCCER_KEYWORDS.some((keyword) => sport.toLowerCase().includes(keyword))) {
    throw new LonghornsError(
      'Texas Longhorns MCP server does not cover soccer. Choose baseball, football, basketball, or track & field.',
      'SOCCER_FORBIDDEN'
    );
  }

  if (!SPORT_ORDER.includes(sport as Sport)) {
    throw new LonghornsError(`Unsupported sport: ${sport}.`, 'UNKNOWN_SPORT');
  }
}

/**
 * Enforce query policy - reject soccer queries
 */
export function enforceQueryPolicy(query: string): void {
  if (SOCCER_KEYWORDS.some((keyword) => query.toLowerCase().includes(keyword))) {
    throw new LonghornsError(
      'Soccer queries are rejected. Blaze Sports Intel focuses on baseball, football, basketball, and track & field.',
      'SOCCER_FORBIDDEN'
    );
  }
}

/**
 * Select appropriate cache for context
 */
export function selectCache(context?: ToolContext): CacheChainInterface {
  if (context?.cache) return context.cache;
  if (context?.env) return new CacheChain(context.env);
  return new CacheChain();
}

// ============================================================================
// TOOL EXECUTION WRAPPER
// ============================================================================

/**
 * Wrap a tool handler with caching and error handling
 */
export async function executeWithCache<TInput, TOutput>(
  toolName: string,
  input: TInput,
  context: ToolContext,
  handler: (input: TInput) => Promise<{ result: TOutput; citations: Citation[] }>
): Promise<ToolResponse<TOutput>> {
  const cache = selectCache(context);
  const cacheKey = buildCacheKey(toolName, input);

  // Try cache first
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as ToolResponse<TOutput>;
      return {
        ...parsed,
        meta: { cache: { key: cacheKey, status: 'HIT' } },
      };
    }
  } catch (error) {
    console.warn(`[${toolName}] Cache read error:`, error);
  }

  // Execute handler
  const { result, citations } = await handler(input);
  const response = createToolResponse(result, citations, cacheKey, 'MISS');

  // Cache the response
  try {
    await cache.put(cacheKey, JSON.stringify(response));
  } catch (error) {
    console.warn(`[${toolName}] Cache write error:`, error);
  }

  return response;
}

// ============================================================================
// SPORT ORDERING UTILITY
// ============================================================================

/**
 * Sort results by sport priority (baseball first)
 */
export function sortBySportOrder<T extends { sport: Sport }>(items: T[]): T[] {
  return [...items].sort((a, b) => SPORT_ORDER.indexOf(a.sport) - SPORT_ORDER.indexOf(b.sport));
}

/**
 * Get sports in priority order, optionally filtered
 */
export function getSportsInOrder(filter?: Sport[]): Sport[] {
  if (!filter) return [...SPORT_ORDER];
  return SPORT_ORDER.filter((s) => filter.includes(s));
}
