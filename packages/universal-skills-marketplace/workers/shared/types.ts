/**
 * Shared types for all Universal Skills Workers.
 */

export interface ApiEnv {
  DB: D1Database;
  CONTENT: R2Bucket;
  CACHE: KVNamespace;
  RATE_LIMIT: KVNamespace;
  REGISTRY_VERSION: string;
}

export interface IndexerEnv {
  DB: D1Database;
  CONTENT: R2Bucket;
  INDEXER_STATE: KVNamespace;
  GITHUB_TOKEN: string;
}

export interface BridgeEnv {
  DB: D1Database;
}

export interface SkillRow {
  id: string;
  name: string;
  description: string;
  source_ecosystem: string;
  source_url: string;
  source_repo: string;
  source_commit: string | null;
  source_path: string;
  manifest_format: string;
  quality_score: number;
  install_count: number;
  star_count: number;
  content_hash: string | null;
  compat_claude: number;
  compat_codex: number;
  tags: string;
  category: string | null;
  last_verified: string | null;
  indexed_at: string;
  tombstoned: number;
}

export interface SourceRow {
  name: string;
  repo_url: string;
  default_branch: string;
  last_sync_sha: string | null;
  last_sync_at: string | null;
  last_check_at: string | null;
  last_result: string | null;
  error_message: string | null;
  priority_tier: string;
  poll_interval_seconds: number;
}

export interface RpcRequest {
  jsonrpc: string;
  id: unknown;
  method: string;
  params?: Record<string, unknown>;
}

export function rpcResult(result: unknown, id: unknown): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
    headers: { "content-type": "application/json" },
  });
}

export function rpcError(code: number, message: string, id: unknown): Response {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }),
    { headers: { "content-type": "application/json" } },
  );
}
