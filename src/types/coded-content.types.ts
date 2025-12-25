/**
 * Coded Content Types
 *
 * Type definitions for SportsDataIO Coded Content integration.
 * Used for CFB game previews and recaps.
 */

/**
 * Content types supported by the Coded Content system
 */
export type CodedContentType = 'preview' | 'recap';

/**
 * Leagues supported by Coded Content
 */
export type CodedContentLeague = 'cfb' | 'nfl' | 'mlb' | 'nba' | 'cbb';

/**
 * Raw article from provider API
 */
export interface CodedContentProviderArticle {
  /** Provider's unique content ID */
  contentId: string;
  /** Article title */
  title: string;
  /** SEO-optimized title (optional) */
  seoTitle?: string;
  /** Article body HTML */
  bodyHtml: string;
  /** Short excerpt/summary */
  excerpt?: string;
  /** Meta description for SEO */
  metaDescription?: string;
  /** Publication timestamp (ISO 8601) */
  publishedAt: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt?: string;
  /** Associated game ID from provider */
  gameId?: string;
  /** Array of team IDs involved */
  teamIds?: string[];
  /** Content type from provider */
  contentType: string;
  /** League identifier */
  league: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Article stored in D1 database
 */
export interface CodedContentArticle {
  /** Composite ID: provider + provider_content_id */
  id: string;
  /** Provider identifier */
  provider: string;
  /** Provider's content ID */
  provider_content_id: string;
  /** League (cfb, nfl, etc.) */
  league: CodedContentLeague;
  /** Content type (preview, recap) */
  content_type: CodedContentType;
  /** Article title */
  title: string;
  /** URL-safe slug */
  slug: string;
  /** Short excerpt */
  excerpt: string | null;
  /** Full HTML body */
  body_html: string;
  /** Publication timestamp (unix seconds) */
  published_at: number | null;
  /** Last update timestamp (unix seconds) */
  updated_at: number | null;
  /** Associated game ID */
  game_id: string | null;
  /** JSON array of team IDs */
  team_ids: string | null;
  /** Raw provider metadata as JSON string */
  metadata_json: string;
  /** Record creation timestamp (unix seconds) */
  created_at: number;
  /** Last seen during ingestion (unix seconds) */
  last_seen_at: number;
}

/**
 * Article card for list display
 */
export interface ArticleCard {
  slug: string;
  title: string;
  excerpt: string | null;
  contentType: CodedContentType;
  publishedAt: string | null;
  gameId: string | null;
}

/**
 * Full article for detail page
 */
export interface ArticleDetail extends ArticleCard {
  bodyHtml: string;
  updatedAt: string | null;
  metadata: ArticleMetadata;
}

/**
 * Article metadata parsed from metadata_json
 */
export interface ArticleMetadata {
  seoTitle?: string;
  metaDescription?: string;
  homeTeam?: string;
  awayTeam?: string;
  gameDate?: string;
  venue?: string;
  [key: string]: unknown;
}

/**
 * API response for article list
 */
export interface ArticleListResponse {
  articles: ArticleCard[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * API response for single article
 */
export interface ArticleDetailResponse {
  article: ArticleDetail;
}

/**
 * Ingestion result statistics
 */
export interface IngestionResult {
  provider: string;
  league: string;
  contentType: CodedContentType;
  fetched: number;
  inserted: number;
  updated: number;
  errors: number;
  timestamp: string;
}

/**
 * Worker environment bindings
 */
export interface CodedContentEnv {
  /** D1 database binding */
  DB: D1Database;
  /** KV namespace for caching */
  CACHE: KVNamespace;
  /** Workers AI binding (optional, for BSI rewrite) */
  AI?: Ai;
  /** API key for Coded Content provider */
  CODED_CONTENT_API_KEY: string;
  /** Base URL for Coded Content API */
  CODED_CONTENT_BASE_URL: string;
  /** Auth mode: 'header' or 'query' */
  CODED_CONTENT_AUTH_MODE: 'header' | 'query';
  /** Header name for auth (if header mode) */
  CODED_CONTENT_AUTH_HEADER: string;
  /** Query param name for auth (if query mode) */
  CODED_CONTENT_AUTH_QUERY_PARAM: string;
  /** Provider's league identifier for CFB */
  CODED_CONTENT_LEAGUE_CFB: string;
  /** Provider's content type identifier for previews */
  CODED_CONTENT_TYPE_PREVIEW: string;
  /** Provider's content type identifier for recaps */
  CODED_CONTENT_TYPE_RECAP: string;
  /** Enable BSI voice rewrite (optional) */
  ENABLE_BSI_REWRITE?: string;
}

/**
 * KV cache keys
 */
export const CACHE_KEYS = {
  CFB_PREVIEWS_CURRENT: 'cfb:previews:current',
  CFB_RECAPS_LATEST: 'cfb:recaps:latest',
  CFB_ARTICLE_PREFIX: 'cfb:article:',
} as const;

/**
 * Cache TTL values (in seconds)
 */
export const CACHE_TTL = {
  ARTICLE_LIST: 300, // 5 minutes
  ARTICLE_DETAIL: 600, // 10 minutes
  INGESTION_LOCK: 120, // 2 minutes
} as const;
