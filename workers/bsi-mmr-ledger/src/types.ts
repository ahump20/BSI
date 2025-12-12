/**
 * BSI MMR Ledger - Type Definitions
 * Append-only Merkle Mountain Range for tamper-evident audit logs
 */

export interface Env {
  DB: D1Database;
  ADMIN_TOKEN: string;
  RATE_LIMIT_KV?: KVNamespace; // optional rate limiting
}

// ─────────────────────────────────────────────────────────────
// Domain Types
// ─────────────────────────────────────────────────────────────

export interface Peak {
  node_id: number;
  height: number;
  hash: string;
}

export interface MmrState {
  leaf_count: number;
  peaks: Peak[];
  root_hash: string;
}

export interface MmrVersion {
  version: number;
  root_hash: string;
  peaks: Peak[];
  created_at: number;
}

export interface MmrNode {
  node_id: number;
  height: number;
  hash: string;
  left_id: number | null;
  right_id: number | null;
  parent_id: number | null;
}

export interface MmrLeaf {
  leaf_index: number;
  node_id: number;
  payload_json: string;
  created_at: number;
}

// ─────────────────────────────────────────────────────────────
// Event Types
// ─────────────────────────────────────────────────────────────

export interface AuditEvent {
  type: string;
  actor: string;
  tags: string[];
  data: unknown;
  ts_ms: number;
}

export interface AppendRequest {
  type?: string;
  actor?: string;
  tags?: string[];
  data?: unknown;
}

export interface AppendResult {
  version: number;
  root_hash: string;
  leaf_index: number;
  leaf_hash: string;
  payload_hash: string;
}

// ─────────────────────────────────────────────────────────────
// Proof Types
// ─────────────────────────────────────────────────────────────

export interface ProofSibling {
  hash: string;
  side: 'left' | 'right';
}

export interface MmrProof {
  version: number;
  root_hash: string;
  leaf_index: number;
  leaf_hash: string;
  peak_pos: number;
  peaks: Array<{ hash: string; height: number }>;
  siblings: ProofSibling[];
}

export interface VerifyResult {
  valid: boolean;
  reason?: string;
}

// ─────────────────────────────────────────────────────────────
// Query Types
// ─────────────────────────────────────────────────────────────

export interface ListLeavesParams {
  limit?: number;
  offset?: number;
  actor?: string;
  tag?: string;
  type?: string;
  since_ms?: number;
  until_ms?: number;
}

export interface LeafWithPayload {
  leaf_index: number;
  hash: string;
  event: AuditEvent;
  created_at: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// ─────────────────────────────────────────────────────────────
// Error Types
// ─────────────────────────────────────────────────────────────

export class MmrError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 500
  ) {
    super(message);
    this.name = 'MmrError';
  }

  static notFound(what: string): MmrError {
    return new MmrError(`${what} not found`, 'NOT_FOUND', 404);
  }

  static badRequest(reason: string): MmrError {
    return new MmrError(reason, 'BAD_REQUEST', 400);
  }

  static unauthorized(reason = 'Missing authentication'): MmrError {
    return new MmrError(reason, 'UNAUTHORIZED', 401);
  }

  static forbidden(reason = 'Access denied'): MmrError {
    return new MmrError(reason, 'FORBIDDEN', 403);
  }

  static internal(reason: string): MmrError {
    return new MmrError(reason, 'INTERNAL', 500);
  }

  static corrupted(reason: string): MmrError {
    return new MmrError(`MMR integrity error: ${reason}`, 'CORRUPTED', 500);
  }
}
