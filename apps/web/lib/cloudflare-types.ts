/**
 * Cloudflare Runtime Bindings
 * Types for Cloudflare KV, Images, and other platform features
 */

export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number }): Promise<{ keys: { name: string }[] }>;
}

declare global {
  /**
   * Cloudflare KV namespace for caching Longhorns MCP data and NCAA live data
   * Available in production via Cloudflare Workers runtime
   */
  const LONGHORNS_CACHE: KVNamespace | undefined;
}

export {};
