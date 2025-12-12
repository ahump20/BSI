/**
 * BSI MMR Ledger - Storage Layer
 * D1 database operations with proper batching and atomic transactions
 */

import type {
  MmrState,
  MmrVersion,
  MmrNode,
  MmrLeaf,
  Peak,
  ListLeavesParams,
  LeafWithPayload,
  PaginatedResult,
  AuditEvent,
} from './types';
import { MmrError } from './types';
import { emptyRootHash } from './crypto';

// ─────────────────────────────────────────────────────────────
// State Operations
// ─────────────────────────────────────────────────────────────

export async function getState(db: D1Database): Promise<MmrState> {
  const row = await db
    .prepare('SELECT leaf_count, peaks_json, root_hash FROM mmr_state WHERE id = 1')
    .first<{ leaf_count: number; peaks_json: string; root_hash: string }>();

  if (!row) {
    return {
      leaf_count: 0,
      peaks: [],
      root_hash: await emptyRootHash(),
    };
  }

  return {
    leaf_count: row.leaf_count,
    peaks: JSON.parse(row.peaks_json) as Peak[],
    root_hash: row.root_hash,
  };
}

// ─────────────────────────────────────────────────────────────
// Version Operations
// ─────────────────────────────────────────────────────────────

export async function getLatestVersion(db: D1Database): Promise<MmrVersion | null> {
  const row = await db
    .prepare('SELECT version, root_hash, peaks_json, created_at FROM mmr_versions ORDER BY version DESC LIMIT 1')
    .first<{ version: number; root_hash: string; peaks_json: string; created_at: number }>();

  if (!row) return null;

  return {
    version: row.version,
    root_hash: row.root_hash,
    peaks: JSON.parse(row.peaks_json) as Peak[],
    created_at: row.created_at,
  };
}

export async function getVersion(db: D1Database, version: number): Promise<MmrVersion> {
  const row = await db
    .prepare('SELECT version, root_hash, peaks_json, created_at FROM mmr_versions WHERE version = ?')
    .bind(version)
    .first<{ version: number; root_hash: string; peaks_json: string; created_at: number }>();

  if (!row) {
    throw MmrError.notFound(`Version ${version}`);
  }

  return {
    version: row.version,
    root_hash: row.root_hash,
    peaks: JSON.parse(row.peaks_json) as Peak[],
    created_at: row.created_at,
  };
}

export async function getVersionOrLatest(db: D1Database, version?: number): Promise<MmrVersion> {
  if (version !== undefined) {
    return getVersion(db, version);
  }

  const latest = await getLatestVersion(db);
  if (!latest) {
    throw MmrError.notFound('No versions exist yet');
  }
  return latest;
}

// ─────────────────────────────────────────────────────────────
// Node Operations
// ─────────────────────────────────────────────────────────────

export async function getNode(db: D1Database, nodeId: number): Promise<MmrNode> {
  const row = await db
    .prepare('SELECT node_id, height, hash, left_id, right_id, parent_id FROM mmr_nodes WHERE node_id = ?')
    .bind(nodeId)
    .first<MmrNode>();

  if (!row) {
    throw MmrError.notFound(`Node ${nodeId}`);
  }

  return row;
}

// ─────────────────────────────────────────────────────────────
// Leaf Operations
// ─────────────────────────────────────────────────────────────

export async function getLeaf(db: D1Database, leafIndex: number): Promise<MmrLeaf> {
  const row = await db
    .prepare('SELECT leaf_index, node_id, payload_json, created_at FROM mmr_leaves WHERE leaf_index = ?')
    .bind(leafIndex)
    .first<MmrLeaf>();

  if (!row) {
    throw MmrError.notFound(`Leaf ${leafIndex}`);
  }

  return row;
}

export async function getLeafWithPayload(db: D1Database, leafIndex: number): Promise<LeafWithPayload> {
  const leaf = await getLeaf(db, leafIndex);
  const node = await getNode(db, leaf.node_id);

  return {
    leaf_index: leaf.leaf_index,
    hash: node.hash,
    event: JSON.parse(leaf.payload_json) as AuditEvent,
    created_at: leaf.created_at,
  };
}

export async function listLeaves(
  db: D1Database,
  params: ListLeavesParams
): Promise<PaginatedResult<LeafWithPayload>> {
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 100);
  const offset = Math.max(params.offset ?? 0, 0);

  // Build WHERE clauses dynamically
  const conditions: string[] = [];
  const bindings: (string | number)[] = [];

  if (params.actor) {
    conditions.push("json_extract(l.payload_json, '$.actor') = ?");
    bindings.push(params.actor);
  }

  if (params.type) {
    conditions.push("json_extract(l.payload_json, '$.type') = ?");
    bindings.push(params.type);
  }

  if (params.tag) {
    // SQLite JSON array search
    conditions.push("EXISTS (SELECT 1 FROM json_each(json_extract(l.payload_json, '$.tags')) WHERE value = ?)");
    bindings.push(params.tag);
  }

  if (params.since_ms !== undefined) {
    conditions.push('l.created_at >= ?');
    bindings.push(params.since_ms);
  }

  if (params.until_ms !== undefined) {
    conditions.push('l.created_at <= ?');
    bindings.push(params.until_ms);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count query
  const countQuery = `SELECT COUNT(*) as total FROM mmr_leaves l ${whereClause}`;
  const countResult = await db
    .prepare(countQuery)
    .bind(...bindings)
    .first<{ total: number }>();
  const total = countResult?.total ?? 0;

  // Data query with join
  const dataQuery = `
    SELECT l.leaf_index, l.payload_json, l.created_at, n.hash
    FROM mmr_leaves l
    JOIN mmr_nodes n ON l.node_id = n.node_id
    ${whereClause}
    ORDER BY l.leaf_index DESC
    LIMIT ? OFFSET ?
  `;

  const rows = await db
    .prepare(dataQuery)
    .bind(...bindings, limit, offset)
    .all<{ leaf_index: number; payload_json: string; created_at: number; hash: string }>();

  const items: LeafWithPayload[] = (rows.results ?? []).map((row) => ({
    leaf_index: row.leaf_index,
    hash: row.hash,
    event: JSON.parse(row.payload_json) as AuditEvent,
    created_at: row.created_at,
  }));

  return {
    items,
    total,
    limit,
    offset,
    has_more: offset + items.length < total,
  };
}

// ─────────────────────────────────────────────────────────────
// Peak Ancestry (for proof building)
// ─────────────────────────────────────────────────────────────

/**
 * Walk from a node up to its peak ancestor within a specific version.
 * Returns the peak node_id that this node rolls up to.
 */
export async function findPeakAncestor(
  db: D1Database,
  startNodeId: number,
  peakNodeIds: Set<number>
): Promise<number> {
  let currentId = startNodeId;

  while (!peakNodeIds.has(currentId)) {
    const node = await db
      .prepare('SELECT parent_id FROM mmr_nodes WHERE node_id = ?')
      .bind(currentId)
      .first<{ parent_id: number | null }>();

    if (!node) {
      throw MmrError.corrupted(`Node ${currentId} not found during peak walk`);
    }

    if (node.parent_id === null) {
      throw MmrError.corrupted(`Reached null parent before finding version peak from node ${startNodeId}`);
    }

    currentId = node.parent_id;
  }

  return currentId;
}

// ─────────────────────────────────────────────────────────────
// Atomic Append Transaction
// ─────────────────────────────────────────────────────────────

export interface AppendTransaction {
  leafNodeHash: string;
  payloadJson: string;
  nowMs: number;
}

export interface AppendResult {
  leafIndex: number;
  leafNodeId: number;
  newPeaks: Peak[];
  newLeafCount: number;
  rootHash: string;
}

/**
 * Execute the entire append operation atomically using D1 batch.
 * This replaces the fragile BEGIN/COMMIT/ROLLBACK pattern.
 */
export async function executeAppend(
  db: D1Database,
  tx: AppendTransaction,
  computeParentHash: (left: string, right: string) => Promise<string>,
  computeRootHash: (peaks: Peak[]) => Promise<string>
): Promise<AppendResult> {
  // Phase 1: Read current state
  const state = await getState(db);
  let peaks = [...state.peaks];
  let leafCount = state.leaf_count;

  // Phase 2: Build all the statements we need to execute
  const statements: D1PreparedStatement[] = [];

  // Ensure state row exists (idempotent)
  const emptyRoot = await computeRootHash([]);
  statements.push(
    db
      .prepare(
        `INSERT INTO mmr_state (id, leaf_count, peaks_json, root_hash, updated_at)
         VALUES (1, 0, '[]', ?, ?)
         ON CONFLICT(id) DO NOTHING`
      )
      .bind(emptyRoot, tx.nowMs)
  );

  // Insert the leaf node
  // Note: We need to do this in stages because we need the auto-generated IDs
  // D1 batch() doesn't give us last_row_id, so we need a different approach

  // Actually, let's use a single transaction with sequential operations
  // but wrapped properly. D1's batch is atomic.

  // For proper ID tracking, we'll do a hybrid approach:
  // 1. Get max node_id before
  // 2. Insert in batch
  // 3. Calculate IDs from the max

  const maxNodeResult = await db
    .prepare('SELECT COALESCE(MAX(node_id), 0) as max_id FROM mmr_nodes')
    .first<{ max_id: number }>();
  const maxLeafResult = await db
    .prepare('SELECT COALESCE(MAX(leaf_index), 0) as max_id FROM mmr_leaves')
    .first<{ max_id: number }>();

  let nextNodeId = (maxNodeResult?.max_id ?? 0) + 1;
  const leafNodeId = nextNodeId;
  const leafIndex = (maxLeafResult?.max_id ?? 0) + 1;

  // Build the node insertion chain
  interface NodeToInsert {
    nodeId: number;
    height: number;
    hash: string;
    leftId: number | null;
    rightId: number | null;
  }

  const nodesToInsert: NodeToInsert[] = [];
  const parentUpdates: Array<{ childId: number; parentId: number }> = [];

  // Start with the leaf
  nodesToInsert.push({
    nodeId: leafNodeId,
    height: 0,
    hash: tx.leafNodeHash,
    leftId: null,
    rightId: null,
  });
  nextNodeId++;

  // MMR peak merging - compute all parents needed
  let currentNode: Peak = { node_id: leafNodeId, height: 0, hash: tx.leafNodeHash };

  while (peaks.length > 0 && peaks[peaks.length - 1].height === currentNode.height) {
    const leftPeak = peaks.pop()!;
    const parentHash = await computeParentHash(leftPeak.hash, currentNode.hash);
    const parentId = nextNodeId++;

    nodesToInsert.push({
      nodeId: parentId,
      height: currentNode.height + 1,
      hash: parentHash,
      leftId: leftPeak.node_id,
      rightId: currentNode.node_id,
    });

    parentUpdates.push({ childId: leftPeak.node_id, parentId });
    parentUpdates.push({ childId: currentNode.node_id, parentId });

    currentNode = { node_id: parentId, height: currentNode.height + 1, hash: parentHash };
  }

  peaks.push(currentNode);
  leafCount++;

  const rootHash = await computeRootHash(peaks);

  // Now build all batch statements
  const batchStatements: D1PreparedStatement[] = [];

  // Insert all nodes
  for (const node of nodesToInsert) {
    batchStatements.push(
      db
        .prepare('INSERT INTO mmr_nodes (node_id, height, hash, left_id, right_id) VALUES (?, ?, ?, ?, ?)')
        .bind(node.nodeId, node.height, node.hash, node.leftId, node.rightId)
    );
  }

  // Update parent pointers
  for (const update of parentUpdates) {
    batchStatements.push(
      db
        .prepare('UPDATE mmr_nodes SET parent_id = ? WHERE node_id = ?')
        .bind(update.parentId, update.childId)
    );
  }

  // Insert leaf record
  batchStatements.push(
    db
      .prepare('INSERT INTO mmr_leaves (leaf_index, node_id, payload_json, created_at) VALUES (?, ?, ?, ?)')
      .bind(leafIndex, leafNodeId, tx.payloadJson, tx.nowMs)
  );

  // Update state
  batchStatements.push(
    db
      .prepare(
        `INSERT INTO mmr_state (id, leaf_count, peaks_json, root_hash, updated_at)
         VALUES (1, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           leaf_count = excluded.leaf_count,
           peaks_json = excluded.peaks_json,
           root_hash = excluded.root_hash,
           updated_at = excluded.updated_at`
      )
      .bind(leafCount, JSON.stringify(peaks), rootHash, tx.nowMs)
  );

  // Insert version record
  batchStatements.push(
    db
      .prepare('INSERT INTO mmr_versions (version, root_hash, peaks_json, created_at) VALUES (?, ?, ?, ?)')
      .bind(leafCount, rootHash, JSON.stringify(peaks), tx.nowMs)
  );

  // Execute atomically
  await db.batch(batchStatements);

  return {
    leafIndex,
    leafNodeId,
    newPeaks: peaks,
    newLeafCount: leafCount,
    rootHash,
  };
}
