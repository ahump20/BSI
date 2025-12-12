/**
 * BSI MMR Ledger - Cryptographic Primitives
 * Domain-separated SHA-256 hashing for MMR nodes
 */

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

/** Domain separation tags prevent second-preimage attacks across node types */
const DOMAIN_TAG = {
  LEAF: new Uint8Array([0x00]),
  PARENT: new Uint8Array([0x01]),
  BAG: new Uint8Array([0x02]),
} as const;

const encoder = new TextEncoder();

// ─────────────────────────────────────────────────────────────
// Byte Utilities
// ─────────────────────────────────────────────────────────────

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error(`Invalid hex string length: ${hex.length}`);
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) {
      throw new Error(`Invalid hex character at position ${i * 2}`);
    }
    bytes[i] = byte;
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const totalLength = parts.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
// Deterministic JSON Serialization
// ─────────────────────────────────────────────────────────────

/**
 * Stable JSON stringify with sorted keys.
 * Critical for reproducible hashes across different runtimes.
 */
export function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>();

  const normalize = (v: unknown): unknown => {
    if (v === null || typeof v !== 'object') return v;

    if (seen.has(v as object)) {
      throw new Error('Circular reference detected in stableStringify');
    }
    seen.add(v as object);

    if (Array.isArray(v)) {
      return v.map(normalize);
    }

    // Sort object keys for deterministic output
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(v).sort()) {
      sorted[key] = normalize((v as Record<string, unknown>)[key]);
    }
    return sorted;
  };

  return JSON.stringify(normalize(value));
}

// ─────────────────────────────────────────────────────────────
// Core Hashing Functions
// ─────────────────────────────────────────────────────────────

async function sha256(data: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(digest));
}

/** Hash raw payload bytes into a leaf node hash */
export async function hashLeaf(payloadHashHex: string): Promise<string> {
  return sha256(concat(DOMAIN_TAG.LEAF, hexToBytes(payloadHashHex)));
}

/** Hash two child nodes into a parent node hash */
export async function hashParent(leftHex: string, rightHex: string): Promise<string> {
  return sha256(concat(DOMAIN_TAG.PARENT, hexToBytes(leftHex), hexToBytes(rightHex)));
}

/** Hash for bagging peaks together (right-to-left fold) */
export async function hashBag(leftHex: string, rightHex: string): Promise<string> {
  return sha256(concat(DOMAIN_TAG.BAG, hexToBytes(leftHex), hexToBytes(rightHex)));
}

/** Hash arbitrary string data (for payload content) */
export async function hashData(data: string): Promise<string> {
  return sha256(encoder.encode(data));
}

/** Compute empty root hash for MMR with no leaves */
export async function emptyRootHash(): Promise<string> {
  return sha256(DOMAIN_TAG.BAG);
}

// ─────────────────────────────────────────────────────────────
// Peak Bagging
// ─────────────────────────────────────────────────────────────

interface PeakLike {
  hash: string;
}

/**
 * Bag all peaks into a single root hash.
 * Folds from right to left for deterministic ordering.
 */
export async function bagPeaks<T extends PeakLike>(peaks: T[]): Promise<string> {
  if (peaks.length === 0) {
    return emptyRootHash();
  }

  let accumulator = peaks[peaks.length - 1].hash;
  for (let i = peaks.length - 2; i >= 0; i--) {
    accumulator = await hashBag(peaks[i].hash, accumulator);
  }
  return accumulator;
}

// ─────────────────────────────────────────────────────────────
// Proof Verification (Stateless)
// ─────────────────────────────────────────────────────────────

import type { MmrProof, VerifyResult, ProofSibling } from './types';

/**
 * Verify an MMR inclusion proof without database access.
 * Pure cryptographic verification.
 */
export async function verifyProof(proof: MmrProof): Promise<VerifyResult> {
  // Step 1: Walk siblings to reconstruct peak hash
  let current = proof.leaf_hash;

  for (const sibling of proof.siblings) {
    if (sibling.side === 'left') {
      current = await hashParent(sibling.hash, current);
    } else {
      current = await hashParent(current, sibling.hash);
    }
  }

  // Step 2: Verify computed hash matches the peak at peak_pos
  const expectedPeak = proof.peaks[proof.peak_pos];
  if (!expectedPeak) {
    return { valid: false, reason: `Invalid peak_pos: ${proof.peak_pos}` };
  }

  if (current !== expectedPeak.hash) {
    return { valid: false, reason: 'Computed peak hash does not match proof' };
  }

  // Step 3: Bag peaks to verify root
  const computedRoot = await bagPeaks(proof.peaks);

  if (computedRoot !== proof.root_hash) {
    return { valid: false, reason: 'Bagged peaks do not match root_hash' };
  }

  return { valid: true };
}
