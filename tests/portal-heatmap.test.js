import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTopProgramsList } from '../lib/portalHeatmap.js';
import { mockPortalActivity } from '../mockData.js';

test('formatTopProgramsList returns fallback string when no programs provided', () => {
  const label = formatTopProgramsList(undefined);
  assert.equal(label, 'No flagship programs yet');
});

test('Great Plains region fixture omits topPrograms and uses fallback label', () => {
  const plainsRegion = mockPortalActivity.regions.find((region) => region.id === 'great-plains');
  assert.ok(plainsRegion, 'Great Plains region fixture should exist');
  const label = formatTopProgramsList(plainsRegion.topPrograms);
  assert.equal(label, 'No flagship programs yet');
});

test('formatTopProgramsList trims to three entries and joins with separators', () => {
  const label = formatTopProgramsList(['LSU', 'Auburn', 'Southern Miss', 'Tennessee']);
  assert.equal(label, 'LSU • Auburn • Southern Miss');
});
