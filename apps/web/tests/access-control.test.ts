import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessDiamondPro, resolveAccessTier, summarizeAccess } from '../lib/access-control';

test('free users do not pass the Diamond Pro gate', () => {
  assert.equal(canAccessDiamondPro([]), false);
  assert.equal(canAccessDiamondPro(['viewer']), false);
});

test('editor and admin roles unlock Diamond Pro features', () => {
  assert.equal(canAccessDiamondPro(['editor']), true);
  assert.equal(canAccessDiamondPro(['viewer', 'editor']), true);
  assert.equal(canAccessDiamondPro(['admin']), true);
});

test('access tier resolution prioritizes admin, then editor', () => {
  assert.equal(resolveAccessTier(['viewer']), 'free');
  assert.equal(resolveAccessTier(['editor']), 'pro');
  assert.equal(resolveAccessTier(['admin']), 'admin');
  assert.equal(resolveAccessTier(['viewer', 'admin']), 'admin');
});

test('summaries expose tier flags for UI gating', () => {
  const free = summarizeAccess(['viewer']);
  assert.equal(free.tier, 'free');
  assert.equal(free.isDiamondPro, false);
  assert.equal(free.isAdmin, false);

  const pro = summarizeAccess(['editor']);
  assert.equal(pro.tier, 'pro');
  assert.equal(pro.isDiamondPro, true);
  assert.equal(pro.isAdmin, false);

  const admin = summarizeAccess(['viewer', 'admin']);
  assert.equal(admin.tier, 'admin');
  assert.equal(admin.isDiamondPro, true);
  assert.equal(admin.isAdmin, true);
});
