/**
 * BSI MMR Ledger - Crypto Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  hexToBytes,
  bytesToHex,
  stableStringify,
  hashLeaf,
  hashParent,
  hashBag,
  hashData,
  bagPeaks,
  verifyProof,
} from '../src/crypto';

describe('Byte Utilities', () => {
  it('hexToBytes converts valid hex', () => {
    const bytes = hexToBytes('deadbeef');
    expect(bytes).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
  });

  it('bytesToHex converts bytes to lowercase hex', () => {
    const hex = bytesToHex(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
    expect(hex).toBe('deadbeef');
  });

  it('roundtrip preserves data', () => {
    const original = 'abcdef0123456789';
    const bytes = hexToBytes(original);
    const result = bytesToHex(bytes);
    expect(result).toBe(original);
  });

  it('hexToBytes throws on odd-length string', () => {
    expect(() => hexToBytes('abc')).toThrow('Invalid hex string length');
  });

  it('hexToBytes throws on invalid characters', () => {
    expect(() => hexToBytes('ghij')).toThrow('Invalid hex character');
  });
});

describe('stableStringify', () => {
  it('sorts object keys deterministically', () => {
    const obj1 = { z: 1, a: 2, m: 3 };
    const obj2 = { a: 2, m: 3, z: 1 };
    expect(stableStringify(obj1)).toBe(stableStringify(obj2));
    expect(stableStringify(obj1)).toBe('{"a":2,"m":3,"z":1}');
  });

  it('handles nested objects', () => {
    const obj = { b: { z: 1, a: 2 }, a: 1 };
    expect(stableStringify(obj)).toBe('{"a":1,"b":{"a":2,"z":1}}');
  });

  it('handles arrays without sorting', () => {
    const arr = [3, 1, 2];
    expect(stableStringify(arr)).toBe('[3,1,2]');
  });

  it('throws on circular references', () => {
    const obj: any = { a: 1 };
    obj.self = obj;
    expect(() => stableStringify(obj)).toThrow('Circular reference');
  });
});

describe('Hashing Functions', () => {
  it('hashData produces consistent 64-char hex', async () => {
    const hash = await hashData('test');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);

    // Same input = same output
    const hash2 = await hashData('test');
    expect(hash2).toBe(hash);
  });

  it('hashLeaf includes domain tag', async () => {
    const payloadHash = await hashData('payload');
    const leafHash = await hashLeaf(payloadHash);

    // Different from raw hash
    expect(leafHash).not.toBe(payloadHash);
    expect(leafHash).toHaveLength(64);
  });

  it('hashParent combines two hashes', async () => {
    const left = await hashData('left');
    const right = await hashData('right');
    const parent = await hashParent(left, right);

    expect(parent).toHaveLength(64);
    expect(parent).not.toBe(left);
    expect(parent).not.toBe(right);

    // Order matters
    const reversed = await hashParent(right, left);
    expect(reversed).not.toBe(parent);
  });

  it('hashBag combines peaks', async () => {
    const a = await hashData('a');
    const b = await hashData('b');
    const bag = await hashBag(a, b);

    expect(bag).toHaveLength(64);
    expect(bag).not.toBe(a);
    expect(bag).not.toBe(b);
  });
});

describe('bagPeaks', () => {
  it('returns empty root for empty array', async () => {
    const root = await bagPeaks([]);
    expect(root).toHaveLength(64);
  });

  it('returns hash directly for single peak', async () => {
    const hash = await hashData('single');
    const peaks = [{ hash }];
    const root = await bagPeaks(peaks);
    expect(root).toBe(hash);
  });

  it('folds multiple peaks right to left', async () => {
    const a = await hashData('a');
    const b = await hashData('b');
    const c = await hashData('c');

    const peaks = [{ hash: a }, { hash: b }, { hash: c }];
    const root = await bagPeaks(peaks);

    // Manual fold: bag(a, bag(b, c))
    const bc = await hashBag(b, c);
    const expected = await hashBag(a, bc);

    expect(root).toBe(expected);
  });
});

describe('verifyProof', () => {
  it('validates a simple single-leaf proof', async () => {
    const leafHash = await hashData('test-leaf');
    const wrappedLeaf = await hashLeaf(leafHash);

    const proof = {
      version: 1,
      root_hash: wrappedLeaf, // Single leaf = leaf is the root
      leaf_index: 1,
      leaf_hash: wrappedLeaf,
      peak_pos: 0,
      peaks: [{ hash: wrappedLeaf, height: 0 }],
      siblings: [],
    };

    const result = await verifyProof(proof);
    expect(result.valid).toBe(true);
  });

  it('rejects proof with wrong root', async () => {
    const leafHash = await hashData('test-leaf');
    const wrappedLeaf = await hashLeaf(leafHash);
    const wrongRoot = await hashData('wrong');

    const proof = {
      version: 1,
      root_hash: wrongRoot,
      leaf_index: 1,
      leaf_hash: wrappedLeaf,
      peak_pos: 0,
      peaks: [{ hash: wrappedLeaf, height: 0 }],
      siblings: [],
    };

    const result = await verifyProof(proof);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('do not match root_hash');
  });

  it('rejects proof with invalid peak_pos', async () => {
    const leafHash = await hashData('test-leaf');
    const wrappedLeaf = await hashLeaf(leafHash);

    const proof = {
      version: 1,
      root_hash: wrappedLeaf,
      leaf_index: 1,
      leaf_hash: wrappedLeaf,
      peak_pos: 99, // Invalid
      peaks: [{ hash: wrappedLeaf, height: 0 }],
      siblings: [],
    };

    const result = await verifyProof(proof);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Invalid peak_pos');
  });

  it('validates proof with siblings', async () => {
    // Build a simple 2-leaf tree manually
    const leaf1Hash = await hashLeaf(await hashData('leaf1'));
    const leaf2Hash = await hashLeaf(await hashData('leaf2'));
    const parentHash = await hashParent(leaf1Hash, leaf2Hash);

    // Proof for leaf1 (left child)
    const proof = {
      version: 2,
      root_hash: parentHash, // Single peak = root
      leaf_index: 1,
      leaf_hash: leaf1Hash,
      peak_pos: 0,
      peaks: [{ hash: parentHash, height: 1 }],
      siblings: [{ hash: leaf2Hash, side: 'right' as const }],
    };

    const result = await verifyProof(proof);
    expect(result.valid).toBe(true);
  });
});
