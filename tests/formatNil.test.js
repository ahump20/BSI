import test from 'node:test';
import assert from 'node:assert/strict';

import { formatNil } from '../lib/formatNil.js';

test('formatNil formats numeric inputs', () => {
  assert.equal(formatNil(1.234), '$1.2M');
  assert.equal(formatNil(0), '$0.0M');
});

test('formatNil coerces string inputs', () => {
  assert.equal(formatNil('2.5'), '$2.5M');
});

test('formatNil handles nullish and invalid inputs safely', () => {
  assert.equal(formatNil(null), '$0.0M');
  assert.equal(formatNil(undefined), '$0.0M');
  assert.equal(formatNil('not-a-number'), '$0.0M');
});
