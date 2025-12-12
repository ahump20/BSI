/**
 * BSI MMR Ledger - Core Service
 * Business logic for append, proof generation, and queries
 */

import type {
  Env,
  AppendRequest,
  AppendResult,
  MmrProof,
  AuditEvent,
  ListLeavesParams,
  LeafWithPayload,
  PaginatedResult,
  MmrState,
  MmrVersion,
  Peak,
} from './types';
import { MmrError } from './types';
import {
  stableStringify,
  hashData,
  hashLeaf,
  hashParent,
  bagPeaks,
  verifyProof as cryptoVerifyProof,
} from './crypto';
import {
  getState,
  getVersionOrLatest,
  getLeaf,
  getNode,
  getLeafWithPayload,
  listLeaves as storageListLeaves,
  findPeakAncestor,
  executeAppend,
} from './storage';

// ─────────────────────────────────────────────────────────────
// Event Construction
// ─────────────────────────────────────────────────────────────

function buildEvent(body: AppendRequest, nowMs: number): AuditEvent {
  return {
    type: typeof body.type === 'string' ? body.type : 'event',
    actor: typeof body.actor === 'string' ? body.actor : 'unknown',
    tags: Array.isArray(body.tags) ? body.tags.filter((t) => typeof t === 'string') : [],
    data: body.data ?? body,
    ts_ms: nowMs,
  };
}

// ─────────────────────────────────────────────────────────────
// Append Operation
// ─────────────────────────────────────────────────────────────

export async function appendEvent(db: D1Database, body: AppendRequest): Promise<AppendResult> {
  const nowMs = Date.now();
  const event = buildEvent(body, nowMs);

  // Canonical serialization for reproducible hashing
  const canonical = stableStringify(event);
  const payloadHash = await hashData(canonical);
  const leafHash = await hashLeaf(payloadHash);

  const result = await executeAppend(
    db,
    {
      leafNodeHash: leafHash,
      payloadJson: canonical,
      nowMs,
    },
    hashParent,
    bagPeaks
  );

  return {
    version: result.newLeafCount,
    root_hash: result.rootHash,
    leaf_index: result.leafIndex,
    leaf_hash: leafHash,
    payload_hash: payloadHash,
  };
}

// ─────────────────────────────────────────────────────────────
// State Queries
// ─────────────────────────────────────────────────────────────

export async function getHead(db: D1Database): Promise<MmrState> {
  return getState(db);
}

export async function getLeafByIndex(db: D1Database, leafIndex: number): Promise<LeafWithPayload> {
  return getLeafWithPayload(db, leafIndex);
}

export async function listEvents(
  db: D1Database,
  params: ListLeavesParams
): Promise<PaginatedResult<LeafWithPayload>> {
  return storageListLeaves(db, params);
}

// ─────────────────────────────────────────────────────────────
// Proof Generation
// ─────────────────────────────────────────────────────────────

export async function buildProof(
  db: D1Database,
  leafIndex: number,
  version?: number
): Promise<MmrProof> {
  // Get the version state (specific or latest)
  const versionState = await getVersionOrLatest(db, version);

  // Get the leaf and its node
  const leaf = await getLeaf(db, leafIndex);

  // Validate: leaf must have existed at this version
  if (leafIndex > versionState.version) {
    throw MmrError.badRequest(
      `Leaf ${leafIndex} does not exist at version ${versionState.version}`
    );
  }

  const leafNode = await getNode(db, leaf.node_id);

  // Build set of peak node IDs for this version
  const peakNodeIds = new Set(versionState.peaks.map((p) => p.node_id));

  // Find which peak this leaf rolls up to
  const peakNodeId = await findPeakAncestor(db, leaf.node_id, peakNodeIds);

  // Walk from leaf to peak, collecting siblings
  const siblings: Array<{ hash: string; side: 'left' | 'right' }> = [];
  let currentId = leaf.node_id;

  while (currentId !== peakNodeId) {
    const current = await getNode(db, currentId);

    if (current.parent_id === null) {
      throw MmrError.corrupted(`Node ${currentId} has no parent but hasn't reached peak`);
    }

    const parent = await getNode(db, current.parent_id);

    if (parent.left_id === null || parent.right_id === null) {
      throw MmrError.corrupted(`Parent ${parent.node_id} missing child references`);
    }

    // Determine sibling and which side it's on
    if (parent.left_id === currentId) {
      // Current is left child, sibling is right
      const sibling = await getNode(db, parent.right_id);
      siblings.push({ hash: sibling.hash, side: 'right' });
    } else if (parent.right_id === currentId) {
      // Current is right child, sibling is left
      const sibling = await getNode(db, parent.left_id);
      siblings.push({ hash: sibling.hash, side: 'left' });
    } else {
      throw MmrError.corrupted(`Parent ${parent.node_id} doesn't reference current node ${currentId}`);
    }

    currentId = parent.node_id;
  }

  // Find peak position in the version's peak list
  const peakPos = versionState.peaks.findIndex((p) => p.node_id === peakNodeId);
  if (peakPos < 0) {
    throw MmrError.corrupted(`Peak ${peakNodeId} not found in version ${versionState.version} peaks`);
  }

  return {
    version: versionState.version,
    root_hash: versionState.root_hash,
    leaf_index: leafIndex,
    leaf_hash: leafNode.hash,
    peak_pos: peakPos,
    peaks: versionState.peaks.map((p) => ({ hash: p.hash, height: p.height })),
    siblings,
  };
}

// ─────────────────────────────────────────────────────────────
// Proof Verification
// ─────────────────────────────────────────────────────────────

export async function verifyProof(proof: MmrProof): Promise<{ valid: boolean; reason?: string }> {
  return cryptoVerifyProof(proof);
}

// ─────────────────────────────────────────────────────────────
// Batch Operations (for bulk imports)
// ─────────────────────────────────────────────────────────────

export interface BatchAppendResult {
  success: number;
  failed: number;
  results: Array<{
    index: number;
    ok: boolean;
    result?: AppendResult;
    error?: string;
  }>;
  final_version: number;
  final_root_hash: string;
}

export async function batchAppend(
  db: D1Database,
  events: AppendRequest[],
  options?: { stopOnError?: boolean }
): Promise<BatchAppendResult> {
  const results: BatchAppendResult['results'] = [];
  let success = 0;
  let failed = 0;

  for (let i = 0; i < events.length; i++) {
    try {
      const result = await appendEvent(db, events[i]);
      results.push({ index: i, ok: true, result });
      success++;
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      results.push({ index: i, ok: false, error });
      failed++;

      if (options?.stopOnError) {
        break;
      }
    }
  }

  const finalState = await getState(db);

  return {
    success,
    failed,
    results,
    final_version: finalState.leaf_count,
    final_root_hash: finalState.root_hash,
  };
}
